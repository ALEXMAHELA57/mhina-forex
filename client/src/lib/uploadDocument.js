import { supabase } from './supabaseClient.js';
import { api } from './api.js';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB — generous for a course PDF/ebook

/**
 * Uploads a PDF/ebook directly to Supabase Storage's private
 * "course-documents" bucket using a signed upload URL our server
 * generated (staff-only). Returns the saved media_assets row.
 */
export async function uploadDocument(file) {
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are supported right now');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large — max ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
  }

  const { path, token } = await api.post('/media/documents/upload-url', { fileName: file.name });

  const { error: uploadError } = await supabase.storage
    .from('course-documents')
    .uploadToSignedUrl(path, token, file);

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { media } = await api.post('/media/documents/confirm', { path });
  return media;
}
