'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, X, Heart, SlidersHorizontal, ChevronDown, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { CartQtyButton } from '@/components/client/CartQtyButton';
import { useWishlist } from '@/config/context/WishlistContext';
import { getServiceIcon } from './serviceIcons';
import type { Filters, ServiceItem } from './types';

const SORT_LABELS: Record<string, string> = {
  rating: 'Best Rated',
  'price-low': 'Price ↑',
  'price-high': 'Price ↓',
  duration: 'Shortest',
};

interface Props {
  loading: boolean;
  activeCategory: string;
  filtered: ServiceItem[];
  appliedFilters: Filters;
  hasActiveFilters: boolean;
  showAll: boolean;
  onShowAll: () => void;
  onOpenFilter: () => void;
  onResetFilters: () => void;
  onSortChange: (val: string) => void;
}

export function ServicesGrid({
  loading, activeCategory, filtered, appliedFilters,
  hasActiveFilters, showAll, onShowAll, onOpenFilter, onResetFilters, onSortChange,
}: Props) {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const PAGE_SIZE = 8;
  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE);
  const remaining = filtered.length - PAGE_SIZE;

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(id);
  };

  return (
    <section className="bg-[#F7F2F6] py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
              {activeCategory === 'All' ? 'All Services' : activeCategory}
            </h2>
            {!loading && (
              <p className="text-xs text-gray-500 mt-0.5">{filtered.length} service{filtered.length !== 1 ? 's' : ''} available</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button onClick={onResetFilters} className="text-xs text-[#e5849c] font-semibold hover:underline flex items-center gap-1">
                <X size={12} /> Clear
              </button>
            )}
            <button
              onClick={onOpenFilter}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
                hasActiveFilters ? 'bg-[#e5849c] text-white border-[#e5849c]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#e5849c]/50'
              }`}
            >
              <SlidersHorizontal size={14} />
              Filter
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
            <div className="relative hidden sm:block">
              <select
                value={appliedFilters.sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium pl-3 pr-8 py-2 rounded-xl outline-none cursor-pointer hover:border-[#e5849c]/50 transition-colors"
              >
                {Object.entries(SORT_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-gray-200 rounded w-20" />
                    <div className="h-8 bg-gray-200 rounded-xl w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visible.map((service) => {
                const discount = service.originalPrice > service.discountedPrice
                  ? Math.round(((service.originalPrice - service.discountedPrice) / service.originalPrice) * 100)
                  : 0;
                const isFav = isWishlisted(service.id);
                const ServiceIcon = getServiceIcon(service.name);

                return (
                  <div
                    key={service.id}
                    onClick={() => router.push(`/client/services/${service.id}`)}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#e5849c]/30 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="relative h-36 flex items-center justify-center overflow-hidden">
                      {service.imageUrl ? (
                        <Image src={service.imageUrl} alt={service.name} fill className="object-cover" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-[#FFEAEF] to-[#f3e8f7]" />
                          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm">
                            <ServiceIcon size={28} className="text-[#e5849c]" strokeWidth={1.5} />
                          </div>
                        </>
                      )}
                      {discount > 0 && (
                        <span className="absolute top-3 left-3 bg-[#e5849c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {discount}% OFF
                        </span>
                      )}
                      <span className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/20 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                        <Clock size={10} /> {service.duration} min
                      </span>
                      <button
                        onClick={(e) => toggleFavorite(service.id, e)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/15 backdrop-blur-sm flex items-center justify-center hover:bg-black/25 transition-colors"
                      >
                        <Heart size={13} className={isFav ? 'text-[#e5849c]' : 'text-white'} />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-[#111827] text-sm leading-tight line-clamp-1 mb-0.5">{service.name}</h3>
                      <p className="text-[10px] text-gray-400 mb-2">{service.category}</p>
                      {service.rating > 0 && (
                        <div className="flex items-center gap-1 mb-3">
                          <Star size={11} className="text-amber-400" />
                          <span className="text-xs font-semibold text-gray-700">{service.rating}</span>
                        </div>
                      )}
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-lg font-extrabold text-[#111827]">₹{service.discountedPrice.toLocaleString('en-IN')}</p>
                          {discount > 0 && (
                            <p className="text-[10px] text-gray-400 line-through">₹{service.originalPrice.toLocaleString('en-IN')}</p>
                          )}
                        </div>
                        <CartQtyButton
                          serviceId={service.id}
                          name={service.name}
                          price={service.discountedPrice}
                          duration={`${service.duration} min`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!showAll && remaining > 0 && (
              <div className="mt-8 text-center">
                <button
                  onClick={onShowAll}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-[#E8708E] text-[#E8708E] font-semibold text-sm hover:bg-[#FFEAEF] transition-colors"
                >
                  View {remaining} more service{remaining !== 1 ? 's' : ''}
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-gray-700">No services found</h3>
            <p className="text-sm text-gray-400 mt-1">Try a different category or adjust your filters</p>
            {hasActiveFilters && (
              <button onClick={onResetFilters} className="mt-4 text-sm text-[#e5849c] font-semibold hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}