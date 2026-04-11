"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Tag, Clock, Star, MapPin, Bell, X, Check, ChevronRight, Loader2, Copy, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
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

const categories = [
  { name: 'Hair Care', icon: '✂️' },
  { name: 'Skin Care', icon: '🧴' },
  { name: 'Makeup', icon: '💄' },
  { name: 'Nail Art', icon: '💅' },
  { name: 'Spa & Massage', icon: '🧖‍♀️' },
  { name: 'Waxing', icon: '🪒' },
];

const packages = [
  {
    name: 'Bridal Glow Package',
    desc: 'Full body massage + facial + hair spa + makeup trial',
    time: '5 hours',
    price: '₹12,999',
    image: 'https://ciceroni.in/cdn/shop/articles/top-12-bridal-makeup-artists-to-look-out-for-in-ahmedabad-480982.png?v=1683890124&width=748',
  },
  {
    name: 'Luxury Spa Day',
    desc: 'Aroma therapy + body polish + signature facial',
    time: '4 hours',
    price: '₹8,499',
    image: 'https://colorcafe.co.in/frontend/images/blogs/1728562931_6707c6f331796.png',
  },
];

const popularServices = [
  {
    name: 'Classic Haircut + Blow Dry',
    duration: '60 min',
    rating: 4.8,
    originalPrice: '₹1,200',
    discountedPrice: '₹899',
    discount: '25% OFF',
    image: 'https://thumbs.dreamstime.com/b/woman-getting-her-hair-done-beauty-salon-attractive-women-116104766.jpg',
  },
  {
    name: 'HydraFacial Signature',
    duration: '75 min',
    rating: 4.9,
    originalPrice: '₹4,500',
    discountedPrice: '₹3,299',
    discount: '27% OFF',
    image: 'https://ladybellemedspa.com/storage/2025/08/HydraFacial-treatment-at-LadyBelle-Med-Spa-in-Fountain-Valley-CA.webp',
  },
  {
    name: 'Gel Nail Extension',
    duration: '120 min',
    rating: 4.7,
    originalPrice: '₹2,800',
    discountedPrice: '₹2,099',
    discount: '25% OFF',
    image: 'https://www.byrdie.com/thmb/COwCfKYihOvoMxUz1TYS71DCMjg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/wintergelnails6-6ebee2208d894784bd3b1d4232c148b0.png',
  },
];

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
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState(user.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [address, setAddress] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState(SERVICE_CATEGORIES[0]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      toast({ title: 'Required fields missing', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      toast({ title: 'Select at least one service', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          isProvider: true,
          role: 'provider',
          providerProfile: {
            fullName,
            phone,
            bio,
            experience,
            address,
            services: selectedServices,
            registeredAt: serverTimestamp(),
            status: 'active',
          },
        },
        { merge: true }
      );
      toast({ title: 'Provider registration complete! 🎉', description: 'You can now access your provider dashboard.' });
      onSuccess();
    } catch (err: any) {
      toast({ title: 'Registration failed', description: err.message, variant: 'destructive' });
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
            <p className="text-sm text-gray-500 mt-0.5">Step {step} of 2 — {step === 1 ? 'Your Details' : 'Services You Offer'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 pt-4 flex-shrink-0">
          <div className="flex gap-2">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#e5849c]' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#e5849c]' : 'bg-gray-200'}`} />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {step === 1 ? (
            <form id="step1form" onSubmit={handleStep1Next} className="space-y-4">
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
                <Input id="prov-exp" placeholder="e.g. 3 years" value={experience} onChange={(e) => setExperience(e.target.value)} className="mt-1.5" />
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
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">Select all the services you can provide. Clients will discover you based on these.</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeCategory === cat ? 'bg-[#e5849c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ALL_SERVICES.filter((s) => s.category === activeCategory).map((service) => {
                  const selected = selectedServices.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        selected ? 'border-[#e5849c] bg-[#fdf0f3] text-[#e5849c]' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selected ? 'border-[#e5849c] bg-[#e5849c]' : 'border-gray-300'
                      }`}>
                        {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-xs font-medium leading-tight">{service.label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedServices.length > 0 && (
                <div className="mt-4 p-3 bg-[#fdf0f3] rounded-xl">
                  <p className="text-xs text-[#e5849c] font-medium">
                    {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          {step === 1 ? (
            <Button type="submit" form="step1form" className="w-full bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 font-medium">
              Continue <ChevronRight size={18} className="ml-1" />
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 py-6">Back</Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || selectedServices.length === 0}
                className="flex-1 bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 font-medium"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Register as Provider'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();

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

  const fetchCoupons = async (user: User) => {
    setCouponsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/coupons/available`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data: Coupon[] = await res.json();
        setCoupons(data);
      }
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
          setIsProvider(snap.exists() && snap.data()?.isProvider === true);
        } catch {
          setIsProvider(false);
        }
        // Fetch personalised coupons now that we have the user
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

  return (
    <>
      {showProviderModal && currentUser && (
        <ProviderRegistrationModal
          user={currentUser}
          onClose={() => setShowProviderModal(false)}
          onSuccess={handleProviderRegistrationSuccess}
        />
      )}

      <header className="fixed inset-x-0 top-0 z-50 bg-white/70 backdrop-blur-md shadow-lg border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <MapPin className="text-[#e5849c]" size={22} />
            <div>
              <p className="text-xs text-gray-600 leading-none">Delivering to</p>
              <p className="font-bold text-gray-800 text-sm">{isLoadingLocation ? 'Detecting...' : userLocation}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!providerStatusLoading && (
              <Button
                onClick={handleProviderButtonClick}
                className={`text-white text-xs font-semibold px-4 h-9 rounded-full shadow-sm transition-all ${
                  isProvider
                    ? 'bg-gradient-to-r from-[#b06b3c] to-[#d4845a] hover:brightness-90'
                    : 'bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90'
                }`}
              >
                {isProvider ? 'Go to Provider Page' : 'Become a Provider'}
              </Button>
            )}
            <button aria-label="Notifications" className="p-1">
              <Bell className="text-[#e5849c]" size={26} />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-14">
        <section className="bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] px-4 py-12 rounded-b-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 max-w-4xl mx-auto">
            What services are you looking for today?
          </h2>
          <div className="relative max-w-4xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={24} />
            <Input
              placeholder="Haircut, Facial, Massage..."
              className="pl-14 pr-6 py-7 text-lg bg-white shadow-xl border-none focus:ring-4 focus:ring-white/50 placeholder:text-gray-500 rounded-4xl"
            />
          </div>
        </section>

        {/* Coupons — fetched from backend based on user type */}
        {couponsLoading && (
          <div className="px-4 -mt-8 relative z-10">
            <div className="rounded-2xl bg-gray-100 animate-pulse h-24" />
          </div>
        )}

        {!couponsLoading && coupons.length > 0 && (
          <div className="px-4 -mt-8 relative z-10 space-y-3">
            {coupons.map((coupon) => {
              const isCopied = copiedCode === coupon.code;
              const discountLabel =
                coupon.type === 'percentage'
                  ? `${coupon.value}% OFF`
                  : `₹${coupon.value} OFF`;
              const bgGradient =
                coupon.applicableFor === 'new_users'
                  ? 'from-[#eec11d] to-[#ffac37]'
                  : coupon.applicableFor === 'returning'
                  ? 'from-[#6366f1] to-[#8b5cf6]'
                  : 'from-[#e5849c] to-[#E5AFBC]';

              return (
                <div
                  key={coupon.id}
                  className={`rounded-2xl overflow-hidden bg-gradient-to-r ${bgGradient} text-white shadow-2xl`}
                >
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag size={18} />
                        <span className="font-bold text-lg tracking-wide">{coupon.code}</span>
                        <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                          {discountLabel}
                        </span>
                      </div>
                      <p className="text-white/90 text-sm">{coupon.description}</p>
                      <p className="text-white/70 text-xs mt-1">
                        Min order ₹{coupon.minOrder}
                        {coupon.maxDiscount ? ` · Max discount ₹${coupon.maxDiscount}` : ''}
                        {' · '}Valid till {coupon.validTo}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-semibold px-4 py-2 rounded-xl"
                    >
                      {isCopied ? (
                        <><CheckCheck size={15} /> Copied!</>
                      ) : (
                        <><Copy size={15} /> Copy</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <section className="px-4 mt-12">
          <h3 className="text-lg font-semibold mb-5 text-gray-800">Categories</h3>
          <div className="grid grid-cols-3 gap-5">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => router.push(`/client/services?category=${cat.name}`)}
                className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100"
              >
                <span className="text-4xl mb-3">{cat.icon}</span>
                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="px-4 mt-12">
          <h3 className="text-lg font-semibold mb-5 text-gray-800">Special Packages</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.name} className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <img src={pkg.image} alt={pkg.name} className="w-full h-60 object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                <div className="p-6">
                  <h4 className="font-bold text-xl mb-3 text-gray-900">{pkg.name}</h4>
                  <p className="text-gray-600 text-sm mb-5 leading-relaxed">{pkg.desc}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{pkg.time}</div>
                      <div className="text-2xl font-bold text-[#e5849c]">{pkg.price}</div>
                    </div>
                    <Button className="bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white px-7 py-6 font-medium">Book Now</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 mt-12">
          <h3 className="text-lg font-semibold mb-5 text-gray-800">Popular Services</h3>
          <div className="space-y-6">
            {popularServices.map((service) => (
              <div key={service.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-6 p-4 sm:p-6">
                  <div className="rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={service.image} alt={service.name} className="w-full sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-lg mb-2">{service.name}</h4>
                      <div className="flex items-center gap-5 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1"><Clock size={16} /> {service.duration}</div>
                        <div className="flex items-center gap-1"><Star size={16} className="text-amber-500 fill-amber-500" /> {service.rating}</div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div className="text-2xl font-bold text-[#e5849c]">{service.discountedPrice}</div>
                      <div className="text-sm text-gray-500 line-through">{service.originalPrice}</div>
                    </div>
                  </div>
                  <div className="sm:self-end">
                    <Button className="bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white px-8 py-6 w-full sm:w-auto">Book</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-20 lg:hidden" />
      </main>
    </>
  );
}

// "use client";

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Search, MapPin, Bell, X, Check, ChevronRight, Loader2,
//   Copy, CheckCheck, ArrowRight, Star, Clock, Tag,
//   Scissors, Sparkles, Shield, Coffee, Wind, Zap
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { onAuthStateChanged, User } from 'firebase/auth';
// import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
// import { auth, db } from '@/lib/firebase';
// import { useToast } from '@/hooks/use-toast';

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

// const categories = [
//   { name: 'Hair Care', icon: Scissors },
//   { name: 'Skin Care', icon: Sparkles },
//   { name: 'Makeup', icon: Shield },
//   { name: 'Nail Art', icon: Zap },
//   { name: 'Spa & Massage', icon: Coffee },
//   { name: 'Waxing', icon: Wind },
// ];

// const packages = [
//   {
//     name: 'Bridal Glow Package',
//     desc: 'Full body massage + facial + hair spa + makeup trial',
//     time: '5 hours',
//     price: '₹12,999',
//     label: 'Most Popular',
//     image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80',
//     span: 'tall',
//   },
//   {
//     name: 'Luxury Spa Day',
//     desc: 'Aroma therapy + body polish + signature facial',
//     time: '4 hours',
//     price: '₹8,499',
//     label: 'Package',
//     image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80',
//     span: 'normal',
//   },
//   {
//     name: 'Hair Transformation',
//     desc: 'Color + cut + blow dry + hair spa treatment',
//     time: '3 hours',
//     price: '₹5,999',
//     label: 'Package',
//     image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
//     span: 'normal',
//   },
//   {
//     name: 'The Radiance Edit',
//     desc: 'Skin & Glow — HydraFacial + LED therapy + face massage',
//     time: '2.5 hours',
//     price: '₹4,299',
//     label: 'New',
//     image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80',
//     span: 'wide',
//   },
// ];

// const popularServices = [
//   {
//     name: 'Classic Haircut + Blow Dry',
//     duration: '60 min',
//     rating: 4.8,
//     reviews: 126,
//     originalPrice: '₹1,200',
//     discountedPrice: '₹899',
//     discount: '25% OFF',
//     image: 'https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?w=200&q=80',
//   },
//   {
//     name: 'HydraFacial Signature',
//     duration: '75 min',
//     rating: 4.9,
//     reviews: 203,
//     originalPrice: '₹4,500',
//     discountedPrice: '₹3,299',
//     discount: '27% OFF',
//     image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=80',
//   },
//   {
//     name: 'Gel Nail Extension',
//     duration: '120 min',
//     rating: 4.7,
//     reviews: 89,
//     originalPrice: '₹2,800',
//     discountedPrice: '₹2,099',
//     discount: '25% OFF',
//     image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=80',
//   },
//   {
//     name: 'Aroma Therapy Body Massage',
//     duration: '90 min',
//     rating: 4.8,
//     reviews: 154,
//     originalPrice: '₹2,200',
//     discountedPrice: '₹1,699',
//     discount: '23% OFF',
//     image: 'https://images.unsplash.com/photo-1519015865-28c0b0083c2a?w=200&q=80',
//   },
// ];

// const ALL_SERVICES = [
//   { id: 'haircut', label: 'Haircut', category: 'Hair Care' },
//   { id: 'hair_color', label: 'Hair Color / Highlights', category: 'Hair Care' },
//   { id: 'hair_spa', label: 'Hair Spa / Treatment', category: 'Hair Care' },
//   { id: 'blowdry', label: 'Blow Dry & Styling', category: 'Hair Care' },
//   { id: 'facial', label: 'Facial', category: 'Skin Care' },
//   { id: 'hydrafacial', label: 'HydraFacial', category: 'Skin Care' },
//   { id: 'cleanup', label: 'Face Cleanup', category: 'Skin Care' },
//   { id: 'threading', label: 'Threading', category: 'Skin Care' },
//   { id: 'bridal_makeup', label: 'Bridal Makeup', category: 'Makeup' },
//   { id: 'party_makeup', label: 'Party Makeup', category: 'Makeup' },
//   { id: 'everyday_makeup', label: 'Everyday Makeup', category: 'Makeup' },
//   { id: 'nail_art', label: 'Nail Art', category: 'Nail Art' },
//   { id: 'gel_nails', label: 'Gel Nail Extension', category: 'Nail Art' },
//   { id: 'manicure', label: 'Manicure', category: 'Nail Art' },
//   { id: 'pedicure', label: 'Pedicure', category: 'Nail Art' },
//   { id: 'body_massage', label: 'Body Massage', category: 'Spa & Massage' },
//   { id: 'aroma_therapy', label: 'Aroma Therapy', category: 'Spa & Massage' },
//   { id: 'head_massage', label: 'Head Massage', category: 'Spa & Massage' },
//   { id: 'waxing_full', label: 'Full Body Waxing', category: 'Waxing' },
//   { id: 'waxing_arms_legs', label: 'Arms & Legs Waxing', category: 'Waxing' },
//   { id: 'waxing_face', label: 'Face Waxing', category: 'Waxing' },
// ];

// const SERVICE_CATEGORIES = [...new Set(ALL_SERVICES.map((s) => s.category))];

// // ─── Provider Registration Modal ────────────────────────────────────────────

// function ProviderRegistrationModal({
//   user,
//   onClose,
//   onSuccess,
// }: {
//   user: User;
//   onClose: () => void;
//   onSuccess: () => void;
// }) {
//   const { toast } = useToast();
//   const [step, setStep] = useState<1 | 2>(1);
//   const [submitting, setSubmitting] = useState(false);
//   const [fullName, setFullName] = useState(user.displayName ?? '');
//   const [phone, setPhone] = useState('');
//   const [bio, setBio] = useState('');
//   const [experience, setExperience] = useState('');
//   const [address, setAddress] = useState('');
//   const [selectedServices, setSelectedServices] = useState<string[]>([]);
//   const [activeCategory, setActiveCategory] = useState(SERVICE_CATEGORIES[0]);

//   const toggleService = (id: string) => {
//     setSelectedServices((prev) =>
//       prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
//     );
//   };

//   const handleStep1Next = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!fullName.trim() || !phone.trim() || !address.trim()) {
//       toast({ title: 'Required fields missing', description: 'Please fill all required fields.', variant: 'destructive' });
//       return;
//     }
//     setStep(2);
//   };

//   const handleSubmit = async () => {
//     if (selectedServices.length === 0) {
//       toast({ title: 'Select at least one service', variant: 'destructive' });
//       return;
//     }
//     setSubmitting(true);
//     try {
//       await setDoc(
//         doc(db, 'users', user.uid),
//         {
//           isProvider: true,
//           role: 'provider',
//           providerProfile: {
//             fullName, phone, bio, experience, address,
//             services: selectedServices,
//             registeredAt: serverTimestamp(),
//             status: 'active',
//           },
//         },
//         { merge: true }
//       );
//       toast({ title: 'Provider registration complete!', description: 'You can now access your provider dashboard.' });
//       onSuccess();
//     } catch (err: any) {
//       toast({ title: 'Registration failed', description: err.message, variant: 'destructive' });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4">
//       <div
//         className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
//         style={{ maxHeight: '92vh' }}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between px-7 py-5 border-b border-[#f5eef0] flex-shrink-0">
//           <div>
//             <p className="text-[10px] tracking-[0.15em] uppercase text-[#e5849c] font-medium mb-1">
//               Step {step} of 2
//             </p>
//             <h2
//               className="font-bold text-xl text-[#1a1118]"
//               style={{ fontFamily: "'Playfair Display', serif" }}
//             >
//               {step === 1 ? 'Your Details' : 'Services You Offer'}
//             </h2>
//           </div>
//           <button
//             onClick={onClose}
//             className="w-9 h-9 rounded-full border border-[#f0e8eb] flex items-center justify-center hover:border-[#e5849c] transition-colors"
//           >
//             <X size={16} className="text-[#7a6a72]" />
//           </button>
//         </div>

//         {/* Progress bar */}
//         <div className="flex gap-1.5 px-7 pt-4 flex-shrink-0">
//           <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#e5849c]' : 'bg-[#f0e8eb]'}`} />
//           <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#e5849c]' : 'bg-[#f0e8eb]'}`} />
//         </div>

//         {/* Body */}
//         <div className="overflow-y-auto flex-1 px-7 py-6">
//           {step === 1 ? (
//             <form id="step1form" onSubmit={handleStep1Next} className="space-y-4">
//               {[
//                 { id: 'prov-name', label: 'Full Name', placeholder: 'Your full name', value: fullName, onChange: setFullName, required: true },
//                 { id: 'prov-phone', label: 'Phone Number', placeholder: '+91 98765 43210', value: phone, onChange: setPhone, required: true, type: 'tel' },
//                 { id: 'prov-address', label: 'Service Area / Address', placeholder: 'e.g. Andheri West, Mumbai', value: address, onChange: setAddress, required: true },
//                 { id: 'prov-exp', label: 'Years of Experience', placeholder: 'e.g. 3 years', value: experience, onChange: setExperience },
//               ].map((field) => (
//                 <div key={field.id}>
//                   <Label htmlFor={field.id} className="text-xs tracking-wide text-[#7a6a72] uppercase font-medium">
//                     {field.label}{field.required ? ' *' : ''}
//                   </Label>
//                   <Input
//                     id={field.id}
//                     type={field.type ?? 'text'}
//                     placeholder={field.placeholder}
//                     value={field.value}
//                     onChange={(e) => field.onChange(e.target.value)}
//                     required={field.required}
//                     className="mt-1.5 border-[#f0e8eb] focus:border-[#e5849c] focus:ring-[#e5849c]/20 rounded-xl"
//                   />
//                 </div>
//               ))}
//               <div>
//                 <Label htmlFor="prov-bio" className="text-xs tracking-wide text-[#7a6a72] uppercase font-medium">
//                   Bio / About You
//                 </Label>
//                 <textarea
//                   id="prov-bio"
//                   placeholder="Tell clients a bit about yourself..."
//                   value={bio}
//                   onChange={(e) => setBio(e.target.value)}
//                   rows={3}
//                   className="w-full mt-1.5 px-4 py-3 text-sm border border-[#f0e8eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e5849c]/20 focus:border-[#e5849c] resize-none transition-colors"
//                 />
//               </div>
//             </form>
//           ) : (
//             <div>
//               <p className="text-sm text-[#7a6a72] mb-5 leading-relaxed">
//                 Select all the services you can provide. Clients will discover you based on these.
//               </p>
//               {/* Category tabs */}
//               <div className="flex gap-2 flex-wrap mb-5">
//                 {SERVICE_CATEGORIES.map((cat) => (
//                   <button
//                     key={cat}
//                     type="button"
//                     onClick={() => setActiveCategory(cat)}
//                     className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
//                       activeCategory === cat
//                         ? 'bg-[#1a1118] text-white'
//                         : 'bg-[#faf7f8] text-[#7a6a72] hover:bg-[#f5eef0] border border-[#f0e8eb]'
//                     }`}
//                   >
//                     {cat}
//                   </button>
//                 ))}
//               </div>
//               {/* Service grid */}
//               <div className="grid grid-cols-2 gap-2">
//                 {ALL_SERVICES.filter((s) => s.category === activeCategory).map((service) => {
//                   const selected = selectedServices.includes(service.id);
//                   return (
//                     <button
//                       key={service.id}
//                       type="button"
//                       onClick={() => toggleService(service.id)}
//                       className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all ${
//                         selected
//                           ? 'border-[#e5849c] bg-[#fdf0f3] text-[#c96480]'
//                           : 'border-[#f0e8eb] bg-white text-[#1a1118] hover:border-[#e5849c]/40'
//                       }`}
//                     >
//                       <div
//                         className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
//                           selected ? 'border-[#e5849c] bg-[#e5849c]' : 'border-[#d5c8cc]'
//                         }`}
//                       >
//                         {selected && <Check size={10} className="text-white" strokeWidth={3} />}
//                       </div>
//                       <span className="text-xs font-medium leading-tight">{service.label}</span>
//                     </button>
//                   );
//                 })}
//               </div>
//               {selectedServices.length > 0 && (
//                 <div className="mt-4 p-3.5 bg-[#fdf0f3] border border-[#f5d5df] rounded-xl">
//                   <p className="text-xs text-[#c96480] font-medium">
//                     {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="px-7 py-5 border-t border-[#f5eef0] flex-shrink-0">
//           {step === 1 ? (
//             <Button
//               type="submit"
//               form="step1form"
//               className="w-full bg-[#1a1118] hover:bg-[#c96480] text-white py-6 font-medium rounded-xl transition-colors"
//             >
//               Continue <ChevronRight size={16} className="ml-1" />
//             </Button>
//           ) : (
//             <div className="flex gap-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setStep(1)}
//                 className="flex-1 py-6 rounded-xl border-[#f0e8eb] hover:border-[#e5849c] hover:text-[#e5849c]"
//               >
//                 Back
//               </Button>
//               <Button
//                 type="button"
//                 onClick={handleSubmit}
//                 disabled={submitting || selectedServices.length === 0}
//                 className="flex-1 bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 font-medium rounded-xl"
//               >
//                 {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Register as Provider'}
//               </Button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Main Page ───────────────────────────────────────────────────────────────

// export default function Home() {
//   const router = useRouter();
//   const { toast } = useToast();

//   const [userLocation, setUserLocation] = useState('Mumbai, Maharashtra');
//   const [isLoadingLocation, setIsLoadingLocation] = useState(true);
//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [isProvider, setIsProvider] = useState(false);
//   const [providerStatusLoading, setProviderStatusLoading] = useState(true);
//   const [showProviderModal, setShowProviderModal] = useState(false);
//   const [activeCategory, setActiveCategory] = useState('Hair Care');

//   // Coupons
//   const [coupons, setCoupons] = useState<Coupon[]>([]);
//   const [couponsLoading, setCouponsLoading] = useState(false);
//   const [copiedCode, setCopiedCode] = useState<string | null>(null);

//   const fetchCoupons = async (user: User) => {
//     setCouponsLoading(true);
//     try {
//       const token = await user.getIdToken();
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/coupons/available`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (res.ok) {
//         const data: Coupon[] = await res.json();
//         setCoupons(data);
//       }
//     } catch {
//       // silently fail
//     } finally {
//       setCouponsLoading(false);
//     }
//   };

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
//           setIsProvider(snap.exists() && snap.data()?.isProvider === true);
//         } catch {
//           setIsProvider(false);
//         }
//         fetchCoupons(user);
//       } else {
//         setIsProvider(false);
//       }
//       setProviderStatusLoading(false);
//     });
//     return () => unsub();
//   }, []);

//   useEffect(() => {
//     setIsLoadingLocation(true);
//     if (!navigator.geolocation) {
//       setUserLocation('Mumbai, Maharashtra');
//       setIsLoadingLocation(false);
//       return;
//     }
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const { latitude, longitude } = pos.coords;
//         try {
//           const res = await fetch(
//             `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
//           );
//           if (res.ok) {
//             const data = await res.json();
//             const suburb = data.locality || '';
//             const city = data.city || data.principalSubdivision || 'Mumbai';
//             setUserLocation(suburb ? `${suburb}, ${city}` : city);
//           } else {
//             setUserLocation('Mumbai, Maharashtra');
//           }
//         } catch {
//           setUserLocation('Mumbai, Maharashtra');
//         }
//         setIsLoadingLocation(false);
//       },
//       () => { setUserLocation('Mumbai, Maharashtra'); setIsLoadingLocation(false); },
//       { timeout: 15000, maximumAge: 600000 }
//     );
//   }, []);

//   const handleProviderButtonClick = () => {
//     if (isProvider) {
//       router.push('/provider');
//     } else {
//       if (!currentUser) { router.push('/login'); return; }
//       setShowProviderModal(true);
//     }
//   };

//   const handleProviderRegistrationSuccess = () => {
//     setIsProvider(true);
//     setShowProviderModal(false);
//     router.push('/provider');
//   };

//   // Coupon color logic
//   const couponGradient = (coupon: Coupon) => {
//     if (coupon.applicableFor === 'new_users') return 'from-[#1a1118] to-[#3d1828]';
//     if (coupon.applicableFor === 'returning') return 'from-[#2d1a24] to-[#4a1f38]';
//     return 'from-[#1a1118] to-[#2d1a24]';
//   };

//   return (
//     <>
//       {/* Google Fonts */}
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
//         .font-playfair { font-family: 'Playfair Display', serif; }
//         .font-dm { font-family: 'DM Sans', sans-serif; }
//       `}</style>

//       {showProviderModal && currentUser && (
//         <ProviderRegistrationModal
//           user={currentUser}
//           onClose={() => setShowProviderModal(false)}
//           onSuccess={handleProviderRegistrationSuccess}
//         />
//       )}

//       {/* ── NAV ── */}
//       <header className="fixed inset-x-0 top-0 z-50 bg-[#faf7f8]/90 backdrop-blur-md border-b border-[#f0e8eb]">
//         <div className="flex items-center justify-between px-6 lg:px-10 h-16 max-w-screen-xl mx-auto">

//           {/* Logo */}
//           <div className="font-playfair text-[1.3rem] font-semibold text-[#1a1118]">
//             aura<span className="text-[#e5849c]">.</span>
//           </div>

//           {/* Desktop nav links */}
//           <nav className="hidden md:flex gap-8 text-[0.75rem] tracking-[0.1em] uppercase text-[#7a6a72] font-medium">
//             {['Services', 'Packages', 'Providers', 'About'].map((l) => (
//               <span key={l} className="cursor-pointer hover:text-[#e5849c] transition-colors">{l}</span>
//             ))}
//           </nav>

//           {/* Actions */}
//           <div className="flex items-center gap-3">
//             <div className="hidden sm:flex items-center gap-1.5 text-sm text-[#7a6a72]">
//               <MapPin size={14} className="text-[#e5849c]" />
//               <span className="text-[#1a1118] font-medium text-[0.8rem]">
//                 {isLoadingLocation ? 'Detecting…' : userLocation}
//               </span>
//             </div>

//             {!providerStatusLoading && (
//               <button
//                 onClick={handleProviderButtonClick}
//                 className={`text-white text-[0.73rem] font-medium tracking-[0.06em] uppercase px-5 h-9 rounded-full transition-all ${
//                   isProvider
//                     ? 'bg-[#1a1118] hover:bg-[#c96480]'
//                     : 'bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90'
//                 }`}
//               >
//                 {isProvider ? 'Provider Dashboard' : 'Become a Provider'}
//               </button>
//             )}

//             <button
//               aria-label="Notifications"
//               className="w-9 h-9 rounded-full border border-[#f0e8eb] flex items-center justify-center hover:border-[#e5849c] transition-colors"
//             >
//               <Bell size={15} className="text-[#7a6a72]" />
//             </button>
//           </div>
//         </div>
//       </header>

//       <main className="pt-16 bg-[#faf7f8] font-dm">

//         {/* ── HERO ── */}
//         <section className="grid lg:grid-cols-2 min-h-[calc(100vh-64px)]">

//           {/* Left */}
//           <div className="flex flex-col justify-center px-6 lg:px-14 py-16 lg:py-24">
//             <div className="flex items-center gap-2.5 mb-6">
//               <div className="w-7 h-px bg-[#e5849c]" />
//               <span className="text-[0.68rem] tracking-[0.2em] uppercase text-[#e5849c] font-medium">
//                 Mumbai's Premier Beauty Network
//               </span>
//             </div>

//             <h1 className="font-playfair text-[clamp(2.8rem,5vw,4.5rem)] leading-[1.08] font-normal text-[#1a1118] mb-6">
//               Beauty,{' '}
//               <em className="text-[#c96480]">refined</em>
//               <br />
//               for your<br />
//               everyday ritual.
//             </h1>

//             <p className="text-[#7a6a72] font-light leading-relaxed max-w-sm mb-8 text-[0.95rem]">
//               Discover vetted beauty professionals who come to you — or meet them at their salon. Haircuts, skincare, massage, and more.
//             </p>

//             {/* Search bar */}
//             <div className="flex bg-white rounded-xl border border-[#f0e8eb] overflow-hidden shadow-sm max-w-[440px]">
//               <div className="relative flex-1">
//                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0a0a8]" />
//                 <input
//                   placeholder="Haircut, HydraFacial, Massage…"
//                   className="w-full border-none outline-none bg-transparent pl-10 pr-4 py-4 text-[0.88rem] font-dm text-[#1a1118] placeholder:text-[#b0a0a8]"
//                 />
//               </div>
//               <button className="bg-[#1a1118] hover:bg-[#c96480] text-white px-6 text-[0.78rem] font-medium tracking-[0.05em] transition-colors">
//                 Search
//               </button>
//             </div>

//             {/* Stats */}
//             <div className="flex gap-8 mt-10">
//               {[
//                 { val: '4,200+', lbl: 'Verified Providers' },
//                 { val: '98k', lbl: 'Happy Clients' },
//                 { val: '4.9', lbl: 'Average Rating' },
//               ].map((s) => (
//                 <div key={s.lbl}>
//                   <div className="font-playfair text-[1.8rem] font-semibold text-[#1a1118]">{s.val}</div>
//                   <div className="text-[0.72rem] text-[#7a6a72] mt-0.5">{s.lbl}</div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Right — image collage */}
//           <div className="hidden lg:block bg-[#1a1118] relative overflow-hidden">
//             <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[3px]">
//               {/* Top row: single wide image */}
//               <div className="col-span-2 relative overflow-hidden" style={{ height: '55%' }}>
//                 <img
//                   src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80"
//                   alt="Salon"
//                   className="w-full h-full object-cover brightness-[0.85] saturate-[0.9] hover:brightness-100 transition-all duration-500"
//                 />
//                 <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
//                   <div className="w-2 h-2 rounded-full bg-[#e5849c] animate-pulse" />
//                   <span className="text-[0.72rem] font-medium text-[#1a1118]">247 available today</span>
//                 </div>
//               </div>
//               {/* Bottom left */}
//               <div className="relative overflow-hidden" style={{ height: '45%' }}>
//                 <img
//                   src="https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=600&q=80"
//                   alt="Facial"
//                   className="w-full h-full object-cover brightness-[0.8] saturate-[0.85] hover:brightness-95 transition-all duration-500"
//                 />
//                 <div className="absolute top-3 right-3 bg-[#e5849c] text-white text-[0.65rem] font-medium tracking-[0.1em] uppercase px-2.5 py-1 rounded">
//                   Trending
//                 </div>
//               </div>
//               {/* Bottom right */}
//               <div className="relative overflow-hidden" style={{ height: '45%' }}>
//                 <img
//                   src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80"
//                   alt="Nails"
//                   className="w-full h-full object-cover brightness-[0.8] saturate-[0.85] hover:brightness-95 transition-all duration-500"
//                 />
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* ── COUPON STRIP ── */}
//         {(couponsLoading || coupons.length > 0) && (
//           <div className="bg-[#1a1118] px-6 lg:px-10 py-4">
//             {couponsLoading ? (
//               <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
//             ) : (
//               <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
//                 {coupons.map((coupon) => {
//                   const isCopied = copiedCode === coupon.code;
//                   const discountLabel =
//                     coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`;

//                   return (
//                     <div
//                       key={coupon.id}
//                       className={`flex-shrink-0 flex items-center gap-4 bg-gradient-to-r ${couponGradient(coupon)} border border-[#e5849c]/20 rounded-xl px-5 py-3`}
//                     >
//                       <div>
//                         <div className="flex items-center gap-2 mb-0.5">
//                           <span className="font-playfair text-[1rem] font-semibold text-[#E5AFBC] tracking-wide">
//                             {coupon.code}
//                           </span>
//                           <span className="text-[0.65rem] font-medium bg-[#e5849c] text-white px-2 py-0.5 rounded">
//                             {discountLabel}
//                           </span>
//                         </div>
//                         <p className="text-[0.72rem] text-white/50">
//                           {coupon.description} · Min ₹{coupon.minOrder}
//                           {coupon.maxDiscount ? ` · Max ₹${coupon.maxDiscount}` : ''} · Till {coupon.validTo}
//                         </p>
//                       </div>
//                       <button
//                         onClick={() => handleCopyCode(coupon.code)}
//                         className="flex-shrink-0 flex items-center gap-1.5 bg-white/10 hover:bg-[#e5849c]/30 border border-white/15 text-white/70 hover:text-white text-[0.72rem] font-medium px-3.5 py-2 rounded-lg transition-all"
//                       >
//                         {isCopied ? (
//                           <><CheckCheck size={12} /> Copied!</>
//                         ) : (
//                           <><Copy size={12} /> Copy</>
//                         )}
//                       </button>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── CATEGORIES ── */}
//         <section className="px-6 lg:px-10 pt-14 pb-6 max-w-screen-xl mx-auto">
//           <div className="flex items-end justify-between mb-7">
//             <div>
//               <p className="text-[0.68rem] tracking-[0.18em] uppercase text-[#e5849c] font-medium mb-1.5">Browse</p>
//               <h2 className="font-playfair text-[1.9rem] font-normal text-[#1a1118]">
//                 What are you looking for?
//               </h2>
//             </div>
//           </div>
//           <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
//             {categories.map((cat) => {
//               const Icon = cat.icon;
//               const isActive = activeCategory === cat.name;
//               return (
//                 <button
//                   key={cat.name}
//                   onClick={() => {
//                     setActiveCategory(cat.name);
//                     router.push(`/client/services?category=${cat.name}`);
//                   }}
//                   className={`flex-shrink-0 flex flex-col items-center gap-2.5 px-6 py-4 rounded-2xl border transition-all ${
//                     isActive
//                       ? 'bg-[#fdf0f3] border-[#e5849c] text-[#c96480]'
//                       : 'bg-white border-[#f0e8eb] text-[#7a6a72] hover:border-[#e5849c]/40 hover:text-[#e5849c]'
//                   }`}
//                 >
//                   <div
//                     className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
//                       isActive ? 'bg-[#e5849c]/15' : 'bg-[#faf7f8]'
//                     }`}
//                   >
//                     <Icon size={17} strokeWidth={1.5} />
//                   </div>
//                   <span className="text-[0.72rem] font-medium whitespace-nowrap">{cat.name}</span>
//                 </button>
//               );
//             })}
//           </div>
//         </section>

//         {/* ── PACKAGES BENTO GRID ── */}
//         <section className="px-6 lg:px-10 py-6 max-w-screen-xl mx-auto">
//           <div className="flex items-end justify-between mb-7">
//             <div>
//               <p className="text-[0.68rem] tracking-[0.18em] uppercase text-[#e5849c] font-medium mb-1.5">Curated Collections</p>
//               <h2 className="font-playfair text-[1.9rem] font-normal text-[#1a1118]">Special Packages</h2>
//             </div>
//             <button className="flex items-center gap-1.5 text-[0.75rem] tracking-[0.06em] uppercase text-[#7a6a72] hover:text-[#e5849c] transition-colors border-b border-transparent hover:border-[#e5849c] pb-0.5">
//               View all <ArrowRight size={12} />
//             </button>
//           </div>

//           {/* Bento layout */}
//           <div
//             className="grid gap-3"
//             style={{
//               gridTemplateColumns: 'repeat(3, 1fr)',
//               gridTemplateRows: '340px 220px',
//             }}
//           >
//             {packages.map((pkg, i) => (
//               <div
//                 key={pkg.name}
//                 className="relative rounded-2xl overflow-hidden bg-[#1a1118] cursor-pointer group"
//                 style={{
//                   gridRow: i === 0 ? '1 / 3' : undefined,
//                   gridColumn: i === 3 ? '2 / 4' : undefined,
//                 }}
//               >
//                 <img
//                   src={pkg.image}
//                   alt={pkg.name}
//                   className="absolute inset-0 w-full h-full object-cover brightness-[0.65] saturate-[0.85] group-hover:brightness-[0.5] group-hover:scale-105 transition-all duration-500"
//                 />
//                 {/* Hover Book button */}
//                 <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[#1a1118] text-[0.72rem] font-medium px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
//                   Book Now
//                 </button>
//                 {/* Content */}
//                 <div
//                   className="absolute bottom-0 left-0 right-0 p-5"
//                   style={{ background: 'linear-gradient(0deg, rgba(26,17,24,0.92) 0%, transparent 100%)' }}
//                 >
//                   <p className="text-[0.63rem] tracking-[0.14em] uppercase text-[#E5AFBC] mb-1.5">
//                     {pkg.label} · {pkg.time}
//                   </p>
//                   <h3 className="font-playfair text-white text-[1.1rem] leading-snug">{pkg.name}</h3>
//                   {i === 0 && (
//                     <p className="text-white/55 text-[0.75rem] mt-1">{pkg.desc}</p>
//                   )}
//                   <p className="font-playfair text-[#E5AFBC] text-[1.2rem] mt-2">{pkg.price}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* ── EDITORIAL PROMO BAND ── */}
//         <div className="mx-6 lg:mx-10 my-10 rounded-3xl overflow-hidden max-w-screen-xl xl:mx-auto" style={{ background: 'linear-gradient(130deg, #1a1118 0%, #3d1828 60%, #5c2038 100%)' }}>
//           <div className="grid lg:grid-cols-2 min-h-[260px]">
//             <div className="flex flex-col justify-center p-10 lg:p-14">
//               <p className="text-[0.68rem] tracking-[0.2em] uppercase text-[#E5AFBC] mb-3">
//                 Limited time · April offer
//               </p>
//               <h2 className="font-playfair text-[2.1rem] text-white leading-[1.15] mb-3">
//                 Your first service,<br />
//                 <em className="text-[#E5AFBC]">on us.</em>
//               </h2>
//               <p className="text-white/50 text-[0.88rem] font-light leading-relaxed mb-6 max-w-xs">
//                 New to Aura? Get 20% off your first booking with verified providers across Mumbai. No strings attached.
//               </p>
//               <button className="self-start flex items-center gap-2 bg-[#e5849c] hover:bg-[#c96480] text-white px-7 py-3 rounded-full text-[0.82rem] font-medium transition-colors">
//                 Claim Offer <ArrowRight size={14} />
//               </button>
//             </div>
//             <div className="hidden lg:grid grid-cols-2 gap-[3px]">
//               {[
//                 'https://images.unsplash.com/photo-1519015865-28c0b0083c2a?w=400&q=80',
//                 'https://images.unsplash.com/photo-1560066984-138daaa651ad?w=400&q=80',
//                 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&q=80',
//                 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
//               ].map((src, i) => (
//                 <div key={i} className="overflow-hidden">
//                   <img
//                     src={src}
//                     alt=""
//                     className="w-full h-full object-cover saturate-[0.7] brightness-[0.75]"
//                   />
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* ── POPULAR SERVICES ── */}
//         <section className="px-6 lg:px-10 py-8 max-w-screen-xl mx-auto">
//           <div className="flex items-end justify-between mb-7">
//             <div>
//               <p className="text-[0.68rem] tracking-[0.18em] uppercase text-[#e5849c] font-medium mb-1.5">Most Booked</p>
//               <h2 className="font-playfair text-[1.9rem] font-normal text-[#1a1118]">Popular Services</h2>
//             </div>
//             <button className="flex items-center gap-1.5 text-[0.75rem] tracking-[0.06em] uppercase text-[#7a6a72] hover:text-[#e5849c] transition-colors border-b border-transparent hover:border-[#e5849c] pb-0.5">
//               View all <ArrowRight size={12} />
//             </button>
//           </div>

//           <div className="divide-y divide-[#f0e8eb]">
//             {popularServices.map((service, i) => (
//               <div
//                 key={service.name}
//                 className="flex items-center gap-5 py-5 group cursor-pointer hover:pl-2 transition-all duration-200"
//               >
//                 <img
//                   src={service.image}
//                   alt={service.name}
//                   className="w-[72px] h-[72px] rounded-2xl object-cover flex-shrink-0"
//                 />
//                 <div className="flex-1 min-w-0">
//                   <h3 className="font-medium text-[#1a1118] text-[0.98rem] mb-1.5">{service.name}</h3>
//                   <div className="flex items-center gap-4 text-[0.78rem] text-[#7a6a72]">
//                     <span className="flex items-center gap-1"><Clock size={13} strokeWidth={1.5} />{service.duration}</span>
//                     <span className="flex items-center gap-1">
//                       <Star size={13} strokeWidth={0} fill="#d4a017" className="text-[#d4a017]" />
//                       {service.rating}
//                     </span>
//                     <span className="hidden sm:inline">{service.reviews} reviews</span>
//                   </div>
//                 </div>
//                 <div className="text-right flex-shrink-0">
//                   <div className="font-playfair text-[1.15rem] text-[#c96480]">{service.discountedPrice}</div>
//                   <div className="text-[0.75rem] text-[#b0a0a8] line-through">{service.originalPrice}</div>
//                   <div className="text-[0.62rem] tracking-wide bg-[#fdf0f3] text-[#c96480] px-2 py-0.5 rounded mt-0.5 font-medium">
//                     {service.discount}
//                   </div>
//                 </div>
//                 <button className="flex-shrink-0 bg-[#1a1118] group-hover:bg-[#c96480] text-white text-[0.78rem] font-medium px-5 py-2.5 rounded-xl transition-colors">
//                   Book
//                 </button>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* Bottom spacing for mobile nav */}
//         <div className="h-16 lg:hidden" />
//       </main>

//       {/* ── FOOTER ── */}
//       <footer className="bg-[#1a1118] px-6 lg:px-10 py-6 flex items-center justify-between">
//         <div className="font-playfair text-[1.15rem] text-white">
//           aura<span className="text-[#e5849c]">.</span>
//         </div>
//         <div className="flex gap-6">
//           {['Privacy', 'Terms', 'Careers', 'Help'].map((l) => (
//             <span key={l} className="text-[0.72rem] tracking-[0.06em] uppercase text-white/35 cursor-pointer hover:text-[#E5AFBC] transition-colors">
//               {l}
//             </span>
//           ))}
//         </div>
//       </footer>
//     </>
//   );
// }