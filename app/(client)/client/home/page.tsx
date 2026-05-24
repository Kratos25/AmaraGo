'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { couponsAPI, categoriesAPI, packagesAPI, servicesAPI } from '@/lib/api';
import { useCart } from '@/config/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/config/context/LocationContext';

// Modals / shared components
import { ProviderRegistrationModal } from '@/app/(client)/client/_components/ProviderRegistrationModal';
import { LocationPickerModal }       from '@/app/(client)/client/_components/LocationPickerModal';

// Sections
import { HeroSection }            from './_sections/HeroSection';
import { OffersSection }          from './_sections/OffersSection';
import { CategoriesSection }      from './_sections/CategoriesSection';
import { PackagesSection }        from './_sections/PackagesSection';
import { TrendingSection }        from './_sections/TrendingSection';
import { MidBannerSection }       from './_sections/MidBannerSection';
import { PopularServicesSection } from './_sections/PopularServicesSection';
import { CouponsSection }         from './_sections/CouponsSection';
import { SiteFooter }             from './_sections/SiteFooter';

// Types
import { Service } from './_types';
import { useSearchVisibility } from '@/config/context/SearchVisibilityContext';

// ─────────────────────────────────────────────────────────────────────────────

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrder: number;
  validTo: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();

  useCart();

  // ── Location (from global context) ───────────────────────────────────────
  const { location: userLocation, setLocation, ready: locationReady } = useLocation();
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // ── Auth / Provider ───────────────────────────────────────────────────────
  const [currentUser, setCurrentUser]                       = useState<User | null>(null);
  const [isProvider, setIsProvider]                         = useState(false);
  const [isProviderApproved, setIsProviderApproved]         = useState(false);
  const [providerStatusLoading, setProviderStatusLoading]   = useState(true);
  const [showProviderModal, setShowProviderModal]           = useState(false);

  // ── Coupons ───────────────────────────────────────────────────────────────
  const [coupons, setCoupons]               = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  // ── API data ──────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<{ name: string; icon: string }[]>([]);
  const [packages, setPackages]     = useState<{
    id: string; name: string; desc: string; time: string; price: string;
    imageUrl?: string; badge?: string; originalPrice?: number;
  }[]>([]);
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [teaserServices, setTeaserServices]   = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const { setNavServices, setNavigateToService } = useSearchVisibility();

  // ── Map API service → internal Service shape ──────────────────────────────
  const mapService = useCallback((s: any): Service => {
    const base = s.base_price;
    const disc = s.discounted_price ?? base;
    const pct  = base > disc ? Math.round(((base - disc) / base) * 100) : 0;
    return {
      id: s.id,
      name: s.name,
      duration: `${s.duration}`,
      rating: s.rating ?? 0,
      discountedPrice: `₹${disc.toLocaleString('en-IN')}`,
      originalPrice:   `₹${base.toLocaleString('en-IN')}`,
      discount: pct > 0 ? `${pct}% OFF` : '',
      rawDiscounted: disc,
      rawOriginal:   base,
      imageUrl: s.image_url,
    };
  }, []);

  // ── Staggered API calls ───────────────────────────────────────────────────
  useEffect(() => {
    // Wave 1 — above the fold (immediate)
    Promise.all([
      categoriesAPI.list()
        .then(({ data }) =>
          setCategories(data.filter((c: any) => c.active).map((c: any) => ({ name: c.name, icon: c.icon || '✨' })))
        ).catch(() => {}),
      servicesAPI.list({ popular: true, active: true })
        .then(({ data }) => setPopularServices(data.map(mapService)))
        .catch(() => {}),
    ]);

    // Wave 2 — below the fold (300ms delay)
    const timer = setTimeout(() => {
      packagesAPI.list()
        .then(({ data }) =>
          setPackages(
            data.filter((p: any) => p.active).map((p: any) => ({
              id: p.id, name: p.name, desc: p.tagline ?? '', time: p.duration ?? '',
              price: `₹${p.price.toLocaleString('en-IN')}`,
              imageUrl: p.image_url, badge: p.badge, originalPrice: p.original_price,
            }))
          )
        ).catch(() => {});

      servicesAPI.list({ active: true })
        .then(({ data }) => setTeaserServices(data.slice(0, 6).map(mapService)))
        .catch(() => {})
        .finally(() => setServicesLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [mapService]);

  // ── Coupons ───────────────────────────────────────────────────────────────
  const fetchCoupons = useCallback(async (_user: User) => {
    setCouponsLoading(true);
    try {
      const { data } = await couponsAPI.listActive();
      setCoupons(data.map((c: any) => ({
        id: c.id, code: c.code, description: c.description,
        type: c.type, value: c.value, minOrder: c.min_order, validTo: c.valid_to,
      })));
    } catch { } finally { setCouponsLoading(false); }
  }, []);

  // ── Auth state ────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          const role = snap.data()?.role;
          if (role === 'service_provider' || role === 'pending_sp') {
            setIsProvider(true);
            if (role === 'pending_sp') {
              setIsProviderApproved(false);
            } else {
              try {
                const provSnap = await getDoc(doc(db, 'provider_profiles', user.uid));
                setIsProviderApproved(provSnap.exists() && provSnap.data()?.is_approved === true);
              } catch { setIsProviderApproved(false); }
            }
          } else { setIsProvider(false); setIsProviderApproved(false); }
        } catch { setIsProvider(false); setIsProviderApproved(false); }
        fetchCoupons(user);
      } else { setIsProvider(false); setIsProviderApproved(false); }
      setProviderStatusLoading(false);
    });
    return () => unsub();
  }, [fetchCoupons]);

  // ── Provider handlers ─────────────────────────────────────────────────────
  const handleProviderButtonClick = () => {
    if (isProvider && isProviderApproved) { router.push('/provider'); return; }
    if (!isProvider) {
      if (!currentUser) { router.push('/login'); return; }
      setShowProviderModal(true);
    }
  };

  const handleProviderRegistrationSuccess = () => {
    setIsProvider(true); setIsProviderApproved(false); setShowProviderModal(false);
  };

  // ── Navigation helper ─────────────────────────────────────────────────────
  const navigateToService = useCallback(
    (id: string) => router.push(`/client/services/${id}`),
    [router]
  );

  // ── Deduplicated services for search ──────────────────────────────────────
  const allServicesForSearch = useMemo(() => {
    const seen = new Set<string>();
    return [...popularServices, ...teaserServices].filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [popularServices, teaserServices]);

  useEffect(() => {
    setNavServices(allServicesForSearch);
  }, [allServicesForSearch, setNavServices]);

  useEffect(() => {
    setNavigateToService(() => navigateToService);
  }, [navigateToService, setNavigateToService]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Modals ────────────────────────────────────────────────── */}
      {showProviderModal && currentUser && (
        <ProviderRegistrationModal
          user={currentUser}
          onClose={() => setShowProviderModal(false)}
          onSuccess={handleProviderRegistrationSuccess}
        />
      )}
      {showLocationPicker && (
        <LocationPickerModal
          current={userLocation}
          onSelect={(loc) => { setLocation(loc, { confirmed: true }); setShowLocationPicker(false); }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {/* ── Sections ──────────────────────────────────────────────── */}
      <HeroSection
        allServicesForSearch={allServicesForSearch}
        navigateToService={navigateToService}
        userLocation={!locationReady ? 'Detecting…' : userLocation}
        isLoadingLocation={!locationReady}
        onLocationClick={() => setShowLocationPicker(true)}
      />

      <OffersSection currentUser={currentUser} />

      <CategoriesSection categories={categories} />

      <PackagesSection packages={packages} loading={servicesLoading} />

      <TrendingSection
        services={popularServices}
        loading={servicesLoading}
        onNavigate={navigateToService}
      />

      <MidBannerSection />

      <PopularServicesSection services={popularServices} loading={servicesLoading} />

      <CouponsSection
        coupons={coupons}
        loading={couponsLoading}
        currentUser={currentUser}
      />

      <SiteFooter />

      <div className="h-20 md:hidden" />
    </>
  );
}



// "use client";

// import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useRouter } from 'next/navigation';
// import { Search, Clock, Star, MapPin, Copy, CheckCheck, Tag, ChevronRight, ChevronLeft, ChevronDown, X, Check, ArrowRight } from 'lucide-react';
// import { onAuthStateChanged, User } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore';
// import { auth, db } from '@/lib/firebase';
// import { couponsAPI, categoriesAPI, packagesAPI, servicesAPI } from '@/lib/api';
// import { useCart } from '@/config/context/CartContext';
// import { CartQtyButton } from '@/components/client/CartQtyButton';
// import { CouponCardSkeleton } from '@/components/ui/skeletons';
// import { useToast } from '@/hooks/use-toast';
// import { ProviderRegistrationModal } from '@/app/(client)/client/_components/ProviderRegistrationModal';

// // ─────────────────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────────────────

// interface Coupon {
//   id: string;
//   code: string;
//   description: string;
//   type: 'percentage' | 'flat';
//   value: number;
//   minOrder: number;
//   maxDiscount?: number;
//   usageLimit: number;
//   usedCount: number;
//   validFrom: string;
//   validTo: string;
//   applicableFor: string;
//   autoApply: boolean;
//   active: boolean;
// }

// interface Service {
//   id: string;
//   name: string;
//   duration: string;
//   rating: number;
//   discountedPrice: string;
//   originalPrice: string;
//   discount: string;
//   rawDiscounted: number;
//   rawOriginal: number;
//   imageUrl?: string;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Helpers
// // ─────────────────────────────────────────────────────────────────────────────

// const EMOJI_KEYS: [string, string][] = [
//   ['hair', '💇'], ['blow', '💨'], ['color', '🎨'], ['scalp', '🧠'],
//   ['facial', '✨'], ['hydra', '💧'], ['cleanup', '🫧'], ['threading', '🧵'],
//   ['skin', '✨'], ['makeup', '💄'], ['bridal', '👰'], ['party', '🎉'],
//   ['nail', '💅'], ['manicure', '🤲'], ['pedicure', '🦶'], ['gel', '💅'],
//   ['massage', '🧖'], ['aroma', '🌸'], ['spa', '🛁'], ['head', '🧠'],
//   ['wax', '🪒'], ['body', '🛁'],
// ];
// function getEmoji(name: string): string {
//   const lower = name.toLowerCase();
//   for (const [key, emoji] of EMOJI_KEYS) {
//     if (lower.includes(key)) return emoji;
//   }
//   return '🌸';
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Location Picker Modal
// // ─────────────────────────────────────────────────────────────────────────────

// function LocationPickerModal({
//   current, onSelect, onClose,
// }: { current: string; onSelect: (loc: string) => void; onClose: () => void }) {
//   const [input, setInput] = useState('');
//   const suggestions = [
//     'Bandra, Mumbai', 'Andheri, Mumbai', 'Juhu, Mumbai', 'Powai, Mumbai',
//     'Thane, Mumbai', 'Borivali, Mumbai', 'Malad, Mumbai', 'Goregaon, Mumbai',
//   ].filter((s) => !input || s.toLowerCase().includes(input.toLowerCase()));

//   return (
//     <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
//       <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 pb-8 md:pb-5" onClick={(e) => e.stopPropagation()}>
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="font-bold text-[#111827]">Change location</h3>
//           <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
//         </div>
//         <div className="relative mb-3">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
//           <input autoFocus value={input} onChange={(e) => setInput(e.target.value)}
//             placeholder="Search area, locality…"
//             className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E91E8C]/30" />
//         </div>
//         <button
//           onClick={() => {
//             navigator.geolocation?.getCurrentPosition(
//               async (pos) => {
//                 try {
//                   const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
//                   const data = await res.json();
//                   const suburb = data.locality || '';
//                   const city = data.city || 'Mumbai';
//                   onSelect(suburb ? `${suburb}, ${city}` : city);
//                 } catch { onSelect('Mumbai, Maharashtra'); }
//               },
//               () => onSelect('Mumbai, Maharashtra')
//             );
//           }}
//           className="flex items-center gap-2 text-[#E91E8C] font-semibold text-sm mb-4 hover:underline"
//         >
//           <MapPin size={14} /> Use current location
//         </button>
//         <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Popular areas</p>
//         <div className="space-y-1 max-h-56 overflow-y-auto">
//           {suggestions.map((s) => (
//             <button key={s} onClick={() => onSelect(s)}
//               className={`w-full text-left px-3 py-2.5 rounded-xl text-sm hover:bg-pink-50 transition-colors ${s === current ? 'bg-pink-50 text-[#E91E8C] font-semibold' : 'text-[#111827]'}`}>
//               {s}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Combined Search Bar (location + search input + button)
// // ─────────────────────────────────────────────────────────────────────────────

// function CombinedSearchBar({
//   services, onNavigate, userLocation, onLocationClick,
// }: { services: Service[]; onNavigate: (id: string) => void; userLocation: string; onLocationClick: () => void }) {
//   const router = useRouter();
//   const [query, setQuery] = useState('');
//   const [focused, setFocused] = useState(false);
//   const ref = useRef<HTMLDivElement>(null);

//   const results = useMemo(() => {
//     if (!query.trim()) return [];
//     const q = query.toLowerCase();
//     return services.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
//   }, [query, services]);

//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, []);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (query.trim()) router.push(`/client/services?q=${encodeURIComponent(query.trim())}`);
//   };

//   const showDropdown = focused && query.trim().length > 0;

//   return (
//     <div ref={ref} className="relative">
//       <form onSubmit={handleSubmit} className='p-6 bg-white/50 backdrop-blur-xl rounded-[10px] border border-[#E8708E]/50'>
//         <div className="flex items-stretch bg-white rounded-md drop-shadow-xl border border-[#E8708E]/30 overflow-hidden h-16 p-2.5">
//           {/* Location pill */}
//           <button type="button" onClick={onLocationClick}
//             className="hidden md:flex items-center gap-1.5 px-3 border-r border-gray-200 text-xs text-gray-600 hover:bg-gray-50 flex-shrink-0 whitespace-nowrap">
//             <MapPin size={16} className="text-[#E8708E]" />
//             <span className="max-w-[120px] truncate">{userLocation}</span>
//             <ChevronDown size={16} className="text-gray-400" />
//           </button>
//           {/* Search input */}
//           <div className="relative flex-1 flex items-center">
//             <Search className="absolute left-3 text-[#E8708E] pointer-events-none" size={16} />
//             <input
//               type="search" value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               onFocus={() => setFocused(true)}
//               placeholder={`Try "Hair Spa" or "Bridal Makeup"`}
//               className="w-full h-full pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
//             />
//           </div>
//           {/* Search button */}
//           <button type="submit"
//             className="bg-[#E8708E] hover:bg-[#c7166f] text-white text-sm font-semibold px-8 rounded-md flex items-center gap-1.5 transition-colors flex-shrink-0">
//             Search <ArrowRight size={15} />
//           </button>
//         </div>
//       </form>

//       {/* Dropdown results */}
//       {showDropdown && (
//         <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
//           {results.length > 0 ? (
//             <>
//               {results.map((s) => (
//                 <button key={s.id} onClick={() => { onNavigate(s.id); setFocused(false); setQuery(''); }}
//                   className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50 transition-colors text-left border-b border-gray-50 last:border-0">
//                   <span className="text-xl">{getEmoji(s.name)}</span>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium text-[#111827] truncate">{s.name}</p>
//                     <p className="text-xs text-gray-400">{s.duration} · {s.discountedPrice}</p>
//                   </div>
//                   {s.discount && <span className="text-[10px] font-bold text-[#E91E8C] bg-[#E91E8C]/10 px-1.5 py-0.5 rounded-full">{s.discount}</span>}
//                 </button>
//               ))}
//               <button onClick={() => { router.push(`/client/services?q=${encodeURIComponent(query.trim())}`); setFocused(false); }}
//                 className="w-full px-4 py-2.5 text-xs font-semibold text-[#E91E8C] hover:bg-pink-50 transition-colors text-center">
//                 See all results for "{query}" →
//               </button>
//             </>
//           ) : (
//             <div className="px-4 py-4 text-sm text-gray-400 text-center">No services found for "{query}"</div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Offers Carousel (with prev/next arrows)
// // ─────────────────────────────────────────────────────────────────────────────

// function OffersCarousel({ currentUser, onBookNow, onProfile }: {
//   currentUser: User | null;
//   onBookNow: () => void;
//   onProfile: () => void;
// }) {
//   const [idx, setIdx] = useState(0);
//   const cards = [
//     {
//       gradient: 'from-[#AE002C] to-[#FA255A]',
//       tag: 'New User',
//       title: '₹200 off your\nfirst booking',
//       sub: 'Use code WELCOME200',
//       btnLabel: 'Book Now →',
//       // btnStyle: 'bg-white text-[#E91E8C]',
//       onClick: onBookNow,
//       // image: '💆',
//       imgSrc: '/assets/offers/offer-new-user.png',
//       imgStyle: { bottom: '0px', right: '5px' },
//     },
//     {
//       gradient: 'from-[#692AFA] to-[#692AFA]',
//       tag: 'Referrals',
//       title: 'Refer a friend,\nearn ₹200 each',
//       sub: 'Share & Earn when they book.',
//       btnLabel: 'Invite Friends →',
//       // btnStyle: 'bg-white text-[#7c3aed]',
//       onClick: onProfile,
//       // image: '🎁',
//       imgSrc: '/assets/offers/offer-referral.png',
//       imgStyle: { bottom: '0px', right: '-1px' },
//     },
//     {
//       gradient: 'from-[#202953] to-[#202953]',
//       tag: 'Referrals',
//       title: 'Earn points,\nunlock rewards',
//       sub: '₹1 spent = 0.5 pts. Gold at 2000 pts.',
//       btnLabel: 'Explore Rewards →',
//       // btnStyle: 'bg-white text-[#1e3a5f]',
//       onClick: onProfile,
//       // image: '💎',
//       imgSrc: '/assets/offers/offer-rewards.png',
//       imgStyle: { bottom: '0px', right: '-1px'},
//     },
//   ];
//   const prev = () => setIdx((i) => (i === 0 ? cards.length - 1 : i - 1));
//   const next = () => setIdx((i) => (i === cards.length - 1 ? 0 : i + 1));

//   return (
//     <div className="relative">
//       {/* Arrow buttons */}
//       <button onClick={prev}
//         className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
//         <ChevronLeft size={16} className="text-gray-600" />
//       </button>
//       <button onClick={next}
//         className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
//         <ChevronRight size={16} className="text-gray-600" />
//       </button>

//       {/* Cards container */}
//       <div className="overflow-hidden">
//         <div
//           className="flex transition-transform duration-300 ease-in-out gap-4"
//           style={{ transform: `translateX(calc(-${idx * 100}% - ${idx * 18}px))` }}
//         >
//           {cards.map((card, i) => (
//             <div key={i} className={`flex-shrink-0 w-full md:w-[390px] rounded-[10px] bg-gradient-to-br ${card.gradient} relative overflow-hidden h-[183px]`}>
//               {/* Offer card image → public/assets/offers/offer-{new-user,referral,rewards}.jpg (300×200px) */}
//               {/* <img src={card.imgSrc} alt={card.tag}
//                 className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
//                 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> */}
//               <div className="relative p-5 pt-4 z-10">
//                 <span className="text-[10px] font-semibold uppercase tracking-widest bg-white/20 text-white px-2.5 py-1 rounded-full">
//                   {card.tag}
//                 </span>
//                 <h3 className="text-2xl font-semibold text-white mt-2 mb-2 whitespace-pre-line leading-tight">{card.title}</h3>
//                 <p className="text-white text-sm mb-1">{card.sub}</p>
//                 <button onClick={card.onClick}
//                   className="text-xl font-semibold text-white hover:underline transition-colors">
//                   {card.btnLabel}
//                 </button>
//               </div>
//               <div className="absolute pointer-events-none select-none" style={card.imgStyle}><img src={card.imgSrc} alt={card.tag} /></div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Desktop: show all 3 cards */}
//       <style jsx>{`
//         @media (min-width: 768px) {
//           div[style] { transform: none !important; flex-wrap: nowrap; }
//         }
//       `}</style>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Category Pills
// // ─────────────────────────────────────────────────────────────────────────────

// function CategoryPills({ categories }: { categories: { name: string; icon: string }[] }) {
//   const router = useRouter();
//   return (
//     <div className="flex flex-wrap gap-2">
//       {categories.map((cat) => (
//         <button
//           key={cat.name}
//           onClick={() => router.push(`/client/services?category=${cat.name}`)}
//           className="flex items-center gap-2 px-4 py-2 bg-[#FDE2E9] border border-[#F7F2F6] rounded-full text-sm text-gray-700 font-medium hover:border-[#E91E8C] hover:text-[#E91E8C] hover:bg-pink-50 transition-all"
//         >
//           <span className="text-base leading-none">{cat.icon}</span>
//           <span className='text-md font-normal'>{cat.name}</span>
//         </button>
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Package Card (new Figma style)
// // ─────────────────────────────────────────────────────────────────────────────

// function PackageCardNew({ pkg }: {
//   pkg: { id: string; name: string; desc: string; time: string; price: string; imageUrl?: string; badge?: string; originalPrice?: number };
// }) {
//   const { name, id, time, price, imageUrl, badge, originalPrice } = pkg;
//   const numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
//   const savings = originalPrice && numPrice < originalPrice
//     ? Math.round(((originalPrice - numPrice) / originalPrice) * 100)
//     : null;

//   return (
//     <div className="flex-shrink-0 w-52 md:w-60 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
//       {/* Image */}
//       {/* Package image → public/assets/packages/package-{name}.jpg (480×360px)
//            Backend: upload image_url via admin panel to override this fallback */}
//       <div className="h-36 bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center relative overflow-hidden">
//         <img
//           src={imageUrl || `/assets/packages/package-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.jpg`}
//           alt={name}
//           className="w-full h-full object-cover"
//           loading="lazy"
//           onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
//         />
//         {/* Emoji fallback shown when image missing */}
//         <span className="text-5xl opacity-30 absolute pointer-events-none">{getEmoji(name)}</span>
//         {badge && (
//           <span className="absolute top-2 left-2 bg-[#E91E8C] text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
//             {badge}
//           </span>
//         )}
//       </div>
//       {/* Info */}
//       <div className="p-3">
//         <p className="font-bold text-sm text-[#111827] leading-tight line-clamp-2 mb-1">{name}</p>
//         <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
//           <Clock size={11} /> {time}
//         </div>
//         <div className="flex items-center justify-between gap-2">
//           <div>
//             <p className="font-extrabold text-base text-[#E91E8C]">{price}</p>
//             {originalPrice && (
//               <div className="flex items-center gap-1">
//                 <p className="text-[10px] text-gray-400 line-through">₹{originalPrice.toLocaleString('en-IN')}</p>
//                 {savings && <p className="text-[10px] text-green-600 font-semibold">Save {savings}%</p>}
//               </div>
//             )}
//           </div>
//           <CartQtyButton packageId={id} name={name} price={numPrice} duration={time} />
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Trending Now Cards (split layout)
// // ─────────────────────────────────────────────────────────────────────────────

// function TrendingCard({
//   service, bgColor, textColor, onNavigate,
// }: { service: Service; bgColor: string; textColor: string; onNavigate: (id: string) => void }) {
//   const bullets = ['Trained & verified professional', 'All tools & products included', 'Hygienic & safe practice'];
//   return (
//     <div className="rounded-2xl overflow-hidden flex h-52 cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
//       onClick={() => onNavigate(service.id)}>
//       {/* Left info panel */}
//       <div className={`flex-1 p-4 flex flex-col justify-between ${bgColor}`}>
//         <div>
//           <p className={`font-extrabold text-sm leading-snug mb-1 ${textColor}`}>{service.name}</p>
//           <p className={`text-xs leading-relaxed mb-2 opacity-80 ${textColor}`}>
//             Premium professional service, ideal for all skin types.
//           </p>
//           <ul className="space-y-1">
//             {bullets.map((b) => (
//               <li key={b} className={`flex items-start gap-1.5 text-[10px] ${textColor} opacity-90`}>
//                 <Check size={10} className="mt-0.5 flex-shrink-0" /> {b}
//               </li>
//             ))}
//           </ul>
//         </div>
//         <div className="flex items-center justify-between mt-2">
//           <span className={`font-extrabold text-base ${textColor}`}>{service.discountedPrice}</span>
//           <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
//             <ArrowRight size={12} className={textColor} />
//           </div>
//         </div>
//       </div>
//       {/* Trending card image → public/assets/services/service-{name}.jpg (480×360px)
//            Backend: upload image_url via admin panel to override this fallback */}
//       <div className="w-2/5 flex-shrink-0 bg-gray-100 relative overflow-hidden">
//         <img
//           src={service.imageUrl || `/assets/services/service-${service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.jpg`}
//           alt={service.name}
//           className="w-full h-full object-cover"
//           loading="lazy"
//           onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
//         />
//         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//           <span className="text-5xl opacity-20">{getEmoji(service.name)}</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Service Card for carousel (Figma package-style card)
// // ─────────────────────────────────────────────────────────────────────────────

// function ServiceCarouselCard({ service, onNavigate }: { service: Service; onNavigate: (id: string) => void }) {
//   return (
//     <div className="flex-shrink-0 w-52 md:w-60 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
//       {/* Service carousel card image → public/assets/services/service-{name}.jpg (480×360px)
//            Backend: upload image_url via admin panel to override this fallback */}
//       <div className="h-36 bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center relative overflow-hidden cursor-pointer"
//         onClick={() => onNavigate(service.id)}>
//         <img
//           src={service.imageUrl || `/assets/services/service-${service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.jpg`}
//           alt={service.name}
//           className="w-full h-full object-cover"
//           loading="lazy"
//           onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
//         />
//         <span className="text-5xl opacity-30 absolute pointer-events-none">{getEmoji(service.name)}</span>
//         {service.discount && (
//           <span className="absolute top-2 left-2 bg-[#E91E8C] text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
//             {service.discount}
//           </span>
//         )}
//       </div>
//       <div className="p-3">
//         <p className="font-bold text-sm text-[#111827] leading-tight line-clamp-2 mb-1 cursor-pointer hover:text-[#E91E8C] transition-colors"
//           onClick={() => onNavigate(service.id)}>
//           {service.name}
//         </p>
//         <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
//           <Clock size={11} /> {service.duration}
//         </div>
//         <div className="flex items-center justify-between gap-2">
//           <div>
//             <p className="font-extrabold text-base text-[#E91E8C]">{service.discountedPrice}</p>
//             {service.discount && (
//               <p className="text-[10px] text-gray-400 line-through">{service.originalPrice}</p>
//             )}
//           </div>
//           <CartQtyButton serviceId={service.id} name={service.name} price={service.rawDiscounted} duration={service.duration} />
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Guest Coupon Teaser
// // ─────────────────────────────────────────────────────────────────────────────

// function GuestCouponTeaser() {
//   const router = useRouter();
//   return (
//     <div className="flex-shrink-0 w-72 rounded-2xl overflow-hidden border border-[#E91E8C]/30 bg-gradient-to-br from-pink-50 to-white shadow-sm">
//       <div className="h-1.5 bg-[#E91E8C]" />
//       <div className="p-4">
//         <div className="flex items-center gap-2 mb-1">
//           <Tag size={13} className="text-[#E91E8C]" />
//           <span className="font-bold text-sm text-[#111827] blur-sm select-none">XXXX200</span>
//           <span className="text-[10px] font-bold text-[#E91E8C] bg-[#E91E8C]/10 px-1.5 py-0.5 rounded-full">UP TO 20% OFF</span>
//         </div>
//         <p className="text-xs text-gray-400 italic mb-1">Login to unlock exclusive offers &amp; coupons</p>
//         <p className="text-[10px] text-gray-300 mb-3">Min ₹499 · Exclusive member offer</p>
//         <button onClick={() => router.push('/login')}
//           className="w-full flex items-center justify-center gap-1.5 bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-semibold py-2 rounded-xl transition-colors">
//           Login to unlock offers
//         </button>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Site Footer
// // ─────────────────────────────────────────────────────────────────────────────

// function SiteFooter() {
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   return (
//     <footer className="bg-[#111827] text-white">
//       <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//           {/* Brand + Contact */}
//           <div>
//             <div className="flex items-center gap-0 mb-4">
//               <span className="text-[#E91E8C] font-extrabold text-2xl">Amara</span>
//               <span className="text-white font-extrabold text-2xl">Go</span>
//             </div>
//             <p className="text-gray-400 text-sm mb-3">+1 (7635) 547-12-97</p>
//             <p className="text-gray-400 text-sm">support@amara.go</p>
//           </div>
//           {/* Quick Links */}
//           <div>
//             <h4 className="font-bold text-sm mb-4">Quick Links</h4>
//             <ul className="space-y-2">
//               <li><button onClick={() => router.push('/client/services')} className="text-gray-400 text-sm hover:text-white transition-colors">Product</button></li>
//               <li><button onClick={() => router.push('/client/home')} className="text-gray-400 text-sm hover:text-white transition-colors">Information</button></li>
//             </ul>
//           </div>
//           {/* About */}
//           <div>
//             <h4 className="font-bold text-sm mb-4">About</h4>
//             <ul className="space-y-2">
//               <li><button onClick={() => router.push('/client/home')} className="text-gray-400 text-sm hover:text-white transition-colors">Company</button></li>
//               <li><button className="text-gray-400 text-sm hover:text-white transition-colors">Site Map</button></li>
//             </ul>
//           </div>
//           {/* Subscribe */}
//           <div>
//             <h4 className="font-bold text-sm mb-4">Subscribe</h4>
//             <div className="flex items-center bg-white/10 border border-white/20 rounded-lg overflow-hidden">
//               <input
//                 type="email" value={email} onChange={(e) => setEmail(e.target.value)}
//                 placeholder="Get updates..."
//                 className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-400 outline-none"
//               />
//               <button className="px-3 py-2.5 bg-[#E91E8C] hover:bg-[#c7166f] transition-colors">
//                 <ArrowRight size={16} />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//       {/* Bottom bar */}
//       <div className="border-t border-white/10">
//         <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             {/* LinkedIn */}
//             <a href="#" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-colors" aria-label="LinkedIn">
//               <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
//             </a>
//             {/* Facebook */}
//             <a href="#" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-colors" aria-label="Facebook">
//               <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
//             </a>
//             {/* Twitter/X */}
//             <a href="#" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-colors" aria-label="Twitter">
//               <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
//             </a>
//           </div>
//           <p className="text-gray-500 text-xs">© 2026 AmaraGo. All rights reserved.</p>
//         </div>
//       </div>
//     </footer>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Main page
// // ─────────────────────────────────────────────────────────────────────────────

// export default function Home() {
//   const router = useRouter();
//   const { toast } = useToast();

//   useCart();
//   const [userLocation, setUserLocation] = useState('Mumbai, Maharashtra');
//   const [isLoadingLocation, setIsLoadingLocation] = useState(true);
//   const [showLocationPicker, setShowLocationPicker] = useState(false); // Fix #4
//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [isProvider, setIsProvider] = useState(false);
//   const [isProviderApproved, setIsProviderApproved] = useState(false);
//   const [providerStatusLoading, setProviderStatusLoading] = useState(true);
//   const [showProviderModal, setShowProviderModal] = useState(false);

//   const [coupons, setCoupons] = useState<Coupon[]>([]);
//   const [couponsLoading, setCouponsLoading] = useState(false);
//   const [copiedCode, setCopiedCode] = useState<string | null>(null);

//   const [categories, setCategories] = useState<{ name: string; icon: string }[]>([]);
//   const [packages, setPackages] = useState<{
//     id: string; name: string; desc: string; time: string; price: string;
//     imageUrl?: string; badge?: string; originalPrice?: number;
//   }[]>([]);
//   const [popularServices, setPopularServices] = useState<Service[]>([]);
//   // Fix #11 — we only need popular services on home (all services behind see-all)
//   const [teaserServices, setTeaserServices] = useState<Service[]>([]);
//   const [servicesLoading, setServicesLoading] = useState(true);

//   const mapService = useCallback((s: any): Service => {
//     const base = s.base_price;
//     const disc = s.discounted_price ?? base;
//     const pct = base > disc ? Math.round(((base - disc) / base) * 100) : 0;
//     return {
//       id: s.id,
//       name: s.name,
//       duration: `${s.duration} min`,
//       rating: s.rating ?? 0,
//       discountedPrice: `₹${disc.toLocaleString('en-IN')}`,
//       originalPrice: `₹${base.toLocaleString('en-IN')}`,
//       discount: pct > 0 ? `${pct}% OFF` : '',
//       rawDiscounted: disc,
//       rawOriginal: base,
//       imageUrl: s.image_url,
//     };
//   }, []);

//   // Fix #5 — Priority-ordered, staggered API calls
//   // Wave 1 (immediate): categories + popular services — above the fold
//   // Wave 2 (deferred 300ms): packages + teaser services — below fold
//   useEffect(() => {
//     // Wave 1 — critical path
//     Promise.all([
//       categoriesAPI.list().then(({ data }) =>
//         setCategories(data.filter((c: any) => c.active).map((c: any) => ({ name: c.name, icon: c.icon || '✨' })))
//       ).catch(() => {}),
//       servicesAPI.list({ popular: true, active: true }).then(({ data }) =>
//         setPopularServices(data.map(mapService))
//       ).catch(() => {}),
//     ]);

//     // Wave 2 — deferred, below-fold content
//     const timer = setTimeout(() => {
//       packagesAPI.list()
//         .then(({ data }) => setPackages(
//           data.filter((p: any) => p.active).map((p: any) => ({
//             id: p.id, name: p.name, desc: p.tagline ?? '', time: p.duration ?? '',
//             price: `₹${p.price.toLocaleString('en-IN')}`,
//             imageUrl: p.image_url, badge: p.badge, originalPrice: p.original_price,
//           }))
//         ))
//         .catch(() => {});

//       // Fix #11 — only fetch 6 for the teaser grid (limit param)
//       servicesAPI.list({ active: true }).then(({ data }) =>
//         setTeaserServices(data.slice(0, 6).map(mapService))
//       ).catch(() => {}).finally(() => setServicesLoading(false));
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [mapService]);

//   const fetchCoupons = useCallback(async (_user: User) => {
//     setCouponsLoading(true);
//     try {
//       const { data } = await couponsAPI.listActive();
//       setCoupons(data.map((c: any) => ({
//         id: c.id, code: c.code, description: c.description, type: c.type,
//         value: c.value, minOrder: c.min_order, maxDiscount: c.max_discount,
//         usageLimit: c.usage_limit, usedCount: c.used_count,
//         validFrom: c.valid_from, validTo: c.valid_to,
//         applicableFor: c.applicable_for, autoApply: c.auto_apply, active: c.active,
//       })));
//     } catch { } finally { setCouponsLoading(false); }
//   }, []);

//   const handleCopyCode = (code: string) => {
//     navigator.clipboard.writeText(code).then(() => {
//       setCopiedCode(code);
//       setTimeout(() => setCopiedCode(null), 2000);
//     });
//   };

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (user) => {
//       setCurrentUser(user);
//       if (user) {
//         try {
//           const snap = await getDoc(doc(db, 'users', user.uid));
//           const role = snap.data()?.role;
//           if (role === 'service_provider' || role === 'pending_sp') {
//             setIsProvider(true);
//             if (role === 'pending_sp') {
//               setIsProviderApproved(false);
//             } else {
//               try {
//                 const provSnap = await getDoc(doc(db, 'provider_profiles', user.uid));
//                 setIsProviderApproved(provSnap.exists() && provSnap.data()?.is_approved === true);
//               } catch { setIsProviderApproved(false); }
//             }
//           } else { setIsProvider(false); setIsProviderApproved(false); }
//         } catch { setIsProvider(false); setIsProviderApproved(false); }
//         fetchCoupons(user);
//       } else { setIsProvider(false); setIsProviderApproved(false); }
//       setProviderStatusLoading(false);
//     });
//     return () => unsub();
//   }, [fetchCoupons]);

//   // Fix #4 — detect location on mount (unchanged), but now location is clickable
//   useEffect(() => {
//     setIsLoadingLocation(true);
//     if (!navigator.geolocation) {
//       setUserLocation('Mumbai, Maharashtra'); setIsLoadingLocation(false); return;
//     }
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         try {
//           const res = await fetch(
//             `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
//           );
//           if (res.ok) {
//             const data = await res.json();
//             const suburb = data.locality || '';
//             const city = data.city || data.principalSubdivision || 'Mumbai';
//             setUserLocation(suburb ? `${suburb}, ${city}` : city);
//           } else { setUserLocation('Mumbai, Maharashtra'); }
//         } catch { setUserLocation('Mumbai, Maharashtra'); }
//         setIsLoadingLocation(false);
//       },
//       () => { setUserLocation('Mumbai, Maharashtra'); setIsLoadingLocation(false); },
//       { timeout: 15000, maximumAge: 600000 }
//     );
//   }, []);

//   const handleProviderButtonClick = () => {
//     if (isProvider && isProviderApproved) { router.push('/provider'); return; }
//     if (!isProvider) {
//       if (!currentUser) { router.push('/login'); return; }
//       setShowProviderModal(true);
//     }
//   };

//   const handleProviderRegistrationSuccess = () => {
//     setIsProvider(true); setIsProviderApproved(false); setShowProviderModal(false);
//   };

//   const navigateToService = useCallback((id: string) => router.push(`/client/services/${id}`), [router]);

//   // All services combined for search (popular + teaser deduplicated)
//   const allServicesForSearch = useMemo(() => {
//     const seen = new Set<string>();
//     return [...popularServices, ...teaserServices].filter((s) => {
//       if (seen.has(s.id)) return false;
//       seen.add(s.id);
//       return true;
//     });
//   }, [popularServices, teaserServices]);

//   return (
//     <>
//       {/* Modals */}
//       {showProviderModal && currentUser && (
//         <ProviderRegistrationModal
//           user={currentUser}
//           onClose={() => setShowProviderModal(false)}
//           onSuccess={handleProviderRegistrationSuccess}
//         />
//       )}
//       {showLocationPicker && (
//         <LocationPickerModal
//           current={userLocation}
//           onSelect={(loc) => { setUserLocation(loc); setShowLocationPicker(false); }}
//           onClose={() => setShowLocationPicker(false)}
//         />
//       )}

//       {/* ── HERO — light pink split layout ──────────────────────── */}
//       <section className="bg-[#FFEAEF]">
//         <div className="w-full mx-auto px-4 md:pl-28 md:pr-0 py-10 md:py-0 flex flex-col md:flex-row items-center gap-8 md:gap-16">
//           {/* Left column */}
//           <div className="flex-1 min-w-0">
//             <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#111827] leading-tight mb-3">
//               Self-care starts at your{' '}
//               <span className="text-[#E8708E]">doorstep<span className='text-black'>.</span></span>
//             </h1>
//             <p className="text-[#805660] text-sm md:text-base mb-4">
//               Book verified beauty experts in minutes
//             </p>
//             {/* Trust badges */}
//             <div className="flex flex-wrap gap-x-4 gap-y-1 mb-6">
//               {['Verified Professionals', 'Free rescheduling', 'Safe & hygienic', 'On-time guarantee'].map((b) => (
//                 <span key={b} className="flex items-center gap-1 text-xs text-gray-600">
//                   <Check size={12} className="text-[#E8708E]" strokeWidth={3} /> {b}
//                 </span>
//               ))}
//             </div>
//             {/* Combined search bar */}
//             <CombinedSearchBar
//               services={allServicesForSearch}
//               onNavigate={navigateToService}
//               userLocation={isLoadingLocation ? 'Detecting…' : userLocation}
//               onLocationClick={() => setShowLocationPicker(true)}
//             />
//             {/* Social proof */}
//             <div className="flex items-center gap-2 mt-5">
//               <Star size={16} className="text-amber-400" />
//               <span className='text-[#4B5563]'>4.8</span><span className='text-black'>&nbsp;·&nbsp;</span>
//               {/* Social proof avatars → public/assets/social-proof/avatar-{1,2,3}.jpg (48×48px) */}
//               <div className="flex -space-x-1">
//                 {['/assets/social-proof/avatar-1.jpg', '/assets/social-proof/avatar-2.jpg', '/assets/social-proof/avatar-3.jpg'].map((src, i) => (
//                   <div key={i} className="w-6 h-6 rounded-full bg-pink-200 border-2 border-white overflow-hidden flex items-center justify-center text-xs">
//                     <img src={src} alt={`Customer ${i + 1}`} className="w-full h-full object-cover"
//                       onError={(e) => { const t = e.target as HTMLImageElement; t.style.display='none'; t.parentElement!.textContent='👩'; }} />
//                   </div>
//                 ))}
//               </div>
//               <span className="text-xs text-[#7F5660] font-medium">10,000+ bookings in Mumbai</span>
//             </div>
//           </div>
//           {/* Right column — hero professional image
//                → Replace placeholder: public/assets/hero/hero-professional.jpg
//                → Recommended size: 800×1050px portrait */}
//           <div className="">
//             <img
//               src="/assets/hero/hero-professional.png"
//               alt="AmaraGo beauty professional"
//               className="w-full h-full object-cover"
//               onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
//             />
//           </div>
//         </div>
//       </section>

//       {/* ── OFFERS & MORE ────────────────────────────────────────── */}
//       <section className="bg-[#F7F2F6] py-10">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <h2 className="text-3xl font-medium text-[#111827] mb-5">Offers &amp; More</h2>
//           <OffersCarousel
//             currentUser={currentUser}
//             onBookNow={() => router.push('/client/services')}
//             onProfile={() => router.push('/client/profile')}
//           />
//         </div>
//       </section>

//       {/* ── EXPLORE CATEGORIES ───────────────────────────────────── */}
//       {categories.length > 0 && (
//         <section className="bg-[#F7F2F6] py-10">
//           <div className="max-w-7xl mx-auto px-4 md:px-8">
//             <h2 className="text-3xl font-medium text-[#111827] mb-5">Explore Categories</h2>
//             <CategoryPills categories={categories} />
//           </div>
//         </section>
//       )}

//       {/* ── SPECIAL PACKAGES ─────────────────────────────────────── */}
//       {(packages.length > 0 || servicesLoading) && (
//         <section className="bg-white py-10">
//           <div className="max-w-7xl mx-auto px-4 md:px-8">
//             <div className="flex items-center justify-between mb-5">
//               <h2 className="text-xl font-extrabold text-[#111827]">Special Packages</h2>
//               <button onClick={() => router.push('/client/services')}
//                 className="text-sm font-semibold text-[#E91E8C] hover:underline flex items-center gap-0.5">
//                 View all <ChevronRight size={14} />
//               </button>
//             </div>
//             <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
//               {servicesLoading
//                 ? [1, 2, 3, 4].map((i) => (
//                   <div key={i} className="flex-shrink-0 w-52 md:w-60 rounded-2xl bg-gray-50 border border-gray-100 animate-pulse">
//                     <div className="h-36 bg-gray-200 rounded-t-2xl" />
//                     <div className="p-3 space-y-2">
//                       <div className="h-3 bg-gray-200 rounded w-3/4" />
//                       <div className="h-3 bg-gray-100 rounded w-1/2" />
//                     </div>
//                   </div>
//                 ))
//                 : packages.map((pkg) => <PackageCardNew key={pkg.id} pkg={pkg} />)
//               }
//             </div>
//           </div>
//         </section>
//       )}

//       {/* ── TRENDING NOW ─────────────────────────────────────────── */}
//       <section className="bg-[#FEF0F5] py-10">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <h2 className="text-xl font-extrabold text-[#111827] mb-5">Trending Now</h2>
//           {servicesLoading ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {[1, 2].map((i) => (
//                 <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
//               ))}
//             </div>
//           ) : popularServices.length > 0 ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {popularServices.slice(0, 2).map((service, i) => (
//                 <TrendingCard
//                   key={service.id}
//                   service={service}
//                   bgColor={i === 0 ? 'bg-[#E91E8C]' : 'bg-[#1e2b45]'}
//                   textColor="text-white"
//                   onNavigate={navigateToService}
//                 />
//               ))}
//             </div>
//           ) : null}
//         </div>
//       </section>

//       {/* ── MID-PAGE BANNER ──────────────────────────────────────── */}
//       <section className="bg-[#FEF0F5] py-10 border-t border-pink-100">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="rounded-3xl bg-white overflow-hidden flex flex-col md:flex-row items-center shadow-sm border border-pink-100">
//             {/* Left text */}
//             <div className="flex-1 p-8 md:p-12">
//               <div className="flex items-center gap-0 mb-4">
//                 <span className="text-[#E91E8C] font-extrabold text-3xl">Amara</span>
//                 <span className="text-[#111827] font-extrabold text-3xl">Go</span>
//               </div>
//               <h2 className="text-2xl md:text-3xl font-extrabold text-[#111827] leading-snug">
//                 Self-care starts at your doorstep.
//               </h2>
//               <button
//                 onClick={() => router.push('/client/services')}
//                 className="mt-6 inline-flex items-center gap-2 bg-[#E91E8C] hover:bg-[#c7166f] text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
//               >
//                 Book Now <ArrowRight size={16} />
//               </button>
//             </div>
//             {/* Mid-page banner image
//                  → Replace placeholder: public/assets/banners/mid-banner-professional.jpg
//                  → Recommended size: 800×576px landscape */}
//             <div className="w-full md:w-80 lg:w-96 h-56 md:h-72 flex-shrink-0 relative bg-gradient-to-br from-pink-100 to-pink-200 overflow-hidden rounded-r-3xl">
//               <img
//                 src="/assets/banners/mid-banner-professional.jpg"
//                 alt="Beauty service at home"
//                 className="w-full h-full object-cover"
//                 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
//               />
//               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                 <span className="text-8xl opacity-20">💄</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── POPULAR SERVICES ─────────────────────────────────────── */}
//       <section className="bg-white py-10">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <div className="flex items-center justify-between mb-5">
//             <h2 className="text-xl font-extrabold text-[#111827]">Popular Services</h2>
//             <button onClick={() => router.push('/client/services')}
//               className="text-sm font-semibold text-[#E91E8C] hover:underline flex items-center gap-0.5">
//               View all <ChevronRight size={14} />
//             </button>
//           </div>
//           <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
//             {servicesLoading
//               ? [1, 2, 3, 4].map((i) => (
//                 <div key={i} className="flex-shrink-0 w-52 md:w-60 rounded-2xl bg-gray-50 border border-gray-100 animate-pulse">
//                   <div className="h-36 bg-gray-200 rounded-t-2xl" />
//                   <div className="p-3 space-y-2">
//                     <div className="h-3 bg-gray-200 rounded w-3/4" />
//                     <div className="h-3 bg-gray-100 rounded w-1/2" />
//                   </div>
//                 </div>
//               ))
//               : popularServices.map((service) => (
//                 <ServiceCarouselCard key={service.id} service={service} onNavigate={navigateToService} />
//               ))
//             }
//           </div>
//         </div>
//       </section>

//       {/* ── COUPONS / TODAY'S OFFERS ─────────────────────────────── */}
//       {(couponsLoading || !currentUser || coupons.length > 0) && (
//         <section className="bg-[#FEF0F5] py-10">
//           <div className="max-w-7xl mx-auto px-4 md:px-8">
//             <h2 className="text-xl font-extrabold text-[#111827] mb-5">Today's Offers</h2>
//             <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
//               {couponsLoading && [1, 2, 3].map((i) => <CouponCardSkeleton key={i} />)}
//               {!couponsLoading && !currentUser && <GuestCouponTeaser />}
//               {!couponsLoading && currentUser && coupons.map((coupon) => {
//                 const isCopied = copiedCode === coupon.code;
//                 const discountLabel = coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`;
//                 return (
//                   <div key={coupon.id} className="flex-shrink-0 w-72 rounded-2xl overflow-hidden border border-[#E91E8C]/30 bg-white shadow-sm">
//                     <div className="h-1.5 bg-[#E91E8C]" />
//                     <div className="p-4">
//                       <div className="flex items-center gap-2 mb-1">
//                         <Tag size={13} className="text-[#E91E8C]" />
//                         <span className="font-bold text-sm text-[#111827] tracking-wide truncate">{coupon.code}</span>
//                         <span className="text-[10px] font-bold text-[#E91E8C] bg-[#E91E8C]/10 px-1.5 py-0.5 rounded-full flex-shrink-0">{discountLabel}</span>
//                       </div>
//                       <p className="text-xs text-gray-600 leading-snug line-clamp-2 mb-1">{coupon.description}</p>
//                       <p className="text-[10px] text-gray-400 mb-3">Min ₹{coupon.minOrder} · Till {coupon.validTo}</p>
//                       <button onClick={() => handleCopyCode(coupon.code)}
//                         className="w-full flex items-center justify-center gap-1.5 bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-semibold py-2 rounded-xl transition-colors">
//                         {isCopied ? <><CheckCheck size={13} /> Copied!</> : <><Copy size={13} /> Copy Code</>}
//                       </button>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </section>
//       )}

//       {/* ── FOOTER ───────────────────────────────────────────────── */}
//       <SiteFooter />

//       <div className="h-20 md:hidden" />
//     </>
//   );
// }