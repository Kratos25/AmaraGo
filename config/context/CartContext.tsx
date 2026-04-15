"use client";

/**
 * CartContext — manages cart state for both guests and authenticated users.
 *
 * Guest flow:  generates a UUID stored in localStorage as "amara_guest_id"
 *              sends X-Guest-Id header on all cart API calls
 *
 * Auth flow:   uses Firebase ID token as Bearer
 *              on login, calls POST /cart/merge to transfer guest cart → user cart
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "@/lib/axios";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  service_id?: string;
  package_id?: string;
  name: string;
  price: number;
  duration?: string;
  quantity: number;
  image_url?: string;
}

interface CartContextValue {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  loading: boolean;
  addItem: (item: Omit<CartItem, "id">) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

// ── Helpers ────────────────────────────────────────────────────────────────────

function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "";
  let gid = localStorage.getItem("amara_guest_id");
  if (!gid) {
    gid = crypto.randomUUID();
    localStorage.setItem("amara_guest_id", gid);
  }
  return gid;
}

async function authHeaders(user: User | null): Promise<Record<string, string>> {
  if (user) {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }
  return { "X-Guest-Id": getOrCreateGuestId() };
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const prevUserRef = useRef<User | null>(null);

  const fetchCart = useCallback(async (user: User | null) => {
    setLoading(true);
    try {
      const headers = await authHeaders(user);
      const { data } = await axios.get("/cart", { headers });
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Watch auth state — on login, merge guest cart then refresh
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      const wasGuest = prevUserRef.current === null;
      prevUserRef.current = user;
      setCurrentUser(user);

      if (user && wasGuest) {
        // Merge guest cart into user cart
        const guestId = typeof window !== "undefined"
          ? localStorage.getItem("amara_guest_id")
          : null;
        if (guestId) {
          try {
            const token = await user.getIdToken();
            await axios.post(
              "/cart/merge",
              { guest_id: guestId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            localStorage.removeItem("amara_guest_id");
          } catch {
            // non-fatal
          }
        }
      }

      await fetchCart(user);
    });
    return unsub;
  }, [fetchCart]);

  const addItem = useCallback(async (item: Omit<CartItem, "id">) => {
    const headers = await authHeaders(currentUser);
    const { data } = await axios.post("/cart", item, { headers });
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.id === data.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = data;
        return next;
      }
      return [...prev, data];
    });
  }, [currentUser]);

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    const headers = await authHeaders(currentUser);
    const { data } = await axios.put(`/cart/${itemId}`, { quantity }, { headers });
    setItems((prev) => prev.map((i) => (i.id === itemId ? data : i)));
  }, [currentUser]);

  const removeItem = useCallback(async (itemId: string) => {
    const headers = await authHeaders(currentUser);
    await axios.delete(`/cart/${itemId}`, { headers });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, [currentUser]);

  const clearCart = useCallback(async () => {
    const headers = await authHeaders(currentUser);
    await axios.delete("/cart", { headers });
    setItems([]);
  }, [currentUser]);

  const refreshCart = useCallback(() => fetchCart(currentUser), [fetchCart, currentUser]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, subtotal, itemCount, loading, addItem, updateItem, removeItem, clearCart, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}