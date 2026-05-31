'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronDown, ArrowRight } from 'lucide-react';
import { getEmoji } from '../home/_utils/emoji';
import { Service } from '../home/_types/index';

interface Props {
  services: Service[];
  onNavigate: (id: string) => void;
  userLocation: string;
  onLocationClick: () => void;
}

export function CombinedSearchBar({ services, onNavigate, userLocation, onLocationClick }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return services.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, services]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/client/services?q=${encodeURIComponent(query.trim())}`);
  };

  const showDropdown = focused && query.trim().length > 0;

  return (
    <div ref={ref} className="relative">
      <form
        onSubmit={handleSubmit}
        className="p-3 md:p-6 bg-white/50 backdrop-blur-xl rounded-[10px] border border-[#E8708E]/50"
      >
      <div className="flex items-stretch bg-white rounded-md drop-shadow-xl border border-[#E8708E]/30 overflow-hidden h-14 md:h-16 p-2">
          <div className="flex items-center gap-1 pl-2">
            <MapPin size={20} className="text-[#E8708E]" />
          </div>
          {/* Location pill — desktop only */}
          <div className="hidden md:flex flex-col justify-center border-r border-gray-200 px-3 flex-shrink-0">
            <span className="text-[12px] text-gray-400 mb-0.5 leading-none">location</span>
            <button
              type="button"
              onClick={onLocationClick}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#E8708E] whitespace-nowrap"
            >
              <span className="max-w-[120px] truncate">{userLocation}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Search input */}
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3 text-[#E8708E] pointer-events-none" size={16} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder={`Try "Hair Spa" or "Bridal Makeup"`}
              className="w-full h-full pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
            />
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="bg-[#E8708E] hover:bg-[#c7166f] text-white text-sm font-semibold px-4 md:px-8 rounded-md flex items-center gap-1.5 transition-colors flex-shrink-0"
          >
            <span className="hidden md:inline">Search</span> <ArrowRight size={15} />
          </button>
        </div>
      </form>

      {/* Dropdown results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {results.length > 0 ? (
            <>
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onNavigate(s.id); setFocused(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50 transition-colors text-left border-b border-gray-50 last:border-0"
                >
                  <span className="text-xl">{getEmoji(s.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.duration} · {s.discountedPrice}</p>
                  </div>
                  {s.discount && (
                    <span className="text-[10px] font-bold text-[#E91E8C] bg-[#E91E8C]/10 px-1.5 py-0.5 rounded-full">
                      {s.discount}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => { router.push(`/client/services?q=${encodeURIComponent(query.trim())}`); setFocused(false); }}
                className="w-full px-4 py-2.5 text-xs font-semibold text-[#E91E8C] hover:bg-pink-50 transition-colors text-center"
              >
                See all results for "{query}" →
              </button>
            </>
          ) : (
            <div className="px-4 py-4 text-sm text-gray-400 text-center">
              No services found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}