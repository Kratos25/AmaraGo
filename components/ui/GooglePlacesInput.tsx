'use client';

/**
 * GooglePlacesInput — Google Places Autocomplete input component.
 * Uses @googlemaps/js-api-loader v2 functional API (setOptions + importLibrary).
 * Falls back to plain text input if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MapPin, Loader2, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export interface PlaceResult {
  address: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  value?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSelect: (result: PlaceResult) => void;
  restrictToIndia?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export function GooglePlacesInput({
  value = '',
  placeholder = 'Search address…',
  className,
  inputClassName,
  onSelect,
  restrictToIndia = true,
  autoFocus = false,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef    = useRef<google.maps.places.Autocomplete | null>(null);

  const [inputValue, setInputValue] = useState(value);
  const [loading, setLoading]       = useState(false);

  useEffect(() => { setInputValue(value); }, [value]);

  useEffect(() => {
    if (!API_KEY) return; // plain-text fallback, skip loading

    setLoading(true);
    setOptions({ key: API_KEY, v: 'weekly', libraries: ['places'] });

    importLibrary('places')
      .then(() => {
        if (!inputRef.current) return;
        const opts: google.maps.places.AutocompleteOptions = {
          fields: ['formatted_address', 'geometry.location'],
          types: ['geocode', 'establishment'],
        };
        if (restrictToIndia) opts.componentRestrictions = { country: 'in' };

        acRef.current = new google.maps.places.Autocomplete(inputRef.current, opts);
        acRef.current.addListener('place_changed', () => {
          const place = acRef.current!.getPlace();
          const addr  = place.formatted_address ?? inputRef.current?.value ?? '';
          const lat   = place.geometry?.location?.lat() ?? null;
          const lng   = place.geometry?.location?.lng() ?? null;
          setInputValue(addr);
          onSelect({ address: addr, lat, lng });
        });
      })
      .catch(() => {/* graceful fallback */})
      .finally(() => setLoading(false));

    return () => {
      document.querySelectorAll('.pac-container').forEach((el) => el.remove());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!API_KEY) onSelect({ address: e.target.value, lat: null, lng: null });
  }, [onSelect]);

  const handleClear = () => {
    setInputValue('');
    onSelect({ address: '', lat: null, lng: null });
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className={cn(
          'w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm outline-none',
          'focus:ring-2 focus:ring-[#E91E8C]/30 focus:border-[#E91E8C]/50',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          inputClassName
        )}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
      )}
      {!loading && inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
