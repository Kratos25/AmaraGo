"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, ChevronDown, Search, Star, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { bookingsAPI, type Booking as APIBooking } from '@/lib/api';

type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  service: string;
  expert: string;
  expertRating: number;
  date: string;
  time: string;
  duration: string;
  address: string;
  price: number;
  status: BookingStatus;
}

const statusConfig: Record<BookingStatus, { label: string; textColor: string; bgColor: string; icon: React.ReactNode }> = {
  upcoming:  { label: 'Upcoming',  textColor: 'text-blue-600',  bgColor: 'bg-blue-50',  icon: <Loader2 size={11} className="text-blue-500 animate-spin" /> },
  completed: { label: 'Completed', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: <CheckCircle size={11} className="text-emerald-500" /> },
  cancelled: { label: 'Cancelled', textColor: 'text-red-500',   bgColor: 'bg-red-50',   icon: <XCircle size={11} className="text-red-500" /> },
};

const tabs: { key: 'all' | BookingStatus; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'upcoming',  label: 'Upcoming'  },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function Bookings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | BookingStatus>('all');
  const [search, setSearch]       = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [apiBookings, setApiBookings] = useState<APIBooking[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    bookingsAPI.list()
      .then(({ data }) => setApiBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allBookings: Booking[] = apiBookings.map((b) => ({
    id: b.id,
    service: b.service_name ?? 'Service',
    expert: b.provider_name ?? 'Pending Assignment',
    expertRating: 0,
    date: b.date,
    time: b.time,
    duration: '',
    address: b.address,
    price: b.total_price,
    status: (b.status === 'completed' ? 'completed' : b.status === 'cancelled' ? 'cancelled' : 'upcoming') as BookingStatus,
  }));

  const upcoming = allBookings.filter((b) => b.status === 'upcoming').length;

  const filtered = allBookings
    .filter((b) => activeTab === 'all' || b.status === activeTab)
    .filter((b) =>
      b.service.toLowerCase().includes(search.toLowerCase()) ||
      b.expert.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Dark hero header ── */}
      <div className="bg-[#111827] px-4 pt-8 pb-8 md:pt-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-white/40 text-xs tracking-widest uppercase mb-1">My</p>
          <h1 className="text-3xl font-extrabold text-white mb-6">Bookings</h1>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: allBookings.length,                                            label: 'Total'    },
              { val: upcoming,                                                       label: 'Upcoming' },
              { val: allBookings.filter((b) => b.status === 'completed').length,   label: 'Done'     },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-extrabold text-white">{s.val}</p>
                <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-28 md:pb-10">

        {/* ── Search ── */}
        <div className="relative mt-5 mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search service or provider…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-gray-100 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#e5849c] shadow-sm transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-[#111827] text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-[#e5849c] hover:text-[#e5849c]'
              }`}
            >
              {tab.label}
              {tab.key === 'upcoming' && upcoming > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-[#e5849c]/10 text-[#e5849c]'}`}>
                  {upcoming}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Cards ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mb-4">📋</div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">No bookings found</h3>
            <p className="text-sm text-gray-400 mb-6">
              {search ? 'Try a different search term' : 'Book a service and it will appear here'}
            </p>
            <button
              onClick={() => router.push('/client/services')}
              className="bg-[#e5849c] hover:bg-[#d4738b] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Explore Services
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking) => {
              const cfg = statusConfig[booking.status];
              const isOpen = expandedId === booking.id;

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[#e5849c]/20 hover:shadow-sm transition-all"
                >
                  {/* Main row */}
                  <div className="flex gap-4 p-4">
                    {/* Icon tile */}
                    <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-[#111827] flex items-center justify-center text-2xl">
                      {booking.service.toLowerCase().includes('hair') ? '💇'
                        : booking.service.toLowerCase().includes('nail') ? '💅'
                        : booking.service.toLowerCase().includes('massage') ? '🧖'
                        : booking.service.toLowerCase().includes('facial') ? '✨'
                        : booking.service.toLowerCase().includes('makeup') ? '💄'
                        : '🌸'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-[#111827] text-sm leading-tight line-clamp-2">{booking.service}</p>
                        <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-400 mb-2">#{booking.id}</p>

                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar size={11} className="text-[#e5849c]" />
                          {booking.date} · {booking.time}
                        </span>
                        {booking.expert && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Star size={11} className="text-[#e5849c]" />
                            {booking.expert}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price + actions bar */}
                  <div className="border-t border-gray-50 flex items-center justify-between px-4 py-3 gap-3">
                    <p className="font-bold text-[#111827] text-base">₹{booking.price.toLocaleString('en-IN')}</p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedId(isOpen ? null : booking.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#e5849c] transition-colors"
                      >
                        {isOpen ? 'Hide' : 'Details'}
                        <ChevronDown size={13} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {booking.status === 'upcoming' && (
                        <button className="bg-[#e5849c] hover:bg-[#d4738b] text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors">
                          Track
                        </button>
                      )}
                      {booking.status === 'completed' && (
                        <button
                          onClick={() => router.push('/client/services')}
                          className="bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors"
                        >
                          Book Again
                        </button>
                      )}
                      {booking.status === 'cancelled' && (
                        <button
                          onClick={() => router.push('/client/services')}
                          className="bg-[#111827] hover:bg-[#1f2937] text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors"
                        >
                          Rebook
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded address */}
                  {isOpen && booking.address && (
                    <div className="border-t border-gray-50 px-4 py-3 flex items-start gap-2">
                      <MapPin size={13} className="text-[#e5849c] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 leading-relaxed">{booking.address}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
