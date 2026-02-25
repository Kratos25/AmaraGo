"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, Star, Filter, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Service {
  id: number;
  name: string;
  category: string;
  duration: number;
  rating: number;
  discountedPrice: number;
  originalPrice: number;
  image: string;
}

interface Filters {
  minRating: number;
  minPrice: number;
  maxPrice: number;
  minDuration: number;
  maxDuration: number;
  sortBy: string;
}

const categoryList = [
  { name: 'All', icon: '🌟' },
  { name: 'Hair Care', icon: '✂️' },
  { name: 'Skin Care', icon: '🧴' },
  { name: 'Makeup', icon: '💄' },
  { name: 'Nail Art', icon: '💅' },
  { name: 'Spa & Massage', icon: '🧖‍♀️' },
  { name: 'Waxing', icon: '🪒' },
];

const allServices: Service[] = [
  { id: 1,  name: 'Classic Haircut + Blow Dry',      category: 'Hair Care',    duration: 60,  rating: 4.8, discountedPrice: 899,  originalPrice: 1200,  image: 'https://picsum.photos/id/1015/600/400' },
  { id: 2,  name: 'Luxury Hair Spa & Mask',           category: 'Hair Care',    duration: 90,  rating: 4.7, discountedPrice: 1499, originalPrice: 1999,  image: 'https://picsum.photos/id/1027/600/400' },
  { id: 3,  name: 'Keratin Smoothening Treatment',    category: 'Hair Care',    duration: 180, rating: 4.9, discountedPrice: 4999, originalPrice: 6500,  image: 'https://picsum.photos/id/133/600/400'  },
  { id: 4,  name: 'HydraFacial Signature',            category: 'Skin Care',    duration: 75,  rating: 4.9, discountedPrice: 3299, originalPrice: 4500,  image: 'https://picsum.photos/id/201/600/400'  },
  { id: 5,  name: 'Deep Cleansing Glow Facial',       category: 'Skin Care',    duration: 60,  rating: 4.6, discountedPrice: 1299, originalPrice: 1800,  image: 'https://picsum.photos/id/251/600/400'  },
  { id: 6,  name: 'Anti-Ageing Chemical Peel',        category: 'Skin Care',    duration: 45,  rating: 4.8, discountedPrice: 2499, originalPrice: 3200,  image: 'https://picsum.photos/id/274/600/400'  },
  { id: 7,  name: 'Party Makeup Look',                category: 'Makeup',       duration: 60,  rating: 4.7, discountedPrice: 2499, originalPrice: 3500,  image: 'https://picsum.photos/id/1005/600/400' },
  { id: 8,  name: 'Full Bridal Makeup + Trial',       category: 'Makeup',       duration: 150, rating: 4.9, discountedPrice: 8999, originalPrice: 12000, image: 'https://picsum.photos/id/1011/600/400' },
  { id: 9,  name: 'Airbrush HD Makeup',               category: 'Makeup',       duration: 90,  rating: 4.8, discountedPrice: 3999, originalPrice: 5000,  image: 'https://picsum.photos/id/102/600/400'  },
  { id: 10, name: 'Gel Nail Extension Full Set',      category: 'Nail Art',     duration: 120, rating: 4.7, discountedPrice: 2099, originalPrice: 2800,  image: 'https://picsum.photos/id/133/600/400'  },
  { id: 11, name: 'Luxury Manicure + Pedicure',       category: 'Nail Art',     duration: 90,  rating: 4.8, discountedPrice: 1599, originalPrice: 2200,  image: 'https://picsum.photos/id/160/600/400'  },
  { id: 12, name: '3D Nail Art Design',               category: 'Nail Art',     duration: 45,  rating: 4.6, discountedPrice: 799,  originalPrice: 1200,  image: 'https://picsum.photos/id/201/600/400'  },
  { id: 13, name: 'Swedish Full Body Massage',        category: 'Spa & Massage', duration: 90, rating: 4.6, discountedPrice: 2499, originalPrice: 3500,  image: 'https://picsum.photos/id/251/600/400'  },
  { id: 14, name: 'Aromatherapy Bliss Session',       category: 'Spa & Massage', duration: 120,rating: 4.9, discountedPrice: 3499, originalPrice: 4500,  image: 'https://picsum.photos/id/274/600/400'  },
  { id: 15, name: 'Hot Stone Therapy',                category: 'Spa & Massage', duration: 75, rating: 4.7, discountedPrice: 2899, originalPrice: 3800,  image: 'https://picsum.photos/id/1015/600/400' },
  { id: 16, name: 'Full Legs Waxing',                 category: 'Waxing',       duration: 60,  rating: 4.5, discountedPrice: 1299, originalPrice: 1700,  image: 'https://picsum.photos/id/1027/600/400' },
  { id: 17, name: 'Brazilian Wax',                    category: 'Waxing',       duration: 45,  rating: 4.8, discountedPrice: 899,  originalPrice: 1200,  image: 'https://picsum.photos/id/133/600/400'  },
  { id: 18, name: 'Full Body Waxing',                 category: 'Waxing',       duration: 180, rating: 4.4, discountedPrice: 3999, originalPrice: 5500,  image: 'https://picsum.photos/id/201/600/400'  },
];

export default function Services() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  const [filters, setFilters] = useState<Filters>({
    minRating: 0,
    minPrice: 0,
    maxPrice: 12000,
    minDuration: 0,
    maxDuration: 300,
    sortBy: 'rating',
  });

  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  const resetFilters = () => {
    const defaultFilters: Filters = {
      minRating: 0, minPrice: 0, maxPrice: 12000,
      minDuration: 0, maxDuration: 300, sortBy: 'rating',
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const handleApplyFilters = (f: Filters) => {
    setAppliedFilters(f);
    setShowFilterModal(false);
  };

  let filteredServices = allServices
    .filter((s) => activeCategory === 'All' || s.category === activeCategory)
    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((s) => s.rating >= appliedFilters.minRating)
    .filter((s) => s.discountedPrice >= appliedFilters.minPrice && s.discountedPrice <= appliedFilters.maxPrice)
    .filter((s) => s.duration >= appliedFilters.minDuration && s.duration <= appliedFilters.maxDuration);

  if (appliedFilters.sortBy === 'rating') filteredServices.sort((a, b) => b.rating - a.rating);
  else if (appliedFilters.sortBy === 'price-low') filteredServices.sort((a, b) => a.discountedPrice - b.discountedPrice);
  else if (appliedFilters.sortBy === 'price-high') filteredServices.sort((a, b) => b.discountedPrice - a.discountedPrice);
  else if (appliedFilters.sortBy === 'duration') filteredServices.sort((a, b) => a.duration - b.duration);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 py-6 rounded-2xl border-gray-200"
              />
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-[#e5849c] text-white rounded-2xl font-medium"
            >
              <Filter size={18} />
              Filters
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {categoryList.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap flex-shrink-0 snap-start transition-all duration-300 ${
                  activeCategory === cat.name
                    ? 'bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-[#e5849c]'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="pt-36 px-4 max-w-7xl mx-auto pb-10">
        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 font-medium">{filteredServices.length} services found</p>
          <div className="text-sm text-gray-500">
            {appliedFilters.sortBy === 'rating' ? 'Best Rated'
              : appliedFilters.sortBy === 'price-low' ? 'Price: Low to High'
              : appliedFilters.sortBy === 'price-high' ? 'Price: High to Low'
              : 'Shortest Duration'}
          </div>
        </div>

        {/* Services Grid */}
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((service) => {
              const discount = Math.round(((service.originalPrice - service.discountedPrice) / service.originalPrice) * 100);
              return (
                <div key={service.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group">
                  <div className="relative">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {discount > 0 && (
                      <div className="absolute top-4 right-4 bg-[#e5849c] text-white text-xs font-bold px-3 py-1 rounded-full">
                        {discount}% OFF
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                      <Clock size={14} /> {service.duration} min
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg leading-tight line-clamp-2">{service.name}</h3>
                      <button
                        onClick={() => toggleFavorite(service.id)}
                        className="transition-colors"
                      >
                        <Heart
                          size={20}
                          className={favorites.includes(service.id) ? 'fill-[#e5849c] text-[#e5849c]' : 'text-gray-300'}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Star size={18} className="text-amber-500 fill-amber-500" />
                        <span className="font-semibold">{service.rating}</span>
                      </div>
                      <div className="text-gray-400">•</div>
                      <div className="text-gray-600">{service.category}</div>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-bold text-[#e5849c]">₹{service.discountedPrice}</div>
                        <div className="text-sm text-gray-400 line-through">₹{service.originalPrice}</div>
                      </div>
                      <Button
                        onClick={() => router.push(`/client/services/${service.id}`)}
                        className="bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-110 text-white px-6 py-5 rounded-2xl font-medium shadow-md"
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">😕</div>
            <h3 className="text-2xl font-semibold text-gray-700">No services found</h3>
            <p className="text-gray-500 mt-2">Try changing filters or search term</p>
          </div>
        )}
      </main>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-end">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl shadow-2xl max-h-[85vh] overflow-auto">
            <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Filters</h2>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={28} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-2xl text-lg focus:outline-none focus:border-[#e5849c]"
                >
                  <option value="rating">Best Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="duration">Shortest Duration</option>
                </select>
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3">Minimum Rating</label>
                <div className="flex gap-3 flex-wrap">
                  {[0, 4.0, 4.5, 4.8].map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilters({ ...filters, minRating: r })}
                      className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all ${
                        filters.minRating === r ? 'bg-[#e5849c] text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {r === 0 ? 'Any' : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3">Price Range (₹)</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Min</label>
                    <input type="number" value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                      className="w-full p-4 border border-gray-200 rounded-2xl text-lg mt-1" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Max</label>
                    <input type="number" value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                      className="w-full p-4 border border-gray-200 rounded-2xl text-lg mt-1" />
                  </div>
                </div>
              </div>

              {/* Duration Range */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3">Duration (minutes)</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Min</label>
                    <input type="number" value={filters.minDuration} step="15"
                      onChange={(e) => setFilters({ ...filters, minDuration: Number(e.target.value) })}
                      className="w-full p-4 border border-gray-200 rounded-2xl text-lg mt-1" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Max</label>
                    <input type="number" value={filters.maxDuration} step="15"
                      onChange={(e) => setFilters({ ...filters, maxDuration: Number(e.target.value) })}
                      className="w-full p-4 border border-gray-200 rounded-2xl text-lg mt-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-6 flex gap-4">
              <Button variant="outline" onClick={resetFilters}
                className="flex-1 py-7 text-lg font-medium border-[#e5849c] text-[#e5849c] hover:bg-pink-50">
                Reset
              </Button>
              <Button onClick={() => handleApplyFilters(filters)}
                className="flex-1 py-7 text-lg font-medium bg-gradient-to-r from-[#e5849c] to-[#E5AFBC]">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}