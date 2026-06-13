import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "../supabase";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size: string, color: string) => void;
  updateQty: (id: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "fitweargh_cart";

function loadLocal(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function itemKey(item: Pick<CartItem, "id" | "size" | "color">) {
  return `${item.id}__${item.size}__${item.color}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(loadLocal);
  // Track whether we've loaded from Firestore for this user session
  const loadedForUser = useRef<string | null>(null);

  // When user logs in: load their Firestore cart and merge with any local guest items
  useEffect(() => {
    if (!user || loadedForUser.current === user.uid) return;

    const merge = async () => {
      try {
        const { data } = await supabase.from("carts").select("items").eq("id", user.uid).maybeSingle();
        const remoteItems: CartItem[] = data ? (data.items ?? []) : [];
        const localItems = loadLocal();

        // Merge: local items take precedence for qty (guest added items win over stale remote)
        const merged = [...remoteItems];
        for (const local of localItems) {
          const k = itemKey(local);
          const idx = merged.findIndex((r) => itemKey(r) === k);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + local.quantity };
          } else {
            merged.push(local);
          }
        }

        setItems(merged);
        loadedForUser.current = user.uid;
        // Clear local guest cart after merging
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Firestore unavailable — stay with local
      }
    };

    merge();
  }, [user]);

  // Reset loaded flag on logout
  useEffect(() => {
    if (!user) {
      loadedForUser.current = null;
    }
  }, [user]);

  // Persist: Firestore for logged-in users, localStorage for guests
  useEffect(() => {
    if (user && loadedForUser.current === user.uid) {
      void supabase.from("carts").upsert({
        id: user.uid,
        items,
        updated_at: new Date().toISOString(),
      });
    } else if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, user]);

  const addItem = (incoming: CartItem) => {
    setItems((prev) => {
      const k = itemKey(incoming);
      const existing = prev.find((i) => itemKey(i) === k);
      if (existing) {
        return prev.map((i) =>
          itemKey(i) === k ? { ...i, quantity: i.quantity + incoming.quantity } : i
        );
      }
      return [...prev, incoming];
    });
  };

  const removeItem = (id: string, size: string, color: string) => {
    const k = itemKey({ id, size, color });
    setItems((prev) => prev.filter((i) => itemKey(i) !== k));
  };

  const updateQty = (id: string, size: string, color: string, qty: number) => {
    const k = itemKey({ id, size, color });
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => itemKey(i) !== k));
    } else {
      setItems((prev) =>
        prev.map((i) => (itemKey(i) === k ? { ...i, quantity: qty } : i))
      );
    }
  };

  const clearCart = () => {
    setItems([]);
    if (user) {
      void supabase.from("carts").upsert({ id: user.uid, items: [], updated_at: new Date().toISOString() });
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
