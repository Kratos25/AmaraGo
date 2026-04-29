"use client";

import Image from 'next/image';
import { Clock, Star, Heart } from 'lucide-react';
import { CartQtyButton } from './CartQtyButton';

const EMOJI_MAP = [
  { keys: ['hair', 'blow'], emoji: '💇' },
  { keys: ['nail', 'manicure', 'pedicure'], emoji: '💅' },
  { keys: ['facial', 'face', 'skin'], emoji: '🧖' },
  { keys: ['massage', 'spa'], emoji: '💆' },
  { keys: ['wax', 'threading'], emoji: '✨' },
  { keys: ['makeup', 'bridal'], emoji: '💄' },
  { keys: ['lash', 'brow'], emoji: '👁️' },
];

function getEmoji(name = '') {
  const lower = name.toLowerCase();
  const match = EMOJI_MAP.find((m) => m.keys.some((k) => lower.includes(k)));
  return match ? match.emoji : '✨';
}

export function ServiceCard({ service, onFavoriteToggle, isFav, onClick }) {
  const { id, name, category, duration, rating, discountedPrice, originalPrice, imageUrl } = service;
  const discount = originalPrice > discountedPrice
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#e5849c]/30 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Image band */}
      <div className="relative h-36 bg-[#111827] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_60%_40%,#e5849c,transparent_65%)]" />
            <span className="text-5xl">{getEmoji(name)}</span>
          </>
        )}

        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-[#e5849c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {discount}% OFF
          </span>
        )}

        <span className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/15 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          <Clock size={10} /> {duration} min
        </span>

        {onFavoriteToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); onFavoriteToggle(id); }}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Heart size={13} className={isFav ? 'fill-[#e5849c] text-[#e5849c]' : 'text-white'} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-[#111827] text-sm leading-tight line-clamp-1 mb-0.5">{name}</h3>
        <p className="text-[10px] text-gray-400 mb-2">{category}</p>

        {rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-gray-700">{rating}</span>
          </div>
        )}

        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-extrabold text-[#111827]">₹{discountedPrice.toLocaleString('en-IN')}</p>
            {discount > 0 && (
              <p className="text-[10px] text-gray-400 line-through">₹{originalPrice.toLocaleString('en-IN')}</p>
            )}
          </div>
          <CartQtyButton
            serviceId={id}
            name={name}
            price={discountedPrice}
            duration={`${duration} min`}
          />
        </div>
      </div>
    </div>
  );
}
