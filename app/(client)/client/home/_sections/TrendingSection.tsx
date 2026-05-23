'use client';

import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { getEmoji } from '../_utils/emoji';
import { Service } from '../_types/index';

function TrendingCard({
  service,
  bgColor,
  textColor,
  onNavigate,
}: {
  service: Service;
  bgColor: string;
  textColor: string;
  onNavigate: (id: string) => void;
}) {
  const bullets = [
    'Trained & verified professional',
    'All tools & products included',
    'Hygienic & safe practice',
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden flex h-52 cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
      onClick={() => onNavigate(service.id)}
    >
      {/* Left info panel */}
      <div className={`flex-1 p-4 flex flex-col justify-between ${bgColor}`}>
        <div>
          <p className={`font-extrabold text-sm leading-snug mb-1 ${textColor}`}>{service.name}</p>
          <p className={`text-xs leading-relaxed mb-2 opacity-80 ${textColor}`}>
            Premium professional service, ideal for all skin types.
          </p>
          <ul className="space-y-1">
            {bullets.map((b) => (
              <li key={b} className={`flex items-start gap-1.5 text-[10px] ${textColor} opacity-90`}>
                <Check size={10} className="mt-0.5 flex-shrink-0" /> {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className={`font-extrabold text-base ${textColor}`}>{service.discountedPrice}</span>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowRight size={12} className={textColor} />
          </div>
        </div>
      </div>

      {/* Right image */}
      <div className="w-2/5 flex-shrink-0 bg-gray-100 relative overflow-hidden">
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-5xl opacity-20">{getEmoji(service.name)}</span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  services: Service[];
  loading: boolean;
  onNavigate: (id: string) => void;
}

export function TrendingSection({ services, loading, onNavigate }: Props) {
  return (
    <section className="bg-[#F7F2F6] py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl font-medium text-[#111827] mb-5">Trending Now</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.slice(0, 2).map((service, i) => (
              <TrendingCard
                key={service.id}
                service={service}
                bgColor={i === 0 ? 'bg-[#E91E8C]' : 'bg-[#1e2b45]'}
                textColor="text-white"
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}