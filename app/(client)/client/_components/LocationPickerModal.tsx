'use client';

import React, { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';

interface Props {
  current: string;
  onSelect: (loc: string) => void;
  onClose: () => void;
}

export function LocationPickerModal({ current, onSelect, onClose }: Props) {
  const [input, setInput] = useState('');

  const suggestions = [
    'Bandra, Mumbai', 'Andheri, Mumbai', 'Juhu, Mumbai', 'Powai, Mumbai',
    'Thane, Mumbai', 'Borivali, Mumbai', 'Malad, Mumbai', 'Goregaon, Mumbai',
  ].filter((s) => !input || s.toLowerCase().includes(input.toLowerCase()));

  const handleDetectLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const suburb = data.locality || '';
          const city = data.city || 'Mumbai';
          onSelect(suburb ? `${suburb}, ${city}` : city);
        } catch {
          onSelect('Mumbai, Maharashtra');
        }
      },
      () => onSelect('Mumbai, Maharashtra')
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 pb-8 md:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#111827]">Change location</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search area, locality…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E91E8C]/30"
          />
        </div>

        {/* Detect location */}
        <button
          onClick={handleDetectLocation}
          className="flex items-center gap-2 text-[#E91E8C] font-semibold text-sm mb-4 hover:underline"
        >
          <MapPin size={14} /> Use current location
        </button>

        {/* Suggestions list */}
        <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Popular areas</p>
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSelect(s)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm hover:bg-pink-50 transition-colors ${
                s === current ? 'bg-pink-50 text-[#E91E8C] font-semibold' : 'text-[#111827]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}