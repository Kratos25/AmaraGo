'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import { CartQtyButton } from '@/components/client/CartQtyButton';
import { getEmoji } from '../_utils/emoji';
import { Service } from '../_types';

function ServiceCarouselCard({
  service,
  onNavigate,
}: {
  service: Service;
  onNavigate: (id: string) => void;
}) {
  return (
    <div className="flex-shrink-0 w-52 md:w-60 rounded-[10px] hover:shadow-lg transition-shadow overflow-hidden">
      <div
        className="h-36 bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center relative overflow-hidden"
        onClick={() => onNavigate(service.id)}
      >
        <img
          src={
            service.imageUrl ||
            `/assets/services/service-${service.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')}.jpg`
          }
          alt={service.name}
          className="w-full h-full object-cover rounded-[10px]"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <span className="text-5xl opacity-30 absolute pointer-events-none">{getEmoji(service.name)}</span>
        {service.discount && (
          <span className="absolute top-2 left-2 bg-[#E91E8C] text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
            {service.discount}
          </span>
        )}
      </div>
      <div className="p-1 pt-4">
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
          <div className="flex-1">
            <p
              className="font-medium text-base text-[#111827] leading-tight line-clamp-2"
              onClick={() => onNavigate(service.id)}
            >
            {service.name}
            </p>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
              <Clock size={11} /> {service.duration}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-base text-[#E8708E]">{service.discountedPrice}</p>
            {service.discount && (
              <p className="text-sm text-gray-400 line-through">{service.originalPrice}</p>
            )}
          </div>
          <CartQtyButton
            serviceId={service.id}
            name={service.name}
            price={service.rawDiscounted}
            duration={service.duration}
          />
        </div>
      </div>
    </div>
  );
}

interface Props {
  services: Service[];
  loading: boolean;
}

export function PopularServicesSection({ services, loading }: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    el?.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el?.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [services]);

  const scroll = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });

  return (
    <section className="bg-[#F7F2F6] py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-[#111827]">Popular Services</h2>
          <button
            onClick={() => router.push('/client/services')}
            className="text-sm font-semibold text-[#E91E8C] hover:underline flex items-center gap-0.5"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 hidden md:flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 hidden md:flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          )}
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-52 md:w-60 rounded-2xl bg-gray-50 border border-gray-100 animate-pulse">
                  <div className="h-36 bg-gray-200 rounded-t-2xl" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            : services.map((service) => (
                <ServiceCarouselCard key={service.id} service={service} onNavigate={router.push.bind(router)} />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}