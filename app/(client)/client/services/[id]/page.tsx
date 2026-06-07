"use client";

import React, { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Clock, Heart, Share2, Tag, Sparkles, ShoppingCart, Check, Users } from 'lucide-react';
import { servicesAPI, type Service } from '@/lib/api';
import { useCart } from '@/config/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/config/context/WishlistContext';
import { CategoriesSection } from '../../home/_sections/CategoriesSection';
import { SiteFooter } from '../../home/_sections/SiteFooter';

export default function ServiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { addItem } = useCart();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();

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

  const categoryDisplay = service?.category_id ?? '';

  // Use service image if available, otherwise fall back to a placeholder
  const serviceImage = service?.image_url ?? '/placeholder-service.jpg';

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
      <div className="min-h-screen bg-[#f5f0ee] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-[#e5849c] animate-spin" />
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="min-h-screen bg-[#f5f0ee] pb-32 md:pb-8 pt-4 md:pt-12 px-4 md:px-28">

      {/* ── Full-width hero banner with image overlay ── */}
      <div className="relative w-full h-36 md:h-36 overflow-hidden rounded-[10px]">
        <img
          src={serviceImage}
          alt={service.name}
          className="w-full h-full object-cover"
        />
        {/* dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/70" />

        {/* Nav row */}
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 pt-4 max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => toggleWishlist(id)}
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Heart size={17} className={`transition-colors ${isWishlisted(id) ? 'fill-[#e5849c] text-[#e5849c]' : 'text-white'}`} />
            </button>
            <button className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
              <Share2 size={17} className="text-white" />
            </button>
          </div>
        </div>

        {/* Title centered in banner */}
        <div className="absolute inset-0 flex items-center justify-center px-16">
          <h1 className="text-xl md:text-3xl font-medium text-white text-center drop-shadow-lg leading-tight">
            {service.name}
          </h1>
        </div>
      </div>

      {/* ── Main content: two-column on md+, stacked on mobile ── */}
      <div className="max-w-5xl mx-auto mt-4 md:mt-6 flex flex-col md:flex-row gap-6 md:gap-x-20">

        {/* ── LEFT: Info card ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#FFF8FA] rounded-[10px] shadow-sm border border-[#E8708E]/30 p-6 flex flex-col gap-4">

            {/* Category badge */}
            {categoryDisplay && (
              <span className="inline-flex items-center gap-1.5 bg-[#FDE2E9] text-[#7F5660] text-xs font-semibold px-3 py-1.5 rounded-full w-fit border border-pink-100">
                <Sparkles size={11} />
                {categoryDisplay}
              </span>
            )}

            {/* Name + description */}
            <div>
              <h2 className="text-2xl font-medium text-[#111827] mb-2">{service.name}</h2>
              {service.description && (
                <p className="text-[#805660] text-sm leading-relaxed">{service.description}</p>
              )}
            </div>

            {/* What's included */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">What's included</p>
              <div className="space-y-2.5">
                {[
                  { text: 'Trained & verified professional' },
                  { text: 'All tools & products included' },
                  { text: 'Hygienic & safe practice' },
                  { text: `${service.duration} session` },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-[#e5849c]" strokeWidth={3} />
                    </span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price row */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 pt-1">
              <span className="text-xl md:text-2xl font-medium text-[#111827]">
                ₹{discountedPrice.toLocaleString('en-IN')}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-base md:text-lg text-gray-400 line-through">
                    ₹{service.base_price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-base md:text-2xl font-normal text-[#16A34A]">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            {/* CTA buttons — hidden on mobile (sticky bar below handles it) */}
            <div className="hidden md:flex gap-3">
              <button
                onClick={handleAddToCart}
                className={`flex items-center justify-center gap-2 h-12 px-5 rounded-xl border-2 font-bold text-sm transition-all flex-shrink-0 ${
                  added
                    ? 'border-green-400 bg-green-50 text-green-600'
                    : 'border-[#e5849c]/50 text-[#e5849c] hover:bg-pink-50'
                }`}
              >
                {added ? <Check size={16} /> : <ShoppingCart size={16} />}
                {added ? 'Added!' : 'Add to cart'}
              </button>

              <button
                onClick={() => router.push(`/client/bookings/new?serviceId=${service.id}`)}
                className="flex-1 h-12 rounded-xl bg-[#e5849c] hover:bg-[#d9708a] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-pink-200"
              >
                Book now
              </button>
            </div>

            {/* Social proof row */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 pt-1 border-t border-gray-50">
              {service.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-[#111827]">{service.rating.toFixed(1)}</span>
                </div>
              )}
              <span className="text-gray-300 text-xs">•</span>
              {/* Avatar stack placeholder */}
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-200 to-pink-400 border-2 border-white flex items-center justify-center"
                    style={{ zIndex: 4 - i }}
                  >
                    <Users size={10} className="text-white" />
                  </div>
                ))}
              </div>
              <span className="text-xs md:text-sm text-[#7F5660]">10,000+ bookings in Mumbai</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Service image panel ── */}
        <div className="hidden md:block md:w-80 lg:w-96 flex-shrink-0">
          <div className="relative flex rounded-2xl overflow-hidden items-center justify-center h-64 md:h-full min-h-64">
            <img
              src={serviceImage}
              alt={service.name}
              className="w-full h-[70%] object-cover rounded-2xl"
            />
            {/* Overlay */}
            <div className="flex absolute top-18 inset-0 h-[71%] justify-center items-center bg-gradient-to-l from-white/90 via-transparent to-white/70 rounded-2xl pointer-events-none" />
          </div>
        </div>

      </div>

      {/* ── Mobile sticky bottom CTA ── */}
      <div className="fixed bottom-16 inset-x-0 z-40 bg-white border-t border-gray-100 px-4 py-3 md:hidden">
        <div className="max-w-2xl mx-auto flex gap-3">
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

          <button
            onClick={() => router.push(`/client/bookings/new?serviceId=${service.id}`)}
            className="flex-1 h-14 rounded-xl bg-[#e5849c] hover:bg-[#d9708a] text-white font-bold text-base flex items-center justify-center gap-2 transition-colors"
          >
            Book Now · ₹{discountedPrice.toLocaleString('en-IN')}
          </button>
        </div>
      </div>
    </div>
  );
}