"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Tag, Clock, Star, MapPin, Bell, X, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

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

        <div className="px-4 -mt-8 relative z-10">
          <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-[#eec11d] to-[#ffac37] text-white shadow-2xl">
            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Tag size={22} />
                  <span className="font-bold text-xl">Welcome20</span>
                </div>
                <p className="text-white/90">Get 20% OFF on your first booking</p>
              </div>
              <Button variant="outline" className="bg-white text-gray-800 hover:bg-gray-100 border-none font-medium px-6">Apply Code</Button>
            </div>
          </div>
        </div>

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