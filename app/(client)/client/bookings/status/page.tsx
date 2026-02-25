"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingData {
  bookingId: string;
  service: { name: string; image: string };
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
  arriving: '28 mins',
  phone: '+919876543210',
};

export default function BookingStatus() {
  const router = useRouter();
  const [status, setStatus] = useState<'finding' | 'assigned'>('finding');
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [showConfirmed, setShowConfirmed] = useState<boolean>(true);

  useEffect(() => {
    const data = sessionStorage.getItem('currentBooking');
    if (data) setBooking(JSON.parse(data));

    const assignTimer = setTimeout(() => setStatus('assigned'), 2800);
    const hideTimer  = setTimeout(() => setShowConfirmed(false), 4000);
    return () => { clearTimeout(assignTimer); clearTimeout(hideTimer); };
  }, []);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-medium">
        Loading your booking...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 bg-white z-50 shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
          <button onClick={() => router.push('/client/home')} className="flex items-center gap-2 text-gray-700">
            <ArrowLeft size={26} /> Home
          </button>
          <div className="font-semibold text-lg">Booking #{booking.bookingId}</div>
        </div>
      </header>

      <main className="pt-24 px-4 max-w-xl mx-auto">
        {/* Status Indicator */}
        <div className="text-center mb-12">
          {status === 'finding' ? (
            <>
              <div className="w-20 h-20 mx-auto border-8 border-pink-200 border-t-[#e5849c] rounded-full animate-spin mb-6" />
              <h2 className="text-3xl font-semibold text-gray-800">Finding the best expert for you...</h2>
              <p className="text-gray-500 mt-3">This usually takes less than 30 seconds</p>
            </>
          ) : (
            <>
              <CheckCircle className="mx-auto text-green-500 size-24 mb-6" />
              <h2 className="text-4xl font-bold text-green-600">Expert Assigned!</h2>
            </>
          )}
        </div>

        {/* Expert Card */}
        {status === 'assigned' && (
          <div className="bg-white rounded-3xl p-8 shadow-xl mb-10">
            <div className="flex items-center gap-6">
              <img src={expert.image} alt={expert.name}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-pink-100" />
              <div className="flex-1">
                <div className="text-3xl font-semibold">{expert.name}</div>
                <div className="flex items-center gap-2 mt-2 text-amber-500">
                  ⭐ {expert.rating}
                  <span className="text-gray-400 text-base">({expert.reviews} reviews)</span>
                </div>
                <div className="mt-4 text-lg font-medium text-[#e5849c]">Arriving in {expert.arriving}</div>
              </div>
            </div>
            <a href={`tel:${expert.phone}`}
              className="mt-8 flex w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-7 rounded-3xl text-2xl font-semibold items-center justify-center gap-3 hover:brightness-110 transition">
              <Phone size={28} /> Call Expert Now
            </a>
          </div>
        )}

        {/* Booking Recap */}
        <div className="bg-white rounded-3xl p-8 shadow mb-12">
          <h3 className="uppercase tracking-widest text-xs text-gray-500 mb-4">YOUR BOOKING</h3>
          <div className="flex gap-5">
            <img src={booking.service.image} className="w-28 h-28 object-cover rounded-2xl" alt={booking.service.name} />
            <div>
              <div className="font-semibold text-2xl">{booking.service.name}</div>
              <div className="text-gray-600 mt-3">
                {booking.date} • {booking.time}<br />{booking.address}
              </div>
              <div className="mt-6 text-3xl font-bold text-[#e5849c]">₹{booking.total}</div>
            </div>
          </div>
        </div>

        {/* Confirmed Toast */}
        {showConfirmed && (
          <div className="bg-green-600 text-white text-center py-6 rounded-3xl font-semibold text-xl shadow-lg">
            🎉 Booking Confirmed! See you soon ✨
          </div>
        )}

        <Button onClick={() => router.push('/client/home')}
          className="w-full py-8 text-xl font-semibold bg-gray-900 text-white rounded-3xl mt-10">
          Back to Home
        </Button>
      </main>
    </div>
  );
}