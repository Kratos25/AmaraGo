'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/config/context/WishlistContext';
import { servicesAPI } from '@/lib/api';
import { ServiceCard } from '@/components/client/ServiceCard';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration: number;
  rating: number;
  discountedPrice: number;
  originalPrice: number;
  imageUrl?: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, toggleWishlist, isWishlisted, loading } = useWishlist();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (wishlist.length === 0) { setServices([]); return; }

    setFetching(true);
    Promise.all(wishlist.map((id) => servicesAPI.getById(id).then(({ data }) => data).catch(() => null)))
      .then((results) => {
        const valid = results.filter(Boolean) as any[];
        setServices(valid.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category_id ?? '',
          duration: parseInt(String(s.duration)) || 0,
          rating: s.rating ?? 0,
          discountedPrice: s.discounted_price ?? s.base_price,
          originalPrice: s.base_price,
          imageUrl: s.image_url,
        })));
      })
      .finally(() => setFetching(false));
  }, [wishlist, loading]);

  const isEmpty = !loading && !fetching && services.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Heart size={18} className="fill-[#e5849c] text-[#e5849c]" />
            <h1 className="font-bold text-[#111827] text-lg">My Wishlist</h1>
            {wishlist.length > 0 && (
              <span className="ml-1 text-xs text-gray-400 font-medium">
                ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Loading skeleton */}
        {(loading || fetching) && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-36 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-[#FFF0F5] flex items-center justify-center mb-4">
              <Heart size={32} className="text-[#e5849c]" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-2">No saved services yet</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">
              Tap the heart on any service to save it here for later.
            </p>
            <button
              onClick={() => router.push('/client/services')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#E91E8C] text-white rounded-xl text-sm font-semibold hover:bg-[#C2185B] transition-colors"
            >
              <ShoppingBag size={16} />
              Browse Services
            </button>
          </div>
        )}

        {/* Services grid */}
        {!loading && !fetching && services.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isFav={isWishlisted(service.id)}
                onFavoriteToggle={(id: string) => toggleWishlist(id)}
                onClick={() => router.push(`/client/services/${service.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
