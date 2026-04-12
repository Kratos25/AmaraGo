"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, Phone, ArrowLeft, MapPin,
  Calendar, Clock, Star, Share2, MessageCircle
} from 'lucide-react';

interface BookingData {
  bookingId: string;
  service: { name: string; image: string; category: string };
  date: string;
  time: string;
  address: string;
  total: number;
}

const expert = {
  name: 'Priya Sharma',
  image: 'https://randomuser.me/api/portraits/women/44.jpg',
  rating: 4.9,
  reviews: 342,
  arriving: 28,
  phone: '+919876543210',
  speciality: 'Hair & Skin Specialist',
  completedJobs: '1.2k+',
};

const steps = [
  { id: 1, label: 'Booking Confirmed',  icon: '✅', done: true  },
  { id: 2, label: 'Expert Assigned',    icon: '👩‍💼', done: true  },
  { id: 3, label: 'Expert on the way',  icon: '🛵', done: false },
  { id: 4, label: 'Service in progress',icon: '✨', done: false },
];

export default function BookingStatus() {
  const router = useRouter();
  const [status, setStatus] = useState<'finding' | 'assigned'>('finding');
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [countdown, setCountdown] = useState(28);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem('currentBooking');
    if (data) setBooking(JSON.parse(data));

    const assignTimer = setTimeout(() => {
      setStatus('assigned');
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3500);
    }, 2800);

    return () => clearTimeout(assignTimer);
  }, []);

  // Countdown timer once assigned
  useEffect(() => {
    if (status !== 'assigned') return;
    const t = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 60000);
    return () => clearInterval(t);
  }, [status]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#fdf6f8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-4 border-pink-200 border-t-[#e5849c] rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Toast Notification ── */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${
        toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 whitespace-nowrap">
          <span className="text-lg">🎉</span>
          <span className="font-semibold text-sm">Expert assigned! She's on her way.</span>
        </div>
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#111827]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/client/home')}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-white">Booking Status</h1>
            <p className="text-xs text-white/40">#{booking.bookingId}</p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            <Share2 size={16} className="text-white" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-5">

        {/* ── Finding / Assigned Hero ── */}
        {status === 'finding' ? (
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
            {/* Pulsing rings */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-[#e5849c]/20 animate-ping opacity-40" />
              <div className="absolute inset-2 rounded-full bg-[#e5849c]/30 animate-ping opacity-30" style={{ animationDelay: '0.3s' }} />
              <div className="relative w-full h-full rounded-full bg-[#111827] flex items-center justify-center shadow-lg shadow-gray-300">
                <span className="text-3xl">🔍</span>
              </div>
            </div>
            <h2 className="font-bold text-xl text-gray-900">Finding your expert...</h2>
            <p className="text-sm text-gray-500 mt-2">Matching you with the best available specialist</p>

            {/* Skeleton expert preview */}
            <div className="mt-6 flex items-center gap-4 bg-gray-50 rounded-2xl p-4 animate-pulse">
              <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded-full w-2/3" />
                <div className="h-3 bg-gray-200 rounded-full w-1/2" />
              </div>
            </div>
          </section>
        ) : (
          /* ── Expert Card ── */
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Gradient top bar */}
            <div className="h-2 bg-gradient-to-r from-[#e5849c] to-[#E5AFBC]" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Expert Assigned
                </span>
                <span className="text-xs text-gray-400 font-medium">Arriving in {countdown} min</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={expert.image}
                    alt={expert.name}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                  <div className="absolute -bottom-1.5 -right-1.5 bg-green-500 w-5 h-5 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-lg">{expert.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{expert.speciality}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-gray-800">{expert.rating}</span>
                      <span className="text-xs text-gray-400">({expert.reviews})</span>
                    </div>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{expert.completedJobs} services</span>
                  </div>
                </div>
              </div>

              {/* Arrival progress bar */}
              <div className="mt-5">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Expert on the way</span>
                  <span className="font-semibold text-[#e5849c]">{countdown} min away</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#e5849c] to-[#d4607a] rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(5, ((28 - countdown) / 28) * 100)}%` }}
                  />
                </div>
              </div>

              {/* CTA row */}
              <div className="flex gap-3 mt-5">
                <a
                  href={`tel:${expert.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-100 hover:brightness-105 transition-all active:scale-95"
                >
                  <Phone size={16} /> Call Expert
                </a>
                <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-95">
                  <MessageCircle size={16} /> Message
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Progress Tracker ── */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-5">Live Tracking</h3>
          <div className="space-y-0">
            {steps.map((step, i) => {
              const isLast = i === steps.length - 1;
              const isActive = !step.done && (i === 0 || steps[i - 1].done);
              return (
                <div key={step.id} className="flex gap-4">
                  {/* Line + icon column */}
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 border-2 transition-all ${
                      step.done
                        ? 'bg-[#e5849c] border-[#e5849c] text-white shadow-md shadow-rose-100'
                        : isActive
                        ? 'bg-[#fff5f7] border-[#e5849c] animate-pulse'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      {step.done ? <CheckCircle size={16} /> : <span>{step.icon}</span>}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-8 mt-1 rounded-full ${step.done ? 'bg-[#e5849c]' : 'bg-gray-100'}`} />
                    )}
                  </div>
                  {/* Label */}
                  <div className="pt-1.5 pb-8">
                    <p className={`text-sm font-semibold ${
                      step.done ? 'text-gray-900' : isActive ? 'text-[#e5849c]' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-gray-400 mt-0.5">In progress...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Booking Details Card ── */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Booking Details</h3>
          </div>
          <div className="p-5">
            <div className="flex gap-4">
              <img
                src={booking.service.image}
                className="w-20 h-20 object-cover rounded-2xl flex-shrink-0"
                alt={booking.service.name}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 leading-tight">{booking.service.name}</p>
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={11} className="text-[#e5849c]" />
                    <span>{booking.date}</span>
                    <Clock size={11} className="text-[#e5849c] ml-1" />
                    <span>{booking.time}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <MapPin size={11} className="text-[#e5849c] mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{booking.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Amount Paid</p>
                <p className="text-2xl font-black text-[#e5849c]">₹{booking.total}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Booking ID</p>
                <p className="text-sm font-bold text-gray-700">#{booking.bookingId}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Help & Safety ── */}
        <section className="bg-[#111827] rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="font-bold text-white text-sm">Your safety is our priority</p>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
                All our experts are background-verified and trained. You can share your live status with a trusted contact.
              </p>
              <button className="mt-3 text-xs font-bold text-[#e5849c] hover:text-[#f099b0] transition-colors">
                Share live status →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* /* ── Floating Back to Home ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/client/home')}
            className="w-full h-14 rounded-2xl bg-gray-900 text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98]"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}