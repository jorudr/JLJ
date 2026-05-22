import { ref } from "vue";
import type { ContentBlock } from "~/entities/thread/model/thread.types";
import {  collection, doc, setDoc, serverTimestamp, query, where, getDocs, increment, updateDoc, getDoc, deleteDoc   } from 'firebase/firestore'
import { db } from '~/shared/firebase.client'
import type { DiaryEntry } from "~/entities/diary/model/diary.types";
import type { ThreadLink, LinkType } from "~/entities/threadLink/model/threadLink.types";
import imageCompression from 'browser-image-compression';
import { uploadToCloudinary } from '~/shared/lib/cloudinary';

import { mainSections, categories } from "~/entities/thread/model/thread.constants";

const getInitialSection = () => {
    if (mainSections && mainSections.length > 2) return mainSections[2];
    if (mainSections && mainSections.length > 0) return mainSections[0];
    return { id: 'ta', name: 'Technical Analysis', shortLabel: 'TA', desc: '' };
};

const defaultSection = getInitialSection();

const getInitialCategory = (sectionId: string) => {
    const cats = categories[sectionId];
    if (cats && cats.length > 0) return cats[0];
    return { id: 'general', name: 'General', desc: '' };
};

const defaultCategory = getInitialCategory(defaultSection?.id || 'ta');

// selectedDomain is a UI helper (not saved to Firestore directly)
export const selectedDomain = ref<string>(defaultSection?.id || 'ta');

// category is the actual Topic ID (saved to Firestore)
export const category = ref<string | null>(defaultCategory?.id || 'general'); 

// subcategory is strictly 'theory' or 'practice' (saved to Firestore)
export const subcategory = ref<string | null>('theory'); 

export const threadTitle = ref<string | null>(null);
export const threadDescription = ref<string | null>(null);
export const thesisHtml = ref<string>('');
export const blocks = ref<ContentBlock[]>([]);
export const selectedTrades = ref<DiaryEntry[]>([]);
export const isSubmitting = ref(false);
export const status = ref<'idle' | 'loading' | 'success' | 'error' | 'deleted'>('idle');
export const threadId = ref<string | null>(null);

export const creationError = ref<string | null>(null);
export const isUploadingImage = ref(false);
export const uploadProgress = ref(0);

function setCreationError(msg: string) {
    creationError.value = msg;
    setTimeout(() => {
        if (creationError.value === msg) creationError.value = null;
    }, 5000);
}


/**
 * Converts the contenteditable HTML into structured ContentBlocks
 */
export function syncBlocksFromHtml(html: string) {
    if (typeof document === 'undefined') return;
    
    const div = document.createElement('div');
    div.innerHTML = html;
    
    const newBlocks: ContentBlock[] = [];
    
    const processNode = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            
            if (tag.startsWith('h')) {
                const level = parseInt(tag.substring(1)) as 2 | 3;
                newBlocks.push({ 
                    type: 'heading', 
                    level: (level === 2 || level === 3) ? level : 2, 
                    text: el.innerHTML.trim() 
                });
            } else if (tag === 'blockquote') {
                newBlocks.push({ type: 'quote', text: el.innerHTML.trim() });
            } else if (tag === 'ul' || tag === 'ol') {
                const items = Array.from(el.querySelectorAll('li')).map(li => li.innerHTML.trim());
                newBlocks.push({ type: 'list', items });
            } else if (tag === 'img') {
                newBlocks.push({ 
                    type: 'image', 
                    src: el.getAttribute('src') || '', 
                    caption: el.getAttribute('alt') || '' 
                });
            } else if (el.querySelector('h1, h2, h3, p, ul, ol, blockquote, img, li')) {
                // If the element contains other block-level elements, we MUST recurse into its children
                // to extract them as separate blocks, rather than grouping them into one paragraph.
                Array.from(el.childNodes).forEach(processNode);
            } else {
                // Standard container (p, div, etc.) that acts as a leaf node
                const content = el.innerHTML.trim();
                // Filter out empty blocks or temporary <br> from contenteditable
                if (content && content !== '<br>') {
                    newBlocks.push({ type: 'paragraph', text: content });
                }
            }
        } else if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) {
                newBlocks.push({ type: 'paragraph', text: text });
            }
        }
    };
    
    Array.from(div.childNodes).forEach(processNode);
    blocks.value = newBlocks;
}

/**
 * Converts structured blocks back to HTML for the editor
 */
export function syncHtmlFromBlocks(inputBlocks: ContentBlock[]) {
    let html = '';
    inputBlocks.forEach(block => {
        if (block.type === 'paragraph') {
            html += `<p>${block.text}</p>`;
        } else if (block.type === 'heading') {
            const tag = `h${block.level}`;
            html += `<${tag}>${block.text}</${tag}>`;
        } else if (block.type === 'quote') {
            html += `<blockquote>${block.text}</blockquote>`;
        } else if (block.type === 'list') {
            html += `<ul>${block.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
        } else if (block.type === 'image') {
            html += `<img src="${block.src}" alt="${block.caption || ''}" style="max-width:100%; border-radius:12px; margin: 1rem 0;" />`;
        }
    });
    thesisHtml.value = html;
}



// Block manipulation functions are now handled by the contenteditable editor


export async function insertImageInBlock(block: any, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Reject files larger than 1.5MB
  if (file.size > 1.5 * 1024 * 1024) {
      setCreationError("Image too large. Please select an image smaller than 1.5MB.");
      return;
  }

  // @ts-ignore
  block.loading = true
  isUploadingImage.value = true;

  try {
    // 1. Compression
    const options = {
      maxSizeMB: 1.4,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    }
    const compressedFile = await imageCompression(file, options)
    console.log('Original size (MB):', (file.size / 1024 / 1024).toFixed(2))
    console.log('Compressed size (MB):', (compressedFile.size / 1024 / 1024).toFixed(2))
    
    // 2. Upload to Cloudinary
    const result = await uploadToCloudinary(compressedFile)
    
    // 3. Update block with Cloudinary URL
    block.src = result.secure_url
  } catch (error) {
    console.error('Image upload failed:', error)
    setCreationError('Failed to upload image. Please check your Cloudinary configuration.');
  } finally {
    // @ts-ignore
    block.loading = false
    isUploadingImage.value = false;
  }
}

/**
 * Inserts a compressed image into the HTML editor at the current cursor position
 */
export async function insertImageInHtml(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    console.log('File selected:', file?.name, 'Size:', file?.size, 'bytes');
    if (!file) return;

    // Reject files larger than 1.5MB immediately
    if (file.size > 1.5 * 1024 * 1024) {
        setCreationError("Image too large. Please select an image smaller than 1.5MB.");
        return;
    }

    // Limit to 3 images per thread
    const currentImageCount = blocks.value.filter(b => b.type === 'image').length;
    if (currentImageCount >= 3) {
        setCreationError("Limit reached: You can upload a maximum of 3 images per thread.");
        return;
    }

    let localPreviewUrl = '';
    const tempId = `img-${Date.now()}`;

    try {
        isUploadingImage.value = true;
        console.log('State: isUploadingImage set to true');

        // 0. Prepare local preview
        localPreviewUrl = URL.createObjectURL(file);

        // 1. Ensure Editor is focused before inserting
        const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
        if (!editor) {
            console.error('Editor not found!');
            return;
        }
        
        editor.focus();
        
        // 2. Insert optimistic preview
        const imgHtml = `<img id="${tempId}" src="${localPreviewUrl}" alt="Uploading..." style="max-width:100%; border-radius:12px; margin: 1rem 0; opacity: 0.5; filter: grayscale(1); transition: all 0.5s;" />`;
        
        // Try to insert at cursor, fallback to append if selection is lost
        const inserted = document.execCommand('insertHTML', false, imgHtml);
        if (!inserted) {
            console.warn('execCommand failed, appending to editor end');
            editor.innerHTML += imgHtml;
        }

        // Give UI a moment
        await new Promise(resolve => setTimeout(resolve, 100));

        // 3. Compression & Upload
        const options = {
            maxSizeMB: 1.0,
            maxWidthOrHeight: 1600,
            useWebWorker: false,
            onProgress: (p: number) => {
                // Compression takes up the first 50% of the progress bar
                uploadProgress.value = Math.round(p / 2);
            }
        };
        
        const compressedFile = await imageCompression(file, options);
        console.log('Image compressed. Uploading...');
        
        const result = await uploadToCloudinary(compressedFile, (p) => {
            // Upload takes up the remaining 50% (from 50 to 100)
            uploadProgress.value = 50 + Math.round(p / 2);
        });
        console.log('Upload successful. Swapping URL...');
        
        // 4. Finalize
        const img = document.getElementById(tempId);
        if (img) {
            img.setAttribute('src', result.secure_url);
            img.style.opacity = '1';
            img.style.filter = 'none';
            img.removeAttribute('id');
            img.setAttribute('alt', '');
        }
        
        thesisHtml.value = editor.innerHTML;
        syncBlocksFromHtml(editor.innerHTML);

    } catch (error) {
        console.error('Image process failed:', error);
        setCreationError('Failed to process image.');
        const img = document.getElementById(tempId);
        if (img) img.remove();
    } finally {
        isUploadingImage.value = false;
        console.log('State: isUploadingImage set to false');
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        // Reset the file input so the same file can be picked again
        if (event.target) (event.target as HTMLInputElement).value = '';
    }
}

export async function createThread( authorId: string) {
    const editor = document.querySelector('[contenteditable="true"]');
    if (editor) syncBlocksFromHtml(editor.innerHTML);
    
    if (isSubmitting.value) return
    if (blocks.value.length === 0) {
        alert("Please add some content to your thesis.");
        return;
    }

  const threadRef = doc(collection(db, 'threads'))
  const userRef = doc(db, 'users', authorId);

  try {
    await setDoc(threadRef, {
      id: threadRef.id,
      title: threadTitle.value,
      description: threadDescription.value,
      category: category.value,
      subcategory: subcategory.value,
      thesis: {
        blocks: blocks.value
      },
      
      authorId,
      status: 'active',
      createdAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      includedTrades: selectedTrades.value
    })

    await updateDoc(userRef, {
      threads: increment(1)
    })
    status.value = 'success'
    threadId.value = threadRef.id

  } catch (error) {
    status.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}


export async function updateThread(
  authorId: string,
  threadId: string
) {
  const editor = document.querySelector('[contenteditable="true"]');
  if (editor) syncBlocksFromHtml(editor.innerHTML);
  
  if (isSubmitting.value) return
  if (!threadId) return
  if (blocks.value.length === 0) return

  isSubmitting.value = true

  const threadRef = doc(db, 'threads', threadId)

  try {
    const threadSnap = await getDoc(threadRef)

    if (!threadSnap.exists()) {
      throw new Error('Thread does not exist')
    }

    const threadData = threadSnap.data()

    if (threadData.authorId !== authorId) {
      throw new Error('Permission denied: not the author')
    }

    await updateDoc(threadRef, {
      title: threadTitle.value,
      description: threadDescription.value,
      category: category.value,
      subcategory: subcategory.value,
      thesis: {
        blocks: blocks.value
      },
      lastActivityAt: serverTimestamp(),
      includedTrades: selectedTrades.value
    })
    status.value = 'success'
  } catch (error) {
    console.error(error)
    status.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

export async function deleteThread(
  authorId: string,
  threadId: string
) {
  if (isSubmitting.value) return
  if (!threadId) return

  isSubmitting.value = true

  const threadRef = doc(db, 'threads', threadId)
  const userRef = doc(db, 'users', authorId);

  try {
    const threadSnap = await getDoc(threadRef)

    if (!threadSnap.exists()) {
      throw new Error('Thread does not exist')
    }

    const threadData = threadSnap.data()

    if (threadData.authorId !== authorId) {
      throw new Error('Permission denied: not the author')
    }

    await deleteDoc(threadRef)

    await updateDoc(userRef, {
      threads: increment(-1)
    })

    status.value = 'deleted'
  } catch (error) {
    console.error(error)
    status.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

export async function createThreadLink(payload: {
  fromThreadId: string
  toThreadId: string
  type: LinkType
}): Promise<ThreadLink | null> {
  const linkRef = doc(collection(db, 'threadLinks'))

  const link: ThreadLink = {
    id: linkRef.id,
    fromThreadId: payload.fromThreadId,
    toThreadId: payload.toThreadId,
    type: payload.type
  }

  await setDoc(linkRef, {
    fromThreadId: link.fromThreadId,
    toThreadId: link.toThreadId,
    type: link.type
  })

  return link
}