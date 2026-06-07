'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentUser: User | null;
  onBookNow: () => void;
  onProfile: () => void;
}

export function OffersCarousel({ currentUser, onBookNow, onProfile }: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userScrolling = useRef(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    {
      gradient: 'from-[#0f4c35] to-[#1a7a52]',
      tag: 'Join Us',
      title: 'Become a\nService Provider',
      sub: 'Set your own schedule. Earn on your terms.',
      btnLabel: 'Apply Now →',
      onClick: () => router.push('/client/profile'),
      imgSrc: '',
      imgStyle: { bottom: '8px', right: '16px' } as React.CSSProperties,
      emoji: '💼',
    },
  ];

  // Triple the cards: [copy A | original B | copy C] — we keep scroll centred on B
  const tripleCards = [...cards, ...cards, ...cards];
  const COUNT = cards.length;

  // Get the width of one card + gap
  const getCardStep = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.children[0]) return 0;
    const first = el.children[0] as HTMLElement;
    const second = el.children[1] as HTMLElement | undefined;
    if (!second) return first.offsetWidth;
    return second.offsetLeft - first.offsetLeft;
  }, []);

  // Initialise scroll to the middle set (set B) on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Wait one frame for layout
    requestAnimationFrame(() => {
      const step = getCardStep();
      el.scrollLeft = step * COUNT;
    });
  }, [getCardStep, COUNT]);

  // When scroll ends near the edges, silently jump to the middle set
  const handleScrollEnd = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const step = getCardStep();
    if (step === 0) return;
    const midStart = step * COUNT;
    const midEnd = step * COUNT * 2;
    if (el.scrollLeft < midStart - step * 0.5 || el.scrollLeft >= midEnd - step * 0.5) {
      // Compute which card index within a set we're closest to
      const offset = ((el.scrollLeft % (step * COUNT)) + step * COUNT) % (step * COUNT);
      el.style.scrollBehavior = 'auto';
      el.scrollLeft = midStart + offset;
      el.style.scrollBehavior = '';
    }
  }, [getCardStep, COUNT]);

  // Auto-advance: scroll right by one card every 3s
  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (userScrolling.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const step = getCardStep();
      el.scrollBy({ left: step, behavior: 'smooth' });
    }, 3000);
  }, [getCardStep]);

  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => { stopAutoPlay(); if (resumeRef.current) clearTimeout(resumeRef.current); };
  }, [startAutoPlay, stopAutoPlay]);

  // Pause auto-play when user touches/scrolls, resume after 4s idle
  const handleUserStart = useCallback(() => {
    userScrolling.current = true;
    stopAutoPlay();
    if (resumeRef.current) clearTimeout(resumeRef.current);
  }, [stopAutoPlay]);

  const handleUserEnd = useCallback(() => {
    userScrolling.current = false;
    handleScrollEnd();
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => startAutoPlay(), 4000);
  }, [handleScrollEnd, startAutoPlay]);

  // Arrow buttons
  const scrollByOne = useCallback((dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = getCardStep();
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
    handleUserStart();
    // Treat arrow click like brief interaction
    setTimeout(() => handleUserEnd(), 500);
  }, [getCardStep, handleUserStart, handleUserEnd]);

  return (
    <div className="relative group">
      {/* Scrollable track — native swipe works */}
      <div
        ref={scrollRef}
        onTouchStart={handleUserStart}
        onTouchEnd={handleUserEnd}
        onMouseDown={handleUserStart}
        onMouseUp={handleUserEnd}
        onMouseLeave={() => { if (userScrolling.current) handleUserEnd(); }}
        className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {tripleCards.map((card, i) => (
          <div
            key={i}
            className={`flex-shrink-0 w-[min(320px,85vw)] md:w-[390px] rounded-[10px] bg-gradient-to-br ${card.gradient} relative overflow-hidden h-[183px]`}
          >
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
            <div className="absolute pointer-events-none select-none" style={card.imgStyle}>
              {card.imgSrc ? (
                <img
                  src={card.imgSrc}
                  alt={card.tag}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (card as any).emoji ? (
                <span style={{ fontSize: '80px', lineHeight: 1, opacity: 0.3 }}>
                  {(card as any).emoji}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop arrow buttons */}
      <button
        onClick={() => scrollByOne(-1)}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50"
        aria-label="Previous offer"
      >
        <ChevronLeft size={18} className="text-gray-600" />
      </button>
      <button
        onClick={() => scrollByOne(1)}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50"
        aria-label="Next offer"
      >
        <ChevronRight size={18} className="text-gray-600" />
      </button>

      {/* Hide native scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
