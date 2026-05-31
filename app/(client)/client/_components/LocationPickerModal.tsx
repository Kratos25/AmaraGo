'use client';

import React, { useState } from 'react';
import { MapPin, X, CheckCircle2, ArrowLeft, BellRing, Gift, Loader2 } from 'lucide-react';
import { SERVICEABLE_CITIES } from '@/lib/serviceable-cities';
import { GooglePlacesInput, type PlaceResult } from '@/components/ui/GooglePlacesInput';

interface Props {
  current: string;
  onSelect: (result: PlaceResult) => void;
  onClose: () => void;
}

export function LocationPickerModal({ current, onSelect, onClose }: Props) {
  const [detecting, setDetecting]               = useState(false);
  const [notServiceableCity, setNotServiceableCity] = useState('');
  const [email, setEmail]                       = useState('');
  const [submitting, setSubmitting]             = useState(false);
  const [waitlistDone, setWaitlistDone]         = useState(false);

  const handlePlaceSelect = (result: PlaceResult) => {
    if (result.address) {
      onSelect(result);
    }
  };

  // ── GPS detect via browser geolocation + Google Geocoder ─────────────────
  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // Use Google Geocoding API if key is available, otherwise bigdatacloud
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.coords.latitude},${pos.coords.longitude}&key=${apiKey}`
            );
            const data = await res.json();
            const addr = data.results?.[0]?.formatted_address ?? '';
            onSelect({ address: addr, lat: pos.coords.latitude, lng: pos.coords.longitude });
          } else {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
            );
            const data = await res.json();
            const suburb = data.locality || '';
            const city = data.city || 'Mumbai';
            onSelect({ address: suburb ? `${suburb}, ${city}` : city, lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
        } catch {
          onSelect({ address: 'Mumbai, Maharashtra', lat: null, lng: null });
        }
        setDetecting(false);
      },
      () => setDetecting(false),
      { timeout: 10000 }
    );
  };

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const existing = JSON.parse(localStorage.getItem('amarago_waitlist') || '[]');
      existing.push({ email: email.trim(), city: notServiceableCity, at: new Date().toISOString() });
      localStorage.setItem('amarago_waitlist', JSON.stringify(existing));
      await new Promise((r) => setTimeout(r, 600));
      setWaitlistDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (notServiceableCity && !waitlistDone) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
        <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setNotServiceableCity(''); setEmail(''); }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="text-center mb-5">
            <MapPin size={28} className="text-[#E91E8C] mx-auto mb-2" />
            <h2 className="text-lg font-bold text-[#111827]">We&apos;re not in {notServiceableCity} yet</h2>
            <p className="text-sm text-gray-500 mt-1">Be the first to know when we launch there.</p>
          </div>
          <form onSubmit={handleWaitlist} className="flex gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E91E8C]/30" />
            <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-[#E91E8C] text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center gap-1.5">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />} Notify
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (notServiceableCity && waitlistDone) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
        <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 pb-8 text-center" onClick={(e) => e.stopPropagation()}>
          <CheckCircle2 size={36} className="text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#111827] mb-1">You&apos;re on the list!</h2>
          <p className="text-sm text-gray-500 mb-4">We&apos;ll notify you when AmaraGo launches in {notServiceableCity}.</p>
          <button onClick={() => { setNotServiceableCity(''); setWaitlistDone(false); setEmail(''); }} className="text-sm text-[#E91E8C] font-semibold hover:underline">
            Choose a different city
          </button>
          <button onClick={onClose} className="block w-full mt-2 text-xs text-gray-400 hover:underline"><Gift size={12} className="inline mr-1" />Close</button>
        </div>
      </div>
    );
  }

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

        {/* Google Places search */}
        <GooglePlacesInput
          value={current}
          placeholder="Search area, city or full address…"
          autoFocus
          onSelect={handlePlaceSelect}
          className="mb-3"
        />

        {/* Detect location */}
        <button
          onClick={handleDetectLocation}
          disabled={detecting}
          className="flex items-center gap-2 text-[#E91E8C] font-semibold text-sm mb-5 hover:underline disabled:opacity-60"
        >
          {detecting
            ? <Loader2 size={14} className="animate-spin" />
            : <MapPin size={14} />}
          Use current location
        </button>

        {/* Serviceable city chips */}
        <div>
          <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Serving in</p>
          <div className="flex flex-wrap gap-2">
            {SERVICEABLE_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => onSelect({ address: city, lat: null, lng: null })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF0F5] text-[#E91E8C] text-xs font-semibold border border-[#E91E8C]/20 hover:bg-[#FFE4EE] transition-colors"
              >
                <CheckCircle2 size={11} />
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
