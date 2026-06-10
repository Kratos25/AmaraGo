"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, ChevronDown, Loader2, AlertTriangle, Search } from 'lucide-react';
import { ProviderDetailsPanel } from './ProviderDetailsPanel';
import type { Booking } from './types';

function StatusBadge({ status, apiStatus }: { status: Booking['status']; apiStatus: string }) {
  if (apiStatus === 'active' || apiStatus === 'in_progress') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] sm:text-[13px] font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 animate-pulse" />
        In Progress
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span className="text-[11px] sm:text-[13px] font-medium px-2.5 py-1 rounded-full bg-[#fce8ef] text-[#e0608a]">
        {apiStatus === 'pending' ? 'Pending' : 'Confirmed'}
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="text-[11px] sm:text-[13px] font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600">
        Completed
      </span>
    );
  }
  return (
    <span className="text-[11px] sm:text-[13px] font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-500">
      Cancelled
    </span>
  );
}

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
    s.includes('wax')     ? ['bg-orange-50', '🌟'] :
    s.includes('clean')   ? ['bg-teal-50',   '🧹'] :
    ['bg-rose-50', '🌸'];
  return (
    <div className={`w-full h-full ${bg} flex items-center justify-center text-2xl sm:text-4xl rounded-xl`}>
      {emoji}
    </div>
  );
}

function ProAvatar({ name, image }: { name: string; image?: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-6 h-6 rounded-full bg-[#fce8ef] border border-[#f5c0cf] overflow-hidden flex items-center justify-center shrink-0">
      {image
        ? <img src={image} alt={name} className="w-full h-full object-cover" />
        : <span className="text-[9px] font-semibold text-[#e0608a]">{initials}</span>}
    </div>
  );
}

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

      {/* ── Mobile layout: stacked ── */}
      <div className="sm:hidden p-3.5">
        {/* Top row: image + info + status */}
        <div className="flex gap-3">
          <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden">
            <ServiceThumb service={booking.service} image={booking.serviceImage} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-[#111827] text-sm leading-snug line-clamp-2">{booking.service}</p>
              <StatusBadge status={booking.status} apiStatus={booking.api_status} />
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar size={11} className="text-[#e0608a]" />
                {booking.date}
              </span>
              {booking.time && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={11} className="text-[#e0608a]" />
                  {booking.time}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Provider + price row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2">
            {booking.expert && booking.expert !== 'Pending Assignment' ? (
              <>
                <ProAvatar name={booking.expert} image={booking.expertImage} />
                <span className="text-xs text-gray-500">
                  <span className="font-semibold text-[#e0608a]">{booking.expert}</span>
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">Provider pending...</span>
            )}
          </div>
          <p className="text-base font-bold text-[#111827]">
            ₹{booking.price.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {booking.api_status === 'pending' && (
            <>
              <button onClick={() => onEdit(booking)} className="flex-1 py-2 rounded-xl bg-[#e0608a] text-white text-xs font-semibold">Reschedule</button>
              <button onClick={onToggle} className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700">Details</button>
              <button onClick={() => setConfirmCancel(true)} className="py-2 px-3 rounded-xl border border-red-200 text-xs font-semibold text-red-500">Cancel</button>
            </>
          )}
          {booking.status === 'upcoming' && booking.api_status === 'confirmed' && (
            <>
              <button onClick={() => onEdit(booking)} className="flex-1 py-2 rounded-xl bg-[#e0608a] text-white text-xs font-semibold">Reschedule</button>
              <button onClick={onToggle} className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700">Details</button>
              <button onClick={() => setConfirmCancel(true)} className="py-2 px-3 rounded-xl border border-red-200 text-xs font-semibold text-red-500">Cancel</button>
            </>
          )}
          {booking.status === 'upcoming' && (booking.api_status === 'active' || booking.api_status === 'in_progress') && (
            <>
              <button className="flex-1 py-2 rounded-xl bg-[#1f2937] text-white text-xs font-semibold">Live Track</button>
              <button onClick={onToggle} className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700">Details</button>
            </>
          )}
          {booking.status === 'completed' && (
            <>
              {!booking.hasClientReview ? (
                <button onClick={() => onRate({ id: booking.id, service: booking.service, expert: booking.expert })} className="flex-1 py-2 rounded-xl bg-[#1f2937] text-white text-xs font-semibold">Rate Service</button>
              ) : (
                <span className="flex-1 text-center text-sm font-medium text-amber-500 py-2">
                  {'★'.repeat(booking.clientReviewRating ?? 0)}{'☆'.repeat(5 - (booking.clientReviewRating ?? 0))}
                </span>
              )}
              <button onClick={() => router.push('/client/services')} className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700">Rebook</button>
            </>
          )}
          {booking.status === 'cancelled' && (
            <button onClick={() => router.push('/client/services')} className="flex-1 py-2 rounded-xl bg-[#1f2937] text-white text-xs font-semibold">Rebook</button>
          )}
        </div>
      </div>

      {/* ── Desktop layout: horizontal ── */}
      <div className="hidden sm:flex items-stretch p-4 gap-4">
        {/* Image — fixed size */}
        <div className="w-28 lg:w-36 h-28 lg:h-36 shrink-0 overflow-hidden rounded-2xl">
          <ServiceThumb service={booking.service} image={booking.serviceImage} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-1 flex flex-col justify-center gap-2">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-[#111827] text-base leading-snug line-clamp-2">{booking.service}</p>
            <StatusBadge status={booking.status} apiStatus={booking.api_status} />
          </div>
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
          {/* Price + actions inline */}
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-50">
            <p className="text-lg font-bold text-[#111827]">₹{booking.price.toLocaleString('en-IN')}</p>
            <div className="flex items-center gap-2">
              {booking.api_status === 'pending' && (
                <>
                  <button onClick={() => onEdit(booking)} className="py-2 px-4 rounded-xl bg-[#e0608a] hover:bg-[#cc5279] text-white text-[13px] font-semibold transition-colors">Reschedule</button>
                  <button onClick={onToggle} className="py-2 px-4 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Details</button>
                  <button onClick={() => setConfirmCancel(true)} className="py-2 px-4 rounded-xl border border-red-200 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors">Cancel</button>
                </>
              )}
              {booking.status === 'upcoming' && booking.api_status === 'confirmed' && (
                <>
                  <button onClick={() => onEdit(booking)} className="py-2 px-4 rounded-xl bg-[#e0608a] hover:bg-[#cc5279] text-white text-[13px] font-semibold transition-colors">Reschedule</button>
                  <button onClick={onToggle} className="py-2 px-4 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Details</button>
                  <button onClick={() => setConfirmCancel(true)} className="py-2 px-4 rounded-xl border border-red-200 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors">Cancel</button>
                </>
              )}
              {booking.status === 'upcoming' && (booking.api_status === 'active' || booking.api_status === 'in_progress') && (
                <>
                  <button className="py-2 px-4 rounded-xl bg-[#1f2937] hover:bg-[#111827] text-white text-[13px] font-semibold transition-colors">Live Track</button>
                  <button onClick={onToggle} className="py-2 px-4 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Details</button>
                </>
              )}
              {booking.status === 'completed' && (
                <>
                  {!booking.hasClientReview ? (
                    <button onClick={() => onRate({ id: booking.id, service: booking.service, expert: booking.expert })} className="py-2 px-4 rounded-xl bg-[#1f2937] hover:bg-[#111827] text-white text-[13px] font-semibold transition-colors">Rate Service</button>
                  ) : (
                    <span className="text-sm font-medium text-amber-500">{'★'.repeat(booking.clientReviewRating ?? 0)}{'☆'.repeat(5 - (booking.clientReviewRating ?? 0))}</span>
                  )}
                  <button onClick={() => router.push('/client/services')} className="py-2 px-4 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Rebook</button>
                </>
              )}
              {booking.status === 'cancelled' && (
                <button onClick={() => router.push('/client/services')} className="py-2 px-4 rounded-xl bg-[#1f2937] hover:bg-[#111827] text-white text-[13px] font-semibold transition-colors">Rebook</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {isOpen && (
        <div className="border-t border-gray-100 px-4 sm:px-5 py-4 space-y-4">
          {booking.address && (
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-[#e0608a] shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">{booking.address}</p>
            </div>
          )}
          {booking.provider_id ? (
            <>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Your Service Provider</p>
              <ProviderDetailsPanel providerId={booking.provider_id} />
            </>
          ) : booking.api_status === 'pending' ? (
            booking.no_providers_in_area ? (
              <div className="flex items-start gap-3 py-3 px-4 bg-orange-50 border border-orange-100 rounded-xl">
                <Search size={14} className="text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-700">Expanding to your area soon!</p>
                  <p className="text-xs text-orange-600 mt-0.5">No provider is available in your area just yet. Our team is on it and will ensure your booking is fulfilled.</p>
                </div>
              </div>
            ) : booking.offered_to_count && booking.offered_to_count > 0 ? (
              <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Loader2 size={12} className="text-blue-500 animate-spin shrink-0" />
                <p className="text-xs text-blue-600">Waiting for a provider to accept — {booking.offered_to_count} notified.</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2 px-3 bg-amber-50 border border-amber-100 rounded-xl">
                <Loader2 size={12} className="text-amber-500 animate-spin shrink-0" />
                <p className="text-xs text-amber-600">We're matching you with a provider — check back soon.</p>
              </div>
            )
          ) : null}
          <button onClick={onToggle} className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#e0608a] transition-colors">
            <ChevronDown size={12} className="rotate-180" /> Hide details
          </button>
        </div>
      )}

      {/* ── Cancel confirmation ── */}
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
              <button onClick={() => setConfirmCancel(false)} disabled={cancelling} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">Keep Booking</button>
              <button onClick={handleCancelConfirmed} disabled={cancelling} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
