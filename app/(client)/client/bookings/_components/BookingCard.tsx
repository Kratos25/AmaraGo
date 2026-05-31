"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, ChevronDown, Loader2, AlertTriangle, Search } from 'lucide-react';
import { ProviderDetailsPanel } from './ProviderDetailsPanel';
import type { Booking } from './types';

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, apiStatus }: { status: Booking['status']; apiStatus: string }) {
  if (apiStatus === 'active' || apiStatus === 'in_progress') {
    return (
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-green-600">
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        In Progress
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span className="text-[13px] font-medium px-4 py-1 rounded-full bg-[#fce8ef] text-[#e0608a]">
        {apiStatus === 'pending' ? 'Pending' : 'Confirmed'}
      </span>
    );
  }
  if (status === 'completed') {
    return <span className="text-[13px] font-medium text-green-600">Completed</span>;
  }
  return <span className="text-[13px] font-medium text-red-500">Cancelled</span>;
}

// ── Service thumbnail ─────────────────────────────────────────────────────────

function ServiceThumb({ service, image }: { service: string; image?: string }) {
  if (image) {
    return <img src={image} alt={service} className="w-full h-full object-cover" />;
  }
  const s = service.toLowerCase();
  const [bg, emoji] =
    s.includes('hair')    ? ['bg-green-50',  '💇'] :
    s.includes('nail')    ? ['bg-purple-50', '💅'] :
    s.includes('massage') ? ['bg-blue-50',   '🧖'] :
    s.includes('facial')  ? ['bg-yellow-50', '✨'] :
    s.includes('makeup') || s.includes('bridal') ? ['bg-pink-50', '💄'] :
    ['bg-rose-50', '🌸'];
  return (
    <div className={`w-full h-full ${bg} flex items-center justify-center text-4xl rounded-[10px]`}>
      {emoji}
    </div>
  );
}

// ── Pro avatar ────────────────────────────────────────────────────────────────

function ProAvatar({ name, image }: { name: string; image?: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-[#fce8ef] border border-[#f5c0cf] overflow-hidden flex items-center justify-center shrink-0">
      {image
        ? <img src={image} alt={name} className="w-full h-full object-cover" />
        : <span className="text-[10px] font-semibold text-[#e0608a]">{initials}</span>}
    </div>
  );
}

// ── BookingCard ───────────────────────────────────────────────────────────────

interface BookingCardProps {
  booking: Booking;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (booking: Booking) => void;
  onRate: (booking: { id: string; service: string; expert: string }) => void;
  onCancel: (bookingId: string) => void;
}

export function BookingCard({ booking, isOpen, onToggle, onEdit, onRate, onCancel }: BookingCardProps) {
  const router = useRouter();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelConfirmed = async () => {
    setCancelling(true);
    try {
      await onCancel(booking.id);
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">

      {/* ── Main row ── */}
      <div className="flex items-stretch gap-0 p-3 sm:p-4">

        {/* Thumbnail — fixed width, full card height */}
        <div className="w-12 sm:w-[15%] shrink-0 overflow-hidden rounded-xl sm:rounded-l-2xl p-1 sm:p-2">
          <ServiceThumb service={booking.service} image={booking.serviceImage} />
        </div>

        {/* Middle — service info */}
        <div className="flex-1 min-w-0 px-2 sm:px-5 py-1 sm:py-4 flex flex-col justify-center gap-1.5 sm:gap-2">
          <p className="font-semibold text-[#111827] text-[14px] sm:text-[15px] leading-snug line-clamp-2">
            {booking.service}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
              <Calendar size={13} className="text-[#e0608a]" />
              {booking.date}
            </span>
            {booking.time && (
              <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
                <Clock size={13} className="text-[#e0608a]" />
                {booking.time}
              </span>
            )}
          </div>

          {booking.expert && booking.expert !== 'Pending Assignment' && (
            <div className="flex items-center gap-2">
              <ProAvatar name={booking.expert} image={booking.expertImage} />
              <span className="text-[13px] text-gray-500">
                Pro: <span className="font-semibold text-[#e0608a]">{booking.expert}</span>
              </span>
            </div>
          )}
        </div>

        {/* Right — status, price, actions */}
        <div className="shrink-0 flex flex-col items-end justify-between px-2 sm:px-5 py-2 sm:py-4 border-l border-gray-50 gap-2 sm:gap-4">

          {/* Top: status badge */}
          <div className="flex flex-col items-end gap-1 sm:gap-6">
            <StatusBadge status={booking.status} apiStatus={booking.api_status} />
            <p className="text-[13px] sm:text-[17px] font-bold text-[#111827]">
              ₹{booking.price.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Bottom: price + buttons */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-col items-stretch gap-1 sm:gap-2 w-[80px] sm:w-[130px]">

              {/* Pending */}
              {booking.api_status === 'pending' && (
                <>
                  <button
                    onClick={() => onEdit(booking)}
                    className="w-full py-1.5 sm:py-2 rounded-md bg-[#e0608a] hover:bg-[#cc5279] text-white text-[11px] sm:text-[13px] font-semibold transition-colors"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={onToggle}
                    className="w-full py-1.5 sm:py-2 rounded-md border border-gray-200 text-[11px] sm:text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full py-1.5 sm:py-2 rounded-md border border-red-200 text-[11px] sm:text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {/* Confirmed upcoming */}
              {booking.status === 'upcoming' && booking.api_status === 'confirmed' && (
                <>
                  <button
                    onClick={() => onEdit(booking)}
                    className="w-full py-1.5 sm:py-2 rounded-xl bg-[#e0608a] hover:bg-[#cc5279] text-white text-[11px] sm:text-[13px] font-semibold transition-colors"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={onToggle}
                    className="w-full py-1.5 sm:py-2 rounded-xl border border-gray-200 text-[11px] sm:text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full py-1.5 sm:py-2 rounded-xl border border-red-200 text-[11px] sm:text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {/* Active / in-progress */}
              {booking.status === 'upcoming' &&
                (booking.api_status === 'active' || booking.api_status === 'in_progress') && (
                <>
                  <button className="w-full py-1.5 sm:py-2 rounded-xl bg-[#1f2937] hover:bg-[#111827] text-white text-[11px] sm:text-[13px] font-semibold transition-colors">
                    Live Track
                  </button>
                  <button
                    onClick={onToggle}
                    className="w-full py-1.5 sm:py-2 rounded-xl border border-gray-200 text-[11px] sm:text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Details
                  </button>
                </>
              )}

              {/* Completed */}
              {booking.status === 'completed' && (
                <>
                  {!booking.hasClientReview ? (
                    <button
                      onClick={() => onRate({ id: booking.id, service: booking.service, expert: booking.expert })}
                      className="w-full py-1.5 sm:py-2 rounded-xl bg-[#1f2937] hover:bg-[#111827] text-white text-[11px] sm:text-[13px] font-semibold transition-colors"
                    >
                      Rate
                    </button>
                  ) : (
                    <span className="text-xs sm:text-sm font-medium text-amber-500 text-right">
                      {'★'.repeat(booking.clientReviewRating ?? 0)}
                      {'☆'.repeat(5 - (booking.clientReviewRating ?? 0))}
                    </span>
                  )}
                  <button
                    onClick={() => router.push('/client/services')}
                    className="w-full py-1.5 sm:py-2 rounded-xl border border-gray-200 text-[11px] sm:text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Rebook
                  </button>
                </>
              )}

              {/* Cancelled */}
              {booking.status === 'cancelled' && (
                <button
                  onClick={() => router.push('/client/services')}
                  className="w-full py-1.5 sm:py-2 rounded-xl bg-[#1f2937] hover:bg-[#111827] text-white text-[11px] sm:text-[13px] font-semibold transition-colors"
                >
                  Rebook
                </button>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {isOpen && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {booking.address && (
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-[#e0608a] shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">{booking.address}</p>
            </div>
          )}

          {booking.provider_id ? (
            <>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Your Service Provider
              </p>
              <ProviderDetailsPanel providerId={booking.provider_id} />
            </>
          ) : booking.api_status === 'pending' ? (
            booking.no_providers_in_area ? (
              <div className="flex items-start gap-3 py-3 px-4 bg-orange-50 border border-orange-100 rounded-xl">
                <Search size={14} className="text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-700">Expanding to your area soon!</p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    No provider is available in your area just yet. Our team is on it and will ensure your booking is fulfilled. You'll be notified as soon as a provider is assigned.
                  </p>
                </div>
              </div>
            ) : booking.offered_to_count && booking.offered_to_count > 0 ? (
              <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Loader2 size={12} className="text-blue-500 animate-spin shrink-0" />
                <p className="text-xs text-blue-600">
                  Waiting for a provider to accept — {booking.offered_to_count} notified.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2 px-3 bg-amber-50 border border-amber-100 rounded-xl">
                <Loader2 size={12} className="text-amber-500 animate-spin shrink-0" />
                <p className="text-xs text-amber-600">
                  We're matching you with a provider — check back soon.
                </p>
              </div>
            )
          ) : null}

          <button
            onClick={onToggle}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#e0608a] transition-colors"
          >
            <ChevronDown size={12} className="rotate-180" /> Hide details
          </button>
        </div>
      )}

      {/* ── Cancel confirmation dialog ── */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Cancel Booking?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Are you sure you want to cancel <span className="font-semibold text-gray-700">{booking.service}</span> on {booking.date}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancel(false)}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelConfirmed}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling && <Loader2 size={14} className="animate-spin" />}
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}