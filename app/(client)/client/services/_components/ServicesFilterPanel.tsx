'use client';

import React from 'react';
import { X, Star } from 'lucide-react';
import type { Filters } from './types';

const SORT_LABELS: Record<string, string> = {
  rating: 'Best Rated',
  'price-low': 'Price ↑',
  'price-high': 'Price ↓',
  duration: 'Shortest',
};

interface Props {
  filters: Filters;
  hasActiveFilters: boolean;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  onChange: (f: Filters) => void;
}

export function ServicesFilterPanel({ filters, hasActiveFilters, onClose, onReset, onApply, onChange }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Filters &amp; Sort</h2>
            {hasActiveFilters && <p className="text-xs text-[#e5849c]">Filters applied</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-7">

          {/* Sort */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sort By</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SORT_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => onChange({ ...filters, sortBy: val })}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filters.sortBy === val ? 'bg-[#111827] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Minimum Rating</p>
            <div className="flex gap-2">
              {[0, 4.0, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  onClick={() => onChange({ ...filters, minRating: r })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                    filters.minRating === r ? 'bg-[#e5849c] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {r === 0 ? 'Any' : <><Star size={11} />{r}+</>}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Price Range (₹)</p>
            <div className="flex gap-3">
              {(['minPrice', 'maxPrice'] as const).map((key) => (
                <div key={key} className="flex-1">
                  <label className="text-[10px] text-gray-400 mb-1 block">{key === 'minPrice' ? 'Min' : 'Max'}</label>
                  <input
                    type="number"
                    value={filters[key]}
                    onChange={(e) => onChange({ ...filters, [key]: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e5849c]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Duration (minutes)</p>
            <div className="flex gap-3">
              {(['minDuration', 'maxDuration'] as const).map((key) => (
                <div key={key} className="flex-1">
                  <label className="text-[10px] text-gray-400 mb-1 block">{key === 'minDuration' ? 'Min' : 'Max'}</label>
                  <input
                    type="number"
                    step="15"
                    value={filters[key]}
                    onChange={(e) => onChange({ ...filters, [key]: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e5849c]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <button onClick={onReset} className="flex-1 py-3 rounded-xl border border-[#e5849c] text-[#e5849c] text-sm font-semibold hover:bg-[#e5849c]/5 transition-colors">
            Reset
          </button>
          <button onClick={onApply} className="flex-1 py-3 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}