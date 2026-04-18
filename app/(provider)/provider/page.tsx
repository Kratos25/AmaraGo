'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Briefcase, Wallet, Award, ChevronRight,
  MapPin, Clock, Calendar, User, Star, CheckCircle2,
  Timer, AlertCircle, IndianRupee, Percent,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/app/lib/utils';
import ProviderLayout from './_components/ProviderLayout';
import { providersAPI, type ProviderProfile, type Booking, type EarningsSummary } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todaySubtitle() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3 h-3',
            i < full
              ? 'text-amber-400 fill-amber-400'
              : i === full && hasHalf
                ? 'text-amber-400 fill-amber-200'
                : 'text-[#D1D5DB]',
          )}
        />
      ))}
    </div>
  );
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  pending:   { label: 'Pending',     color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', Icon: Clock       },
  confirmed: { label: 'Confirmed',   color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', Icon: CheckCircle2 },
  active:    { label: 'In Progress', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', Icon: Timer        },
  completed: { label: 'Completed',   color: '#6B7280', bg: '#F5F4F2', border: '#EBEBEB', Icon: CheckCircle2 },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatItem {
  label: string;
  value: string;
  Icon: React.ElementType;
  sub?: React.ReactNode;
  loading?: boolean;
}

function StatCard({ label, value, Icon, sub, loading }: StatItem) {
  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col">
          <div className="w-9 h-9 rounded-xl bg-[#FFF0EC] flex items-center justify-center mb-3">
            <Icon className="w-4 h-4 text-[#C84B31]" />
          </div>
          <p className="text-[11px] text-[#9CA3AF] font-medium">{label}</p>
          {loading ? (
            <div className="h-7 w-16 rounded-lg bg-[#F5F4F2] animate-pulse mt-1" />
          ) : (
            <p className="font-bold text-xl md:text-2xl text-[#1A1A1A] tracking-tight leading-none mt-1">{value}</p>
          )}
          {sub && <div className="mt-1.5">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.pending;
  const StatusIcon = cfg.Icon;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 bg-white border border-[#EBEBEB] rounded-xl hover:border-[#C84B31]/25 hover:shadow-sm transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13px] text-[#1A1A1A] truncate">{booking.service_name ?? 'Service'}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[11px] text-[#9CA3AF]">{booking.client_name ?? '—'}</span>
          <span className="text-[#EBEBEB]">·</span>
          <span className="text-[11px] text-[#9CA3AF]">{booking.date}</span>
          <span className="text-[#EBEBEB]">·</span>
          <span className="text-[11px] text-[#9CA3AF]">{booking.time}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-[13px] text-[#1A1A1A]">₹{fmt(booking.total_price)}</p>
        <span
          className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          {cfg.label}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-[#D1D5DB] shrink-0 group-hover:text-[#C84B31] transition-colors" />
    </div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: EarningsSummary['transactions'][0] }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#F5F4F2] rounded-xl">
      <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[12px] text-[#1A1A1A] truncate">{tx.service_name}</p>
        <p className="text-[11px] text-[#9CA3AF] truncate">{tx.client_name} · {tx.date}</p>
      </div>
      <p className="font-bold text-[13px] text-emerald-600 shrink-0">+₹{fmt(tx.net_amount)}</p>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[#9CA3AF] shrink-0">{icon}</span>
      <span className="text-[11px] text-[#9CA3AF] w-20 shrink-0">{label}</span>
      <span className="text-[13px] text-[#1A1A1A] font-medium truncate">{value}</span>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRows({ n = 3, h = 'h-[60px]' }: { n?: number; h?: string }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={cn(h, 'rounded-xl bg-[#F5F4F2] animate-pulse')} />
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SPDashboard() {
  const router = useRouter();
  const [profile,  setProfile]  = useState<ProviderProfile | null>(null);
  const [allJobs,  setAllJobs]  = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.allSettled([
      providersAPI.getMyProfile().then(({ data }) => setProfile(data)),
      providersAPI.getMyJobs().then(({ data }) => setAllJobs(data)),
      providersAPI.getMyEarnings().then(({ data }) => setEarnings(data)),
    ]).finally(() => setLoading(false));
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeJobs = useMemo(
    () => allJobs
      .filter((b) => ['pending', 'confirmed', 'active'].includes(b.status))
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(0, 6),
    [allJobs],
  );

  const recentTx   = earnings?.transactions.slice(0, 5) ?? [];
  const rating     = profile?.rating ?? 0;
  const ratingStr  = rating > 0 ? rating.toFixed(1) : '—';

  const stats: StatItem[] = [
    {
      label: 'Total Earned',
      value: earnings ? `₹${fmt(earnings.total_earned)}` : '₹0',
      Icon: Wallet, loading,
    },
    {
      label: 'This Month',
      value: earnings ? `₹${fmt(earnings.this_month)}` : '₹0',
      Icon: TrendingUp, loading,
    },
    {
      label: 'Jobs Done',
      value: String(profile?.total_jobs ?? 0),
      Icon: Briefcase, loading,
    },
    {
      label: 'Avg Rating',
      value: ratingStr,
      Icon: Award,
      loading,
      sub: rating > 0 ? <StarRating rating={rating} /> : null,
    },
  ];

  return (
    <ProviderLayout title="Dashboard" subtitle={todaySubtitle()}>
      <div className="space-y-5 md:space-y-6">

        {/* ── Pending-approval full-screen message ── */}
        {!loading && profile && !profile.is_approved && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-5">
              <AlertCircle className="w-9 h-9 text-amber-500" />
            </div>
            <h2 className="font-bold text-[20px] text-[#1A1A1A] mb-2">Waiting for Admin Approval</h2>
            <p className="text-[14px] text-[#6B7280] max-w-sm">
              Your application has been submitted. We'll verify your details and get back to you <span className="font-semibold text-[#1A1A1A]">within 24 hours</span>.
            </p>
            <div className="mt-6 px-5 py-3 bg-amber-50 border border-amber-200 rounded-xl max-w-xs">
              <p className="text-[12px] font-semibold text-amber-700">⏳ Application under review</p>
              <p className="text-[11px] text-amber-600 mt-1">You'll receive access once our team approves your profile.</p>
            </div>
            <button
              onClick={() => router.push('/client/home')}
              className="mt-6 text-[13px] font-semibold text-[#C84B31] hover:opacity-80 transition-opacity"
            >
              ← Back to Home
            </button>
          </div>
        )}

        {/* ── Full dashboard (approved only) ── */}
        {(loading || (profile && profile.is_approved)) && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* ── ROW 2: Assigned Jobs + Earnings Overview ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-start">

          {/* Assigned Jobs */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[15px] text-[#1A1A1A] tracking-tight">Assigned Jobs</h2>
              {activeJobs.length > 0 && (
                <button
                  className="text-[#C84B31] text-[13px] font-medium hover:text-[#B04028] transition-colors flex items-center gap-1"
                  onClick={() => router.push('/provider/my-jobs')}
                >
                  See all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Card className="border border-[#EBEBEB] shadow-none bg-white overflow-hidden">
              <CardContent className="p-3 space-y-2">
                {loading ? (
                  <SkeletonRows n={3} />
                ) : activeJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF0EC] flex items-center justify-center mb-3">
                      <Briefcase className="w-5 h-5 text-[#C84B31]/40" />
                    </div>
                    <p className="font-semibold text-[13px] text-[#6B7280]">No active jobs</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-1">Admin will assign bookings to you</p>
                  </div>
                ) : (
                  activeJobs.map((b) => (
                    <BookingCard key={b.id} booking={b} onClick={() => router.push('/provider/my-jobs')} />
                  ))
                )}
              </CardContent>
              {/* Status legend */}
              <div className="px-4 py-3 border-t border-[#EBEBEB] flex items-center gap-4 flex-wrap">
                {(['pending', 'confirmed', 'active'] as const).map((k) => (
                  <span key={k} className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                    <span className="w-2 h-2 rounded-full" style={{ background: STATUS_CFG[k].color }} />
                    {STATUS_CFG[k].label}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Earnings Overview */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[15px] text-[#1A1A1A] tracking-tight">Earnings Overview</h2>
            </div>
            <Card className="border border-[#EBEBEB] shadow-none bg-white overflow-hidden">
              {/* Total banner */}
              <div
                className="px-5 py-5"
                style={{ background: 'linear-gradient(135deg, #C84B31 0%, #E8703A 55%, #F2924A 100%)' }}
              >
                <p className="text-[10px] font-bold text-white/70 tracking-widest uppercase mb-1">Lifetime Earned</p>
                <p className="font-bold text-[28px] text-white tracking-tight leading-none">
                  {loading ? '—' : `₹${fmt(earnings?.total_earned ?? 0)}`}
                </p>
                <p className="text-[12px] text-white/70 mt-1">
                  Commission: {earnings?.commission_rate ?? 15}% per job
                </p>
              </div>
              {/* Week / Month */}
              <div className="grid grid-cols-2 divide-x divide-[#EBEBEB] border-b border-[#EBEBEB]">
                {[
                  { label: 'This Week',  value: earnings?.this_week  ?? 0 },
                  { label: 'This Month', value: earnings?.this_month ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-4">
                    <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wider">{label}</p>
                    {loading ? (
                      <div className="h-6 w-20 rounded-lg bg-[#F5F4F2] animate-pulse mt-1" />
                    ) : (
                      <p className="font-bold text-[18px] text-[#1A1A1A] tracking-tight mt-0.5">₹{fmt(value)}</p>
                    )}
                  </div>
                ))}
              </div>
              {/* Quick stats row */}
              <div className="grid grid-cols-3 divide-x divide-[#EBEBEB] border-b border-[#EBEBEB]">
                {[
                  { Icon: Briefcase, label: 'Total Jobs', value: String(earnings?.total_jobs ?? profile?.total_jobs ?? 0) },
                  { Icon: Percent,   label: 'Commission', value: `${earnings?.commission_rate ?? 15}%` },
                  { Icon: MapPin,    label: 'Location',   value: profile?.location ? profile.location.split(',')[0] : '—' },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="px-4 py-3 flex flex-col items-center text-center">
                    <Icon className="w-3.5 h-3.5 text-[#9CA3AF] mb-1" />
                    <p className="font-semibold text-[13px] text-[#1A1A1A]">{value}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{label}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 flex gap-2.5">
                <button
                  className="flex-1 h-9 rounded-xl border border-[#C84B31]/30 bg-[#FFF0EC] text-[#C84B31] text-[13px] font-semibold hover:bg-[#FDDDD5] transition-colors"
                  onClick={() => router.push('/provider/earnings')}
                >
                  View Earnings
                </button>
                <button
                  className="flex-1 h-9 rounded-xl border border-[#EBEBEB] bg-white text-[#6B7280] text-[13px] font-semibold hover:bg-[#FFF0EC] hover:border-[#FDDDD5] hover:text-[#C84B31] transition-colors"
                  onClick={() => router.push('/provider/earnings')}
                >
                  Full Report
                </button>
              </div>
            </Card>
          </div>

        </div>

        {/* ── ROW 3: Recent Payments + Profile Snapshot ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-start">

          {/* Recent Payments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[15px] text-[#1A1A1A] tracking-tight">Recent Payments</h2>
              <button
                className="text-[#C84B31] text-[13px] font-medium hover:text-[#B04028] transition-colors flex items-center gap-1"
                onClick={() => router.push('/provider/earnings')}
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <Card className="border border-[#EBEBEB] shadow-none bg-white">
              <CardContent className="p-4 space-y-2">
                {loading ? (
                  <SkeletonRows n={3} h="h-[52px]" />
                ) : recentTx.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <IndianRupee className="w-8 h-8 text-[#D1D5DB] mb-2" />
                    <p className="text-[13px] text-[#9CA3AF]">No transactions yet</p>
                  </div>
                ) : (
                  recentTx.map((tx) => <TxRow key={tx.id} tx={tx} />)
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Snapshot */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[15px] text-[#1A1A1A] tracking-tight">My Profile</h2>
              <button
                className="text-[#C84B31] text-[13px] font-medium hover:text-[#B04028] transition-colors flex items-center gap-1"
                onClick={() => router.push('/provider/profile')}
              >
                Edit <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <Card className="border border-[#EBEBEB] shadow-none bg-white">
              <CardContent className="p-5 space-y-4">
                {loading ? (
                  <SkeletonRows n={3} h="h-5" />
                ) : (
                  <>
                    {profile?.bio && (
                      <p className="text-[13px] text-[#6B7280] leading-relaxed line-clamp-3">{profile.bio}</p>
                    )}
                    <div className="space-y-2.5">
                      {!!profile?.experience_years && (
                        <InfoRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Experience"
                          value={`${profile.experience_years} yr${profile.experience_years !== 1 ? 's' : ''}`} />
                      )}
                      {profile?.location && (
                        <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={profile.location} />
                      )}
                      {profile?.phone && (
                        <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Phone" value={profile.phone} />
                      )}
                      {rating > 0 && (
                        <InfoRow
                          icon={<Star className="w-3.5 h-3.5" />}
                          label="Rating"
                          value={<span className="flex items-center gap-1.5">{ratingStr} <StarRating rating={rating} /></span>}
                        />
                      )}
                    </div>
                    {!!profile?.services_offered?.length && (
                      <div>
                        <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-2">Services Offered</p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.services_offered.slice(0, 6).map((s) => (
                            <span key={s} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FFF0EC] text-[#C84B31] border border-[#FDDDD5]">
                              {s}
                            </span>
                          ))}
                          {profile.services_offered.length > 6 && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F5F4F2] text-[#9CA3AF] border border-[#EBEBEB]">
                              +{profile.services_offered.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

        {/* ── ROW 4: Quick Actions ── */}
        <div>
          <h2 className="font-bold text-[15px] text-[#1A1A1A] tracking-tight mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'My Jobs',  desc: 'View assigned bookings',  path: '/provider/my-jobs',  Icon: Briefcase },
              { label: 'Earnings', desc: 'Income & transactions',    path: '/provider/earnings', Icon: Wallet    },
              { label: 'Schedule', desc: 'Manage your calendar',     path: '/provider/schedule', Icon: Calendar  },
              { label: 'Profile',  desc: 'Update your info',         path: '/provider/profile',  Icon: User      },
            ].map((a) => (
              <Card
                key={a.label}
                className="border border-[#EBEBEB] shadow-none hover:border-[#C84B31]/30 hover:shadow-sm transition-all cursor-pointer group bg-white"
                onClick={() => router.push(a.path)}
              >
                <CardContent className="p-4 md:p-5 flex flex-col gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0EC] flex items-center justify-center group-hover:bg-[#FDDDD5] transition-colors">
                    <a.Icon className="w-5 h-5 text-[#C84B31]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[13px] text-[#1A1A1A]">{a.label}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">{a.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        </>)}
      </div>
    </ProviderLayout>
  );
}