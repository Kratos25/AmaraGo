'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Clock, Calendar, Phone, CheckCircle2,
  Briefcase, Timer, XCircle, ChevronRight, IndianRupee,
  CreditCard, FileText, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import ProviderLayout from '../_components/ProviderLayout';
import { providersAPI, bookingsAPI, type Booking, type BookingStatus } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function todaySubtitle() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: 'upcoming' as const,  label: 'Upcoming',  Icon: Briefcase,    color: '#6B7280', bg: '#F5F4F2', border: '#EBEBEB'  },
  { key: 'active'   as const,  label: 'Active',    Icon: Timer,        color: '#C84B31', bg: '#FFF0EC', border: '#FDDDD5'  },
  { key: 'completed'as const,  label: 'Completed', Icon: CheckCircle2, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0'  },
  { key: 'cancelled'as const,  label: 'Cancelled', Icon: XCircle,      color: '#DC2626', bg: '#FEF2F2', border: '#FECACA'  },
] as const;

type TabKey = typeof TABS[number]['key'];

const PAYMENT_LABELS: Record<string, string> = {
  upi: 'UPI', card: 'Card', wallet: 'Wallet', cash: 'Cash',
};

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({
  booking, onAction, actionLoading, onRateClient,
}: {
  booking: Booking;
  onAction?: (id: string, status: BookingStatus) => void;
  actionLoading?: string | null;
  onRateClient?: (bookingId: string, clientName: string) => void;
}) {
  const isActive    = booking.status === 'active';
  const isConfirmed = booking.status === 'confirmed';
  const isPending   = booking.status === 'pending';
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';

  const statusConfig = {
    pending:   { label: 'Pending',     color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    confirmed: { label: 'Confirmed',   color: '#C84B31', bg: '#FFF0EC', border: '#FDDDD5' },
    active:    { label: 'In Progress', color: '#C84B31', bg: '#FFF0EC', border: '#FDDDD5' },
    completed: { label: 'Completed',   color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    cancelled: { label: 'Cancelled',   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  };
  const sc = statusConfig[booking.status] ?? statusConfig.pending;
  const isLoading = actionLoading === booking.id;

  return (
    <Card className={cn(
      'border shadow-none bg-white overflow-hidden transition-all',
      isActive
        ? 'border-[#FDDDD5] ring-1 ring-[#FFF0EC]'
        : 'border-[#EBEBEB] hover:border-[#C84B31]/20 hover:shadow-sm',
    )}>
      <CardContent className="p-0">

        {/* ── Top: Animated pulse for active ── */}
        {isActive && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FFF0EC] border-b border-[#FDDDD5]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C84B31] opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C84B31]" />
            </span>
            <span className="text-[11px] font-bold text-[#C84B31] tracking-wide">IN PROGRESS</span>
          </div>
        )}

        {/* ── Main body ── */}
        <div className="p-4">
          {/* Service + Status badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[14px] text-[#1A1A1A] leading-tight truncate">
                {booking.service_name ?? 'Service'}
              </h3>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                Booking #{booking.id.slice(-6).toUpperCase()}
              </p>
            </div>
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 border"
              style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
            >
              {sc.label}
            </span>
          </div>

          {/* Client info */}
          <div className="flex items-center gap-2 p-3 bg-[#F5F4F2] rounded-xl mb-3 border border-[#EBEBEB]">
            <div className="w-8 h-8 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center shrink-0 font-semibold text-[12px] text-[#C84B31]"
              style={{ background: 'linear-gradient(135deg,#FFF0EC,#FDDDD5)' }}>
              {(booking.client_name ?? 'C').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-[#1A1A1A] truncate">
                {booking.client_name ?? 'Client'}
              </p>
              {booking.client_phone && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone className="w-2.5 h-2.5 text-[#9CA3AF] shrink-0" />
                  <p className="text-[11px] text-[#9CA3AF]">{booking.client_phone}</p>
                </div>
              )}
            </div>
            {booking.client_phone && (
              <a
                href={`tel:${booking.client_phone}`}
                className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-1 rounded-full">
              <Calendar className="w-2.5 h-2.5 text-[#9CA3AF] shrink-0" />
              {formatDate(booking.date)}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-1 rounded-full">
              <Clock className="w-2.5 h-2.5 text-[#9CA3AF] shrink-0" />
              {booking.time}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-1 rounded-full max-w-[200px]">
              <MapPin className="w-2.5 h-2.5 text-[#9CA3AF] shrink-0" />
              <span className="truncate">{booking.address}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-1 rounded-full">
              <CreditCard className="w-2.5 h-2.5 text-[#9CA3AF] shrink-0" />
              {PAYMENT_LABELS[booking.payment_method] ?? booking.payment_method}
            </span>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl mb-3">
              <FileText className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 leading-relaxed">{booking.notes}</p>
            </div>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between pt-3 border-t border-[#EBEBEB]">
            <div className="flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-[#6B7280]" />
              <span className="text-[11px] text-[#9CA3AF]">
                ₹{fmt(booking.base_price)}
                {booking.discount_amount > 0 && (
                  <span className="text-emerald-600 ml-1">−₹{fmt(booking.discount_amount)}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[#9CA3AF]">Total</span>
              <p className="font-bold text-[15px] text-[#1A1A1A]">₹{fmt(booking.total_price)}</p>
            </div>
          </div>
        </div>

        {/* ── Action buttons ── */}
        {(isConfirmed || isActive) && onAction && (
          <div className={cn(
            'px-4 pb-4 flex gap-2',
          )}>
            {isConfirmed && (
              <button
                disabled={isLoading}
                onClick={() => onAction(booking.id, 'active')}
                className="flex-1 h-9 rounded-xl bg-[#C84B31] hover:bg-[#B04028] text-white text-[13px] font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Timer className="w-3.5 h-3.5" /> Start Job
                  </>
                )}
              </button>
            )}
            {isActive && (
              <button
                disabled={isLoading}
                onClick={() => onAction(booking.id, 'completed')}
                className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* ── Rate client (completed) ── */}
        {isCompleted && (
          <div className="px-4 pb-4">
            {!booking.provider_review ? (
              onRateClient && (
                <button
                  onClick={() => onRateClient(booking.id, booking.client_name ?? 'Client')}
                  className="w-full h-9 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  ★ Rate Client
                </button>
              )
            ) : (
              <div className="flex items-center justify-center gap-2 py-1">
                <span className="text-amber-400 text-sm tracking-tight">
                  {'★'.repeat(booking.provider_review.rating)}{'☆'.repeat(5 - booking.provider_review.rating)}
                </span>
                <span className="text-[11px] text-[#9CA3AF]">Client rated</span>
              </div>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 w-32 rounded-lg bg-[#F5F4F2] animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-[#F5F4F2] animate-pulse" />
        </div>
        <div className="h-14 rounded-xl bg-[#F5F4F2] animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-24 rounded-full bg-[#F5F4F2] animate-pulse" />
          <div className="h-6 w-20 rounded-full bg-[#F5F4F2] animate-pulse" />
        </div>
        <div className="flex justify-between pt-2">
          <div className="h-4 w-20 rounded bg-[#F5F4F2] animate-pulse" />
          <div className="h-5 w-16 rounded bg-[#F5F4F2] animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#FFF0EC] flex items-center justify-center mb-4">
        <Briefcase className="w-6 h-6 text-[#C84B31]/40" />
      </div>
      <p className="font-semibold text-[14px] text-[#6B7280]">{message}</p>
      <p className="text-[12px] text-[#9CA3AF] mt-1">Check back later for new assignments</p>
    </div>
  );
}

// ─── Completed summary bar ────────────────────────────────────────────────────

function CompletedSummary({ jobs }: { jobs: Booking[] }) {
  const total = jobs.reduce((s, j) => s + j.total_price, 0);
  const paid  = jobs.filter((j) => j.payment_method !== 'cash').reduce((s, j) => s + j.total_price, 0);
  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        { label: 'Jobs Done',    value: String(jobs.length),   color: '#16A34A' },
        { label: 'Total Value',  value: `₹${fmt(total)}`,      color: '#1A1A1A' },
        { label: 'Online Paid',  value: `₹${fmt(paid)}`,       color: '#C84B31' },
      ].map(({ label, value, color }) => (
        <Card key={label} className="border border-[#EBEBEB] shadow-none bg-white">
          <CardContent className="p-3 flex flex-col items-center text-center">
            <p className="font-bold text-[16px] md:text-[18px]" style={{ color }}>{value}</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
// ─── Star picker ─────────────────────────────────────────────────────────────

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

// ─── Rate Client Modal (provider → client) ────────────────────────────────────────

import { X } from 'lucide-react';

function RateClientModal({
  clientName,
  onClose,
  onDone,
}: {
  clientName: string;
  onClose: () => void;
  onDone: (rating: number, comment: string) => Promise<void>;
}) {
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await onDone(rating, comment.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-[#1A1A1A] px-6 py-5 text-center relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
          <div className="text-3xl mb-2">👤</div>
          <h2 className="text-white font-bold text-lg">Rate the Client</h2>
          <p className="text-white/50 text-xs mt-1 line-clamp-1">{clientName}</p>
        </div>
        <div className="p-6">
          <p className="text-center text-sm text-gray-500 mb-4">
            How was it working with <span className="font-semibold text-[#1A1A1A]">{clientName}</span>?
          </p>
          <StarPicker value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-center text-sm font-semibold text-amber-500 mt-1 mb-4">{labels[rating]}</p>
          )}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any notes about this client? (optional)"
            rows={3}
            maxLength={500}
            className="w-full mt-3 px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 resize-none focus:outline-none focus:border-[#C84B31] transition-colors"
          />
          <button
            disabled={!rating || submitting}
            onClick={submit}
            className="mt-4 w-full h-12 rounded-2xl bg-[#C84B31] hover:bg-[#B04028] disabled:opacity-40 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Submit Rating'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Main page ────────────────────────────────────────────────────────────────

export default function MyJobs() {
  const { toast } = useToast();
  const [jobs,        setJobs]        = useState<Booking[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<TabKey>('upcoming');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rateClientModal, setRateClientModal] = useState<{ bookingId: string; clientName: string } | null>(null);

  const handleRateClient = async (rating: number, comment: string) => {
    if (!rateClientModal) return;
    await bookingsAPI.rateClient(rateClientModal.bookingId, { rating, comment });
    setJobs((prev) =>
      prev.map((j) =>
        j.id === rateClientModal.bookingId
          ? { ...j, provider_review: { rating, comment, created_at: new Date().toISOString() } }
          : j
      )
    );
    toast({ title: 'Client rated!', description: `You gave ${rating} star${rating !== 1 ? 's' : ''}.` });
  };

  const loadJobs = () => {
    setLoading(true);
    providersAPI.getMyJobs()
      .then(({ data }) => setJobs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadJobs(); }, []);

  // ── Derived tabs ────────────────────────────────────────────────────────────
  const tabJobs = useMemo<Record<TabKey, Booking[]>>(() => ({
    upcoming:  jobs.filter((j) => j.status === 'pending' || j.status === 'confirmed')
                   .sort((a, b) => (a.date > b.date ? 1 : -1)),
    active:    jobs.filter((j) => j.status === 'active')
                   .sort((a, b) => (a.date > b.date ? 1 : -1)),
    completed: jobs.filter((j) => j.status === 'completed')
                   .sort((a, b) => (a.date < b.date ? 1 : -1)),
    cancelled: jobs.filter((j) => j.status === 'cancelled')
                   .sort((a, b) => (a.date < b.date ? 1 : -1)),
  }), [jobs]);

  // Auto-switch to active tab if there are active jobs and we're on upcoming with 0
  useEffect(() => {
    if (!loading && tabJobs.active.length > 0 && tabJobs.upcoming.length === 0 && activeTab === 'upcoming') {
      setActiveTab('active');
    }
  }, [loading, tabJobs, activeTab]);

  // ── Status update ────────────────────────────────────────────────────────────
  const handleAction = async (bookingId: string, newStatus: BookingStatus) => {
    setActionLoading(bookingId);
    try {
      await bookingsAPI.updateStatus(bookingId, newStatus);
      setJobs((prev) => prev.map((j) => j.id === bookingId ? { ...j, status: newStatus } : j));
      const msgs: Partial<Record<BookingStatus, string>> = {
        active:    'Job started! Client has been notified.',
        completed: 'Job marked as complete. Great work! 🎉',
      };
      toast({ title: msgs[newStatus] ?? 'Updated', description: '' });
      if (newStatus === 'active') setActiveTab('active');
      if (newStatus === 'completed') setActiveTab('completed');
    } catch {
      toast({ title: 'Update failed', description: 'Please try again.' });
    } finally {
      setActionLoading(null);
    }
  };

  const displayed = tabJobs[activeTab];

  return (
    <>
    <ProviderLayout title="My Jobs" subtitle={todaySubtitle()}>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-4 gap-2 md:gap-3 mb-5">
        {TABS.map(({ key, label, color, bg, border }) => {
          const count = tabJobs[key].length;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex flex-col items-center py-3 px-1 rounded-xl border transition-all',
                isActive ? 'shadow-sm' : 'bg-white',
              )}
              style={isActive
                ? { background: bg, borderColor: border }
                : { borderColor: '#EBEBEB', background: '#fff' }}
            >
              <span
                className="font-bold text-[18px] md:text-[20px] leading-none"
                style={{ color: isActive ? color : '#1A1A1A' }}
              >
                {loading ? '—' : count}
              </span>
              <span
                className="text-[9px] md:text-[10px] font-medium mt-1 leading-tight"
                style={{ color: isActive ? color : '#9CA3AF' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl mb-5">
        {TABS.map(({ key, label, Icon }) => {
          const count  = tabJobs[key].length;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-2 px-1 md:px-2 rounded-lg text-[11px] md:text-[12px] font-semibold transition-all',
                isActive ? 'bg-white text-[#C84B31] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]',
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              {!loading && count > 0 && (
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                  isActive ? 'bg-[#FFF0EC] text-[#C84B31]' : 'bg-[#EBEBEB] text-[#9CA3AF]',
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Refresh button ── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] text-[#9CA3AF]">
          {loading ? 'Loading jobs…' : `${displayed.length} job${displayed.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={loadJobs}
          disabled={loading}
          className="flex items-center gap-1.5 text-[12px] text-[#C84B31] font-medium hover:text-[#B04028] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* ── pending info banner ── */}
      {!loading && activeTab === 'upcoming' && tabJobs.upcoming.some((j) => j.status === 'pending') && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-700">
            <span className="font-semibold">Pending</span> jobs are awaiting admin confirmation.{' '}
            <span className="font-semibold">Confirmed</span> jobs are ready to start.
          </p>
        </div>
      )}

      {/* ── Completed summary ── */}
      {!loading && activeTab === 'completed' && tabJobs.completed.length > 0 && (
        <CompletedSummary jobs={tabJobs.completed} />
      )}

      {/* ── Job cards grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : displayed.length === 0 ? (
          <EmptyState
            message={
              activeTab === 'upcoming'  ? 'No upcoming jobs' :
              activeTab === 'active'    ? 'No active jobs right now' :
              activeTab === 'completed' ? 'No completed jobs yet' :
              'No cancelled jobs'
            }
          />
        ) : (
          displayed.map((b) => (
            <JobCard
              key={b.id}
              booking={b}
              onAction={['confirmed', 'active'].includes(b.status) ? handleAction : undefined}
              actionLoading={actionLoading}
              onRateClient={b.status === 'completed' ? (id, name) => setRateClientModal({ bookingId: id, clientName: name }) : undefined}
            />
          ))
        )}
      </div>

    </ProviderLayout>

    {/* ── Rate client modal ── */}
    {rateClientModal && (
      <RateClientModal
        clientName={rateClientModal.clientName}
        onClose={() => setRateClientModal(null)}
        onDone={handleRateClient}
      />
    )}
    </>
  );
}
