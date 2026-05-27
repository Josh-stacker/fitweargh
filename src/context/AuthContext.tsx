import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { welcomeEmailHtml } from "../emails/welcomeEmail";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function checkAdmin(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const admin = await checkAdmin(u.uid);
        setIsAdmin(admin);
        setUser(u);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const admin = await checkAdmin(cred.user.uid);
    if (admin) {
      await signOut(auth);
      throw new Error("Admin accounts must sign in via the admin portal.");
    }
    setIsAdmin(false);
  };

  const loginAdmin = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const admin = await checkAdmin(cred.user.uid);
    if (!admin) {
      await signOut(auth);
      throw new Error("Not an admin account.");
    }
    setIsAdmin(true);
  };

  const register = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "customers", cred.user.uid), {
      name,
      email,
      phone: "",
      orderCount: 0,
      totalSpent: 0,
      createdAt: serverTimestamp(),
    });
    // Welcome email
    await setDoc(doc(db, "mail", `welcome_${cred.user.uid}`), {
      to: email,
      message: {
        subject: "Welcome to FitwearGH!",
        html: welcomeEmailHtml(name),
      },
    });
    setUser({ ...cred.user, displayName: name });
    setIsAdmin(false);
  };

  const logout = async () => {
    await signOut(auth);
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

