import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase, type AppUser } from "../supabase";
import { welcomeEmailHtml } from "../emails/welcomeEmail";
import { queueAndSendMail } from "../lib/mail";

interface AuthContextType {
  user: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function checkAdmin(uid: string): Promise<boolean> {
  const { data, error } = await supabase
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
    displayName:
      typeof metadata.full_name === "string"
        ? metadata.full_name
        : typeof metadata.name === "string"
        ? metadata.name
        : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const syncSession = async (sessionUser: User | null, event?: AuthChangeEvent) => {
      try {
        if (!sessionUser) {
          if (!mounted) return;
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // On first confirmed signup, create profile and send welcome email
        if (event === "SIGNED_IN" && sessionUser.email_confirmed_at) {
          const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", sessionUser.id)
            .maybeSingle();

          if (!existing) {
            const meta = sessionUser.user_metadata ?? {};
            const name = typeof meta.full_name === "string" ? meta.full_name : "";
            await supabase.from("profiles").insert({
              id: sessionUser.id,
              name,
              email: sessionUser.email ?? "",
              phone: "",
              order_count: 0,
              total_spent: 0,
            });
            await queueAndSendMail([{
              to: sessionUser.email ?? "",
              subject: "Welcome to FitwearGH!",
              html: welcomeEmailHtml(name),
            }]);
          }
        }

        const admin = await checkAdmin(sessionUser.id);
        if (!mounted) return;
        setUser(toAppUser(sessionUser));
        setIsAdmin(admin);
        setLoading(false);
      } catch (error) {
        console.error("Auth sync failed:", error);
        if (!mounted) return;
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: sessionData }) => {
      void syncSession(sessionData.session?.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      void syncSession(session?.user ?? null, event);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("No user returned from Supabase.");

    const admin = await checkAdmin(data.user.id);
    if (admin) {
      await supabase.auth.signOut();
      throw new Error("Admin accounts must sign in via the admin portal.");
    }
    setUser(toAppUser(data.user));
    setIsAdmin(false);
  };

  const loginAdmin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("No user returned from Supabase.");

    const admin = await checkAdmin(data.user.id);
    if (!admin) {
      await supabase.auth.signOut();
      throw new Error("Not an admin account.");
    }
    setUser(toAppUser(data.user));
    setIsAdmin(true);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error("No user returned from Supabase.");
    // Profile creation and welcome email happen after OTP verification via onAuthStateChange
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  // Expose loginAdmin so AdminLogin can call it directly
  const ctx = { user, isAdmin, loading, login, register, logout, loginAdmin } as AuthContextType & { loginAdmin: typeof loginAdmin };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx as AuthContextType & { loginAdmin: (email: string, password: string) => Promise<void> };
}
