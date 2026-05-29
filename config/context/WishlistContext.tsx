'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { wishlistAPI } from '@/lib/api';

const STORAGE_KEY = 'amarago_wishlist';

interface WishlistContextValue {
  wishlist: string[];
  isWishlisted: (serviceId: string) => boolean;
  toggleWishlist: (serviceId: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextValue>({
  wishlist: [],
  isWishlisted: () => false,
  toggleWishlist: async () => {},
  loading: false,
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWishlist(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist)); } catch {}
  }, [wishlist]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const local: string[] = (() => {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
          })();
          let serverList: string[];
          if (local.length > 0) {
            const { data } = await wishlistAPI.sync(local);
            serverList = data.wishlist;
          } else {
            const { data } = await wishlistAPI.get();
            serverList = data.wishlist;
          }
          setWishlist(serverList);
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  const toggleWishlist = useCallback(async (serviceId: string) => {
    const isIn = wishlist.includes(serviceId);
    setWishlist((prev) =>
      isIn ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
    if (user) {
      try {
        const { data } = isIn
          ? await wishlistAPI.remove(serviceId)
          : await wishlistAPI.add(serviceId);
        setWishlist(data.wishlist);
      } catch {
        setWishlist((prev) =>
          isIn ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)
        );
      }
    }
  }, [wishlist, user]);

  const isWishlisted = useCallback(
    (serviceId: string) => wishlist.includes(serviceId),
    [wishlist]
  );

  return (
    <WishlistContext.Provider value={{ wishlist, isWishlisted, toggleWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
