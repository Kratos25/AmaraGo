"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, Star, MapPin, Bell, Copy, CheckCheck, Tag, ChevronRight, Flame, ShieldCheck, RefreshCcw, Clock3, BadgeCheck, X, ChevronDown } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { couponsAPI, categoriesAPI, packagesAPI, servicesAPI } from '@/lib/api';
import { useCart } from '@/config/context/CartContext';
import { CartQtyButton } from '@/components/client/CartQtyButton';
import { PackageCard } from '@/components/client/PackageCard';
import { CouponCardSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/hooks/use-toast';
import { ProviderRegistrationModal } from '@/app/(client)/client/_components/ProviderRegistrationModal';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  applicableFor: string;
  autoApply: boolean;
  active: boolean;
}

interface Service {
  id: string;
  name: string;
  duration: string;
  rating: number;
  discountedPrice: string;
  originalPrice: string;
  discount: string;
  rawDiscounted: number;
  rawOriginal: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const EMOJI_KEYS: [string, string][] = [
  ['hair', '💇'], ['blow', '💨'], ['color', '🎨'], ['scalp', '🧠'],
  ['facial', '✨'], ['hydra', '💧'], ['cleanup', '🫧'], ['threading', '🧵'],
  ['skin', '✨'], ['makeup', '💄'], ['bridal', '👰'], ['party', '🎉'],
  ['nail', '💅'], ['manicure', '🤲'], ['pedicure', '🦶'], ['gel', '💅'],
  ['massage', '🧖'], ['aroma', '🌸'], ['spa', '🛁'], ['head', '🧠'],
  ['wax', '🪒'], ['body', '🛁'],
];
function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of EMOJI_KEYS) {
    if (lower.includes(key)) return emoji;
  }
  return '🌸';
}

// ─────────────────────────────────────────────────────────────────────────────
// Fix #6 — Marquee that only renders ~2× visible-width worth of cards
// (no full duplication of entire array in DOM)
// ─────────────────────────────────────────────────────────────────────────────

const CARD_WIDTH = 176 + 14; // w-44 (176px) + gap (14px)
const VIEWPORT_CARDS = Math.ceil((typeof window !== 'undefined' ? window.innerWidth : 390) / CARD_WIDTH) + 2;

function PopularServicesSlider({
  services,
  onNavigate,
}: {
  services: Service[];
  onNavigate: (id: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const pausedRef = useRef(false);
  const focusedRef = useRef(false);

  // Only duplicate enough cards to fill ~2 viewports for the loop
  const visible = useMemo(() => {
    if (services.length === 0) return [];
    const needed = Math.max(VIEWPORT_CARDS * 2, services.length * 2);
    const result: (Service & { _key: string })[] = [];
    let i = 0;
    while (result.length < needed) {
      result.push({ ...services[i % services.length], _key: `${services[i % services.length].id}-${i}` });
      i++;
    }
    return result;
  }, [services]);

  const halfWidth = useMemo(() => (services.length * CARD_WIDTH), [services.length]);

  useEffect(() => {
    if (visible.length === 0) return;
    const speed = 0.5; // px per frame

    const tick = () => {
      if (!pausedRef.current && !focusedRef.current && trackRef.current) {
        posRef.current += speed;
        if (posRef.current >= halfWidth) posRef.current -= halfWidth;
        trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [halfWidth, visible.length]);

  // Fix #10 — keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(id); }
  };

  return (
    <div
      className="overflow-hidden -mx-4 md:-mx-8"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div
        ref={trackRef}
        className="flex will-change-transform"
        style={{ gap: '14px', padding: '6px 16px 14px', width: 'max-content' }}
      >
        {visible.map((service) => (
          <button
            key={service._key}
            onClick={() => onNavigate(service.id)}
            onKeyDown={(e) => handleKeyDown(e, service.id)}
            onFocus={() => { focusedRef.current = true; pausedRef.current = true; }}
            onBlur={() => { focusedRef.current = false; pausedRef.current = false; }}
            tabIndex={0}
            aria-label={`${service.name}, ${service.discountedPrice}${service.discount ? ', ' + service.discount : ''}`}
            className="flex-shrink-0 w-44 rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-[#e5849c]/50 hover:shadow-md transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5849c] focus-visible:ring-offset-2"
          >
            <div className="h-[72px] bg-gradient-to-br from-[#111827] to-[#1f2937] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_70%_30%,#e5849c,transparent_60%)]" />
              <span className="text-4xl relative z-10 drop-shadow-sm">{getEmoji(service.name)}</span>
              {service.discount && (
                <span className="absolute top-2 right-2 text-[9px] font-bold bg-[#e5849c] text-white px-1.5 py-0.5 rounded-full leading-none">
                  {service.discount}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="font-semibold text-[#111827] text-[11px] leading-tight line-clamp-2 mb-2 group-hover:text-[#e5849c] transition-colors min-h-[30px]">
                {service.name}
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-bold text-sm text-[#111827]">{service.discountedPrice}</p>
                  {service.discount && (
                    <p className="text-[10px] text-gray-400 line-through leading-none">{service.originalPrice}</p>
                  )}
                </div>
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400 mb-0.5">
                  <Clock size={9} />{service.duration}
                </span>
              </div>
              {service.rating > 0 && (
                <div className="flex items-center gap-1 mt-1.5 border-t border-gray-50 pt-1.5">
                  <Star size={9} className="fill-amber-400 text-amber-400" />
                  <span className="text-[10px] text-amber-500 font-semibold">{service.rating}</span>
                  <span className="text-[10px] text-gray-300 ml-auto">Tap to book</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fix #4 — Location Picker Modal
// ─────────────────────────────────────────────────────────────────────────────

function LocationPickerModal({
  current,
  onSelect,
  onClose,
}: {
  current: string;
  onSelect: (loc: string) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState('');
  const suggestions = [
    'Bandra, Mumbai', 'Andheri, Mumbai', 'Juhu, Mumbai', 'Powai, Mumbai',
    'Thane, Mumbai', 'Borivali, Mumbai', 'Malad, Mumbai', 'Goregaon, Mumbai',
  ].filter((s) => !input || s.toLowerCase().includes(input.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 pb-8 md:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#111827]">Change location</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search area, locality…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#e5849c]/40"
          />
        </div>
        <button
          onClick={() => {
            navigator.geolocation?.getCurrentPosition(
              async (pos) => {
                try {
                  const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
                  const data = await res.json();
                  const suburb = data.locality || '';
                  const city = data.city || 'Mumbai';
                  onSelect(suburb ? `${suburb}, ${city}` : city);
                } catch { onSelect('Mumbai, Maharashtra'); }
              },
              () => onSelect('Mumbai, Maharashtra')
            );
          }}
          className="flex items-center gap-2 text-[#e5849c] font-semibold text-sm mb-4 hover:underline"
        >
          <MapPin size={14} /> Use current location
        </button>
        <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Popular areas</p>
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSelect(s)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm hover:bg-[#fff5f7] transition-colors ${s === current ? 'bg-[#fff5f7] text-[#e5849c] font-semibold' : 'text-[#111827]'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fix #1 — Functional Search with live filter dropdown
// ─────────────────────────────────────────────────────────────────────────────

function SearchBar({ services, onNavigate }: { services: Service[]; onNavigate: (id: string) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return services.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, services]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/client/services?q=${encodeURIComponent(query.trim())}`);
  };

  const showDropdown = focused && query.trim().length > 0;

  return (
    <div ref={ref} className="relative">
      <form onSubmit={handleSubmit}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search haircut, facial, massage…"
          className="w-full pl-11 pr-4 py-4 rounded-xl bg-white text-sm text-gray-800 placeholder:text-gray-400 outline-none shadow-lg focus:ring-2 focus:ring-[#e5849c]/40"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </form>

      {/* Live results dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {results.length > 0 ? (
            <>
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onNavigate(s.id); setFocused(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fff5f7] transition-colors text-left border-b border-gray-50 last:border-0"
                >
                  <span className="text-xl">{getEmoji(s.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.duration} · {s.discountedPrice}</p>
                  </div>
                  {s.discount && <span className="text-[10px] font-bold text-[#e5849c] bg-[#e5849c]/10 px-1.5 py-0.5 rounded-full">{s.discount}</span>}
                </button>
              ))}
              <button
                onClick={() => { router.push(`/client/services?q=${encodeURIComponent(query.trim())}`); setFocused(false); }}
                className="w-full px-4 py-2.5 text-xs font-semibold text-[#e5849c] hover:bg-[#fff5f7] transition-colors text-center"
              >
                See all results for "{query}" →
              </button>
            </>
          ) : (
            <div className="px-4 py-4 text-sm text-gray-400 text-center">No services found for "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fix #2 — Sticky header
// ─────────────────────────────────────────────────────────────────────────────

function StickyHeader({
  userLocation,
  onLocationClick,
  onCartClick,
  allServices,
  onNavigate,
}: {
  userLocation: string;
  onLocationClick: () => void;
  onCartClick: () => void;
  allServices: Service[];
  onNavigate: (id: string) => void;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 120);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all duration-200 ${visible ? 'translate-y-0 shadow-sm' : '-translate-y-full'}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center gap-3">
        {/* Logo / brand */}
        <button onClick={() => router.push('/client')} className="font-extrabold text-[#111827] text-lg flex-shrink-0">
          Amara<span className="text-[#e5849c]">Go</span>
        </button>

        {/* Search toggle */}
        {searchOpen ? (
          <div className="flex-1">
            <SearchBar services={allServices} onNavigate={(id) => { onNavigate(id); setSearchOpen(false); }} />
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-400 text-sm hover:bg-gray-200 transition-colors text-left"
          >
            <Search size={15} /> Search services…
          </button>
        )}

        {/* Location pill */}
        <button
          onClick={onLocationClick}
          className="hidden md:flex items-center gap-1 text-xs text-gray-600 hover:text-[#e5849c] transition-colors flex-shrink-0"
        >
          <MapPin size={13} className="text-[#e5849c]" />
          <span className="max-w-[120px] truncate">{userLocation}</span>
          <ChevronDown size={11} />
        </button>

        <button onClick={() => router.push('/client/notifications')} aria-label="Notifications" className="flex-shrink-0">
          <Bell size={20} className="text-gray-500" />
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fix #9 — Trust badges strip
// ─────────────────────────────────────────────────────────────────────────────

function TrustBadges() {
  const badges = [
    { icon: BadgeCheck, label: 'Verified professionals' },
    { icon: RefreshCcw, label: 'Free rescheduling' },
    { icon: ShieldCheck, label: 'Safe & hygienic' },
    { icon: Clock3, label: 'On-time guarantee' },
  ];
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 mt-5 pb-1">
      {badges.map(({ icon: Icon, label }) => (
        <div key={label} className="flex-shrink-0 flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
          <Icon size={13} className="text-[#e5849c]" />
          <span className="text-white/80 text-xs font-medium whitespace-nowrap">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header helper
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: { label: string; href: string } }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-bold text-[#111827]">{title}</h2>
      {action && (
        <button onClick={() => router.push(action.href)} className="text-xs font-semibold text-[#e5849c] hover:underline flex items-center gap-0.5">
          {action.label} <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fix #7 — Service card with CartQtyButton inline
// ─────────────────────────────────────────────────────────────────────────────

function ServiceGridCard({ service, onNavigate }: { service: Service; onNavigate: (id: string) => void }) {
  return (
    <div className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 p-3 hover:border-[#e5849c]/30 hover:shadow-sm transition-all">
      <button onClick={() => onNavigate(service.id)} className="flex items-start gap-3 flex-1 min-w-0 text-left group">
        <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-[#fff5f7] flex items-center justify-center text-xl mt-0.5">
          {getEmoji(service.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#111827] text-xs leading-tight line-clamp-2 group-hover:text-[#e5849c] transition-colors mb-1">
            {service.name}
          </p>
          <p className="font-bold text-sm text-[#111827] leading-none">{service.discountedPrice}</p>
          {service.discount ? (
            <p className="text-[10px] text-[#e5849c] font-medium mt-0.5">{service.discount}</p>
          ) : (
            <p className="text-[10px] text-gray-400 mt-0.5">{service.duration}</p>
          )}
        </div>
      </button>
      {/* CartQtyButton inline on card */}
      <div className="flex-shrink-0 mt-1">
        <CartQtyButton
          serviceId={service.id}
          price={service.rawDiscounted}
          name={service.name}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fix #11 — Removed AllServicesSection from home (replaced by a teaser grid)
// Shows only 6 services with "See all services" CTA
// ─────────────────────────────────────────────────────────────────────────────

function ServiceTeaserSection({ services, onNavigate }: { services: Service[]; onNavigate: (id: string) => void }) {
  const router = useRouter();
  const teaser = services.slice(0, 6);

  return (
    <section className="mt-10 mb-[-80px] md:mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#111827]">Popular Services</h2>
        <button
          onClick={() => router.push('/client/services')}
          className="text-xs font-semibold text-[#e5849c] hover:underline flex items-center gap-0.5"
        >
          See all services <ChevronRight size={13} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {teaser.map((service) => (
          <ServiceGridCard key={service.id} service={service} onNavigate={onNavigate} />
        ))}
      </div>
      {/* CTA block to services page */}
      <button
        onClick={() => router.push('/client/services')}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#e5849c]/30 text-sm font-semibold text-[#e5849c] hover:bg-[#fff5f7] transition-colors"
      >
        Browse all services <ChevronRight size={15} />
      </button>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fix #8 — Guest coupon teaser
// ─────────────────────────────────────────────────────────────────────────────

function GuestCouponTeaser() {
  const router = useRouter();
  return (
    <div className="flex-shrink-0 w-72 rounded-2xl overflow-hidden border border-[#e5849c]/30 bg-gradient-to-br from-[#fff5f7] to-white shadow-sm">
      <div className="h-1.5 bg-[#e5849c]" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Tag size={13} className="text-[#e5849c] flex-shrink-0" />
              <span className="font-bold text-sm text-[#111827] tracking-wide blur-sm select-none">XXXX200</span>
              <span className="flex-shrink-0 text-[10px] font-bold text-[#e5849c] bg-[#e5849c]/10 px-1.5 py-0.5 rounded-full">UP TO 20% OFF</span>
            </div>
            <p className="text-xs text-gray-400 italic">Login to unlock exclusive offers &amp; coupons</p>
            <p className="text-[10px] text-gray-300 mt-1.5">Min ₹499 · Exclusive member offer</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-semibold py-2 rounded-xl transition-colors"
        >
          Login to unlock offers
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();

  useCart();
  const [userLocation, setUserLocation] = useState('Mumbai, Maharashtra');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false); // Fix #4
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProvider, setIsProvider] = useState(false);
  const [isProviderApproved, setIsProviderApproved] = useState(false);
  const [providerStatusLoading, setProviderStatusLoading] = useState(true);
  const [showProviderModal, setShowProviderModal] = useState(false);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [categories, setCategories] = useState<{ name: string; icon: string }[]>([]);
  const [packages, setPackages] = useState<{
    id: string; name: string; desc: string; time: string; price: string;
    imageUrl?: string; badge?: string; originalPrice?: number;
  }[]>([]);
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  // Fix #11 — we only need popular services on home (all services behind see-all)
  const [teaserServices, setTeaserServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const mapService = useCallback((s: any): Service => {
    const base = s.base_price;
    const disc = s.discounted_price ?? base;
    const pct = base > disc ? Math.round(((base - disc) / base) * 100) : 0;
    return {
      id: s.id,
      name: s.name,
      duration: `${s.duration} min`,
      rating: s.rating ?? 0,
      discountedPrice: `₹${disc.toLocaleString('en-IN')}`,
      originalPrice: `₹${base.toLocaleString('en-IN')}`,
      discount: pct > 0 ? `${pct}% OFF` : '',
      rawDiscounted: disc,
      rawOriginal: base,
    };
  }, []);

  // Fix #5 — Priority-ordered, staggered API calls
  // Wave 1 (immediate): categories + popular services — above the fold
  // Wave 2 (deferred 300ms): packages + teaser services — below fold
  useEffect(() => {
    // Wave 1 — critical path
    Promise.all([
      categoriesAPI.list().then(({ data }) =>
        setCategories(data.filter((c: any) => c.active).map((c: any) => ({ name: c.name, icon: c.icon || '✨' })))
      ).catch(() => {}),
      servicesAPI.list({ popular: true, active: true }).then(({ data }) =>
        setPopularServices(data.map(mapService))
      ).catch(() => {}),
    ]);

    // Wave 2 — deferred, below-fold content
    const timer = setTimeout(() => {
      packagesAPI.list()
        .then(({ data }) => setPackages(
          data.filter((p: any) => p.active).map((p: any) => ({
            id: p.id, name: p.name, desc: p.tagline ?? '', time: p.duration ?? '',
            price: `₹${p.price.toLocaleString('en-IN')}`,
            imageUrl: p.image_url, badge: p.badge, originalPrice: p.original_price,
          }))
        ))
        .catch(() => {});

      // Fix #11 — only fetch 6 for the teaser grid (limit param)
      servicesAPI.list({ active: true, limit: 6 }).then(({ data }) =>
        setTeaserServices(data.map(mapService))
      ).catch(() => {}).finally(() => setServicesLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [mapService]);

  const fetchCoupons = useCallback(async (_user: User) => {
    setCouponsLoading(true);
    try {
      const { data } = await couponsAPI.listActive();
      setCoupons(data.map((c: any) => ({
        id: c.id, code: c.code, description: c.description, type: c.type,
        value: c.value, minOrder: c.min_order, maxDiscount: c.max_discount,
        usageLimit: c.usage_limit, usedCount: c.used_count,
        validFrom: c.valid_from, validTo: c.valid_to,
        applicableFor: c.applicable_for, autoApply: c.auto_apply, active: c.active,
      })));
    } catch { } finally { setCouponsLoading(false); }
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

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

  // Fix #4 — detect location on mount (unchanged), but now location is clickable
  useEffect(() => {
    setIsLoadingLocation(true);
    if (!navigator.geolocation) {
      setUserLocation('Mumbai, Maharashtra'); setIsLoadingLocation(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const suburb = data.locality || '';
            const city = data.city || data.principalSubdivision || 'Mumbai';
            setUserLocation(suburb ? `${suburb}, ${city}` : city);
          } else { setUserLocation('Mumbai, Maharashtra'); }
        } catch { setUserLocation('Mumbai, Maharashtra'); }
        setIsLoadingLocation(false);
      },
      () => { setUserLocation('Mumbai, Maharashtra'); setIsLoadingLocation(false); },
      { timeout: 15000, maximumAge: 600000 }
    );
  }, []);

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

  const navigateToService = useCallback((id: string) => router.push(`/client/services/${id}`), [router]);

  // All services combined for search (popular + teaser deduplicated)
  const allServicesForSearch = useMemo(() => {
    const seen = new Set<string>();
    return [...popularServices, ...teaserServices].filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [popularServices, teaserServices]);

  return (
    <>
      {showProviderModal && currentUser && (
        <ProviderRegistrationModal
          user={currentUser}
          onClose={() => setShowProviderModal(false)}
          onSuccess={handleProviderRegistrationSuccess}
        />
      )}

      {/* Fix #4 — Location picker modal */}
      {showLocationPicker && (
        <LocationPickerModal
          current={userLocation}
          onSelect={(loc) => { setUserLocation(loc); setShowLocationPicker(false); }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {/* Fix #2 — Sticky header (appears after scroll) */}
      <StickyHeader
        userLocation={userLocation}
        onLocationClick={() => setShowLocationPicker(true)}
        onCartClick={() => router.push('/client/cart')}
        allServices={allServicesForSearch}
        onNavigate={navigateToService}
      />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="bg-[#111827] px-4 pt-14 md:pt-10 pb-10">
        <div className="max-w-3xl mx-auto">
          {/* Mobile top row */}
          <div className="md:hidden flex items-center justify-between mb-6">
            {/* Fix #4 — clickable location */}
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
            >
              <MapPin size={15} className="text-[#e5849c]" />
              <span className="text-sm font-medium">
                {isLoadingLocation ? 'Detecting…' : userLocation}
              </span>
              <ChevronDown size={12} className="text-white/50 mt-0.5" />
            </button>
            <div className="flex items-center gap-3">
              {!providerStatusLoading && (
                isProvider && isProviderApproved ? (
                  <button onClick={() => router.push('/provider')} className="text-[#e5849c] border border-[#e5849c]/50 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#e5849c]/10 transition-all">My Provider</button>
                ) : isProvider ? (
                  <button disabled className="text-amber-500 border border-amber-300/50 text-xs font-semibold px-3 py-1.5 rounded-full cursor-not-allowed opacity-80">⏳ Approval Pending</button>
                ) : (
                  <button onClick={handleProviderButtonClick} className="text-[#e5849c] border border-[#e5849c]/50 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#e5849c]/10 transition-all">Earn with us</button>
                )
              )}
              <button aria-label="Notifications"><Bell size={20} className="text-white/70" /></button>
            </div>
          </div>

          {/* Headline + social proof */}
          <div className="mb-7">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
              Beauty &amp; wellness,<br />
              <span className="text-[#e5849c]">at your doorstep.</span>
            </h1>
            <p className="text-white/50 text-sm mb-3">Book trusted professionals in minutes.</p>
            {/* Social proof pill */}
            <div className="flex items-center gap-1.5 w-fit bg-white/10 border border-white/15 rounded-full px-3 py-1">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-white/80 text-xs font-medium">4.8 · 10,000+ bookings in Mumbai</span>
            </div>
          </div>

          {/* Fix #1 — Functional search */}
          <SearchBar services={allServicesForSearch} onNavigate={navigateToService} />

          {/* Fix #9 — Trust badges */}
          <TrustBadges />

          {/* Desktop location + provider pill */}
          <div className="hidden md:flex items-center justify-between mt-4">
            {/* Fix #4 — clickable on desktop too */}
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center gap-1.5 text-white/50 text-xs hover:text-white/80 transition-colors"
            >
              <MapPin size={13} className="text-[#e5849c]" />
              {isLoadingLocation ? 'Detecting location…' : userLocation}
              <ChevronDown size={11} />
            </button>
            {!providerStatusLoading && (
              isProvider && isProviderApproved ? (
                <button onClick={() => router.push('/provider')} className="text-[#e5849c] border border-[#e5849c]/40 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-[#e5849c]/10 transition-all">Go to Provider Dashboard →</button>
              ) : isProvider ? (
                <button disabled className="text-amber-500 border border-amber-300/40 text-xs font-semibold px-4 py-1.5 rounded-full cursor-not-allowed opacity-80">⏳ Waiting for Admin Approval</button>
              ) : (
                <button onClick={handleProviderButtonClick} className="text-[#e5849c] border border-[#e5849c]/40 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-[#e5849c]/10 transition-all">Earn with AmaraGo →</button>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Page body ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Promo banners */}
        <section className="mt-8">
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {[
              { gradient: 'from-[#111827] to-[#1f2937]', glow: '#e5849c', tag: 'New Users', tagColor: 'text-[#e5849c] bg-[#e5849c]/15', title: '₹200 off\nyour first booking', sub: 'Use code WELCOME200 at checkout', btnStyle: 'bg-[#e5849c] text-white', btnLabel: 'Book Now →', emoji: '💆', onClick: () => router.push('/client/services') },
              { gradient: 'from-[#7c3aed] to-[#a855f7]', glow: '#fff', tag: 'Referrals', tagColor: 'text-white/80 bg-white/15', title: 'Refer a friend,\nearn ₹200 each', sub: 'Share your code. Earn when they book.', btnStyle: 'bg-white text-[#7c3aed]', btnLabel: 'Share Code →', emoji: '🎁', onClick: () => {} },
              { gradient: 'from-[#b45309] to-[#d97706]', glow: '#fff', tag: 'Loyalty', tagColor: 'text-white/80 bg-white/15', title: 'Earn points,\nunlock rewards', sub: '₹1 spent = 0.5 pts. Gold at 2000 pts.', btnStyle: 'bg-white text-[#b45309]', btnLabel: 'View Tiers →', emoji: '💎', onClick: () => router.push('/client/profile') },
            ].map((b, i) => (
              <div key={i} className={`flex-shrink-0 w-72 md:w-80 rounded-3xl overflow-hidden bg-gradient-to-br ${b.gradient} relative`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_30%,var(--glow),transparent_60%)]" style={{ ['--glow' as any]: b.glow }} />
                <div className="relative p-5">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${b.tagColor}`}>{b.tag}</span>
                  <h3 className="text-xl font-extrabold text-white mt-3 mb-1 whitespace-pre-line">{b.title}</h3>
                  <p className="text-white/60 text-xs mb-4">{b.sub}</p>
                  <button onClick={b.onClick} className={`text-xs font-bold px-4 py-2 rounded-xl hover:brightness-90 transition ${b.btnStyle}`}>{b.btnLabel}</button>
                </div>
                <div className="absolute right-0 bottom-0 text-6xl opacity-20 pr-3 pb-2">{b.emoji}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mt-8">
            <SectionHeader title="Browse Categories" />
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => router.push(`/client/services?category=${cat.name}`)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 w-20 md:w-24 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#fff5f7] border border-[#e5849c]/20 flex items-center justify-center text-3xl group-hover:bg-[#e5849c]/10 group-hover:border-[#e5849c]/40 transition-all">
                    {cat.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Fix #8 — Coupons: real for logged-in, teaser for guests */}
        <section className="mt-8">
          <SectionHeader title="Today's Offers" />
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {couponsLoading && [1, 2, 3].map((i) => <CouponCardSkeleton key={i} />)}

            {!couponsLoading && !currentUser && <GuestCouponTeaser />}

            {!couponsLoading && currentUser && coupons.map((coupon) => {
              const isCopied = copiedCode === coupon.code;
              const discountLabel = coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`;
              return (
                <div key={coupon.id} className="flex-shrink-0 w-72 rounded-2xl overflow-hidden border border-[#e5849c]/30 bg-gradient-to-br from-[#fff5f7] to-white shadow-sm">
                  <div className="h-1.5 bg-[#e5849c]" />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag size={13} className="text-[#e5849c] flex-shrink-0" />
                          <span className="font-bold text-sm text-[#111827] tracking-wide truncate">{coupon.code}</span>
                          <span className="flex-shrink-0 text-[10px] font-bold text-[#e5849c] bg-[#e5849c]/10 px-1.5 py-0.5 rounded-full">{discountLabel}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-snug line-clamp-2">{coupon.description}</p>
                        <p className="text-[10px] text-gray-400 mt-1.5">Min ₹{coupon.minOrder} · Till {coupon.validTo}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                    >
                      {isCopied ? <><CheckCheck size={13} /> Copied!</> : <><Copy size={13} /> Copy Code</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Packages */}
        {packages.length > 0 && (
          <section className="mt-10">
            <SectionHeader title="Special Packages" action={{ label: 'View all', href: '/client/services' }} />
            <div className="flex gap-5 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {packages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>
          </section>
        )}

        {/* Fix #3 + #6 + #10 — Trending Now with improved marquee */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={15} className="text-[#e5849c]" />
              <h2 className="text-base font-bold text-[#111827]">Trending Now</h2>
            </div>
            <button
              onClick={() => router.push('/client/services')}
              className="text-xs font-semibold text-[#e5849c] hover:underline flex items-center gap-0.5"
            >
              See all <ChevronRight size={13} />
            </button>
          </div>

          {servicesLoading ? (
            <div className="flex gap-4 overflow-hidden -mx-4 px-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-44 rounded-2xl bg-white border border-gray-100 animate-pulse">
                  <div className="h-[72px] bg-gray-200 rounded-t-2xl" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : popularServices.length > 0 ? (
            <PopularServicesSlider services={popularServices} onNavigate={navigateToService} />
          ) : null}
        </section>

        {/* Fix #11 — Teaser grid (6 services) instead of full list */}
        {servicesLoading ? (
          <section className="mt-10 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-white border border-gray-100 animate-pulse" />
              ))}
            </div>
          </section>
        ) : teaserServices.length > 0 ? (
          <ServiceTeaserSection services={teaserServices} onNavigate={navigateToService} />
        ) : null}

      </div>

      <div className="h-24 md:hidden" />
    </>
  );
}