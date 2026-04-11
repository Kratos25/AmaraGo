'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Clock, ChevronRight, CalendarCheck,
  MoreHorizontal, Eye, X, RefreshCw, Download,
  SlidersHorizontal, IndianRupee, Star,
  TrendingUp, AlertTriangle, CheckCircle2,
  CalendarClock, Calendar, Ban, Phone,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import AdminLayout from '../_components/AdminLayout';

// ─── Types ──────────────────────────────────────────────────────────────────

type BookingStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'searching';
type TabKey        = 'all' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'searching';

interface Booking {
  id: string;
  bookingRef: string;
  client: string;
  clientEmoji: string;
  clientPhone: string;
  provider: string;
  providerEmoji: string;
  service: string;
  category: string;
  location: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  amount: number;
  platformFee: number;
  providerEarning: number;
  status: BookingStatus;
  createdAt: string;
  rating?: number;
  cancelReason?: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const ALL_BOOKINGS: Booking[] = [
  {
    id: 'b1', bookingRef: 'GLM-001247',
    client: 'Ananya Singh', clientEmoji: '👩', clientPhone: '+91 98765 10001',
    provider: 'Meera Patel', providerEmoji: '👩‍🦰',
    service: 'Gold Facial', category: 'Skin Care',
    location: 'Bandra West, Mumbai',
    scheduledDate: 'Today', scheduledTime: '3:45 PM', duration: '60 min',
    amount: 1599, platformFee: 240, providerEarning: 1359,
    status: 'completed', createdAt: 'Today, 2:00 PM', rating: 5,
  },
  {
    id: 'b2', bookingRef: 'GLM-001246',
    client: 'Priya Mehta', clientEmoji: '👩‍🦱', clientPhone: '+91 98765 10002',
    provider: 'Riya Sharma', providerEmoji: '👩‍🦱',
    service: 'Party Makeup', category: 'Makeup',
    location: 'Juhu, Mumbai',
    scheduledDate: 'Today', scheduledTime: '6:00 PM', duration: '90 min',
    amount: 1999, platformFee: 300, providerEarning: 1699,
    status: 'in_progress', createdAt: 'Today, 11:00 AM',
  },
  {
    id: 'b3', bookingRef: 'GLM-001245',
    client: 'Sneha Reddy', clientEmoji: '👰', clientPhone: '+91 98765 10003',
    provider: 'Sunita Verma', providerEmoji: '🧖‍♀️',
    service: 'Bridal Makeup', category: 'Bridal',
    location: 'Powai, Mumbai',
    scheduledDate: 'Tomorrow', scheduledTime: '10:00 AM', duration: '180 min',
    amount: 4999, platformFee: 750, providerEarning: 4249,
    status: 'confirmed', createdAt: 'Today, 9:30 AM',
  },
  {
    id: 'b4', bookingRef: 'GLM-001244',
    client: 'Divya Nair', clientEmoji: '🧖‍♀️', clientPhone: '+91 98765 10004',
    provider: 'Searching…', providerEmoji: '🔍',
    service: 'Hair Spa', category: 'Hair Care',
    location: 'Dadar, Mumbai',
    scheduledDate: 'Today', scheduledTime: '7:00 PM', duration: '75 min',
    amount: 999, platformFee: 150, providerEarning: 849,
    status: 'searching', createdAt: 'Today, 5:00 PM',
  },
  {
    id: 'b5', bookingRef: 'GLM-001243',
    client: 'Meghna Kulkarni', clientEmoji: '💅', clientPhone: '+91 98765 10005',
    provider: 'Priya Nair', providerEmoji: '💅',
    service: 'Nail Art', category: 'Nail',
    location: 'Worli, Mumbai',
    scheduledDate: 'Yesterday', scheduledTime: '4:00 PM', duration: '45 min',
    amount: 699, platformFee: 105, providerEarning: 594,
    status: 'completed', createdAt: 'Yesterday, 1:00 PM', rating: 4,
  },
  {
    id: 'b6', bookingRef: 'GLM-001242',
    client: 'Kavita Shah', clientEmoji: '👩‍🦳', clientPhone: '+91 98765 10006',
    provider: 'Sunita Verma', providerEmoji: '🧖‍♀️',
    service: 'Body Massage', category: 'Spa',
    location: 'Malad West, Mumbai',
    scheduledDate: 'Dec 28', scheduledTime: '11:00 AM', duration: '90 min',
    amount: 2499, platformFee: 375, providerEarning: 2124,
    status: 'confirmed', createdAt: 'Today, 8:00 AM',
  },
  {
    id: 'b7', bookingRef: 'GLM-001241',
    client: 'Ritu Sharma', clientEmoji: '👩‍🦰', clientPhone: '+91 98765 10007',
    provider: 'Meera Patel', providerEmoji: '👩‍🦰',
    service: 'Party Makeup', category: 'Makeup',
    location: 'Andheri East, Mumbai',
    scheduledDate: 'Dec 26', scheduledTime: '5:00 PM', duration: '90 min',
    amount: 1999, platformFee: 300, providerEarning: 1699,
    status: 'cancelled', createdAt: 'Dec 25', cancelReason: 'Client requested cancellation',
  },
  {
    id: 'b8', bookingRef: 'GLM-001240',
    client: 'Pooja Verma', clientEmoji: '🧑‍🦱', clientPhone: '+91 98765 10008',
    provider: 'Kavita M.', providerEmoji: '💄',
    service: 'HydraFacial', category: 'Skin Care',
    location: 'Borivali, Mumbai',
    scheduledDate: 'Dec 25', scheduledTime: '2:00 PM', duration: '75 min',
    amount: 3299, platformFee: 495, providerEarning: 2804,
    status: 'completed', createdAt: 'Dec 24', rating: 5,
  },
  {
    id: 'b9', bookingRef: 'GLM-001239',
    client: 'Sonia Kapoor', clientEmoji: '😤', clientPhone: '+91 98765 10009',
    provider: 'Riya Sharma', providerEmoji: '👩‍🦱',
    service: 'Hair Styling', category: 'Hair Care',
    location: 'Santacruz, Mumbai',
    scheduledDate: 'Dec 24', scheduledTime: '3:00 PM', duration: '60 min',
    amount: 899, platformFee: 135, providerEarning: 764,
    status: 'cancelled', createdAt: 'Dec 23', cancelReason: 'Provider unavailable',
  },
];

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, {
  label: string; dot: string; bg: string; border: string; text: string; icon: React.ElementType;
}> = {
  confirmed:   { label: 'Confirmed',   dot: 'bg-[#C84B31]',  bg: 'bg-[#FFF0EC]', border: 'border-[#FDDDD5]', text: 'text-[#C84B31]',  icon: CalendarCheck   },
  in_progress: { label: 'In Progress', dot: 'bg-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100',  text: 'text-blue-700',   icon: RefreshCw       },
  completed:   { label: 'Completed',   dot: 'bg-green-500',  bg: 'bg-green-50',  border: 'border-green-100', text: 'text-green-700',  icon: CheckCircle2    },
  cancelled:   { label: 'Cancelled',   dot: 'bg-red-400',    bg: 'bg-red-50',    border: 'border-red-100',   text: 'text-red-600',    icon: Ban             },
  searching:   { label: 'Searching',   dot: 'bg-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-100', text: 'text-amber-700',  icon: CalendarClock   },
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',         label: 'All'         },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'searching',   label: 'Searching'   },
  { key: 'confirmed',   label: 'Confirmed'   },
  { key: 'completed',   label: 'Completed'   },
  { key: 'cancelled',   label: 'Cancelled'   },
];

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({ booking, onCancel, onView }: {
  booking: Booking;
  onCancel: (id: string) => void;
  onView:   (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sc = STATUS_CONFIG[booking.status];
  const StatusIcon = sc.icon;

  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white hover:border-[#FDDDD5] hover:shadow-sm transition-all">
      <CardContent className="p-4 sm:p-5">

        {/* Top: ref + status + menu */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#9CA3AF] tracking-wider font-mono">{booking.bookingRef}</span>
            <span className="text-[9px] text-[#9CA3AF]">·</span>
            <span className="text-[10px] text-[#9CA3AF]">{booking.createdAt}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border', sc.bg, sc.border, sc.text)}>
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', sc.dot,
                booking.status === 'in_progress' || booking.status === 'searching' ? 'animate-pulse' : ''
              )} />
              {sc.label}
            </span>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((p) => !p)}
                className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#EBEBEB] transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-9 w-44 bg-white border border-[#EBEBEB] rounded-xl shadow-lg z-20 py-1">
                    <button onClick={() => { onView(booking.id); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                      <Eye className="w-3.5 h-3.5 text-[#9CA3AF]" /> View Details
                    </button>
                    <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                      <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" /> Call Client
                    </button>
                    <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                      <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" /> Call Provider
                    </button>
                    {(booking.status === 'confirmed' || booking.status === 'searching') && (
                      <>
                        <div className="border-t border-[#EBEBEB] my-1" />
                        <button onClick={() => { onCancel(booking.id); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50">
                          <X className="w-3.5 h-3.5" /> Cancel Booking
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Client + Provider row */}
        <div className="flex items-center gap-2 mb-4">
          {/* Client */}
          <div className="flex-1 flex items-center gap-2.5 min-w-0 bg-[#F5F4F2] rounded-xl px-3 py-2.5 border border-[#EBEBEB]">
            <div className="w-8 h-8 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center text-base shrink-0">
              {booking.clientEmoji}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-[#9CA3AF] font-medium">Client</p>
              <p className="text-[12px] font-semibold text-[#1A1A1A] truncate">{booking.client}</p>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />

          {/* Provider */}
          <div className="flex-1 flex items-center gap-2.5 min-w-0 bg-[#F5F4F2] rounded-xl px-3 py-2.5 border border-[#EBEBEB]">
            <div className={cn(
              'w-8 h-8 rounded-full border flex items-center justify-center text-base shrink-0',
              booking.status === 'searching'
                ? 'bg-amber-50 border-amber-100 animate-pulse'
                : 'bg-white border-[#EBEBEB]',
            )}>
              {booking.providerEmoji}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-[#9CA3AF] font-medium">Provider</p>
              <p className={cn('text-[12px] font-semibold truncate', booking.status === 'searching' ? 'text-amber-600' : 'text-[#1A1A1A]')}>
                {booking.provider}
              </p>
            </div>
          </div>
        </div>

        {/* Service + details */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-bold text-[14px] text-[#1A1A1A] leading-tight">{booking.service}</h3>
              <span className="text-[10px] font-semibold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-2 py-0.5 rounded-full">
                {booking.category}
              </span>
            </div>
            {booking.rating && (
              <div className="flex items-center gap-1 shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('w-3 h-3', i < (booking.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-[#EBEBEB]')} />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-1 rounded-full">
              <Calendar className="w-2.5 h-2.5 text-[#9CA3AF]" />
              {booking.scheduledDate}, {booking.scheduledTime}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-1 rounded-full">
              <Clock className="w-2.5 h-2.5 text-[#9CA3AF]" />
              {booking.duration}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-1 rounded-full">
              <MapPin className="w-2.5 h-2.5 text-[#9CA3AF]" />
              {booking.location}
            </span>
          </div>
        </div>

        {/* Cancel reason */}
        {booking.cancelReason && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
            <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="text-[11px] text-red-600">{booking.cancelReason}</p>
          </div>
        )}

        {/* Financials */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Total',        value: `₹${booking.amount.toLocaleString()}`,        color: 'text-[#1A1A1A]'  },
            { label: 'Platform Fee', value: `₹${booking.platformFee.toLocaleString()}`,   color: 'text-[#C84B31]'  },
            { label: 'SP Earning',   value: `₹${booking.providerEarning.toLocaleString()}`, color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#F5F4F2] rounded-xl px-2 py-2 text-center border border-[#EBEBEB]">
              <p className={cn('font-bold text-[12px] sm:text-[13px] leading-none', color)}>{value}</p>
              <p className="text-[9px] text-[#9CA3AF] mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => onView(booking.id)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl hover:bg-[#FFF0EC] hover:border-[#FDDDD5] transition-colors group"
        >
          <span className="text-[12px] font-semibold text-[#6B7280] group-hover:text-[#C84B31] transition-colors">View Full Details</span>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#C84B31] group-hover:translate-x-0.5 transition-all" />
        </button>
      </CardContent>
    </Card>
  );
}

// ─── Table Row (desktop list view) ───────────────────────────────────────────

function BookingRow({ booking, onCancel, onView }: {
  booking: Booking;
  onCancel: (id: string) => void;
  onView:   (id: string) => void;
}) {
  const sc = STATUS_CONFIG[booking.status];
  return (
    <tr
      className="border-b border-[#EBEBEB] hover:bg-[#FFF0EC]/30 cursor-pointer transition-colors"
      onClick={() => onView(booking.id)}
    >
      <td className="px-4 py-3">
        <p className="text-[11px] font-bold text-[#9CA3AF] font-mono">{booking.bookingRef}</p>
        <p className="text-[10px] text-[#9CA3AF] mt-0.5">{booking.createdAt}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{booking.clientEmoji}</span>
          <div>
            <p className="text-[12px] font-semibold text-[#1A1A1A]">{booking.client}</p>
            <p className="text-[10px] text-[#9CA3AF]">{booking.location}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-[12px] font-semibold text-[#1A1A1A]">{booking.service}</p>
        <p className="text-[10px] text-[#9CA3AF]">{booking.scheduledDate}, {booking.scheduledTime}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{booking.providerEmoji}</span>
          <p className={cn('text-[12px] font-medium', booking.status === 'searching' ? 'text-amber-600' : 'text-[#6B7280]')}>
            {booking.provider}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-[13px] font-bold text-[#1A1A1A]">₹{booking.amount.toLocaleString()}</p>
        <p className="text-[10px] text-[#C84B31]">Fee: ₹{booking.platformFee}</p>
      </td>
      <td className="px-4 py-3">
        <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border', sc.bg, sc.border, sc.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
          {sc.label}
        </span>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button onClick={() => onView(booking.id)} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#FFF0EC] hover:text-[#C84B31] transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
          {(booking.status === 'confirmed' || booking.status === 'searching') && (
            <button onClick={() => onCancel(booking.id)} className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-[15px] font-bold text-[#1A1A1A]">{label}</p>
      <p className="text-[12px] text-[#9CA3AF] mt-1">{sub}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminBookings() {
  const router    = useRouter();
  const { toast } = useToast();

  const [bookings, setBookings]       = useState<Booking[]>(ALL_BOOKINGS);
  const [activeTab, setActiveTab]     = useState<TabKey>('all');
  const [search, setSearch]           = useState('');
  const [sortBy, setSortBy]           = useState<'recent' | 'amount_high' | 'amount_low' | 'date'>('recent');
  const [viewMode, setViewMode]       = useState<'card' | 'table'>('card');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Counts
  const counts: Record<TabKey, number> = useMemo(() => ({
    all:         bookings.length,
    confirmed:   bookings.filter((b) => b.status === 'confirmed').length,
    in_progress: bookings.filter((b) => b.status === 'in_progress').length,
    completed:   bookings.filter((b) => b.status === 'completed').length,
    cancelled:   bookings.filter((b) => b.status === 'cancelled').length,
    searching:   bookings.filter((b) => b.status === 'searching').length,
  }), [bookings]);

  // Categories
  const categories = useMemo(() => {
    const s = new Set(bookings.map((b) => b.category));
    return ['All', ...Array.from(s)];
  }, [bookings]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = bookings.filter((b) => {
      const matchTab    = activeTab === 'all' ? true : b.status === activeTab;
      const matchSearch = !search ||
        b.client.toLowerCase().includes(search.toLowerCase()) ||
        b.provider.toLowerCase().includes(search.toLowerCase()) ||
        b.service.toLowerCase().includes(search.toLowerCase()) ||
        b.bookingRef.toLowerCase().includes(search.toLowerCase()) ||
        b.location.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'All' || b.category === categoryFilter;
      return matchTab && matchSearch && matchCat;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'amount_high') return b.amount - a.amount;
      if (sortBy === 'amount_low')  return a.amount - b.amount;
      return 0;
    });
  }, [bookings, activeTab, search, categoryFilter, sortBy]);

  // Summary stats
  const totalRevenue    = bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + b.amount, 0);
  const totalFees       = bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + b.platformFee, 0);
  const completionRate  = bookings.length ? Math.round((counts.completed / bookings.length) * 100) : 0;

  // Actions
  const handleCancel = (id: string) => {
    const b = bookings.find((x) => x.id === id);
    setBookings((prev) => prev.map((x) => x.id === id
      ? { ...x, status: 'cancelled', cancelReason: 'Cancelled by admin' }
      : x
    ));
    toast({ title: `Booking ${b?.bookingRef} cancelled`, description: 'Client and provider have been notified.' });
  };

  const handleView = (id: string) => router.push(`/admin/bookings/${id}`);

  return (
    <AdminLayout
      title="Bookings"
      subtitle="Monitor and manage all platform bookings"
      topBarRight={
        <button
          className="h-9 px-4 flex items-center gap-2 rounded-xl border border-[#EBEBEB] bg-white text-[12px] font-semibold text-[#6B7280] hover:bg-[#F5F4F2] transition-colors"
          onClick={() => {}}
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      }
    >

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Bookings',   value: bookings.length,          Icon: CalendarCheck, color: 'text-[#C84B31]',  bg: 'bg-[#FFF0EC]', border: 'border-[#FDDDD5]' },
          { label: 'Revenue Collected', value: `₹${(totalRevenue / 1000).toFixed(0)}K`, Icon: IndianRupee, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'Platform Fees',    value: `₹${(totalFees / 1000).toFixed(0)}K`,     Icon: TrendingUp,  color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-100'  },
          { label: 'Completion Rate',  value: `${completionRate}%`,     Icon: CheckCircle2,  color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
        ].map(({ label, value, Icon, color, bg, border }) => (
          <Card key={label} className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border shrink-0', bg, border)}>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              <div>
                <p className={cn('font-bold text-[18px] leading-none', color)}>{value}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search + controls ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, provider, service or booking ref…"
            className="w-full pl-10 pr-4 h-10 text-[13px] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31]/20 text-[#1A1A1A] placeholder:text-[#9CA3AF]"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-10 px-3 text-[12px] font-semibold text-[#6B7280] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] cursor-pointer"
        >
          <option value="recent">Sort: Recent</option>
          <option value="amount_high">Sort: Highest Amount</option>
          <option value="amount_low">Sort: Lowest Amount</option>
          <option value="date">Sort: Schedule Date</option>
        </select>

        {/* View mode toggle */}
        <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl border border-[#EBEBEB]">
          {(['card', 'table'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all capitalize',
                viewMode === mode ? 'bg-white text-[#C84B31] shadow-sm' : 'text-[#9CA3AF]',
              )}
            >
              {mode === 'card' ? '⊞ Cards' : '≡ Table'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFilters((p) => !p)}
          className={cn(
            'h-10 px-4 flex items-center gap-2 rounded-xl border text-[12px] font-semibold transition-colors',
            showFilters ? 'bg-[#FFF0EC] border-[#FDDDD5] text-[#C84B31]' : 'bg-white border-[#EBEBEB] text-[#6B7280] hover:bg-[#F5F4F2]',
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
        </button>
      </div>

      {/* ── Category filter ───────────────────────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white border border-[#EBEBEB] rounded-xl">
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider self-center mr-1">Category:</p>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'text-[11px] font-semibold px-3 py-1 rounded-full border transition-all',
                categoryFilter === cat
                  ? 'bg-[#C84B31] border-[#C84B31] text-white'
                  : 'bg-[#F5F4F2] border-[#EBEBEB] text-[#6B7280] hover:border-[#C84B31] hover:text-[#C84B31]',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl mb-5 overflow-x-auto no-scrollbar">
        {TABS.map(({ key, label }) => {
          const sc = key !== 'all' ? STATUS_CONFIG[key as BookingStatus] : null;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 py-2 px-3 sm:px-4 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap',
                activeTab === key ? 'bg-white text-[#C84B31] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]',
              )}
            >
              {label}
              {counts[key] > 0 && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                  activeTab === key ? 'bg-[#FFF0EC] text-[#C84B31]' : 'bg-[#EBEBEB] text-[#9CA3AF]',
                )}>
                  {counts[key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Searching alert ───────────────────────────────────────────────── */}
      {counts.searching > 0 && activeTab !== 'searching' && (
        <button
          onClick={() => setActiveTab('searching')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 hover:bg-amber-100 transition-colors group"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
          <p className="text-[12px] font-semibold text-amber-700 flex-1 text-left">
            {counts.searching} booking{counts.searching > 1 ? 's' : ''} waiting for a provider
          </p>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={activeTab === 'cancelled' ? '🚫' : activeTab === 'searching' ? '🔍' : '📅'}
          label={search ? 'No bookings found' : `No ${activeTab === 'all' ? '' : activeTab.replace('_', ' ')} bookings`}
          sub={search ? 'Try a different search term' : 'Nothing here right now'}
        />
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
              onView={handleView}
            />
          ))}
        </div>
      ) : (
        /* Table view */
        <Card className="border border-[#EBEBEB] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[#EBEBEB] bg-[#F5F4F2]">
                  {['Ref & Date', 'Client', 'Service', 'Provider', 'Amount', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    onCancel={handleCancel}
                    onView={handleView}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Footer count ─────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <p className="text-center text-[11px] text-[#9CA3AF] mt-6">
          Showing {filtered.length} of {bookings.length} bookings
        </p>
      )}

    </AdminLayout>
  );
}