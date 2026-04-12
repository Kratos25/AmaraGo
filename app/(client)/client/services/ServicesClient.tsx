"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Clock, Star, X, Heart, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { categoriesAPI, servicesAPI } from '@/lib/api';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration: number;
  rating: number;
  discountedPrice: number;
  originalPrice: number;
}

interface Filters {
  minRating: number;
  minPrice: number;
  maxPrice: number;
  minDuration: number;
  maxDuration: number;
  sortBy: string;
}

const SERVICE_EMOJI: Record<string, string> = {
  hair: '💇', nail: '💅', massage: '🧖', spa: '🧖',
  facial: '✨', skin: '✨', makeup: '💄', wax: '🪒',
};

function getEmoji(name: string) {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(SERVICE_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '🌸';
}

const SORT_LABELS: Record<string, string> = {
  rating: 'Best Rated',
  'price-low': 'Price ↑',
  'price-high': 'Price ↓',
  duration: 'Shortest',
};

export default function Services() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');

  const [activeCategory, setActiveCategory] = useState<string>(categoryFromUrl || 'All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [categoryList, setCategoryList] = useState<{ name: string; icon: string }[]>([{ name: 'All', icon: '🌟' }]);
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    minRating: 0, minPrice: 0, maxPrice: 50000,
    minDuration: 0, maxDuration: 300, sortBy: 'rating',
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);

  useEffect(() => {
    Promise.all([categoriesAPI.list(), servicesAPI.list({ active: true })])
      .then(([catRes, svcRes]) => {
        const cats = catRes.data;
        setCategoryList([{ name: 'All', icon: '🌟' }, ...cats.map((c) => ({ name: c.name, icon: c.icon || '✨' }))]);
        const catMap: Record<string, string> = {};
        cats.forEach((c) => { catMap[c.id] = c.name; });
        setAllServices(svcRes.data.map((s) => ({
          id: s.id,
          name: s.name,
          category: catMap[s.category_id] ?? '',
          duration: parseInt(String(s.duration)) || 0,
          rating: s.rating ?? 0,
          discountedPrice: s.discounted_price ?? s.base_price,
          originalPrice: s.base_price,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (categoryFromUrl) setActiveCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  const resetFilters = () => {
    const d: Filters = { minRating: 0, minPrice: 0, maxPrice: 50000, minDuration: 0, maxDuration: 300, sortBy: 'rating' };
    setFilters(d);
    setAppliedFilters(d);
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setShowFilterPanel(false);
  };

  let filtered = allServices
    .filter((s) => activeCategory === 'All' || s.category === activeCategory)
    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((s) => s.rating >= appliedFilters.minRating)
    .filter((s) => s.discountedPrice >= appliedFilters.minPrice && s.discountedPrice <= appliedFilters.maxPrice)
    .filter((s) => s.duration >= appliedFilters.minDuration && s.duration <= appliedFilters.maxDuration);

  if (appliedFilters.sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  else if (appliedFilters.sortBy === 'price-low') filtered.sort((a, b) => a.discountedPrice - b.discountedPrice);
  else if (appliedFilters.sortBy === 'price-high') filtered.sort((a, b) => b.discountedPrice - a.discountedPrice);
  else if (appliedFilters.sortBy === 'duration') filtered.sort((a, b) => a.duration - b.duration);

  const hasActiveFilters = appliedFilters.minRating > 0 || appliedFilters.minPrice > 0
    || appliedFilters.maxPrice < 50000 || appliedFilters.minDuration > 0 || appliedFilters.maxDuration < 300;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky search + categories bar — top-0 mobile, top-16 desktop (below layout nav) */}
      <div className="sticky top-0 md:top-16 z-40 bg-[#111827] shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 space-y-3">

          {/* Search row */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={17} />
              <input
                type="search"
                placeholder="Search services…"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 text-white placeholder:text-white/40 text-sm outline-none focus:bg-white/15 transition-colors"
              />
            </div>

            <button
              onClick={() => setShowFilterPanel(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                hasActiveFilters ? 'bg-[#e5849c] text-white' : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filter</span>
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>

            <div className="relative hidden sm:block">
              <select
                value={appliedFilters.sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const f = { ...appliedFilters, sortBy: e.target.value };
                  setAppliedFilters(f);
                  setFilters(f);
                }}
                className="appearance-none bg-white/10 text-white text-sm font-medium pl-3 pr-8 py-2.5 rounded-xl outline-none cursor-pointer hover:bg-white/15 transition-colors"
              >
                {Object.entries(SORT_LABELS).map(([val, label]) => (
                  <option key={val} value={val} className="text-gray-900 bg-white">{label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categoryList.map((cat) => {
              const active = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    setActiveCategory(cat.name);
                    router.push(`/client/services?category=${cat.name}`, { scroll: false });
                  }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#e5849c] text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-28 md:pb-10">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-[#111827]">
              {activeCategory === 'All' ? 'All Services' : activeCategory}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {loading ? 'Loading…' : `${filtered.length} service${filtered.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs text-[#e5849c] font-semibold hover:underline flex items-center gap-1">
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((service) => {
              const discount = service.originalPrice > service.discountedPrice
                ? Math.round(((service.originalPrice - service.discountedPrice) / service.originalPrice) * 100)
                : 0;
              const isFav = favorites.includes(service.id);

              return (
                <div
                  key={service.id}
                  onClick={() => router.push(`/client/services/${service.id}`)}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#e5849c]/30 hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Card top band */}
                  <div className="relative h-36 bg-[#111827] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_60%_40%,#e5849c,transparent_65%)]" />
                    <span className="text-5xl">{getEmoji(service.name)}</span>

                    {discount > 0 && (
                      <span className="absolute top-3 left-3 bg-[#e5849c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {discount}% OFF
                      </span>
                    )}

                    <span className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/15 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                      <Clock size={10} /> {service.duration} min
                    </span>

                    <button
                      onClick={(e) => toggleFavorite(service.id, e)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <Heart size={13} className={isFav ? 'fill-[#e5849c] text-[#e5849c]' : 'text-white'} />
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <h3 className="font-semibold text-[#111827] text-sm leading-tight line-clamp-1 mb-0.5">{service.name}</h3>
                    <p className="text-[10px] text-gray-400 mb-2">{service.category}</p>

                    {service.rating > 0 && (
                      <div className="flex items-center gap-1 mb-3">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
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
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/client/services/${service.id}`); }}
                        className="bg-[#e5849c] hover:bg-[#d4738b] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mb-4">😕</div>
            <h3 className="text-base font-semibold text-gray-700">No services found</h3>
            <p className="text-sm text-gray-400 mt-1">Try a different category or adjust your filters</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="mt-4 text-sm text-[#e5849c] font-semibold hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Filter slide-up panel */}
      {showFilterPanel && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/50" onClick={() => setShowFilterPanel(false)}>
          <div
            className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-[#111827]">Filters &amp; Sort</h2>
                {hasActiveFilters && <p className="text-xs text-[#e5849c]">Filters applied</p>}
              </div>
              <button onClick={() => setShowFilterPanel(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-7">

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sort By</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SORT_LABELS).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setFilters({ ...filters, sortBy: val })}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        filters.sortBy === val ? 'bg-[#111827] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Minimum Rating</p>
                <div className="flex gap-2">
                  {[0, 4.0, 4.5, 4.8].map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilters({ ...filters, minRating: r })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                        filters.minRating === r ? 'bg-[#e5849c] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {r === 0 ? 'Any' : <><Star size={11} className="fill-current" />{r}+</>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Price Range (₹)</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 mb-1 block">Min</label>
                    <input type="number" value={filters.minPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e5849c]" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 mb-1 block">Max</label>
                    <input type="number" value={filters.maxPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e5849c]" />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Duration (minutes)</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 mb-1 block">Min</label>
                    <input type="number" step="15" value={filters.minDuration}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, minDuration: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e5849c]" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 mb-1 block">Max</label>
                    <input type="number" step="15" value={filters.maxDuration}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, maxDuration: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e5849c]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
              <button onClick={resetFilters}
                className="flex-1 py-3 rounded-xl border border-[#e5849c] text-[#e5849c] text-sm font-semibold hover:bg-[#e5849c]/5 transition-colors">
                Reset
              </button>
              <button onClick={applyFilters}
                className="flex-1 py-3 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
