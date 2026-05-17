import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function key(item: Pick<CartItem, "id" | "size" | "color">) {
  return `${item.id}__${item.size}__${item.color}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (incoming: CartItem) => {
    setItems((prev) => {
      const k = key(incoming);
      const existing = prev.find((i) => key(i) === k);
      if (existing) {
        return prev.map((i) =>
          key(i) === k ? { ...i, quantity: i.quantity + incoming.quantity } : i
        );
      }
      return [...prev, incoming];
    });
  };

  const removeItem = (id: string, size: string, color: string) => {
    const k = key({ id, size, color });
    setItems((prev) => prev.filter((i) => key(i) !== k));
  };

  const updateQty = (id: string, size: string, color: string, qty: number) => {
    const k = key({ id, size, color });
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => key(i) !== k));
    } else {
      setItems((prev) =>
        prev.map((i) => (key(i) === k ? { ...i, quantity: qty } : i))
      );
    }
  };

  const clearCart = () => setItems([]);

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
