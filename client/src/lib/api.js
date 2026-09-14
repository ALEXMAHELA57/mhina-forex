import { supabase } from './supabaseClient.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

/**
 * Thin fetch wrapper that attaches the current Supabase session's JWT as
 * a Bearer token, so every call is authenticated the same way the
 * server's requireAuth middleware expects.
 */
async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const resp = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json.error || `Request failed: ${resp.status}`);
  return json;
}

export const api = {
  get: (path) => apiFetch(path, { method: 'GET' }),
  post: (path, body) => apiFetch(path, { method: 'POST', body }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
};
