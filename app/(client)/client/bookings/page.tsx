"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { bookingsAPI, servicesAPI, type Booking as APIBooking } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { BookingListSkeleton } from '@/components/ui/skeletons';

import { BookingCard }      from './_components/BookingCard';
import { EditBookingModal } from './_components/EditBookingModal';
import { RateServiceModal } from './_components/RateServiceModal';
import type { Booking, BookingStatus } from './_components/types';

const TABS: { key: 'all' | BookingStatus; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'upcoming',  label: 'Upcoming'  },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function BookingsPage() {
  const router    = useRouter();
  const { toast } = useToast();

  const [activeTab,   setActiveTab]   = useState<'all' | BookingStatus>('upcoming');
  const [search,      setSearch]      = useState('');
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [apiBookings, setApiBookings] = useState<APIBooking[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [ratingModal, setRatingModal] = useState<{ id: string; service: string; expert: string } | null>(null);
  const [editModal,   setEditModal]   = useState<Booking | null>(null);
  const [serviceImages, setServiceImages] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      bookingsAPI.list(),
      servicesAPI.list({ active: true }).catch(() => ({ data: [] })),
    ])
      .then(([bookingsRes, servicesRes]) => {
        setApiBookings(bookingsRes.data.items);
        const imgMap: Record<string, string> = {};
        servicesRes.data.forEach((s) => {
          if (s.image_url) imgMap[s.name.toLowerCase()] = s.image_url;
        });
        setServiceImages(imgMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const allBookings: Booking[] = apiBookings.map((b) => ({
    id:                 b.id,
    booking_ref:        b.booking_ref,
    api_status:         b.status,
    provider_id:        b.provider_id,
    service:            b.service_name  ?? 'Service',
    serviceImage:       serviceImages[(b.service_name ?? '').toLowerCase()],
    expert:             b.provider_name ?? 'Pending Assignment',
    expertRating:       0,
    date:               b.date,
    time:               b.time,
    duration:           '',
    address:            b.address,
    price:              b.total_price,
    status: (
      b.status === 'completed' ? 'completed'
      : b.status === 'cancelled' ? 'cancelled'
      : 'upcoming'
    ) as BookingStatus,
    hasClientReview:    !!b.client_review,
    clientReviewRating: b.client_review?.rating,
    no_providers_in_area: b.no_providers_in_area ?? false,
    offered_to_count:   b.offered_to?.length ?? 0,
  }));

  const totalCount     = allBookings.length;
  const upcomingCount  = allBookings.filter((b) => b.status === 'upcoming').length;
  const completedCount = allBookings.filter((b) => b.status === 'completed').length;

  const filtered = allBookings
    .filter((b) => activeTab === 'all' || b.status === activeTab)
    .filter((b) =>
      b.service.toLowerCase().includes(search.toLowerCase()) ||
      b.expert.toLowerCase().includes(search.toLowerCase()),
    );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSubmitReview = async (bookingId: string, rating: number, comment: string) => {
    await bookingsAPI.submitProviderReview(bookingId, { rating, comment });
    setApiBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, client_review: { rating, comment, created_at: new Date().toISOString() } }
          : b,
      ),
    );
    toast({ title: 'Review submitted!', description: `You gave ${rating} star${rating !== 1 ? 's' : ''}.` });
  };

  const handleEditSaved = (bookingId: string, date: string, time: string) => {
    setApiBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, date, time } : b)),
    );
  };

  const handleCancel = async (bookingId: string) => {
    await bookingsAPI.cancel(bookingId);
    setApiBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b,
      ),
    );
    toast({ title: 'Booking cancelled', description: 'Your booking has been cancelled.' });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const cancelledCount = allBookings.filter((b) => b.status === 'cancelled').length;

  const statCards = (
    <div className="grid grid-cols-3 md:grid-cols-1 gap-2 sm:gap-3">
      {[
        { val: String(totalCount).padStart(2, '0'),     label: 'Total',     color: 'text-[#E8708E]', bg: 'bg-[#E8708E]/10', border: 'border-[#E8708E]/30' },
        { val: String(upcomingCount).padStart(2, '0'),   label: 'Upcoming',  color: 'text-[#E8708E]', bg: 'bg-[#E8708E]/10', border: 'border-[#E8708E]/30' },
        { val: String(completedCount).padStart(2, '0'),  label: 'Completed', color: 'text-green-600',  bg: 'bg-green-50',     border: 'border-green-200'     },
        { val: String(cancelledCount).padStart(2, '0'),  label: 'Cancelled', color: 'text-gray-500',   bg: 'bg-gray-50',      border: 'border-gray-200'      },
      ].map((s) => (
        <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-3 py-3 md:py-4 text-center md:text-left md:flex md:items-center md:gap-4`}>
          <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${s.color} leading-none mb-1 md:mb-0`}>{s.val}</p>
          <p className={`text-[10px] sm:text-xs ${s.color} font-medium opacity-70`}>{s.label}</p>
        </div>
      ))}
    </div>
  );

  const searchAndTabs = (
    <>
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search service or provider…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#d4537e] shadow-sm transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-0 border-b border-gray-200 mb-4 sm:mb-5 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[#d4537e] text-[#d4537e]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );

  const bookingsList = loading ? (
    <BookingListSkeleton count={3} />
  ) : filtered.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-3xl mb-4 shadow-sm">
        📋
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">No bookings found</h3>
      <p className="text-sm text-gray-400 mb-6">
        {search ? 'Try a different search term' : 'Book a service and it will appear here'}
      </p>
      <button
        onClick={() => router.push('/client/services')}
        className="bg-[#d4537e] hover:bg-[#c0476f] text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
      >
        Explore Services
      </button>
    </div>
  ) : (
    <div className="space-y-4">
      {filtered.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          isOpen={expandedId === booking.id}
          onToggle={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
          onEdit={setEditModal}
          onRate={setRatingModal}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-[#fdf6f8]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-28 md:pb-12">

          <h1 className="text-xl md:text-2xl font-semibold text-[#111827] mb-4 md:mb-6">My Bookings</h1>

          {/* ── Mobile layout: stacked ── */}
          <div className="md:hidden">
            {statCards}
            <div className="mt-5">
              {searchAndTabs}
              {bookingsList}
            </div>
          </div>

          {/* ── Desktop layout: sidebar + main ── */}
          <div className="hidden md:flex gap-8 items-start">

            {/* Left sidebar — stats + quick filter */}
            <div className="w-[220px] lg:w-[260px] flex-shrink-0 sticky top-24 space-y-5">
              {statCards}

              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
                <button
                  onClick={() => router.push('/client/services')}
                  className="w-full text-sm font-semibold text-[#e5849c] border border-[#e5849c]/30 py-2.5 rounded-xl hover:bg-[#fdf0f3] transition-colors"
                >
                  + Book a Service
                </button>
              </div>
            </div>

            {/* Right — search, tabs, cards */}
            <div className="flex-1 min-w-0">
              {searchAndTabs}
              {bookingsList}
            </div>
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
      {ratingModal && (
        <RateServiceModal
          booking={ratingModal}
          onClose={() => setRatingModal(null)}
          onDone={handleSubmitReview}
        />
      )}
      {editModal && (
        <EditBookingModal
          booking={editModal}
          onClose={() => setEditModal(null)}
          onSaved={handleEditSaved}
        />
      )}
    </>
  );
}