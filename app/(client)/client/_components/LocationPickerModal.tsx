'use client';

import React, { useState } from 'react';
import { Search, MapPin, X, CheckCircle2, AlertCircle, ArrowLeft, BellRing, Gift, Loader2 } from 'lucide-react';
import { ALL_AREAS, SERVICEABLE_CITIES, isCityServiceable } from '@/lib/serviceable-cities';

interface Props {
  current: string;
  onSelect: (loc: string) => void;
  onClose: () => void;
}

export function LocationPickerModal({ current, onSelect, onClose }: Props) {
  const [input, setInput] = useState('');
  const [notServiceableCity, setNotServiceableCity] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);

  const handlePickCity = (loc: string) => {
    if (isCityServiceable(loc)) {
      onSelect(loc);
    } else {
      setNotServiceableCity(loc);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      handlePickCity(input.trim());
    }
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

  const suggestions = ALL_AREAS.filter(
    (s) => !input || s.toLowerCase().includes(input.toLowerCase())
  ).slice(0, 10);

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
          handlePickCity(suburb ? `${suburb}, ${city}` : city);
        } catch {
          handlePickCity('Mumbai, Maharashtra');
        }
      },
      () => handlePickCity('Mumbai, Maharashtra')
    );
  };

  // Show not-serviceable overlay when user picks a non-serviceable city
  if (notServiceableCity) {
    return (
      <NotServiceableOverlay
        city={notServiceableCity}
        email={email}
        setEmail={setEmail}
        submitting={submitting}
        waitlistDone={waitlistDone}
        onWaitlist={handleWaitlist}
        onBack={() => { setNotServiceableCity(''); setWaitlistDone(false); setEmail(''); }}
        onClose={onClose}
      />
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

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search area or city, press Enter…"
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

        {/* Serviceable city chips */}
        {!input && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Serving in</p>
            <div className="flex flex-wrap gap-2">
              {SERVICEABLE_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => onSelect(city)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF0F5] text-[#E91E8C] text-xs font-semibold border border-[#E91E8C]/20 hover:bg-[#FFE4EE] transition-colors"
                >
                  <CheckCircle2 size={11} />
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions list */}
        <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">
          {input ? 'Results' : 'Popular areas'}
        </p>
        <div>
          {suggestions.length > 0 ? (
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {suggestions.map((s) => {
                const serviceable = isCityServiceable(s);
                return (
                  <button
                    key={s}
                    onClick={() => handlePickCity(s)}
                    className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl text-sm hover:bg-pink-50 transition-colors ${
                      s === current ? 'bg-pink-50 text-[#E91E8C] font-semibold' : 'text-[#111827]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      {s}
                    </span>
                    {serviceable ? (
                      <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle size={13} className="text-gray-300 shrink-0" title="Not available yet" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : input.trim() ? (
            <button
              onClick={() => handlePickCity(input.trim())}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#111827] hover:bg-pink-50 transition-colors"
            >
              <MapPin size={13} className="text-gray-400 shrink-0" />
              Search for &quot;{input.trim()}&quot;
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Inline not-serviceable overlay used by LocationPickerModal ──────────────
function NotServiceableOverlay({
  city,
  email,
  setEmail,
  submitting,
  waitlistDone,
  onWaitlist,
  onBack,
  onClose,
}: {
  city: string;
  email: string;
  setEmail: (v: string) => void;
  submitting: boolean;
  waitlistDone: boolean;
  onWaitlist: (e: React.FormEvent) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 pb-8 md:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
        >
          <ArrowLeft size={15} /> Back
        </button>

        {!waitlistDone ? (
          <>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-[#FFF0F5] flex items-center justify-center mx-auto mb-3">
                <MapPin size={24} className="text-[#E91E8C]" />
              </div>
              <h3 className="text-lg font-bold text-[#111827] mb-1">
                We&apos;re not in {city} yet
              </h3>
              <p className="text-sm text-gray-500">
                Currently serving{' '}
                <span className="font-semibold text-[#E91E8C]">{SERVICEABLE_CITIES.join(', ')}</span>.
              </p>
            </div>

            <form onSubmit={onWaitlist} className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Notify me when we launch here
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
                  disabled={submitting}
                  className="px-4 py-2.5 bg-[#E91E8C] text-white rounded-xl text-sm font-semibold hover:bg-[#C2185B] transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
                  Notify
                </button>
              </div>
            </form>

            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#E91E8C]/40 bg-[#FFF0F5] text-[#E91E8C] text-sm font-semibold hover:bg-[#FFE4EE] transition-colors"
            >
              <Gift size={14} /> Choose a different city
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#111827] mb-1">You&apos;re on the list!</h3>
            <p className="text-sm text-gray-500 mb-5">
              We&apos;ll notify you when AmaraGo launches in {city}.
            </p>
            <button
              onClick={onBack}
              className="text-sm text-[#E91E8C] font-semibold hover:underline"
            >
              Choose a different city
            </button>
          </div>
        )}
      </div>
    </div>
  );
}