import { defineStore } from 'pinia'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '@/shared/firebase.client'

import type { Reply } from '~/entities/reply/model/reply.types'
import type { Thread } from '~/entities/thread/model/thread.types'
import type { ThreadLink } from '~/entities/threadLink/model/threadLink.types'
import type { Diary, DiaryEntry } from '~/entities/diary/model/diary.types'


import { threadConverter, replyConverter, threadLinkConverter, diaryConverter } from '~/composables/typeConverters'

export const useForumStore = defineStore('forum', {
  state: () => ({
    threads: new Map<string, Thread>(),
    replies: new Map<string, Reply[]>(),
    users: new Map<string, any>(),
    threadLinks: new Map<string, ThreadLink[]>(),
    allThreadLinks: new Map<string, ThreadLink[]>(),
    diaries: new Map<string, DiaryEntry[]>(),
    quotes: new Map(),
    loading: false,
  }),

  actions: {
    // DEDICATED DIARY ACTIONS
    addDiaryEntry(authorId: string, entry: DiaryEntry) {
      // Trigger deep reactivity by modifying the existing array, or creating a new map instance
      const currentDiary = this.diaries.get(authorId) || []
      const newDiary = [...currentDiary, entry]
      
      this.diaries.set(authorId, newDiary)
      this.diaries = new Map(this.diaries) // FORCE REACTIVITY MAP UPDATE
      
      // Also keep user profile in sync if it exists
      const user = this.users.get(authorId)
      if (user) {
        this.users.set(authorId, { ...user, diary: newDiary })
        this.users = new Map(this.users) // FORCE REACTIVITY MAP UPDATE
      }
    },
    removeDiaryEntry(authorId: string, entryId: number) {
        const currentDiary = this.diaries.get(authorId) || []
        const newDiary = currentDiary.filter((_, index) => index !== entryId)
        
        this.diaries.set(authorId, newDiary)
        this.diaries = new Map(this.diaries)

        const user = this.users.get(authorId)
        if (user) {
          this.users.set(authorId, { ...user, diary: newDiary })
          this.users = new Map(this.users)
        }
      },
    clearDiary(authorId: string, strategyId?: string) {
      const currentDiary = this.diaries.get(authorId) || []
      let newDiary: DiaryEntry[] = []

      if (strategyId) {
          newDiary = currentDiary.filter((e: DiaryEntry) => e.strategyId !== strategyId)
      }

      this.diaries.set(authorId, newDiary)
      this.diaries = new Map(this.diaries)

      const user = this.users.get(authorId)
      if (user) {
        this.users.set(authorId, { ...user, diary: newDiary })
        this.users = new Map(this.users)
      }
    },
    updateDiaryEntryVisuals(authorId: string, entryId: number, newNotes: string, newImages: any[]) {
        const currentDiary = this.diaries.get(authorId) || []
        if (currentDiary[entryId]) {
            currentDiary[entryId].notes = newNotes;
            currentDiary[entryId].images = newImages;
            this.diaries.set(authorId, [...currentDiary])
            this.diaries = new Map(this.diaries)
            
            const user = this.users.get(authorId)
            if (user) {
                this.users.set(authorId, { ...user, diary: [...currentDiary] })
                this.users = new Map(this.users)
            }
        }
    },
    updateDiaryEntryNote(authorId: string, entryId: number, newNote: string) {
        const currentDiary = this.diaries.get(authorId) || []
        if (currentDiary[entryId]) {
            currentDiary[entryId].notes = newNote;
            this.diaries.set(authorId, [...currentDiary])
            this.diaries = new Map(this.diaries)
            
            const user = this.users.get(authorId)
            if (user) {
                this.users.set(authorId, { ...user, diary: [...currentDiary] })
                this.users = new Map(this.users)
            }
        }
    },

      async addReply(reply: Reply) {
        if(this.loading) return;
        this.loading = true;
        try {
          const currentList = this.replies.get(reply.threadId) || [];
    
          const newList = [...currentList, reply];
        
          this.replies.set(reply.threadId, newList);
        }finally{
          this.loading = false;
        }
      },

      removeReply(threadId: string, replyId: string) {
        const list = this.replies.get(threadId)
        if (!list) return

        this.replies.set(
          threadId,
          list.filter(reply => reply.id !== replyId)
        )
      },

      async removeThread(threadId: string) {
        this.threads.delete(threadId)
        this.replies.delete(threadId)
        this.threadLinks.delete(threadId)
      },

      addThread(thread: Thread) {
        this.threads.set(thread.id, thread)
        this.threads = new Map(this.threads)
      },

      async createThread(threadData: Omit<Thread, 'id'> & Record<string, any>): Promise<Thread> {
        this.loading = true
        try {
          const threadRef = doc(collection(db, 'threads'))
          const thread = {
            id: threadRef.id,
            ...threadData
          } as Thread & Record<string, any>

          await setDoc(threadRef, thread)
          this.threads.set(thread.id, thread)
          this.threads = new Map(this.threads)

          return thread
        } finally {
          this.loading = false
        }
      },

      getAuthor(userId: string) {
        const user = this.users.get(userId)
       
        if (!user) return 'anonymous'
 
        return user
      },

    async fetchThread(id: string): Promise<Thread | null> {
      if (this.threads.has(id)) {
        return this.threads.get(id)!
      }

      const ref = doc(db, 'threads', id).withConverter(threadConverter)
      const snap = await getDoc(ref)
      if (!snap.exists()) return null

      const thread = snap.data()
      this.threads.set(thread.id, thread)
      this.threads = new Map(this.threads)
      return thread
    },

    async fetchThreadList(limitCount = 30, orderField = 'lastActivityAt'): Promise<void> {
      this.loading = true

      try {
        const q = query(
          collection(db, 'threads').withConverter(threadConverter),
          orderBy(orderField, 'desc'),
          limit(limitCount)
        )

        const snap = await getDocs(q)

        snap.forEach(d => {
          const thread = d.data()
          this.threads.set(thread.id, thread)
        })
        this.threads = new Map(this.threads)

      } finally {
        this.loading = false
      }
    },

    async fetchFollowedThreads(followedIds: string[], limitCount = 30): Promise<void> {
      if (!followedIds || followedIds.length === 0) return;
      this.loading = true

      try {
        const chunks = []
        for (let i = 0; i < followedIds.length; i += 10) {
           chunks.push(followedIds.slice(i, i + 10))
        }

        for (const chunk of chunks) {
            const q = query(
                collection(db, 'threads').withConverter(threadConverter),
                where('authorId', 'in', chunk),
                orderBy('lastActivityAt', 'desc'),
                limit(limitCount)
            )

            const snap = await getDocs(q)

            snap.forEach(d => {
                const thread = d.data()
                this.threads.set(thread.id, thread)
            })
        }
      } finally {
        this.loading = false
      }
    },

    async fetchQuotes(){
      const q = query(
        collection(db, 'quotes')
      )

      const snap = await getDocs(q)

      
      snap.forEach(d => {
        const quote = d.data()
        this.quotes.set(d.id, quote)
      })
    },


    async fetchReplies(threadId: string): Promise<Reply[]> {
    const q = query(
        collection(db, 'replies').withConverter(replyConverter),
        where('threadId', '==', threadId)
    )

    const snap = await getDocs(q)

    const list: Reply[] = snap.docs.map(d => d.data())

    this.replies.set(threadId, list)
    return list
    },

    async fetchUser(userId: string) {
      this.loading = true
      try{
      if (this.users.has(userId)) {
        return this.users.get(userId)
      }

      const snap = await getDoc(doc(db, 'users', userId))
      if (!snap.exists()) return null

      const user = snap.data()
      this.users.set(userId, user)
      return user
      }finally{
        this.loading = false
      }
    },


    async fetchThreadLinks(threadId: string): Promise<ThreadLink[]> {
      if (this.threadLinks.has(threadId)) {
        return this.threadLinks.get(threadId)!
      }

      // Fetch links where this thread is the source
      const qFrom = query(
        collection(db, 'threadLinks').withConverter(threadLinkConverter),
        where('fromThreadId', '==', threadId)
      )
      // Fetch links where this thread is the target
      const qTo = query(
        collection(db, 'threadLinks').withConverter(threadLinkConverter),
        where('toThreadId', '==', threadId)
      )

      const [snapFrom, snapTo] = await Promise.all([getDocs(qFrom), getDocs(qTo)])

      const links: ThreadLink[] = []
      snapFrom.forEach(d => links.push(d.data()))
      snapTo.forEach(d => {
        // Avoid duplicates (shouldn't happen but be safe)
        if (!links.find(l => l.id === d.id)) links.push(d.data())
      })

      this.threadLinks.set(threadId, links)
      return links
    },
    async fetchAllThreadLinks() {
      const q = query(
        collection(db, 'threadLinks').withConverter(threadLinkConverter)
      )

      const snap = await getDocs(q)
      const links: ThreadLink[] = []

      snap.forEach(d => {
        const link = d.data()
        links.push(link)
      })

      this.allThreadLinks.set('all', links)

      return links
    },

    clearThread(threadId: string) {
      this.replies.delete(threadId)
      this.threadLinks.delete(threadId)
    },

    reset() {
      this.threads.clear()
      this.replies.clear()
      this.users.clear()
      this.threadLinks.clear()
    },
  },
})
