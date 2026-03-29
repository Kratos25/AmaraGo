"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Tag, Clock, Star, MapPin, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Package {
  name: string;
  desc: string;
  time: string;
  price: string;
  image: string;
}

interface PopularService {
  name: string;
  duration: string;
  rating: number;
  originalPrice: string;
  discountedPrice: string;
  discount: string;
  image: string;
}

const categories = [
  { name: 'Hair Care', icon: '✂️' },
  { name: 'Skin Care', icon: '🧴' },
  { name: 'Makeup', icon: '💄' },
  { name: 'Nail Art', icon: '💅' },
  { name: 'Spa & Massage', icon: '🧖‍♀️' },
  { name: 'Waxing', icon: '🪒' },
];

const packages: Package[] = [
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

const popularServices: PopularService[] = [
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

export default function Home() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<string>('Mumbai, Maharashtra');
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);

  const fetchLocation = async () => {
    setIsLoadingLocation(true);
    setUserLocation('Detecting...');

    if (!navigator.geolocation) {
      setUserLocation('Mumbai, Maharashtra');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const suburb = data.locality || data.localityInfo?.administrative?.[2]?.name || '';
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
      () => {
        setUserLocation('Mumbai, Maharashtra');
        setIsLoadingLocation(false);
      },
      { timeout: 15000, maximumAge: 600000 }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-white/70 backdrop-blur-md shadow-lg border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="text-[#e5849c]" size={22} />
            <div>
              <p className="text-xs text-gray-600 leading-none">Delivering to</p>
              <p className="font-bold text-gray-800 text-sm">
                {isLoadingLocation ? 'Detecting...' : userLocation}
              </p>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/provider')}
              className="bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white text-xs font-semibold px-4 h-9 rounded-full shadow-sm"
            >
              Become a Provider
            </Button>
            <button aria-label="Notifications" className="p-1">
              <Bell className="text-[#e5849c]" size={26} />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-14">
        {/* Hero */}
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

        {/* Coupon Banner */}
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
              <Button variant="outline" className="bg-white text-gray-800 hover:bg-gray-100 border-none font-medium px-6">
                Apply Code
              </Button>
            </div>
          </div>
        </div>

        {/* Categories */}
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

        {/* Special Packages */}
        <section className="px-4 mt-12">
          <h3 className="text-lg font-semibold mb-5 text-gray-800">Special Packages</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <img
                  src={pkg.image}
                  alt={pkg.name}
                  className="w-full h-60 object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="p-6">
                  <h4 className="font-bold text-xl mb-3 text-gray-900">{pkg.name}</h4>
                  <p className="text-gray-600 text-sm mb-5 leading-relaxed">{pkg.desc}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{pkg.time}</div>
                      <div className="text-2xl font-bold text-[#e5849c]">{pkg.price}</div>
                    </div>
                    <Button className="bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white px-7 py-6 font-medium">
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Services */}
        <section className="px-4 mt-12">
          <h3 className="text-lg font-semibold mb-5 text-gray-800">Popular Services</h3>
          <div className="space-y-6">
            {popularServices.map((service) => (
              <div
                key={service.name}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-6 p-4 sm:p-6">
                  <div className="rounded-2xl overflow-hidden flex-shrink-0">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-lg mb-2">{service.name}</h4>
                      <div className="flex items-center gap-5 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock size={16} /> {service.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={16} className="text-amber-500 fill-amber-500" /> {service.rating}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div className="text-2xl font-bold text-[#e5849c]">{service.discountedPrice}</div>
                      <div className="text-sm text-gray-500 line-through">{service.originalPrice}</div>
                    </div>
                  </div>
                  <div className="sm:self-end">
                    <Button className="bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white px-8 py-6 w-full sm:w-auto">
                      Book
                    </Button>
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