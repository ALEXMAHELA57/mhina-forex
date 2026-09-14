import { createClient } from '@supabase/supabase-js';

// Public anon client — safe to use in the browser. RLS policies in
// db/rls_policies.sql are what actually enforce access control on
// every query made through this client.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
