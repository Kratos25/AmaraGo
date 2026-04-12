"use client";

import React, { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Clock, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { servicesAPI, type Service } from '@/lib/api';



export default function ServiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    servicesAPI.getById(id)
      .then(({ data }) => setService(data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-pink-100 border-t-[#e5849c] animate-spin" />
      </div>
    );
  }

  if (!service) return null;

  const discountedPrice = service.discounted_price ?? service.base_price;
  const discount = service.discounted_price
    ? Math.round(((service.base_price - service.discounted_price) / service.base_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 max-w-7xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-700">
            <ArrowLeft size={28} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex gap-5">
            <button onClick={() => setIsFavorite(!isFavorite)}>
              <Heart className={`size-6 transition-colors ${isFavorite ? 'fill-[#e5849c] text-[#e5849c]' : 'text-gray-600'}`} />
            </button>
            <button><Share2 className="size-6 text-gray-600" /></button>
          </div>
        </div>
      </header>

      {/* Hero — gradient placeholder (API has no image field) */}
      <div className="relative h-96 mt-16 bg-gradient-to-br from-[#e5849c] to-[#E5AFBC]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-8 left-6 text-white">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Star className="fill-current" size={28} />
            <span className="text-4xl font-bold">{service.rating.toFixed(1)}</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight">{service.name}</h1>
          <p className="text-white/90 mt-2 flex items-center gap-2 text-xl">
            <Clock size={22} /> {service.duration}
          </p>
        </div>
        <div className="absolute top-8 right-6 bg-white px-5 py-3 rounded-3xl shadow-xl text-right">
          <div className="text-4xl font-bold text-[#e5849c]">₹{discountedPrice.toLocaleString('en-IN')}</div>
          {discount > 0 && <div className="text-sm text-gray-500 line-through">₹{service.base_price.toLocaleString('en-IN')}</div>}
        </div>
      </div>

      <div className="px-4 max-w-7xl mx-auto -mt-8 relative z-10">
        {/* Sticky Book Button */}
        <div className="z-40 flex justify-end mb-8">
          <Button
            onClick={() => router.push(`/client/bookings/new?serviceId=${service.id}`)}
            className="bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white shadow-2xl px-10 py-7 text-lg rounded-3xl hover:scale-105 transition-all"
          >
            Book Now — ₹{discountedPrice.toLocaleString('en-IN')}
          </Button>
        </div>

        {/* About */}
        {service.description && (
          <div className="bg-white rounded-3xl p-7 shadow mb-6">
            <h2 className="text-2xl font-semibold mb-5">About this service</h2>
            <p className="text-gray-600 leading-relaxed text-[17px]">{service.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}