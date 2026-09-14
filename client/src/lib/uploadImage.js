import { api } from './api.js';

// Guardrails: stop an accidental huge upload before it ever reaches
// Cloudflare — a 500KB chart screenshot doesn't need a 20MB raw photo.
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_DIMENSION_PX = 4096; // longest side

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image file'));
    };
    img.src = url;
  });
}

/**
 * Validates, then uploads a File directly to Cloudflare Images via the
 * server-issued one-time upload URL, then confirms the media_assets row.
 * Returns the saved media row ({ id, provider_asset_id, ... }).
 *
 * The server independently enforces the daily upload cap (see
 * server/src/middleware/rateLimitUploads.js) — this client-side check is
 * a fast fail for obviously-oversized files, not the actual enforcement.
 */
export async function uploadImage(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Image is too large — max ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
  }

  const { width, height } = await readImageDimensions(file);
  if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
    throw new Error(`Image dimensions too large — max ${MAX_DIMENSION_PX}px on the longest side`);
  }

  // 1. Ask our API for a one-time Cloudflare direct-upload URL.
  const { imageId, uploadURL } = await api.post('/media/images/upload-url');

  // 2. Upload the file straight to Cloudflare — never through our server.
  const formData = new FormData();
  formData.append('file', file);
  const uploadResp = await fetch(uploadURL, { method: 'POST', body: formData });
  if (!uploadResp.ok) throw new Error('Upload to Cloudflare failed');

  // 3. Confirm with our API so it's saved as a media_assets row.
  return api.post('/media/images/confirm', { imageId }); // { media, deliveryUrl }
}
