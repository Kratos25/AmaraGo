"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { bookingsAPI, type Booking as APIBooking } from '@/lib/api';
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

  useEffect(() => {
    bookingsAPI
      .list()
      .then(({ data }) => setApiBookings(data))
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-[#fdf6f8]">
        <div className="max-full mx-auto px-24 pt-8 pb-28 md:pb-12">

          {/* ── Stat cards ── */}
          <div className="w-[50%] grid grid-cols-3 gap-3 mb-8">
            {[
              { val: String(totalCount).padStart(2, '0'),                          label: 'Total Bookings'     },
              { val: String(upcomingCount).padStart(2, '0'),                       label: 'Upcoming Bookings'  },
              { val: String(completedCount).padStart(2, '0'),                      label: 'Completed Bookings' },
            ].map((s) => (
              <div
                key={s.label}
                className="w- bg-[#E8708E]/10 border border-[#E8708E] rounded-2xl px-2 py-3 text-center"
              >
                <p className="text-2xl font-semibold text-[#E8708E] leading-none mb-1">{s.val}</p>
                <div className="h-0.5 w-16 border border-[#E8708E]/50 mx-auto mb-1" />
                <p className="text-base text-[#E8708E]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Title ── */}
          <h1 className="text-2xl font-semibold text-[#111827] mb-5">My Bookings</h1>

          {/* ── Search ── */}
          <div className="relative mb-5">
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

          {/* ── Tabs + sort ── */}
          <div className="flex items-center justify-between border-b border-gray-200 mb-5">
            <div className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-[#d4537e] text-[#d4537e]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 pb-2 transition-colors">
              <ArrowUpDown size={14} /> Sort by
            </button>
          </div>

          {/* ── Cards ── */}
          {loading ? (
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
                />
              ))}

              {/* Load more */}
              <div className="text-center pt-4">
                <button className="text-sm font-medium text-[#E8708E] hover:text-[#E8708E]/90 underline underline-offset-2 transition-colors">
                  Load More
                </button>
              </div>
            </div>
          )}

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