"use client";

import Image from 'next/image';
import { Clock } from 'lucide-react';
import { CartQtyButton } from './CartQtyButton';

const EMOJI_MAP = [
  { keys: ['bridal', 'wedding'], emoji: '👰' },
  { keys: ['hair'], emoji: '💇' },
  { keys: ['spa', 'relax'], emoji: '🧖' },
  { keys: ['nail', 'manicure', 'pedicure'], emoji: '💅' },
  { keys: ['glow', 'facial', 'skin'], emoji: '✨' },
];

function getEmoji(name = '') {
  const lower = name.toLowerCase();
  const match = EMOJI_MAP.find((m) => m.keys.some((k) => lower.includes(k)));
  return match ? match.emoji : '✨';
}

export function PackageCard({ pkg }) {
  const { id, name, desc, time, price, imageUrl, badge, originalPrice } = pkg;
  const savings = originalPrice && parseFloat(price.replace(/[^0-9.]/g, '')) < originalPrice
    ? `Save ₹${(originalPrice - parseFloat(price.replace(/[^0-9.]/g, ''))).toLocaleString('en-IN')}`
    : null;

  return (
    <div className="flex-shrink-0 w-64 md:w-72 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Image band */}
      <div className="h-36 bg-[#111827] flex items-center justify-center relative overflow-hidden">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_30%,#e5849c,transparent_60%)]" />
            <span className="text-5xl">{getEmoji(name)}</span>
          </>
        )}
        {badge && (
          <span className="absolute top-3 left-3 bg-[#e5849c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      <div className="p-5">
        <h4 className="font-bold text-base text-[#111827] mb-1 leading-tight">{name}</h4>
        <p className="text-gray-500 text-xs mb-4 leading-relaxed line-clamp-2">{desc}</p>
        <div className="flex items-center justify-between">
          <div>
            {time && (
              <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                <Clock size={10} />{time}
              </p>
            )}
            <p className="text-xl font-extrabold text-[#e5849c]">{price}</p>
            {savings && <p className="text-[10px] text-green-600 font-semibold">{savings}</p>}
          </div>
          <CartQtyButton
            packageId={id}
            name={name}
            price={parseFloat(price.replace(/[^0-9.]/g, ''))}
            duration={time}
          />
        </div>
      </div>
    </div>
  );
}
