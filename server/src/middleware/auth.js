import { supabaseAdmin } from '../config/supabase.js';

/**
 * Verifies the Supabase JWT sent from the client (Authorization: Bearer <token>)
 * and attaches the authenticated user + their profile row to req.user.
 * Any route needing to know "who is calling" should use this first.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ error: 'Profile not found for authenticated user' });
  }

  req.user = userData.user;
  req.profile = profile;
  next();
}
