'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Clock,
  ShoppingBag, CheckCircle2, XCircle, CalendarClock,
  RefreshCw, IndianRupee, User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import AdminLayout from '../../_components/AdminLayout';
import { adminAPI, type UserProfile, type Booking } from '@/lib/api';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; border: string; text: string; dot: string; Icon: React.ElementType }> = {
  pending:   { label: 'Searching',   bg: 'bg-amber-50',  border: 'border-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500',  Icon: CalendarClock  },
  confirmed: { label: 'Confirmed',   bg: 'bg-[#FFF0EC]', border: 'border-[#FDDDD5]',  text: 'text-[#C84B31]',  dot: 'bg-[#C84B31]',  Icon: Calendar       },
  active:    { label: 'In Progress', bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   Icon: RefreshCw      },
  completed: { label: 'Completed',   bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  Icon: CheckCircle2   },
  cancelled: { label: 'Cancelled',   bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-600',    dot: 'bg-red-400',    Icon: XCircle        },
};

function getSC(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG['pending'];
}

// ── Booking Row ───────────────────────────────────────────────────────────────

function BookingRow({ booking }: { booking: Booking }) {
  const sc = getSC(booking.status);
  const StatusIcon = sc.Icon;
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#EBEBEB] last:border-0 hover:bg-[#FFF0EC]/30 transition-colors">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center border shrink-0', sc.bg, sc.border)}>
        <StatusIcon className={cn('w-4 h-4', sc.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{booking.service_name ?? 'Service'}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
            <Calendar className="w-3 h-3" /> {booking.date}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
            <Clock className="w-3 h-3" /> {booking.time}
          </span>
          {booking.provider_name && (
            <span className="text-[10px] text-[#9CA3AF]">· {booking.provider_name}</span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[13px] font-bold text-[#1A1A1A]">₹{booking.total_price.toLocaleString()}</p>
        <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border', sc.bg, sc.border, sc.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
          {sc.label}
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ClientProfilePage() {
  const router      = useRouter();
  const params      = useParams();
  const { toast }   = useToast();
  const clientId    = params.id as string;

  const [client, setClient]     = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!clientId) return;
    Promise.all([
      adminAPI.getClient(clientId),
      adminAPI.getClientBookings(clientId),
    ])
      .then(([clientRes, bookingsRes]) => {
        setClient(clientRes.data);
        setBookings(bookingsRes.data);
      })
      .catch(() => toast({ title: 'Failed to load client', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [clientId]);

  // Summary stats
  const totalSpend      = bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + b.total_price, 0);
  const completedCount  = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount  = bookings.filter((b) => b.status === 'cancelled').length;
  const activeBooking   = bookings.find((b) => b.status === 'active' || b.status === 'confirmed');

  if (loading) {
    return (
      <AdminLayout title="Client Profile" subtitle="Loading…">
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-[#C84B31] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!client) {
    return (
      <AdminLayout title="Client Profile" subtitle="Not found">
        <div className="text-center py-20">
          <p className="text-[15px] font-bold text-[#1A1A1A]">Client not found</p>
          <button onClick={() => router.back()} className="mt-4 text-[13px] text-[#C84B31] font-semibold hover:opacity-80">← Go back</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Client Profile"
      subtitle="Full profile and booking history"
      topBarRight={
        <button
          onClick={() => router.back()}
          className="h-9 px-4 flex items-center gap-2 rounded-xl border border-[#EBEBEB] bg-white text-[12px] font-semibold text-[#6B7280] hover:bg-[#F5F4F2] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5">

        {/* ── Left: Profile card ─────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Avatar + name */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center text-3xl mb-3">
                {client.profile_image ? (
                  <img src={client.profile_image} alt={client.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-[#C84B31]" />
                )}
              </div>
              <h2 className="font-bold text-[18px] text-[#1A1A1A]">{client.name}</h2>
              <span className="text-[10px] font-bold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-2 py-0.5 rounded-full mt-1">CLIENT</span>

              <div className="w-full mt-4 space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-[#9CA3AF]" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-[#9CA3AF]" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.created_at && (
                  <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-[#9CA3AF]" />
                    <span>Joined {new Date(client.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Statistics</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Bookings',  value: bookings.length,                               color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100',   Icon: ShoppingBag   },
                  { label: 'Completed',       value: completedCount,                                color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100',  Icon: CheckCircle2  },
                  { label: 'Cancelled',       value: cancelledCount,                                color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-100',    Icon: XCircle       },
                  { label: 'Total Spend',     value: `₹${(totalSpend / 1000).toFixed(1)}K`,         color: 'text-[#C84B31]',  bg: 'bg-[#FFF0EC]', border: 'border-[#FDDDD5]',  Icon: IndianRupee   },
                ].map(({ label, value, color, bg, border, Icon }) => (
                  <div key={label} className={cn('p-3 rounded-xl border flex items-center gap-2', bg, border)}>
                    <Icon className={cn('w-4 h-4 shrink-0', color)} />
                    <div>
                      <p className={cn('font-bold text-[16px] leading-none', color)}>{value}</p>
                      <p className="text-[9px] text-[#9CA3AF] mt-0.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active booking */}
          {activeBooking && (
            <Card className="border border-[#C84B31]/20 shadow-none bg-[#FFF0EC]">
              <CardContent className="p-4">
                <p className="text-[11px] font-bold text-[#C84B31] uppercase tracking-wider mb-2">Active Booking</p>
                <p className="text-[13px] font-semibold text-[#1A1A1A]">{activeBooking.service_name}</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">{activeBooking.date} · {activeBooking.time}</p>
                {activeBooking.provider_name && (
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">Provider: {activeBooking.provider_name}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Booking history ─────────────────────────────────────── */}
        <div>
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-0">
              <div className="px-5 py-4 border-b border-[#EBEBEB]">
                <p className="font-bold text-[15px] text-[#1A1A1A]">Booking History</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{bookings.length} total bookings</p>
              </div>
              {bookings.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-2">
                  <ShoppingBag className="w-8 h-8 text-[#EBEBEB]" />
                  <p className="text-[13px] font-semibold text-[#9CA3AF]">No bookings yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[#EBEBEB]">
                  {bookings.map((b) => <BookingRow key={b.id} booking={b} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </AdminLayout>
  );
}
