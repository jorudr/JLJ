// Cloudinary configuration placeholders
// To get these, go to your Cloudinary Dashboard > Settings > Enable Unsigned Uploads
export const CLOUD_NAME = 'dc11u4c6i';
export const UPLOAD_PRESET = 'ml_default';

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Uploads a file to Cloudinary using the unsigned upload preset with progress tracking.
 * @param file The file to upload (Blob or File)
 * @param onProgress Callback function for upload progress (0-100)
 * @returns The Cloudinary response object
 */
export async function uploadToCloudinary(
    file: Blob | File,
    onProgress?: (progress: number) => void
): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
        const xhr = new XMLHttpRequest();

        xhr.open('POST', url);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    reject(new Error(errorData.error?.message || 'Upload failed'));
                } catch {
                    reject(new Error('Failed to upload image to Cloudinary'));
                }
            }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
    });
}
