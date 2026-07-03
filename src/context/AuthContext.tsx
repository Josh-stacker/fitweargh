import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase, type AppUser } from "../supabase";
import { welcomeEmailHtml } from "../emails/welcomeEmail";
import { queueAndSendMail } from "../lib/mail";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  confirmSignup: (email: string, token: string) => Promise<void>;
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

// This context is for the storefront/customer session only (uses the
// "customer" Supabase client). Admin sign-in lives in AdminAuthContext with
// its own client/storageKey, so a customer and an admin can be signed in at
// the same time in the same browser without one login evicting the other.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const syncSession = async (sessionUser: User | null, event?: AuthChangeEvent) => {
      try {
        if (!sessionUser) {
          if (!mounted) return;
          setUser(null);
          setLoading(false);
          return;
        }

        // An unconfirmed signup can still hand back a session (depends on
        // Supabase project auth settings) — don't treat that as logged in,
        // or the dashboard renders before the profile row / welcome email
        // logic (both gated on email_confirmed_at) have run.
        if (!sessionUser.email_confirmed_at) {
          if (!mounted) return;
          setUser(null);
          setLoading(false);
          return;
        }

        // Customer accounts only — admin accounts sign in through the admin
        // portal with its own session, so bail out here rather than showing
        // an admin as "logged in" on the storefront.
        const admin = await checkAdmin(sessionUser.id);
        if (admin) {
          if (!mounted) return;
          setUser(null);
          setLoading(false);
          return;
        }

        // On first confirmed signup, create profile and send welcome email.
        // Insert (not select-then-insert) so the profiles PK conflict is the
        // single source of truth for "already handled" — avoids a race where
        // two near-simultaneous SIGNED_IN events both pass a pre-check select
        // and both send the welcome email.
        if (event === "SIGNED_IN") {
          const meta = sessionUser.user_metadata ?? {};
          const name = typeof meta.full_name === "string" ? meta.full_name : "";
          const { error: insertError } = await supabase.from("profiles").insert({
            id: sessionUser.id,
            full_name: name,
            email: sessionUser.email ?? "",
            phone: "",
          });

          if (!insertError) {
            await queueAndSendMail([{
              to: sessionUser.email ?? "",
              subject: "Welcome to FitwearGH!",
              html: welcomeEmailHtml(name),
            }]);
          } else if (insertError.code !== "23505") {
            throw insertError;
          }
        }

        if (!mounted) return;
        setUser(toAppUser(sessionUser));
        setLoading(false);
      } catch (error) {
        console.error("Auth sync failed:", error);
        if (!mounted) return;
        setUser(null);
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

  const confirmSignup = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (error) throw error;
    if (!data.user) throw new Error("No user returned from Supabase.");
    setUser(toAppUser(data.user));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const ctx: AuthContextType = { user, loading, login, register, confirmSignup, logout };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
