import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { adminSupabase, type AppUser } from "../supabase";

interface AdminAuthContextType {
  user: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

async function checkAdmin(uid: string): Promise<boolean> {
  const { data, error } = await adminSupabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", uid)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

function toAppUser(user: User): AppUser {
  const metadata = user.user_metadata ?? {};
  return {
    uid: user.id,
    id: user.id,
    email: user.email ?? null,
    displayName: typeof metadata.full_name === "string" ? metadata.full_name : null,
  };
}

// Separate client/storageKey from the customer AuthContext so an admin can
// be signed in to /admin at the same time a customer is signed in on the
// storefront, in the same browser, without either login evicting the other.
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const syncSession = async (sessionUser: User | null) => {
      try {
        if (!sessionUser) {
          if (!mounted) return;
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const admin = await checkAdmin(sessionUser.id);
        if (!mounted) return;
        setUser(toAppUser(sessionUser));
        setIsAdmin(admin);
        setLoading(false);
      } catch (error) {
        console.error("Admin auth sync failed:", error);
        if (!mounted) return;
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    adminSupabase.auth.getSession().then(({ data: sessionData }) => {
      void syncSession(sessionData.session?.user ?? null);
    });

    const { data } = adminSupabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      void syncSession(session?.user ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const loginAdmin = async (email: string, password: string) => {
    const { data, error } = await adminSupabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("No user returned from Supabase.");

    const admin = await checkAdmin(data.user.id);
    if (!admin) {
      await adminSupabase.auth.signOut();
      throw new Error("Not an admin account.");
    }
    setUser(toAppUser(data.user));
    setIsAdmin(true);
  };

  const logout = async () => {
    await adminSupabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  const ctx: AdminAuthContextType = { user, isAdmin, loading, loginAdmin, logout };

  return <AdminAuthContext.Provider value={ctx}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
