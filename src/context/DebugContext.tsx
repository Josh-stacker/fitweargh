import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

const DEBUG_EMAIL = "nerdosey@gmail.com";
const STORAGE_KEY = "fitwear_debug";

interface DebugContextType {
  debugEnabled: boolean;
  isDebugUser: boolean;
  toggleDebug: () => void;
  log: (...args: unknown[]) => void;
}

const DebugContext = createContext<DebugContextType>({
  debugEnabled: false,
  isDebugUser: false,
  toggleDebug: () => {},
  log: () => {},
});

export function DebugProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isDebugUser = user?.email === DEBUG_EMAIL;
  const [debugEnabled, setDebugEnabled] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    if (!isDebugUser && debugEnabled) {
      setDebugEnabled(false);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isDebugUser, debugEnabled]);

  const toggleDebug = () => {
    if (!isDebugUser) return;
    setDebugEnabled((prev) => {
      const next = !prev;
      try { next ? localStorage.setItem(STORAGE_KEY, "1") : localStorage.removeItem(STORAGE_KEY); } catch {}
      return next;
    });
  };

  const log = (...args: unknown[]) => {
    if (debugEnabled) console.log(...args);
  };

  return (
    <DebugContext.Provider value={{ debugEnabled, isDebugUser, toggleDebug, log }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  return useContext(DebugContext);
}
