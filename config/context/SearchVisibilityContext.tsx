// SearchVisibilityContext.tsx
'use client';
import { createContext, useContext, useState } from 'react';
import { Service } from '@/app/(client)/client/home/_types';

const Ctx = createContext<{
  heroSearchVisible: boolean;
  setHeroSearchVisible: (v: boolean) => void;
  navServices: Service[];
  setNavServices: (s: Service[]) => void;
  navigateToService: (id: string) => void;
  setNavigateToService: (fn: (id: string) => void) => void;
}>({
  heroSearchVisible: true,
  setHeroSearchVisible: () => {},
  navServices: [],
  setNavServices: () => {},
  navigateToService: () => {},
  setNavigateToService: () => {},
});

export function SearchVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [heroSearchVisible, setHeroSearchVisible] = useState(true);
  const [navServices, setNavServices] = useState<Service[]>([]);
  const [navigateToService, setNavigateToService] = useState<(id: string) => void>(() => () => {});

  return (
    <Ctx.Provider value={{
      heroSearchVisible, setHeroSearchVisible,
      navServices, setNavServices,
      navigateToService, setNavigateToService,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSearchVisibility = () => useContext(Ctx);