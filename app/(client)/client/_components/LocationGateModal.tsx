'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  X,
  Loader2,
  CheckCircle2,
  BellRing,
  Gift,
  ArrowLeft,
} from 'lucide-react';
import { ALL_AREAS, SERVICEABLE_CITIES, isCityServiceable } from '@/lib/serviceable-cities';
import { useLocation } from '@/config/context/LocationContext';

type Screen = 'pick' | 'not-serviceable' | 'gift-city' | 'waitlist-done';

export function LocationGateModal() {
  const { locationConfirmed, setLocation, ready } = useLocation();

  const [screen, setScreen] = useState<Screen>('pick');
  const [input, setInput] = useState('');
  const [giftInput, setGiftInput] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [pendingCity, setPendingCity] = useState(''); // the non-serviceable city user selected
  const [email, setEmail] = useState('');
  const [submittingWaitlist, setSubmittingWaitlist] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when the modal opens
  useEffect(() => {
    if (ready && !locationConfirmed) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [ready, locationConfirmed]);

  // Don't render until localStorage has been read
  if (!ready) return null;
  // Hide when location is confirmed
  if (locationConfirmed) return null;

  const areaSuggestions = ALL_AREAS.filter(
    (a) => !input || a.toLowerCase().includes(input.toLowerCase())
  ).slice(0, 8);

  const giftAreaSuggestions = ALL_AREAS.filter(
    (a) => !giftInput || a.toLowerCase().includes(giftInput.toLowerCase())
  ).slice(0, 8);

  // ── GPS detection ────────────────────────────────────────────────────────
  const handleDetect = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const suburb = data.locality || '';
          const city = data.city || data.principalSubdivision || 'Mumbai';
          const full = suburb ? `${suburb}, ${city}` : city;
          handleSelectArea(full);
        } catch {
          handleSelectArea('Mumbai, Maharashtra');
        }
        setDetecting(false);
      },
      () => { setDetecting(false); },
      { timeout: 10000 }
    );
  };

  // ── Submit typed input (Enter key) ────────────────────────────────────────
  const handleInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      handleSelectArea(input.trim());
    }
  };

  // ── Area selected from suggestions or GPS ────────────────────────────────
  const handleSelectArea = (area: string) => {
    if (isCityServiceable(area)) {
      setLocation(area, { confirmed: true });
    } else {
      setPendingCity(area);
      setScreen('not-serviceable');
    }
  };

  // ── Gift city selected ────────────────────────────────────────────────────
  const handleSelectGiftArea = (area: string) => {
    if (isCityServiceable(area)) {
      setLocation(area, { confirmed: true, isGift: true });
    } else {
      // recipient city also not serviceable
      setPendingCity(area);
      setScreen('not-serviceable');
    }
  };

  // ── Waitlist submit (save email to localStorage for now) ─────────────────
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmittingWaitlist(true);
    try {
      // Save waitlist entry locally; replace with API call when backend ready
      const existing = JSON.parse(localStorage.getItem('amarago_waitlist') || '[]');
      existing.push({ email: email.trim(), city: pendingCity, at: new Date().toISOString() });
      localStorage.setItem('amarago_waitlist', JSON.stringify(existing));
      await new Promise((r) => setTimeout(r, 600)); // simulate network
      setScreen('waitlist-done');
    } finally {
      setSubmittingWaitlist(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div
        className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Screen: Pick City ─────────────────────────────────────────── */}
        {screen === 'pick' && (
          <div className="p-6 pb-8">
            {/* Brand header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-[#E91E8C] font-extrabold text-lg">Amara</span>
                <span className="text-[#111827] font-extrabold text-lg">Go</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-1">Where should we serve you?</h2>
            <p className="text-sm text-gray-500 mb-5">
              We&apos;ll show services available at your location.
            </p>

            {/* GPS button */}
            <button
              onClick={handleDetect}
              disabled={detecting}
              className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-xl bg-[#FFF0F5] border border-[#E91E8C]/30 text-[#E91E8C] font-semibold text-sm hover:bg-[#FFE4EE] transition-colors disabled:opacity-60"
            >
              {detecting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <MapPin size={16} />
              )}
              {detecting ? 'Detecting your location…' : 'Use my current location'}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or search</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputSubmit}
                placeholder="Search your area or city…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E91E8C]/30"
              />
            </div>

            {/* Serviceable cities chips */}
            {!input && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                  Serving in
                </p>
                <div className="flex flex-wrap gap-2">
                  {SERVICEABLE_CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleSelectArea(city)}
                      className="px-3 py-1.5 rounded-full bg-[#FFF0F5] text-[#E91E8C] text-xs font-semibold border border-[#E91E8C]/20 hover:bg-[#FFE4EE] transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Area suggestions */}
            {areaSuggestions.length > 0 && (
              <>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                  {input ? 'Results' : 'Popular areas'}
                </p>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {areaSuggestions.map((area) => (
                    <button
                      key={area}
                      onClick={() => handleSelectArea(area)}
                      className="w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-sm text-[#111827] hover:bg-pink-50 transition-colors"
                    >
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      {area}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* No results → show "not in area" option */}
            {input && areaSuggestions.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">
                  No results for &quot;{input}&quot;
                </p>
                <button
                  onClick={() => { setPendingCity(input); setScreen('not-serviceable'); }}
                  className="text-[#E91E8C] text-sm font-semibold hover:underline"
                >
                  Check if we&apos;re coming there →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Screen: Not Serviceable ───────────────────────────────────── */}
        {screen === 'not-serviceable' && (
          <div className="p-6 pb-8">
            <button
              onClick={() => setScreen('pick')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
            >
              <ArrowLeft size={15} /> Back
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#FFF0F5] flex items-center justify-center mx-auto mb-3">
                <MapPin size={28} className="text-[#E91E8C]" />
              </div>
              <h2 className="text-xl font-bold text-[#111827] mb-1">
                We&apos;re not in {pendingCity} yet
              </h2>
              <p className="text-sm text-gray-500">
                But we&apos;re expanding fast! Be the first to know when we launch near you.
              </p>
            </div>

            {/* Waitlist form */}
            <form onSubmit={handleWaitlistSubmit} className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Notify me when AmaraGo launches here
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E91E8C]/30"
                />
                <button
                  type="submit"
                  disabled={submittingWaitlist}
                  className="px-4 py-2.5 bg-[#E91E8C] text-white rounded-xl text-sm font-semibold hover:bg-[#C2185B] transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submittingWaitlist ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
                  Notify
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Gift / proxy booking CTA */}
            <button
              onClick={() => setScreen('gift-city')}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-[#E91E8C]/40 bg-[#FFF0F5] hover:bg-[#FFE4EE] transition-colors text-left"
            >
              <Gift size={20} className="text-[#E91E8C] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#111827]">Book for someone else</p>
                <p className="text-xs text-gray-500">
                  In a city we already serve? Book as a gift!
                </p>
              </div>
            </button>
          </div>
        )}

        {/* ── Screen: Gift City Picker ──────────────────────────────────── */}
        {screen === 'gift-city' && (
          <div className="p-6 pb-8">
            <button
              onClick={() => setScreen('not-serviceable')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
            >
              <ArrowLeft size={15} /> Back
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Gift size={18} className="text-[#E91E8C]" />
              <h2 className="text-xl font-bold text-[#111827]">Recipient&apos;s location</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Enter the city where the service should be delivered.
            </p>

            {/* Serviceable cities chips */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                We serve in
              </p>
              <div className="flex flex-wrap gap-2">
                {SERVICEABLE_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleSelectGiftArea(city)}
                    className="px-3 py-1.5 rounded-full bg-[#FFF0F5] text-[#E91E8C] text-xs font-semibold border border-[#E91E8C]/20 hover:bg-[#FFE4EE] transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                autoFocus
                value={giftInput}
                onChange={(e) => setGiftInput(e.target.value)}
                placeholder="Search recipient's area…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E91E8C]/30"
              />
            </div>

            {giftAreaSuggestions.length > 0 && (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {giftAreaSuggestions.map((area) => (
                  <button
                    key={area}
                    onClick={() => handleSelectGiftArea(area)}
                    className="w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-sm text-[#111827] hover:bg-pink-50 transition-colors"
                  >
                    <MapPin size={13} className="text-gray-400 shrink-0" />
                    {area}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Screen: Waitlist Done ─────────────────────────────────────── */}
        {screen === 'waitlist-done' && (
          <div className="p-6 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-2">You&apos;re on the list!</h2>
            <p className="text-sm text-gray-500 mb-6">
              We&apos;ll email you as soon as AmaraGo launches in {pendingCity}.
            </p>

            <button
              onClick={() => setScreen('gift-city')}
              className="w-full flex items-center justify-center gap-2 py-3 mb-3 rounded-xl bg-[#FFF0F5] border border-[#E91E8C]/30 text-[#E91E8C] font-semibold text-sm hover:bg-[#FFE4EE] transition-colors"
            >
              <Gift size={16} />
              Book for someone else
            </button>

            <button
              onClick={() => setScreen('pick')}
              className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
            >
              Change city
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
