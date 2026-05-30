'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { categoriesAPI, servicesAPI } from '@/lib/api';
import { SiteFooter } from '../home/_sections/SiteFooter';
import { MidBannerSection } from '../home/_sections/MidBannerSection';
import { CategoriesSection } from '../home/_sections/CategoriesSection';
import { ServicesHero } from './_components/ServicesHero';
import { ServicesGrid } from './_components/ServicesGrid';
import { ServicesFilterPanel } from './_components/ServicesFilterPanel';
import type { ServiceItem, Filters } from './_components/types';

const DEFAULT_FILTERS: Filters = {
  minRating: 0, minPrice: 0, maxPrice: 50000,
  minDuration: 0, maxDuration: 300, sortBy: 'rating',
};

export default function ServicesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');

  const [activeCategory, setActiveCategory] = useState<string>(categoryFromUrl || 'All');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [categoryList, setCategoryList] = useState<{ name: string; icon: string }[]>([{ name: 'All', icon: '🌟' }]);
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);

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
          imageUrl: s.image_url,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (categoryFromUrl) setActiveCategory(categoryFromUrl); }, [categoryFromUrl]);
  useEffect(() => { setShowAll(false); }, [activeCategory]);

  const selectCategory = (name: string) => {
    setActiveCategory(name);
    router.push(`/client/services?category=${encodeURIComponent(name)}`, { scroll: false });
  };

  const resetFilters = () => { setFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); };
  const applyFilters = () => { setAppliedFilters(filters); setShowFilterPanel(false); };

  const filtered = useMemo(() => {
    let list = allServices
      .filter((s) => activeCategory === 'All' || s.category === activeCategory)
      .filter((s) => s.rating >= appliedFilters.minRating)
      .filter((s) => s.discountedPrice >= appliedFilters.minPrice && s.discountedPrice <= appliedFilters.maxPrice)
      .filter((s) => s.duration >= appliedFilters.minDuration && s.duration <= appliedFilters.maxDuration);

    if (appliedFilters.sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (appliedFilters.sortBy === 'price-low') list.sort((a, b) => a.discountedPrice - b.discountedPrice);
    else if (appliedFilters.sortBy === 'price-high') list.sort((a, b) => b.discountedPrice - a.discountedPrice);
    else if (appliedFilters.sortBy === 'duration') list.sort((a, b) => a.duration - b.duration);
    return list;
  }, [allServices, activeCategory, appliedFilters]);

  const hasActiveFilters = appliedFilters.minRating > 0 || appliedFilters.minPrice > 0
    || appliedFilters.maxPrice < 50000 || appliedFilters.minDuration > 0 || appliedFilters.maxDuration < 300;

  return (
    <div className="min-h-screen bg-white">
      <ServicesHero
        loading={loading}
        categoryList={categoryList}
        activeCategory={activeCategory}
        onSelectCategory={selectCategory}
      />
      <ServicesGrid
        loading={loading}
        activeCategory={activeCategory}
        filtered={filtered}
        appliedFilters={appliedFilters}
        hasActiveFilters={hasActiveFilters}
        showAll={showAll}
        onShowAll={() => setShowAll(true)}
        onOpenFilter={() => setShowFilterPanel(true)}
        onResetFilters={resetFilters}
        onSortChange={(val) => {
          const f = { ...appliedFilters, sortBy: val };
          setAppliedFilters(f); setFilters(f);
        }}
      />
      {showFilterPanel && (
        <ServicesFilterPanel
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onClose={() => setShowFilterPanel(false)}
          onReset={resetFilters}
          onApply={applyFilters}
          onChange={setFilters}
        />
      )}
      <CategoriesSection categories={categoryList} />
      <MidBannerSection />
      <SiteFooter />
    </div>
  );
}