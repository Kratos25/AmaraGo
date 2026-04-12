'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, UserCheck, CalendarCheck, CalendarClock,
  IndianRupee, TrendingUp, Check, X, ChevronRight,
  Clock, MapPin, Star, AlertCircle, Activity,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import AdminLayout from './_components/AdminLayout';
import { adminAPI, providersAPI, bookingsAPI, type DashboardStats, type ProviderProfile, type Booking } from '@/lib/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
// Primary   #C84B31   Hover #B04028
// Tint bg   #FFF0EC   Tint border #FDDDD5
// Page bg   #F5F4F2   Surface #FFFFFF
// Border    #EBEBEB
// Text-1    #1A1A1A   Text-2 #6B7280   Text-3 #9CA3AF

// ─── Types ────────────────────────────────────────────────────────────────────
// Weekly sparkline data (Mon–Sun) — decorative only
const WEEKLY_REVENUE = [18400, 22100, 15800, 31200, 28900, 42000, 38500];
const WEEKLY_BOOKINGS = [12, 18, 9, 24, 21, 31, 27];

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color = '#C84B31' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 80; const H = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" className="shrink-0">
      <polyline points={pts} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points={`0,${H} ${pts} ${W},${H}`} stroke="none" fill={color} fillOpacity="0.08" />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  Icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  iconBorder: string;
  sparkData: number[];
  sparkColor: string;
  onClick?: () => void;
}

function StatCard({ label, value, change, positive, Icon, iconColor, iconBg, iconBorder, sparkData, sparkColor, onClick }: StatCardProps) {
  return (
    <Card
      className={cn('border border-[#EBEBEB] shadow-none bg-white transition-all', onClick && 'cursor-pointer hover:border-[#FDDDD5] hover:shadow-sm')}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">{label}</p>
            <p className="font-bold text-[22px] sm:text-[26px] text-[#1A1A1A] tracking-tight leading-none">{value}</p>
          </div>
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border shrink-0', iconBg, iconBorder)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className={cn(
            'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full',
            positive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-500 border border-red-100',
          )}>
            <TrendingUp className={cn('w-3 h-3', !positive && 'rotate-180')} />
            {change}
          </span>
          <Sparkline data={sparkData} color={sparkColor} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [pendingProviders, setPendingProviders] = useState<ProviderProfile[]>([]);

  useEffect(() => {
    adminAPI.getDashboard().then(({ data }) => setStats(data)).catch(() => {});
    bookingsAPI.list({ status: undefined }).then(({ data }) => setRecentBookings(data.slice(0, 5))).catch(() => {});
    providersAPI.list({ approved: false }).then(({ data }) => setPendingProviders(data)).catch(() => {});
  }, []);

  const handleApprove = async (uid: string, name: string) => {
    try {
      await providersAPI.setApproval(uid, true);
      setPendingProviders((p) => p.filter((sp) => sp.uid !== uid));
      toast({ title: `${name} approved ✓`, description: 'Provider is now active and can receive bookings.' });
    } catch {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    }
  };

  const handleReject = async (uid: string, name: string) => {
    try {
      await providersAPI.setApproval(uid, false);
      setPendingProviders((p) => p.filter((sp) => sp.uid !== uid));
      toast({ title: `${name} rejected`, description: 'Provider application has been declined.' });
    } catch {
      toast({ title: 'Failed to reject', variant: 'destructive' });
    }
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <AdminLayout
      title="Dashboard"
      subtitle={today}
      topBarRight={
        <Button
          onClick={() => router.push('/admin/services?tab=services&openAdd=true')}
          className="h-9 px-4 bg-[#C84B31] hover:bg-[#B04028] text-white font-semibold text-[13px] rounded-xl shadow-none border-0"
        >
          + Add Service
        </Button>
      }
    >

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <StatCard
          label="Total Clients"
          value={stats ? stats.verified_clients.toLocaleString() : "2,450"}
          change="+12% MTD"
          positive
          Icon={Users}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          iconBorder="border-blue-100"
          sparkData={[180, 210, 195, 240, 228, 245, 245]}
          sparkColor="#3B82F6"
          onClick={() => router.push('/admin/clients')}
        />
        <StatCard
          label="Service Providers"
          value={stats ? stats.active_providers.toString() : "48"}
          change="+5% MTD"
          positive
          Icon={UserCheck}
          iconColor="text-[#C84B31]"
          iconBg="bg-[#FFF0EC]"
          iconBorder="border-[#FDDDD5]"
          sparkData={[38, 40, 41, 43, 44, 46, 48]}
          sparkColor="#C84B31"
          onClick={() => router.push('/admin/providers')}
        />
        <StatCard
          label="Total Bookings"
          value={stats ? stats.total_bookings.toLocaleString() : "1,284"}
          change="+18% MTD"
          positive
          Icon={CalendarCheck}
          iconColor="text-green-500"
          iconBg="bg-green-50"
          iconBorder="border-green-100"
          sparkData={[92, 110, 98, 124, 118, 131, 127]}
          sparkColor="#16A34A"
          onClick={() => router.push('/admin/bookings')}
        />
        <StatCard
          label="Active Bookings"
          value="34"
          change="+8% today"
          positive
          Icon={CalendarClock}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          iconBorder="border-amber-100"
          sparkData={[22, 28, 19, 34, 31, 38, 34]}
          sparkColor="#F59E0B"
          onClick={() => router.push('/admin/bookings?status=active')}
        />
        <StatCard
          label="Revenue (MTD)"
          value="₹4.2L"
          change="+22% MTD"
          positive
          Icon={IndianRupee}
          iconColor="text-purple-500"
          iconBg="bg-purple-50"
          iconBorder="border-purple-100"
          sparkData={[18400, 22100, 15800, 31200, 28900, 42000, 38500]}
          sparkColor="#8B5CF6"
          onClick={() => router.push('/admin/payments')}
        />
        <StatCard
          label="Pending Approvals"
          value={String(pendingProviders.length)}
          change="Needs action"
          positive={false}
          Icon={AlertCircle}
          iconColor="text-rose-500"
          iconBg="bg-rose-50"
          iconBorder="border-rose-100"
          sparkData={[8, 6, 9, 5, 7, 4, pendingProviders.length]}
          sparkColor="#F43F5E"
        />
      </div>

      {/* ── Main two-column grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">

        {/* ══ LEFT ══════════════════════════════════════════════════════════ */}
        <div className="space-y-5">

          {/* Recent Bookings */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-bold text-[15px] text-[#1A1A1A]">Recent Bookings</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">Latest activity across the platform</p>
                </div>
                <button
                  onClick={() => router.push('/admin/bookings')}
                  className="flex items-center gap-1 text-[12px] font-semibold text-[#C84B31] hover:opacity-80"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Table header — desktop */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_80px_100px] gap-3 px-3 py-2 mb-1">
                {['Client', 'Service', 'Provider', 'Amount', 'Status'].map((h) => (
                  <p key={h} className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{h}</p>
                ))}
              </div>

              <div className="space-y-1.5">
                {recentBookings.map((b) => {
                  const apiStatus = b.status;
                  const statusKey =
                    apiStatus === 'completed' ? 'completed' :
                    apiStatus === 'active'    ? 'in_progress' :
                    apiStatus === 'confirmed' ? 'confirmed' : 'searching';
                  const statusCfg = {
                    completed:   { label: 'Completed',   bg: 'bg-green-50',  border: 'border-green-100', text: 'text-green-700',  dot: 'bg-green-500'  },
                    in_progress: { label: 'In Progress', bg: 'bg-blue-50',   border: 'border-blue-100',  text: 'text-blue-700',   dot: 'bg-blue-500'   },
                    searching:   { label: 'Searching',   bg: 'bg-amber-50',  border: 'border-amber-100', text: 'text-amber-700',  dot: 'bg-amber-500'  },
                    confirmed:   { label: 'Confirmed',   bg: 'bg-[#FFF0EC]', border: 'border-[#FDDDD5]', text: 'text-[#C84B31]',  dot: 'bg-[#C84B31]'  },
                  } as const;
                  const s = statusCfg[statusKey as keyof typeof statusCfg];
                  return (
                    <div
                      key={b.id}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_80px_100px] gap-1 sm:gap-3 px-3 py-3 bg-[#F5F4F2] rounded-xl border border-transparent hover:border-[#EBEBEB] transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/bookings/${b.id}`)}
                    >
                      <div className="flex items-center justify-between sm:block">
                        <div>
                          <p className="text-[13px] font-semibold text-[#1A1A1A]">{b.client_name ?? 'Client'}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-[#9CA3AF]" />
                            <span className="text-[10px] text-[#9CA3AF]">{b.address}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:hidden">
                          <span className="text-[13px] font-bold text-[#1A1A1A]">₹{b.total_price.toLocaleString()}</span>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', s.bg, s.border, s.text)}>
                            {s.label}
                          </span>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[12px] font-medium text-[#1A1A1A]">{b.service_name ?? 'Service'}</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">{b.time}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[12px] font-medium text-[#6B7280]">{b.provider_name ?? 'Pending'}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[13px] font-bold text-[#1A1A1A]">₹{b.total_price.toLocaleString()}</p>
                      </div>
                      <div className="hidden sm:flex items-center">
                        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border', s.bg, s.border, s.text)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {recentBookings.length === 0 && (
                  <p className="text-center text-[12px] text-[#9CA3AF] py-8">No bookings yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weekly overview chart */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-bold text-[15px] text-[#1A1A1A]">Weekly Overview</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">Revenue & bookings — last 7 days</p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-[#9CA3AF]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C84B31]" /> Revenue
                  </span>
                  <span className="flex items-center gap-1.5 text-[#9CA3AF]">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Bookings
                  </span>
                </div>
              </div>

              {/* Bar chart */}
              {(() => {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const maxRev = Math.max(...WEEKLY_REVENUE);
                const maxBk  = Math.max(...WEEKLY_BOOKINGS);
                return (
                  <div className="flex items-end gap-2 sm:gap-3 h-40">
                    {days.map((day, i) => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="flex items-end gap-0.5 w-full h-32">
                          {/* Revenue bar */}
                          <div
                            className="flex-1 rounded-t-lg bg-[#C84B31] transition-all duration-500 min-h-[4px]"
                            style={{ height: `${(WEEKLY_REVENUE[i] / maxRev) * 100}%` }}
                          />
                          {/* Bookings bar */}
                          <div
                            className="flex-1 rounded-t-lg bg-blue-400 transition-all duration-500 min-h-[4px]"
                            style={{ height: `${(WEEKLY_BOOKINGS[i] / maxBk) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#9CA3AF] font-medium">{day}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#EBEBEB]">
                {[
                  { label: 'Total Revenue',   value: '₹1,97,900', color: 'text-[#C84B31]' },
                  { label: 'Total Bookings',  value: '142',        color: 'text-blue-500'  },
                  { label: 'Avg per Booking', value: '₹1,394',    color: 'text-green-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p className={cn('font-bold text-[16px] sm:text-[18px]', color)}>{value}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ══ RIGHT ═════════════════════════════════════════════════════════ */}
        <div className="space-y-5">

          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-[15px] text-[#1A1A1A]">Pending SP Approvals</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">Providers awaiting verification</p>
                </div>
                {pendingProviders.length > 0 && (
                  <span className="text-[11px] font-bold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-2.5 py-1 rounded-full">
                    {pendingProviders.length} pending
                  </span>
                )}
              </div>

              {pendingProviders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-[13px] font-semibold text-[#1A1A1A]">All caught up!</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">No pending approvals right now</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingProviders.map((sp) => (
                    <div key={sp.uid} className="bg-[#F5F4F2] rounded-xl border border-[#EBEBEB] p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center text-lg shrink-0">
                          ✨
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-[14px] text-[#1A1A1A] truncate">{sp.name}</p>
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full shrink-0">
                              Pending
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px] text-[#9CA3AF]">{sp.experience_years}yr exp.</span>
                            <span className="text-[#EBEBEB]">·</span>
                            <span className="text-[11px] text-[#9CA3AF] truncate">{sp.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {sp.services_offered.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] font-semibold text-[#6B7280] bg-white border border-[#EBEBEB] px-2 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                        {sp.created_at && (
                          <span className="text-[10px] text-[#9CA3AF] self-center ml-1">
                            · {new Date(sp.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="h-9 bg-[#C84B31] hover:bg-[#B04028] text-white font-semibold text-[12px] rounded-xl shadow-none border-0"
                          onClick={() => handleApprove(sp.uid, sp.name)}
                        >
                          <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="h-9 border-[#EBEBEB] text-[#6B7280] hover:bg-red-50 hover:border-red-200 hover:text-red-500 font-semibold text-[12px] rounded-xl shadow-none"
                          onClick={() => handleReject(sp.uid, sp.name)}
                        >
                          <X className="w-3.5 h-3.5 mr-1.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingProviders.length > 0 && (
                <button
                  onClick={() => router.push('/admin/providers?tab=pending')}
                  className="w-full flex items-center justify-center gap-1.5 mt-3 py-2.5 text-[12px] font-semibold text-[#C84B31] hover:opacity-80 transition-opacity"
                >
                  View all pending <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </CardContent>
          </Card>

          {/* Platform health */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[#C84B31]" />
                <p className="font-bold text-[15px] text-[#1A1A1A]">Platform Health</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Provider Fill Rate',    value: 94, color: '#16A34A' },
                  { label: 'Booking Completion',    value: 88, color: '#C84B31' },
                  { label: 'Client Retention',      value: 76, color: '#2563EB' },
                  { label: 'Payment Success Rate',  value: 99, color: '#D97706' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium text-[#6B7280]">{label}</span>
                      <span className="text-[12px] font-bold" style={{ color }}>{value}%</span>
                    </div>
                    <div className="h-1.5 bg-[#F5F4F2] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${value}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div className="mt-5 pt-4 border-t border-[#EBEBEB] space-y-1.5">
                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Quick Links</p>
                {[
                  { label: 'Manage Service Providers', href: '/admin/providers' },
                  { label: 'View All Bookings',         href: '/admin/bookings'  },
                  { label: 'Payment Reports',           href: '/admin/payments'  },
                ].map(({ label, href }) => (
                  <button
                    key={href}
                    onClick={() => router.push(href)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-[#F5F4F2] rounded-xl border border-transparent hover:border-[#EBEBEB] transition-colors group"
                  >
                    <span className="text-[12px] font-medium text-[#6B7280] group-hover:text-[#1A1A1A] transition-colors">{label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#C84B31] transition-colors" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

    </AdminLayout>
  );
}
