'use client';

import React from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface Props {
  currentUser: User | null;
  onBookNow: () => void;
  onProfile: () => void;
}

export function OffersCarousel({ currentUser, onBookNow, onProfile }: Props) {
  const router = useRouter();

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

  // Duplicate cards for seamless infinite loop
  const loopCards = [...cards, ...cards];

  return (
    <>
      {/* Inject keyframe animation */}
      <style>{`
        @keyframes offers-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .offers-track {
          animation: offers-scroll 16s linear infinite;
        }
        .offers-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="overflow-hidden">
        <div className="offers-track flex gap-4" style={{ width: 'max-content' }}>
          {loopCards.map((card, i) => (
            <div
              key={i}
              className={`flex-shrink-0 w-[min(320px,85vw)] md:w-[390px] rounded-[10px] bg-gradient-to-br ${card.gradient} relative overflow-hidden h-[183px]`}
            >
              {/* Text */}
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

              {/* Illustration */}
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
      </div>
    </>
  );
}
