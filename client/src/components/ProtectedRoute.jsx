import { Navigate } from 'react-router-dom';
import { useProfile } from '../lib/useProfile.js';

/**
 * Wraps any route that needs a logged-in user. Pass `requireActive` to
 * also enforce the access gate (Headway-verified or paid membership) —
 * this is a UX convenience only; the real enforcement is server-side
 * (API middleware + RLS), so this never substitutes for that.
 */
export default function ProtectedRoute({ children, requireActive = false }) {
  const { session, profile, loading } = useProfile();

  if (loading) return <p>Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (requireActive && profile?.access_status !== 'active') {
    return <Navigate to="/access-gate" replace />;
  }

  return children;
}
