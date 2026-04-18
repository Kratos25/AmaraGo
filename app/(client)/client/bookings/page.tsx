"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, MapPin, ChevronDown, Search, Star, CheckCircle,
  XCircle, Loader2, X, Phone, Shield, Award, Edit2, ChevronRight,
} from 'lucide-react';
import { bookingsAPI, providersAPI, type Booking as APIBooking, type ProviderProfile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { BookingListSkeleton } from '@/components/ui/skeletons';

type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  booking_ref?: string;
  api_status: string;       // raw API status (pending/confirmed/active/completed/cancelled)
  provider_id?: string;
  service: string;
  expert: string;
  expertRating: number;
  date: string;
  time: string;
  duration: string;
  address: string;
  price: number;
  status: BookingStatus;
  hasClientReview: boolean;
  clientReviewRating?: number;
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

// ─── Edit Booking Modal ───────────────────────────────────────────────────────

function EditBookingModal({
  booking,
  onClose,
  onSaved,
}: {
  booking: Booking;
  onClose: () => void;
  onSaved: (bookingId: string, date: string, time: string) => void;
}) {
  const { toast } = useToast();
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState(booking.time);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Available time slots, filtered to not show past times for today
  const ALL_SLOTS = [
    '08:00 AM','09:00 AM','10:00 AM','11:00 AM',
    '12:00 PM','01:00 PM','02:00 PM','03:00 PM',
    '04:00 PM','05:00 PM','06:00 PM','07:00 PM',
  ];

  const availableSlots = date === today
    ? ALL_SLOTS.filter((slot) => {
        const [h, m] = slot.replace(/ AM| PM/, '').split(':').map(Number);
        const isPM = slot.endsWith('PM');
        const slotHour = isPM && h !== 12 ? h + 12 : (!isPM && h === 12 ? 0 : h);
        const now = new Date();
        return slotHour > now.getHours() || (slotHour === now.getHours() && m > now.getMinutes());
      })
    : ALL_SLOTS;

  const handleSave = async () => {
    if (!date || !time) return;
    setSaving(true);
    try {
      await bookingsAPI.update(booking.id, { date, time });
      onSaved(booking.id, date, time);
      toast({ title: 'Booking updated!', description: `Rescheduled to ${date} at ${time}.` });
      onClose();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err?.response?.data?.detail ?? 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-[#111827] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-white">Edit Booking</h2>
            <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{booking.service}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <Calendar size={12} className="inline mr-1 text-[#e5849c]" /> Date
            </label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => { setDate(e.target.value); setTime(''); }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#e5849c] focus:ring-1 focus:ring-[#e5849c]/20"
            />
          </div>

          {/* Time slots */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <Clock size={12} className="inline mr-1 text-[#e5849c]" /> Time
            </label>
            {availableSlots.length === 0 ? (
              <p className="text-xs text-red-500 py-2">No slots available today — please pick another date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={`py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      time === slot
                        ? 'bg-[#e5849c] border-[#e5849c] text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#e5849c] hover:text-[#e5849c]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!date || !time || saving}
            className="flex-1 py-3 rounded-2xl bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider Details Panel ───────────────────────────────────────────────────

function ProviderDetailsPanel({ providerId }: { providerId: string }) {
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providersAPI.getById(providerId)
      .then(({ data }) => setProvider(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [providerId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
        <Loader2 size={12} className="animate-spin text-[#e5849c]" /> Loading provider details…
      </div>
    );
  }

  if (!provider) return null;

  return (
    <div className="space-y-3">
      {/* Provider header */}
      <div className="flex items-center gap-3 p-3 bg-[#fdf0f3] rounded-xl border border-[#e5849c]/20">
        <div className="w-12 h-12 rounded-full bg-white border-2 border-[#e5849c]/20 flex items-center justify-center text-xl overflow-hidden shrink-0">
          {provider.profile_image
            ? <img src={provider.profile_image} alt={provider.name} className="w-full h-full object-cover" />
            : '👤'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#111827] text-sm">{provider.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] text-gray-600">{provider.rating?.toFixed(1) ?? '–'} · {provider.total_jobs} jobs done</span>
          </div>
          {provider.location && (
            <p className="text-[10px] text-gray-400 mt-0.5"><MapPin size={9} className="inline mr-0.5" />{provider.location}</p>
          )}
        </div>
        {provider.phone && (
          <a
            href={`tel:${provider.phone}`}
            className="w-9 h-9 rounded-full bg-[#e5849c] flex items-center justify-center shrink-0 hover:bg-[#d4738b] transition-colors"
          >
            <Phone size={14} className="text-white" />
          </a>
        )}
      </div>

      {/* Experience + bio */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
          <p className="text-base font-black text-[#e5849c]">{provider.experience_years}</p>
          <p className="text-[10px] text-gray-400">Years Exp.</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
          <p className="text-base font-black text-[#e5849c]">{provider.total_jobs}</p>
          <p className="text-[10px] text-gray-400">Jobs Done</p>
        </div>
      </div>

      {provider.bio && (
        <p className="text-xs text-gray-500 leading-relaxed px-1">{provider.bio}</p>
      )}

      {/* Certifications */}
      {provider.certifications && provider.certifications.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Award size={10} /> Certifications
          </p>
          <div className="space-y-1">
            {provider.certifications.map((cert, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
                <Shield size={11} className="text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-700 truncate">{cert.name}</p>
                  {cert.issuer && <p className="text-[10px] text-gray-400 truncate">{cert.issuer}{cert.year ? ` · ${cert.year}` : ''}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services offered */}
      {provider.services_offered && provider.services_offered.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Services Offered</p>
          <div className="flex flex-wrap gap-1">
            {provider.services_offered.map((s, i) => (
              <span key={i} className="text-[10px] font-medium px-2.5 py-1 bg-[#fdf0f3] text-[#e5849c] border border-[#e5849c]/20 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Star picker ──────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-3 justify-center my-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="text-4xl transition-all hover:scale-125 focus:outline-none leading-none"
        >
          <span className={n <= (hovered || value) ? 'text-amber-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  );
}

// ─── Rate Service Modal (client → provider) ───────────────────────────────────

function RateServiceModal({
  booking,
  onClose,
  onDone,
}: {
  booking: { id: string; service: string; expert: string };
  onClose: () => void;
  onDone: (bookingId: string, rating: number, comment: string) => Promise<void>;
}) {
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await onDone(booking.id, rating, comment.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#111827] px-6 py-5 text-center relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
          <div className="text-3xl mb-2">⭐</div>
          <h2 className="text-white font-bold text-lg">Rate Your Experience</h2>
          <p className="text-white/50 text-xs mt-1 line-clamp-1">{booking.service}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {booking.expert && booking.expert !== 'Pending Assignment' && (
            <p className="text-center text-sm text-gray-500 mb-4">
              How was your experience with <span className="font-semibold text-[#1A1A1A]">{booking.expert}</span>?
            </p>
          )}

          <StarPicker value={rating} onChange={setRating} />

          {rating > 0 && (
            <p className="text-center text-sm font-semibold text-amber-500 mt-1 mb-4">
              {labels[rating]}
            </p>
          )}

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about your experience (optional)…"
            rows={3}
            maxLength={500}
            className="w-full mt-3 px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-none focus:outline-none focus:border-[#e5849c] transition-colors"
          />

          <button
            disabled={!rating || submitting}
            onClick={submit}
            className="mt-4 w-full h-12 rounded-2xl bg-[#111827] hover:bg-[#1f2937] disabled:opacity-40 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>Submit Review</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Bookings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | BookingStatus>('all');
  const [search, setSearch]       = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [apiBookings, setApiBookings] = useState<APIBooking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [ratingModal, setRatingModal] = useState<{ id: string; service: string; expert: string } | null>(null);
  const [editModal, setEditModal]   = useState<Booking | null>(null);
  const { toast } = useToast();

  const handleSubmitReview = async (bookingId: string, rating: number, comment: string) => {
    await bookingsAPI.submitProviderReview(bookingId, { rating, comment });
    setApiBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, client_review: { rating, comment, created_at: new Date().toISOString() } }
          : b
      )
    );
    toast({ title: 'Review submitted!', description: `You gave ${rating} star${rating !== 1 ? 's' : ''}.` });
  };

  const handleEditSaved = (bookingId: string, date: string, time: string) => {
    setApiBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, date, time } : b));
  };

  useEffect(() => {
    bookingsAPI.list()
      .then(({ data }) => setApiBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allBookings: Booking[] = apiBookings.map((b) => ({
    id: b.id,
    booking_ref: b.booking_ref,
    api_status: b.status,
    provider_id: b.provider_id,
    service: b.service_name ?? 'Service',
    expert: b.provider_name ?? 'Pending Assignment',
    expertRating: 0,
    date: b.date,
    time: b.time,
    duration: '',
    address: b.address,
    price: b.total_price,
    status: (b.status === 'completed' ? 'completed' : b.status === 'cancelled' ? 'cancelled' : 'upcoming') as BookingStatus,
    hasClientReview: !!b.client_review,
    clientReviewRating: b.client_review?.rating,
  }));

  const upcoming = allBookings.filter((b) => b.status === 'upcoming').length;

  const filtered = allBookings
    .filter((b) => activeTab === 'all' || b.status === activeTab)
    .filter((b) =>
      b.service.toLowerCase().includes(search.toLowerCase()) ||
      b.expert.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <>
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
          <BookingListSkeleton count={4} />
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

                      <p className="text-[11px] text-gray-400 mb-2">
                        {booking.booking_ref
                          ? <span className="font-bold text-[#e5849c]">{booking.booking_ref}</span>
                          : `#${booking.id.slice(0, 8)}`}
                      </p>

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

                      {/* Edit button — only for pending bookings */}
                      {booking.api_status === 'pending' && (
                        <button
                          onClick={() => setEditModal(booking)}
                          className="flex items-center gap-1 border border-[#e5849c] text-[#e5849c] hover:bg-[#fdf0f3] text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                        >
                          <Edit2 size={10} /> Edit
                        </button>
                      )}

                      {booking.status === 'upcoming' && booking.api_status !== 'pending' && (
                        <button className="bg-[#e5849c] hover:bg-[#d4738b] text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors">
                          Track
                        </button>
                      )}
                      {booking.status === 'completed' && !booking.hasClientReview && (
                        <button
                          onClick={() => setRatingModal({ id: booking.id, service: booking.service, expert: booking.expert })}
                          className="flex items-center gap-1 bg-amber-400 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors"
                        >
                          <Star size={11} fill="white" /> Rate
                        </button>
                      )}
                      {booking.status === 'completed' && booking.hasClientReview && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                          {'★'.repeat(booking.clientReviewRating ?? 0)}
                          {'☆'.repeat(5 - (booking.clientReviewRating ?? 0))}
                        </span>
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

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t border-gray-50 px-4 py-4 space-y-4">
                      {/* Address */}
                      {booking.address && (
                        <div className="flex items-start gap-2">
                          <MapPin size={13} className="text-[#e5849c] flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-500 leading-relaxed">{booking.address}</p>
                        </div>
                      )}

                      {/* Provider details */}
                      {booking.provider_id ? (
                        <>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Service Provider</p>
                          <ProviderDetailsPanel providerId={booking.provider_id} />
                        </>
                      ) : booking.api_status === 'pending' ? (
                        <div className="flex items-center gap-2 py-2 px-3 bg-amber-50 border border-amber-100 rounded-xl">
                          <Loader2 size={12} className="text-amber-500 animate-spin shrink-0" />
                          <p className="text-xs text-amber-600">We're matching you with a provider — check back soon.</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* ── Rate service modal ── */}
    {ratingModal && (
      <RateServiceModal
        booking={ratingModal}
        onClose={() => setRatingModal(null)}
        onDone={handleSubmitReview}
      />
    )}

    {/* ── Edit booking modal ── */}
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