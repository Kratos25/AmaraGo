"use client";

import React, { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Clock, Heart, Share2, Tag, Sparkles, ShoppingCart, Check } from 'lucide-react';
import { servicesAPI, type Service } from '@/lib/api';
import { useCart } from '@/config/context/CartContext';
import { useToast } from '@/hooks/use-toast';

export default function ServiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { addItem } = useCart();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    servicesAPI.getById(id)
      .then(({ data }) => setService(data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  const discountedPrice = service?.discounted_price ?? service?.base_price ?? 0;
  const discount = service?.discounted_price && service?.base_price
    ? Math.round(((service.base_price - service.discounted_price) / service.base_price) * 100)
    : 0;

  // category_id is all we have from the API — display it as-is or look up name
  const categoryDisplay = service?.category_id ?? '';

  const handleAddToCart = async () => {
    if (!service) return;
    await addItem({
      service_id: service.id,
      name: service.name,
      price: discountedPrice,
      duration: service.duration,
      quantity: 1,
    });
    setAdded(true);
    toast({ title: `${service.name} added to cart 🛍️` });
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-[#e5849c] animate-spin" />
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* ── Dark hero header ── */}
      <div className="bg-[#111827] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        {/* Nav row */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Heart size={17} className={`transition-colors ${isFavorite ? 'fill-[#e5849c] text-[#e5849c]' : 'text-white'}`} />
            </button>
            <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Share2 size={17} className="text-white" />
            </button>
          </div>
        </div>

        {/* Service info */}
        <div className="relative z-10 px-4 pb-8 pt-2 max-w-2xl mx-auto">
          {discount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-[#e5849c] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              <Tag size={10} /> {discount}% OFF
            </span>
          )}
          <h1 className="text-2xl font-extrabold text-white leading-tight mb-3">{service.name}</h1>
          <div className="flex items-center flex-wrap gap-3">
            {service.rating > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-white text-xs font-semibold">{service.rating.toFixed(1)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Clock size={12} className="text-white/70" />
              <span className="text-white text-xs">{service.duration}</span>
            </div>
            {categoryDisplay && (
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <Sparkles size={12} className="text-[#e5849c]" />
                <span className="text-white/80 text-xs">{categoryDisplay}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Price card floating over hero ── */}
      <div className="px-4 max-w-2xl mx-auto -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">Starting price</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-extrabold text-[#111827]">₹{discountedPrice.toLocaleString('en-IN')}</span>
              {discount > 0 && (
                <span className="text-sm text-gray-400 line-through mb-0.5">₹{service.base_price.toLocaleString('en-IN')}</span>
              )}
            </div>
          </div>
          {discount > 0 && (
            <div className="bg-green-50 text-green-700 text-xs font-bold px-3 py-2 rounded-xl">
              Save ₹{(service.base_price - discountedPrice).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>

      {/* ── About ── */}
      {service.description && (
        <div className="px-4 max-w-2xl mx-auto mt-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="text-sm font-bold text-[#111827] mb-3">About this service</h2>
            <p className="text-gray-500 leading-relaxed text-sm">{service.description}</p>
          </div>
        </div>
      )}

      {/* ── Highlights ── */}
      <div className="px-4 max-w-2xl mx-auto mt-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="text-sm font-bold text-[#111827] mb-4">What's included</h2>
          <div className="space-y-3">
            {[
              { icon: '✔️', text: 'Trained & verified professional' },
              { icon: '✔️', text: 'All tools & products included' },
              { icon: '✔️', text: 'Hygienic & safe practice' },
              { icon: '✔️', text: `${service.duration} session` },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-gray-600">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky bottom CTA ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 px-4 py-4 mb-16 md:mb-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-2 h-14 px-6 rounded-xl border-2 font-bold text-sm transition-all flex-shrink-0 ${
              added
                ? 'border-green-400 bg-green-50 text-green-600'
                : 'border-[#e5849c]/40 text-[#e5849c] hover:bg-[#fdf0f3]'
            }`}
          >
            {added ? <Check size={18} /> : <ShoppingCart size={18} />}
            {added ? 'Added!' : 'Add to Cart'}
          </button>

          {/* Book Now — goes to single-service checkout */}
          <button
            onClick={() => router.push(`/client/bookings/new?serviceId=${service.id}`)}
            className="flex-1 h-14 rounded-xl bg-[#111827] hover:bg-[#1f2937] text-white font-bold text-base flex items-center justify-center gap-2 transition-colors"
          >
            Book Now · ₹{discountedPrice.toLocaleString('en-IN')}
          </button>
        </div>
      </div>
    </div>
  );
}