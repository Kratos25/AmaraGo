'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Clock } from 'lucide-react';
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
    <div className="flex-shrink-0 w-52 md:w-60 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div
        className="h-36 bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center relative overflow-hidden cursor-pointer"
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
          className="w-full h-full object-cover"
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
      <div className="p-3">
        <p
          className="font-bold text-sm text-[#111827] leading-tight line-clamp-2 mb-1 cursor-pointer hover:text-[#E91E8C] transition-colors"
          onClick={() => onNavigate(service.id)}
        >
          {service.name}
        </p>
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
          <Clock size={11} /> {service.duration}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-extrabold text-base text-[#E91E8C]">{service.discountedPrice}</p>
            {service.discount && (
              <p className="text-[10px] text-gray-400 line-through">{service.originalPrice}</p>
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
  return (
    <section className="bg-white py-10">
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
        <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
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
    </section>
  );
}