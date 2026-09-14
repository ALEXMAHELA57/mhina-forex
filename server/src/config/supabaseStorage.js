import { supabaseAdmin } from './supabase.js';

const BUCKET = 'course-documents';

/**
 * Generates a one-time signed URL the browser can upload a document
 * (PDF/ebook) directly to — the file bytes never pass through our server.
 * Docs: https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl
 */
export async function createDocumentUploadUrl(fileName) {
  const path = `${Date.now()}-${fileName}`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(`Supabase Storage upload URL failed: ${error.message}`);
  return { path, token: data.token, signedUrl: data.signedUrl };
}

/**
 * Generates a short-lived signed READ url for viewing a document — this
 * is the actual gate: call it only after checking the requester's tier
 * against the course the document belongs to. Short expiry means a
 * leaked link goes stale quickly rather than being a permanent download.
 */
export async function createDocumentViewUrl(path, expiresInSeconds = 300) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) throw new Error(`Supabase Storage view URL failed: ${error.message}`);
  return data.signedUrl;
}
