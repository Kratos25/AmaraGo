'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  currentUser: User | null;
  onBookNow: () => void;
  onProfile: () => void;
}

export function OffersCarousel({ currentUser, onBookNow, onProfile }: Props) {
  const [idx, setIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const cards = [
    {
      gradient: 'from-[#AE002C] to-[#FA255A]',
      tag: 'New User',
      title: '₹200 off your\nfirst booking',
      sub: 'Use code WELCOME200',
      btnLabel: 'Book Now →',
      onClick: onBookNow,
      imgSrc: '/assets/offers/offer-new-user.png',
      imgStyle: { bottom: '0px', right: '5px' } as React.CSSProperties,
    },
    {
      gradient: 'from-[#692AFA] to-[#692AFA]',
      tag: 'Referrals',
      title: 'Refer a friend,\nearn ₹200 each',
      sub: 'Share & Earn when they book.',
      btnLabel: 'Invite Friends →',
      onClick: onProfile,
      imgSrc: '/assets/offers/offer-referral.png',
      imgStyle: { bottom: '0px', right: '-1px' } as React.CSSProperties,
    },
    {
      gradient: 'from-[#202953] to-[#202953]',
      tag: 'Loyalty',
      title: 'Earn points,\nunlock rewards',
      sub: '₹1 spent = 0.5 pts. Gold at 2000 pts.',
      btnLabel: 'Explore Rewards →',
      onClick: onProfile,
      imgSrc: '/assets/offers/offer-rewards.png',
      imgStyle: { bottom: '0px', right: '-1px' } as React.CSSProperties,
    },
  ];

  const prev = () => setIdx((i) => (i === 0 ? cards.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === cards.length - 1 ? 0 : i + 1));

  return (
    <div className="relative">
      {/* Arrow buttons — mobile only */}
      {isMobile && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </>
      )}

      {/* Cards container */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out gap-4"
          style={isMobile ? { transform: `translateX(calc(-${idx * 100}% - ${idx * 18}px))` } : undefined}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              className={`flex-shrink-0 w-full md:w-[390px] rounded-[10px] bg-gradient-to-br ${card.gradient} relative overflow-hidden h-[183px]`}
            >
              {/* Text content */}
              <div className="relative p-5 pt-4 z-10">
                <span className="text-[10px] font-semibold uppercase tracking-widest bg-white/20 text-white px-2.5 py-1 rounded-full">
                  {card.tag}
                </span>
                <h3 className="text-2xl font-semibold text-white mt-2 mb-2 whitespace-pre-line leading-tight">
                  {card.title}
                </h3>
                <p className="text-white text-sm mb-1">{card.sub}</p>
                <button
                  onClick={card.onClick}
                  className="text-xl font-semibold text-white hover:underline transition-colors"
                >
                  {card.btnLabel}
                </button>
              </div>

              {/* Card image — per-card positioning */}
              <div className="absolute pointer-events-none select-none" style={card.imgStyle}>
                <img
                  src={card.imgSrc}
                  alt={card.tag}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators — mobile only */}
      {isMobile && (
        <div className="flex justify-center gap-1.5 mt-3">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === idx ? 'bg-[#E91E8C] w-4' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}