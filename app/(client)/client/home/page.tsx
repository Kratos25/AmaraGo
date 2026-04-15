"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Tag, Clock, Star, MapPin, Bell, X, Check, ChevronRight, Loader2, Copy, CheckCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { authAPI, couponsAPI, categoriesAPI, packagesAPI, servicesAPI } from '@/lib/api';
import { useCart } from '@/config/context/CartContext';
import {
  BannerSkeleton,
  CategoryRowSkeleton,
  PackageRowSkeleton,
  ServiceListSkeleton,
  CouponCardSkeleton,
} from '@/components/ui/skeletons';
import { useToast } from '@/hooks/use-toast';

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


const ALL_SERVICES = [
  { id: 'haircut', label: 'Haircut', category: 'Hair Care' },
  { id: 'hair_color', label: 'Hair Color / Highlights', category: 'Hair Care' },
  { id: 'hair_spa', label: 'Hair Spa / Treatment', category: 'Hair Care' },
  { id: 'blowdry', label: 'Blow Dry & Styling', category: 'Hair Care' },
  { id: 'facial', label: 'Facial', category: 'Skin Care' },
  { id: 'hydrafacial', label: 'HydraFacial', category: 'Skin Care' },
  { id: 'cleanup', label: 'Face Cleanup', category: 'Skin Care' },
  { id: 'threading', label: 'Threading', category: 'Skin Care' },
  { id: 'bridal_makeup', label: 'Bridal Makeup', category: 'Makeup' },
  { id: 'party_makeup', label: 'Party Makeup', category: 'Makeup' },
  { id: 'everyday_makeup', label: 'Everyday Makeup', category: 'Makeup' },
  { id: 'nail_art', label: 'Nail Art', category: 'Nail Art' },
  { id: 'gel_nails', label: 'Gel Nail Extension', category: 'Nail Art' },
  { id: 'manicure', label: 'Manicure', category: 'Nail Art' },
  { id: 'pedicure', label: 'Pedicure', category: 'Nail Art' },
  { id: 'body_massage', label: 'Body Massage', category: 'Spa & Massage' },
  { id: 'aroma_therapy', label: 'Aroma Therapy', category: 'Spa & Massage' },
  { id: 'head_massage', label: 'Head Massage', category: 'Spa & Massage' },
  { id: 'waxing_full', label: 'Full Body Waxing', category: 'Waxing' },
  { id: 'waxing_arms_legs', label: 'Arms & Legs Waxing', category: 'Waxing' },
  { id: 'waxing_face', label: 'Face Waxing', category: 'Waxing' },
];

const SERVICE_CATEGORIES = [...new Set(ALL_SERVICES.map((s) => s.category))];

function ProviderRegistrationModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState(user.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      toast({ title: 'Required fields missing', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      await authAPI.registerProvider({
        name: fullName,
        email: user.email ?? '',
        phone,
        firebase_uid: user.uid,
        id_token: token,
        bio,
        experience_years: parseInt(experience) || 0,
        services_offered: [],
        location: address,
      });
      toast({ title: 'Registration complete! 🎉', description: 'Awaiting admin approval. Your dashboard is ready.' });
      onSuccess();
    } catch (err: any) {
      toast({ title: 'Registration failed', description: err?.response?.data?.detail ?? err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-xl text-gray-900">Become a Provider</h2>
            <p className="text-sm text-gray-500 mt-0.5">Fill in your details to get started</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="provform" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="prov-name">Full Name *</Label>
              <Input id="prov-name" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="prov-phone">Phone Number *</Label>
              <Input id="prov-phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="prov-address">Service Area / Address *</Label>
              <Input id="prov-address" placeholder="e.g. Andheri West, Mumbai" value={address} onChange={(e) => setAddress(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="prov-exp">Years of Experience</Label>
              <Input id="prov-exp" placeholder="e.g. 3" value={experience} onChange={(e) => setExperience(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="prov-bio">Bio / About You</Label>
              <textarea
                id="prov-bio"
                placeholder="Tell clients a bit about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full mt-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e5849c]/40 resize-none"
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <Button
            type="submit"
            form="provform"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 font-medium"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Register as Provider'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable section header ────────────────────────────────────────────────────
function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; href: string };
}) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-bold text-[#111827]">{title}</h2>
      {action && (
        <button
          onClick={() => router.push(action.href)}
          className="text-xs font-semibold text-[#e5849c] hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();

  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState('Mumbai, Maharashtra');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProvider, setIsProvider] = useState(false);
  const [providerStatusLoading, setProviderStatusLoading] = useState(true);
  const [showProviderModal, setShowProviderModal] = useState(false);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Categories, packages, popular services from API
  const [categories, setCategories] = useState<{ name: string; icon: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [packages, setPackages] = useState<{ id: string; name: string; desc: string; time: string; price: string }[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [popularServices, setPopularServices] = useState<{ id: string; name: string; duration: string; rating: number; discountedPrice: string; originalPrice: string; discount: string }[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    categoriesAPI.list()
      .then(({ data }) => { setCategories(data.filter((c) => c.active).map((c) => ({ name: c.name, icon: c.icon || '✨' }))); setCategoriesLoading(false); })
      .catch(() => setCategoriesLoading(false))
      .catch(() => {});

    packagesAPI.list()
      .then(({ data }) => setPackages(
        data.filter((p) => p.active).map((p) => ({
          id: p.id,
          name: p.name,
          desc: p.tagline ?? '',
          time: p.duration ?? '',
          price: `₹${p.price.toLocaleString('en-IN')}`,
        }))
      ))
      .catch(() => {});

    servicesAPI.list({ popular: true, active: true })
      .then(({ data }) => setPopularServices(
        data.map((s) => {
          const base = s.base_price;
          const disc = s.discounted_price ?? base;
          const discPct = base > disc ? Math.round(((base - disc) / base) * 100) : 0;
          return {
            id: s.id,
            name: s.name,
            duration: `${s.duration} min`,
            rating: s.rating ?? 0,
            discountedPrice: `₹${disc.toLocaleString('en-IN')}`,
            originalPrice: `₹${base.toLocaleString('en-IN')}`,
            discount: discPct > 0 ? `${discPct}% OFF` : '',
          };
        })
      ))
      .catch(() => {})
      .finally(() => setServicesLoading(false));
  }, []);

  const fetchCoupons = async (_user: User) => {
    setCouponsLoading(true);
    try {
      const { data } = await couponsAPI.listActive();
      setCoupons(data.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        type: c.type,
        value: c.value,
        minOrder: c.min_order,
        maxDiscount: c.max_discount,
        usageLimit: c.usage_limit,
        usedCount: c.used_count,
        validFrom: c.valid_from,
        validTo: c.valid_to,
        applicableFor: c.applicable_for,
        autoApply: c.auto_apply,
        active: c.active,
      })));
    } catch {
      // silently fail — coupon section just won't show
    } finally {
      setCouponsLoading(false);
    }
  };

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
          setIsProvider(role === 'service_provider');
        } catch {
          setIsProvider(false);
        }
        fetchCoupons(user);
      } else {
        setIsProvider(false);
      }
      setProviderStatusLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setIsLoadingLocation(true);
    if (!navigator.geolocation) {
      setUserLocation('Mumbai, Maharashtra');
      setIsLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          if (res.ok) {
            const data = await res.json();
            const suburb = data.locality || '';
            const city = data.city || data.principalSubdivision || 'Mumbai';
            setUserLocation(suburb ? `${suburb}, ${city}` : city);
          } else {
            setUserLocation('Mumbai, Maharashtra');
          }
        } catch {
          setUserLocation('Mumbai, Maharashtra');
        }
        setIsLoadingLocation(false);
      },
      () => { setUserLocation('Mumbai, Maharashtra'); setIsLoadingLocation(false); },
      { timeout: 15000, maximumAge: 600000 }
    );
  }, []);

  const handleProviderButtonClick = () => {
    if (isProvider) {
      router.push('/provider');
    } else {
      if (!currentUser) { router.push('/login'); return; }
      setShowProviderModal(true);
    }
  };

  const handleProviderRegistrationSuccess = () => {
    setIsProvider(true);
    setShowProviderModal(false);
    router.push('/provider');
  };

  const handleAddToCart = async (
    id: string,
    name: string,
    price: number,
    type: 'service' | 'package',
    duration?: string
  ) => {
    await addItem({
      [type === 'service' ? 'service_id' : 'package_id']: id,
      name,
      price,
      duration,
      quantity: 1,
    });
    setAddedIds((prev) => new Set(prev).add(id));
    setTimeout(() => setAddedIds((prev) => { const n = new Set(prev); n.delete(id); return n; }), 2000);
  };

  return (
    <>
      {showProviderModal && currentUser && (
        <ProviderRegistrationModal
          user={currentUser}
          onClose={() => setShowProviderModal(false)}
          onSuccess={handleProviderRegistrationSuccess}
        />
      )}

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-[#111827] px-4 pt-14 md:pt-10 pb-10">
        <div className="max-w-3xl mx-auto">

          {/* Location row — mobile only (desktop has nav header) */}
          <div className="md:hidden flex items-center justify-between mb-6">
            <button className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors">
              <MapPin size={15} className="text-[#e5849c]" />
              <span className="text-sm font-medium">
                {isLoadingLocation ? 'Detecting location…' : userLocation}
              </span>
            </button>
            <div className="flex items-center gap-3">
              {!providerStatusLoading && (
                <button
                  onClick={handleProviderButtonClick}
                  className="text-[#e5849c] border border-[#e5849c]/50 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#e5849c]/10 transition-all"
                >
                  {isProvider ? 'My Provider' : 'Earn with us'}
                </button>
              )}
              <button aria-label="Notifications">
                <Bell size={20} className="text-white/70" />
              </button>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-7">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
              Beauty &amp; wellness,<br />
              <span className="text-[#e5849c]">at your doorstep.</span>
            </h1>
            <p className="text-white/50 text-sm">
              Book trusted professionals in minutes.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            <input
              type="search"
              placeholder="Search haircut, facial, massage…"
              className="w-full pl-11 pr-4 py-4 rounded-xl bg-white text-sm text-gray-800 placeholder:text-gray-400 outline-none shadow-lg focus:ring-2 focus:ring-[#e5849c]/40"
            />
          </div>

          {/* Desktop — location + provider pill below search */}
          <div className="hidden md:flex items-center justify-between mt-4">
            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <MapPin size={13} className="text-[#e5849c]" />
              {isLoadingLocation ? 'Detecting location…' : userLocation}
            </div>
            {!providerStatusLoading && (
              <button
                onClick={handleProviderButtonClick}
                className="text-[#e5849c] border border-[#e5849c]/40 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-[#e5849c]/10 transition-all"
              >
                {isProvider ? 'Go to Provider Dashboard →' : 'Earn with AmaraGo →'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Rest of the page ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">


        {/* ── Promo Banners ─────────────────────────────────────── */}
        <section className="mt-8">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex-shrink-0 w-72 md:w-80 rounded-3xl overflow-hidden bg-gradient-to-br from-[#111827] to-[#1f2937] relative">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_20%,#e5849c,transparent_60%)]" />
              <div className="relative p-5">
                <span className="text-[10px] font-bold text-[#e5849c] uppercase tracking-widest bg-[#e5849c]/15 px-2.5 py-1 rounded-full">New Users</span>
                <h3 className="text-xl font-extrabold text-white mt-3 mb-1">₹200 off<br />your first booking</h3>
                <p className="text-white/50 text-xs mb-4">Use code WELCOME200 at checkout</p>
                <button onClick={() => router.push('/client/services')} className="bg-[#e5849c] text-white text-xs font-bold px-4 py-2 rounded-xl hover:brightness-90 transition">Book Now →</button>
              </div>
              <div className="absolute right-0 bottom-0 text-6xl opacity-20 pr-3 pb-2">💆</div>
            </div>
            <div className="flex-shrink-0 w-72 md:w-80 rounded-3xl overflow-hidden bg-gradient-to-br from-[#7c3aed] to-[#a855f7] relative">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_80%,#fff,transparent_50%)]" />
              <div className="relative p-5">
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest bg-white/15 px-2.5 py-1 rounded-full">Referrals</span>
                <h3 className="text-xl font-extrabold text-white mt-3 mb-1">Refer a friend,<br />earn ₹200 each</h3>
                <p className="text-white/60 text-xs mb-4">Share your code. Earn when they book.</p>
                <button className="bg-white text-[#7c3aed] text-xs font-bold px-4 py-2 rounded-xl hover:brightness-95 transition">Share Code →</button>
              </div>
              <div className="absolute right-0 bottom-0 text-6xl opacity-20 pr-3 pb-2">🎁</div>
            </div>
            <div className="flex-shrink-0 w-72 md:w-80 rounded-3xl overflow-hidden bg-gradient-to-br from-[#b45309] to-[#d97706] relative">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,#fff,transparent_60%)]" />
              <div className="relative p-5">
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest bg-white/15 px-2.5 py-1 rounded-full">Loyalty</span>
                <h3 className="text-xl font-extrabold text-white mt-3 mb-1">Earn points,<br />unlock rewards</h3>
                <p className="text-white/60 text-xs mb-4">₹1 spent = 0.5 pts. Gold starts at 2000 pts.</p>
                <button onClick={() => router.push('/client/profile')} className="bg-white text-[#b45309] text-xs font-bold px-4 py-2 rounded-xl hover:brightness-95 transition">View Tiers →</button>
              </div>
              <div className="absolute right-0 bottom-0 text-6xl opacity-20 pr-3 pb-2">💎</div>
            </div>
          </div>
        </section>

        {/* ── Categories ────────────────────────────────────────── */}
        {categories.length > 0 && (
          <section className="mt-8">
            <SectionHeader title="Browse Categories" />
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => router.push(`/client/services?category=${cat.name}`)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 w-20 md:w-24 group"
                >
                  <div className="w-16 h-16 md:w-18 md:h-18 rounded-2xl bg-[#fff5f7] border border-[#e5849c]/20 flex items-center justify-center text-3xl group-hover:bg-[#e5849c]/10 group-hover:border-[#e5849c]/40 transition-all">
                    {cat.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Offers / Coupons ──────────────────────────────────── */}
        {couponsLoading && (
          <section className="mt-8">
            <SectionHeader title="Today's Offers" />
            <div className="flex gap-4 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
              {[1, 2, 3].map((i) => (
                <CouponCardSkeleton key={i} />
              ))}
            </div>
          </section>
        )}

        {!couponsLoading && coupons.length > 0 && (
          <section className="mt-8">
            <SectionHeader title="Today's Offers" />
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
              {coupons.map((coupon) => {
                const isCopied = copiedCode === coupon.code;
                const discountLabel = coupon.type === 'percentage'
                  ? `${coupon.value}% OFF`
                  : `₹${coupon.value} OFF`;

                return (
                  <div
                    key={coupon.id}
                    className="flex-shrink-0 w-72 rounded-2xl overflow-hidden border border-[#e5849c]/30 bg-gradient-to-br from-[#fff5f7] to-white shadow-sm"
                  >
                    {/* Colored stripe */}
                    <div className="h-1.5 bg-[#e5849c]" />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Tag size={13} className="text-[#e5849c] flex-shrink-0" />
                            <span className="font-bold text-sm text-[#111827] tracking-wide truncate">{coupon.code}</span>
                            <span className="flex-shrink-0 text-[10px] font-bold text-[#e5849c] bg-[#e5849c]/10 px-1.5 py-0.5 rounded-full">
                              {discountLabel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-snug line-clamp-2">{coupon.description}</p>
                          <p className="text-[10px] text-gray-400 mt-1.5">
                            Min ₹{coupon.minOrder} · Till {coupon.validTo}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                      >
                        {isCopied
                          ? <><CheckCheck size={13} /> Copied!</>
                          : <><Copy size={13} /> Copy Code</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Packages ──────────────────────────────────────────── */}
        {packages.length > 0 && (
          <section className="mt-10">
            <SectionHeader title="Special Packages" action={{ label: 'View all', href: '/client/services' }} />
            <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex-shrink-0 w-64 md:w-72 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Illustration band */}
                  <div className="h-36 bg-[#111827] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_30%,#e5849c,transparent_60%)]" />
                    <span className="text-5xl">{pkg.name.includes('Bridal') ? '👰' : pkg.name.includes('Hair') ? '💇' : pkg.name.includes('Spa') ? '🧖' : '✨'}</span>
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-base text-[#111827] mb-1 leading-tight">{pkg.name}</h4>
                    <p className="text-gray-500 text-xs mb-4 leading-relaxed line-clamp-2">{pkg.desc}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        {pkg.time && <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1"><Clock size={10} />{pkg.time}</p>}
                        <p className="text-xl font-extrabold text-[#e5849c]">{pkg.price}</p>
                      </div>
                      <button
                        onClick={() => handleAddToCart(pkg.id, pkg.name, parseFloat(pkg.price.replace(/[^0-9.]/g, '')), 'package', pkg.time)}
                        className={`flex items-center gap-1 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all ${
                          addedIds.has(pkg.id) ? 'bg-green-500 text-white' : 'bg-[#111827] hover:bg-[#1f2937] text-white'
                        }`}
                      >
                        {addedIds.has(pkg.id) ? '✓ Added' : '+ Add'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Popular Services ──────────────────────────────────── */}
        <section className="mt-10 mb-8">
          <SectionHeader title="Popular Services" action={{ label: 'See all services →', href: '/client/services' }} />

          {servicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                  <div className="flex-shrink-0 space-y-1.5 text-right">
                    <div className="h-3.5 bg-gray-200 rounded w-16" />
                    <div className="h-7 bg-gray-200 rounded-xl w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : popularServices.length > 0 ? (
            <div className="space-y-3">
              {popularServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#e5849c]/30 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => router.push(`/client/services/${service.id}`)}
                >
                  {/* Icon */}
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-[#111827] flex items-center justify-center text-2xl">
                    {service.name.toLowerCase().includes('hair') ? '💇'
                      : service.name.toLowerCase().includes('nail') ? '💅'
                      : service.name.toLowerCase().includes('massage') || service.name.toLowerCase().includes('spa') ? '🧖'
                      : service.name.toLowerCase().includes('facial') || service.name.toLowerCase().includes('skin') ? '✨'
                      : service.name.toLowerCase().includes('makeup') ? '💄'
                      : service.name.toLowerCase().includes('wax') ? '🪒'
                      : '🌸'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#111827] text-sm truncate">{service.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock size={10} />{service.duration}
                      </span>
                      {service.rating > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                          <Star size={10} className="fill-amber-400" />{service.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing + Book */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-[#111827] text-sm">{service.discountedPrice}</p>
                      {service.discount && (
                        <p className="text-[10px] text-gray-400 line-through">{service.originalPrice}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(service.id, service.name, typeof service.discountedPrice === 'number' ? service.discountedPrice : parseFloat(String(service.discountedPrice).replace(/[^0-9.]/g,'')), 'service', service.duration);
                      }}
                      className={`flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                        addedIds.has(service.id) ? 'bg-green-500 text-white' : 'bg-[#e5849c] hover:bg-[#d4738b] text-white'
                      }`}
                    >
                      {addedIds.has(service.id) ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">No services available right now.</p>
          )}
        </section>

      </div>

      {/* Mobile bottom spacer */}
      <div className="h-24 md:hidden" />
    </>
  );
}