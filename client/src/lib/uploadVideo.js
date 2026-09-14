import * as tus from 'tus-js-client';
import { api } from './api.js';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB — generous ceiling for lesson/session videos

/**
 * Uploads a video file directly to Bunny Stream using a resumable TUS
 * upload, authorized by a short-lived signature our server generated
 * (server never sees the file bytes; Bunny never sees our private key).
 * onProgress(percent) is called repeatedly during upload if provided.
 * Returns the saved media_assets row once confirmed.
 */
export async function uploadVideo(file, { title, onProgress } = {}) {
  if (!file.type.startsWith('video/')) {
    throw new Error('Only video files are allowed');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Video is too large — max ${MAX_FILE_SIZE_BYTES / 1024 / 1024 / 1024}GB`);
  }

  // 1. Ask our API to create the Bunny video object + get signed upload auth.
  const { videoGuid, libraryId, signature, expire, endpoint } = await api.post('/media/videos/create', {
    title: title || file.name,
  });

  // 2. Upload the file bytes directly to Bunny via TUS (resumable).
  await new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000],
      headers: {
        AuthorizationSignature: signature,
        AuthorizationExpire: String(expire),
        VideoId: videoGuid,
        LibraryId: String(libraryId),
      },
      metadata: {
        filetype: file.type,
        title: title || file.name,
      },
      onError: reject,
      onProgress: (bytesUploaded, bytesTotal) => {
        if (onProgress) onProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: resolve,
    });
    upload.start();
  });

  // 3. Confirm with our API so it's saved as a media_assets row.
  return api.post('/media/videos/confirm', { videoGuid });
}
