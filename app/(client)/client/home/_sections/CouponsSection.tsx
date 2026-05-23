'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Copy, CheckCheck } from 'lucide-react';
import { User } from 'firebase/auth';
import { CouponCardSkeleton } from '@/components/ui/skeletons';

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrder: number;
  validTo: string;
}

function GuestCouponTeaser() {
  const router = useRouter();
  return (
    <div className="flex-shrink-0 w-72 rounded-2xl overflow-hidden border border-[#E91E8C]/30 bg-gradient-to-br from-pink-50 to-white shadow-sm">
      <div className="h-1.5 bg-[#E91E8C]" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Tag size={13} className="text-[#E91E8C]" />
          <span className="font-bold text-sm text-[#111827] blur-sm select-none">XXXX200</span>
          <span className="text-[10px] font-bold text-[#E91E8C] bg-[#E91E8C]/10 px-1.5 py-0.5 rounded-full">
            UP TO 20% OFF
          </span>
        </div>
        <p className="text-xs text-gray-400 italic mb-1">
          Login to unlock exclusive offers &amp; coupons
        </p>
        <p className="text-[10px] text-gray-300 mb-3">Min ₹499 · Exclusive member offer</p>
        <button
          onClick={() => router.push('/login')}
          className="w-full flex items-center justify-center gap-1.5 bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-semibold py-2 rounded-xl transition-colors"
        >
          Login to unlock offers
        </button>
      </div>
    </div>
  );
}

interface Props {
  coupons: Coupon[];
  loading: boolean;
  currentUser: User | null;
}

export function CouponsSection({ coupons, loading, currentUser }: Props) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Don't render section at all if logged in and no coupons and not loading
  if (!loading && currentUser && coupons.length === 0) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  return (
    <section className="bg-[#FEF0F5] py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-xl font-extrabold text-[#111827] mb-5">Today's Offers</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {loading && [1, 2, 3].map((i) => <CouponCardSkeleton key={i} />)}

          {!loading && !currentUser && <GuestCouponTeaser />}

          {!loading &&
            currentUser &&
            coupons.map((coupon) => {
              const isCopied = copiedCode === coupon.code;
              const discountLabel =
                coupon.type === 'percentage'
                  ? `${coupon.value}% OFF`
                  : `₹${coupon.value} OFF`;
              return (
                <div
                  key={coupon.id}
                  className="flex-shrink-0 w-72 rounded-2xl overflow-hidden border border-[#E91E8C]/30 bg-white shadow-sm"
                >
                  <div className="h-1.5 bg-[#E91E8C]" />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag size={13} className="text-[#E91E8C]" />
                      <span className="font-bold text-sm text-[#111827] tracking-wide truncate">
                        {coupon.code}
                      </span>
                      <span className="text-[10px] font-bold text-[#E91E8C] bg-[#E91E8C]/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {discountLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-snug line-clamp-2 mb-1">
                      {coupon.description}
                    </p>
                    <p className="text-[10px] text-gray-400 mb-3">
                      Min ₹{coupon.minOrder} · Till {coupon.validTo}
                    </p>
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className="w-full flex items-center justify-center gap-1.5 bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                    >
                      {isCopied ? (
                        <><CheckCheck size={13} /> Copied!</>
                      ) : (
                        <><Copy size={13} /> Copy Code</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}