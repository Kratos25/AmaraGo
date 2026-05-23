'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export function MidBannerSection() {
  const router = useRouter();
  return (
    <section className="bg-[#FEF0F5] py-10 border-t border-pink-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="rounded-3xl bg-white overflow-hidden flex flex-col md:flex-row items-center shadow-sm border border-pink-100">
          {/* Left text */}
          <div className="flex-1 p-8 md:p-12">
            <div className="flex items-center gap-0 mb-4">
              <span className="text-[#E91E8C] font-extrabold text-3xl">Amara</span>
              <span className="text-[#111827] font-extrabold text-3xl">Go</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#111827] leading-snug">
              Self-care starts at your doorstep.
            </h2>
            <button
              onClick={() => router.push('/client/services')}
              className="mt-6 inline-flex items-center gap-2 bg-[#E91E8C] hover:bg-[#c7166f] text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Book Now <ArrowRight size={16} />
            </button>
          </div>

          {/* Right image */}
          <div className="w-full md:w-80 lg:w-96 h-56 md:h-72 flex-shrink-0 relative bg-gradient-to-br from-pink-100 to-pink-200 overflow-hidden rounded-r-3xl">
            <img
              src="/assets/banners/mid-banner-professional.jpg"
              alt="Beauty service at home"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-8xl opacity-20">💄</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}