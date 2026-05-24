'use client';

import React, { useState } from 'react';
import { MapPin, BellRing, Gift, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SERVICEABLE_CITIES } from '@/lib/serviceable-cities';
import { useLocation } from '@/config/context/LocationContext';

export default function NotServiceablePage() {
  const router = useRouter();
  const { location, setLocation } = useLocation();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const cityName = location
    ? location.split(',').pop()?.trim() ?? location
    : 'your area';

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const existing = JSON.parse(localStorage.getItem('amarago_waitlist') || '[]');
      existing.push({ email: email.trim(), city: location, at: new Date().toISOString() });
      localStorage.setItem('amarago_waitlist', JSON.stringify(existing));
      await new Promise((r) => setTimeout(r, 600));
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFEAEF] flex flex-col items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center">

        {!done ? (
          <>
            <div className="w-20 h-20 rounded-full bg-[#FFF0F5] flex items-center justify-center mx-auto mb-5">
              <MapPin size={36} className="text-[#E91E8C]" />
            </div>

            <h1 className="text-2xl font-bold text-[#111827] mb-2">
              We&apos;re not in {cityName} yet
            </h1>
            <p className="text-gray-500 text-sm mb-2">
              AmaraGo is currently available in{' '}
              <span className="font-semibold text-[#E91E8C]">
                {SERVICEABLE_CITIES.join(', ')}
              </span>
              .
            </p>
            <p className="text-gray-400 text-sm mb-7">
              We&apos;re expanding fast — be the first to know when we launch near you!
            </p>

            {/* Waitlist */}
            <form onSubmit={handleWaitlist} className="mb-6">
              <label className="block text-xs font-semibold text-gray-600 text-left mb-1.5">
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
                  disabled={submitting}
                  className="px-4 py-2.5 bg-[#E91E8C] text-white rounded-xl text-sm font-semibold hover:bg-[#C2185B] transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
                  Notify me
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Gift booking */}
            <button
              onClick={() => {
                // Reset so gate modal appears to pick a new city
                setLocation('', { confirmed: false });
                router.push('/client/home');
              }}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-dashed border-[#E91E8C]/40 bg-[#FFF0F5] hover:bg-[#FFE4EE] transition-colors text-left mb-4"
            >
              <Gift size={22} className="text-[#E91E8C] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#111827]">Book for someone else</p>
                <p className="text-xs text-gray-500">
                  Choose a city where we already serve
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                setLocation('', { confirmed: false });
                router.push('/client/home');
              }}
              className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
            >
              ← Change my city
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={36} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#111827] mb-2">You&apos;re on the list!</h1>
            <p className="text-gray-500 text-sm mb-7">
              We&apos;ll notify you at <span className="font-semibold">{email}</span> as soon as
              AmaraGo launches in {cityName}.
            </p>

            <button
              onClick={() => {
                setLocation('', { confirmed: false });
                router.push('/client/home');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 mb-3 rounded-xl bg-[#FFF0F5] border border-[#E91E8C]/30 text-[#E91E8C] font-semibold text-sm hover:bg-[#FFE4EE] transition-colors"
            >
              <Gift size={16} />
              Book for someone else
            </button>

            <button
              onClick={() => {
                setLocation('', { confirmed: false });
                router.push('/client/home');
              }}
              className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
            >
              ← Back to home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
