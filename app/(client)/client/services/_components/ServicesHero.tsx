'use client';

import React from 'react';
import { getCategoryIcon } from './serviceIcons';

const COLLAGE_IMAGES = [
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=400&fit=crop',
];

interface Props {
  loading: boolean;
  categoryList: { name: string; icon: string }[];
  activeCategory: string;
  onSelectCategory: (name: string) => void;
}

export function ServicesHero({ loading, categoryList, activeCategory, onSelectCategory }: Props) {
  return (
    <section className="bg-[#F7F2F6] pt-10 pb-10 border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-6 items-stretch">

        {/* Left: heading + category tiles */}
        <div className="flex-1 min-w-0 border-2 border-[#FFEAEF] bg-[#FFF8FA] rounded-3xl py-5 px-4 sm:py-6 sm:px-6 md:px-12">
          <h1 className="text-3xl md:text-4xl font-medium text-[#111827] mb-[-10px]">Explore</h1>
          <div className="flex items-center gap-2 mt-3 mb-4">
            <span className="text-lg md:text-[22px] font-normal text-[#000000]">Our wide range of Services</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-2xl bg-gray-100" />
                  <div className="h-2.5 bg-gray-100 rounded mt-2 mx-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {categoryList.map((cat) => {
                const active = activeCategory === cat.name;
                const CatIcon = getCategoryIcon(cat.icon, cat.name);
                return (
                  <button key={cat.name} onClick={() => onSelectCategory(cat.name)} className="flex flex-col items-center group">
                    <div className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all border-2 ${
                      active
                        ? 'bg-[#FFEAEF] border-[#E8708E]/40 shadow-sm'
                        : 'bg-[#FFEAEF] border-transparent hover:bg-pink-50 hover:border-[#E8708E]/40'
                    }`}>
                      <CatIcon size={24} className="text-[#E8708E]" strokeWidth={1.5} />
                    </div>
                    <p className={`text-[10px] md:text-[11px] text-center mt-1.5 leading-tight line-clamp-2 transition-colors ${
                      active ? 'text-[#E8708E] font-semibold' : 'text-gray-600 group-hover:text-[#E8708E]'
                    }`}>
                      {cat.name}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: photo collage */}
        <div className="hidden md:flex w-full md:w-[55%] flex-shrink-0 gap-4">
          <div className="flex-1 flex flex-col gap-4">
            <div className="grow-[4] basis-0 rounded-tl-[10px] overflow-hidden bg-pink-50">
              <img src={COLLAGE_IMAGES[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="grow-[2] basis-0 rounded-bl-[10px] overflow-hidden bg-pink-50">
              <img src={COLLAGE_IMAGES[1]} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="grow-[2] basis-0 rounded-tr-[10px] overflow-hidden bg-pink-50">
              <img src={COLLAGE_IMAGES[2]} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="grow-[4] basis-0 rounded-br-[10px] overflow-hidden bg-pink-50">
              <img src={COLLAGE_IMAGES[3]} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}