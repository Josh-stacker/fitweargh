import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Two independent auth sessions (separate storageKey) so a customer can be
// signed in on the storefront at the same time an admin is signed in to the
// dashboard, in the same browser, without one login evicting the other.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { storageKey: "fitweargh-customer-auth" },
});

export const adminSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: { storageKey: "fitweargh-admin-auth" },
});

export interface AppUser {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
}
