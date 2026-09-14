import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';

/**
 * Loads the current session + profile row and keeps them in sync as auth
 * state changes. Every protected page/component can call this instead of
 * re-implementing the same Supabase auth listener.
 */
export function useProfile() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load(currentSession) {
      setSession(currentSession);
      if (!currentSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const user = currentSession.user;

      // maybeSingle() instead of single() — a missing row returns null
      // cleanly instead of throwing a 406.
      let { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!data) {
        // Self-heal: the handle_new_user DB trigger should always create
        // this row automatically on signup, but if it didn't for some
        // reason (an edge case in an OAuth provider's metadata shape, or
        // an account that signed up before a trigger fix landed), create
        // a minimal profile now rather than leaving the account
        // permanently stuck with no way to load one.
        const fallbackHandle = user.email || user.phone || `user_${user.id.slice(0, 8)}`;
        const meta = user.user_metadata || {};
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: meta.full_name || meta.name || fallbackHandle.split('@')[0],
            username: meta.username || `${fallbackHandle.split('@')[0]}_${user.id.slice(0, 6)}`,
            email: user.email || null,
            access_status: 'pending',
          })
          .select()
          .single();

        if (insertError) {
          // A 409 here means the DB trigger's own insert just landed a
          // moment after our SELECT ran but before our INSERT did — the
          // row genuinely exists now, just re-fetch it rather than
          // treating this race as a real failure.
          const { data: existing } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          data = existing;
        } else {
          data = created;
        }
      }

      if (mounted) {
        setProfile(data);
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => load(session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      load(newSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, profile, loading };
}
