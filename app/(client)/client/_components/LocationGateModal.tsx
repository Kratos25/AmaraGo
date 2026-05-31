'use client';

import React, { useState } from 'react';
import {
  MapPin,
  X,
  Loader2,
  CheckCircle2,
  BellRing,
  Gift,
  ArrowLeft,
} from 'lucide-react';
import { SERVICEABLE_CITIES } from '@/lib/serviceable-cities';
import { useLocation } from '@/config/context/LocationContext';
import { GooglePlacesInput } from '@/components/ui/GooglePlacesInput';

type Screen = 'pick' | 'not-serviceable' | 'waitlist-done';

export function LocationGateModal() {
  const { locationConfirmed, setLocation, ready } = useLocation();

  const [screen, setScreen]                 = useState<Screen>('pick');
  const [detecting, setDetecting]           = useState(false);
  const [pendingCity, setPendingCity]       = useState('');
  const [email, setEmail]                   = useState('');
  const [submittingWaitlist, setSubmitting] = useState(false);

  if (!ready) return null;
  if (locationConfirmed) return null;

  // ── GPS detect ────────────────────────────────────────────────────────────
  const handleDetect = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
            );
            const data = await res.json();
            const addr = data.results?.[0]?.formatted_address ?? '';
            setLocation(addr, { confirmed: true, lat: latitude, lng: longitude });
          } else {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await res.json();
            const suburb = data.locality || '';
            const city = data.city || 'Mumbai';
            setLocation(suburb ? `${suburb}, ${city}` : city, { confirmed: true, lat: latitude, lng: longitude });
          }
        } catch {
          setLocation('Mumbai, Maharashtra', { confirmed: true, lat: null, lng: null });
        }
        setDetecting(false);
      },
      () => setDetecting(false),
      { timeout: 10000 }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div
        className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Screen: Pick location ─────────────────────────────────────── */}
        {screen === 'pick' && (
          <div className="p-6 pb-8">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[#E91E8C] font-extrabold text-lg">Amara</span>
              <span className="text-[#111827] font-extrabold text-lg">Go</span>
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-1">Where should we serve you?</h2>
            <p className="text-sm text-gray-500 mb-5">We&apos;ll show services available at your location.</p>

            <button
              onClick={handleDetect}
              disabled={detecting}
              className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-xl bg-[#FFF0F5] border border-[#E91E8C]/30 text-[#E91E8C] font-semibold text-sm hover:bg-[#FFE4EE] transition-colors disabled:opacity-60"
            >
              {detecting ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              {detecting ? 'Detecting your location…' : 'Use my current location'}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or search</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <GooglePlacesInput
              placeholder="Search your area or city…"
              autoFocus
              onSelect={(result) => {
                if (result.address) {
                  setLocation(result.address, { confirmed: true, lat: result.lat, lng: result.lng });
                }
              }}
              className="mb-4"
            />

            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Serving in</p>
            <div className="flex flex-wrap gap-2">
              {SERVICEABLE_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => setLocation(city, { confirmed: true, lat: null, lng: null })}
                  className="px-3 py-1.5 rounded-full bg-[#FFF0F5] text-[#E91E8C] text-xs font-semibold border border-[#E91E8C]/20 hover:bg-[#FFE4EE] transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Screen: Not Serviceable ───────────────────────────────────── */}
        {screen === 'not-serviceable' && (
          <div className="p-6 pb-8">
            <button onClick={() => setScreen('pick')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
              <ArrowLeft size={15} /> Back
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#FFF0F5] flex items-center justify-center mx-auto mb-3">
                <MapPin size={28} className="text-[#E91E8C]" />
              </div>
              <h2 className="text-xl font-bold text-[#111827] mb-1">We&apos;re not in {pendingCity} yet</h2>
              <p className="text-sm text-gray-500">But we&apos;re expanding fast! Be the first to know.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (!email.trim()) return; setSubmitting(true); const existing = JSON.parse(localStorage.getItem('amarago_waitlist') || '[]'); existing.push({ email: email.trim(), city: pendingCity, at: new Date().toISOString() }); localStorage.setItem('amarago_waitlist', JSON.stringify(existing)); setTimeout(() => { setSubmitting(false); setScreen('waitlist-done'); }, 600); }} className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notify me when AmaraGo launches here</label>
              <div className="flex gap-2">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E91E8C]/30" />
                <button type="submit" disabled={submittingWaitlist} className="px-4 py-2.5 bg-[#E91E8C] text-white rounded-xl text-sm font-semibold hover:bg-[#C2185B] transition-colors disabled:opacity-60 flex items-center gap-1.5">
                  {submittingWaitlist ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
                  Notify
                </button>
              </div>
            </form>
            <button onClick={() => setScreen('pick')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#E91E8C]/40 bg-[#FFF0F5] text-[#E91E8C] text-sm font-semibold hover:bg-[#FFE4EE] transition-colors">
              <Gift size={14} /> Choose a different city
            </button>
          </div>
        )}

        {/* ── Screen: Waitlist done ─────────────────────────────────────── */}
        {screen === 'waitlist-done' && (
          <div className="p-6 pb-8 text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#111827] mb-1">You&apos;re on the list!</h2>
            <p className="text-sm text-gray-500 mb-5">We&apos;ll notify you when AmaraGo launches in {pendingCity}.</p>
            <button onClick={() => setScreen('pick')} className="text-sm text-[#E91E8C] font-semibold hover:underline">Choose a different city</button>
          </div>
        )}

      </div>
    </div>
  );
}
