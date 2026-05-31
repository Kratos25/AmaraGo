// _sections/HeroSection.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { Check, Star } from 'lucide-react';
import { CombinedSearchBar } from '../../_components/CombinedSearchBar';
import { Service } from '../_types/index';
import { useSearchVisibility } from '@/config/context/SearchVisibilityContext';

interface Props {
  allServicesForSearch: Service[];
  navigateToService: (id: string) => void;
  userLocation: string;
  isLoadingLocation: boolean;
  onLocationClick: () => void;
}

export function HeroSection({
  allServicesForSearch,
  navigateToService,
  userLocation,
  isLoadingLocation,
  onLocationClick,
}: Props) {
  const searchRef = useRef<HTMLDivElement>(null);
  const { setHeroSearchVisible } = useSearchVisibility();

  useEffect(() => {
    const el = searchRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroSearchVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [setHeroSearchVisible]);

  return (
    <section className="bg-[#FFEAEF]">
      <div className="w-full mx-auto px-4 md:pl-28 md:pr-0 pt-8 pb-0 md:py-0 flex flex-col md:flex-row items-center gap-6 md:gap-16">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#111827] leading-tight mb-3">
            Self-care starts at your{' '}
            <span className="text-[#E8708E]">doorstep<span className="text-black">.</span></span>
          </h1>
          <p className="text-[#805660] text-sm md:text-base mb-4">
            Book verified beauty experts in minutes
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-6">
            {['Verified Professionals', 'Free rescheduling', 'Safe & hygienic', 'On-time guarantee'].map((b) => (
              <span key={b} className="flex items-center gap-1 text-xs text-gray-600">
                <Check size={12} className="text-[#E8708E]" strokeWidth={3} /> {b}
              </span>
            ))}
          </div>

          {/* ← wrap the search bar in a ref div */}
          <div ref={searchRef}>
            <CombinedSearchBar
              services={allServicesForSearch}
              onNavigate={navigateToService}
              userLocation={isLoadingLocation ? 'Detecting…' : userLocation}
              onLocationClick={onLocationClick}
            />
          </div>

          <div className="flex items-center gap-2 mt-5">
            <Star size={16} className="text-amber-400" />
            <span className="text-[#4B5563]">4.8</span>
            <span className="text-black">&nbsp;·&nbsp;</span>
            <div className="flex -space-x-1">
              {[
                'https://api.dicebear.com/9.x/lorelei/svg?seed=Priya&backgroundColor=ffd5dc',
                'https://api.dicebear.com/9.x/lorelei/svg?seed=Ananya&backgroundColor=f9c4d2',
                'https://api.dicebear.com/9.x/lorelei/svg?seed=Meera&backgroundColor=ffb3c6',
              ].map((src, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-pink-200 border-2 border-white overflow-hidden flex items-center justify-center text-xs">
                  <img src={src} alt={`Customer ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-xs text-[#7F5660] font-medium">10,000+ bookings in Mumbai</span>
          </div>
        </div>
        
        <div className="relative flex-shrink-0 w-full md:w-auto flex justify-center md:block">
          {/* pink radial gradient blob behind the image */}
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-radial from-[#F9A8C9]/60 via-[#FFDCE9]/30 to-transparent blur-2xl scale-110" />
          <img src="/assets/hero/hero-professional.png" alt="AmaraGo beauty professional"
            className="relative w-2/3 sm:w-1/2 md:w-full h-auto md:h-full object-contain md:object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      </div>
    </section>
  );
}