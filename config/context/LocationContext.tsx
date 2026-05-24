'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { isCityServiceable } from '@/lib/serviceable-cities';

const STORAGE_KEY = 'amarago_location';

interface StoredLocation {
  location: string;
  confirmed: boolean;
  isGift: boolean;
}

interface LocationContextValue {
  /** Full location string e.g. "Bandra, Mumbai" */
  location: string;
  /** Has the user explicitly confirmed their city? */
  locationConfirmed: boolean;
  /** Is the current location within a serviceable city? */
  isServiceable: boolean;
  /** Is this a gift booking (user's own city differs from service city)? */
  isGift: boolean;
  /** Set location; confirmed=true persists it and hides the gate */
  setLocation: (loc: string, opts?: { confirmed?: boolean; isGift?: boolean }) => void;
  /** Force the gate modal to reappear (e.g. "change city") */
  resetLocation: () => void;
  /** Whether the initial localStorage read is done */
  ready: boolean;
}

const LocationContext = createContext<LocationContextValue>({
  location: '',
  locationConfirmed: false,
  isServiceable: false,
  isGift: false,
  setLocation: () => {},
  resetLocation: () => {},
  ready: false,
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState('');
  const [locationConfirmed, setConfirmed] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [ready, setReady] = useState(false);

  // Read from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredLocation = JSON.parse(raw);
        setLocationState(parsed.location ?? '');
        setConfirmed(parsed.confirmed ?? false);
        setIsGift(parsed.isGift ?? false);
      }
    } catch {
      // ignore corrupted storage
    }
    setReady(true);
  }, []);

  const setLocation = useCallback(
    (
      loc: string,
      opts: { confirmed?: boolean; isGift?: boolean } = {}
    ) => {
      const confirmed = opts.confirmed ?? true;
      const gift = opts.isGift ?? false;
      setLocationState(loc);
      setConfirmed(confirmed);
      setIsGift(gift);
      try {
        const data: StoredLocation = { location: loc, confirmed, isGift: gift };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore storage errors
      }
    },
    []
  );

  const resetLocation = useCallback(() => {
    setConfirmed(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const isServiceable = isCityServiceable(location);

  return (
    <LocationContext.Provider
      value={{
        location,
        locationConfirmed,
        isServiceable,
        isGift,
        setLocation,
        resetLocation,
        ready,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
