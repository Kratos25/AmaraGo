'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownToLine, Briefcase, Percent, TrendingUp,
  RefreshCw, IndianRupee, Star, ChevronRight, Wallet,
  CalendarDays, Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProviderLayout from '@/app/(provider)/provider/_components/ProviderLayout';
import { providersAPI, type EarningsSummary, type EarningTransaction } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todaySubtitle() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function getWeekDates(anchor: Date): Date[] {
  const monday = new Date(anchor);
  const day = monday.getDay();
  monday.setDate(anchor.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Last 6 calendar months (oldest → newest) */
function last6MonthsBreakdown(txs: EarningTransaction[]): { label: string; amount: number; month: string }[] {
  const today   = new Date();
  const months  = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    return {
      year:  d.getFullYear(),
      month: d.getMonth(),
      label: MONTH_SHORT[d.getMonth()],
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    };
  });
  return months.map((m) => ({
    label:  m.label,
    month:  m.key,
    amount: txs
      .filter((tx) => tx.date?.slice(0, 7) === m.key)
      .reduce((s, tx) => s + (tx.net_amount ?? 0), 0),
  }));
}

/** Per-day totals for the current week */
function weeklyBreakdown(txs: EarningTransaction[]): { day: string; amount: number }[] {
  const weekDates = getWeekDates(new Date());
  return weekDates.map((d, i) => ({
    day: DAY_LABELS[i],
    amount: txs
      .filter((tx) => tx.date?.slice(0, 10) === toDateStr(d))
      .reduce((s, tx) => s + (tx.net_amount ?? 0), 0),
  }));
}

/** Group by service, sort by total net_amount desc */
function topServices(txs: EarningTransaction[]): { name: string; total: number; count: number }[] {
  const map: Record<string, { total: number; count: number }> = {};
  for (const tx of txs) {
    const k = tx.service_name || 'Unknown';
    if (!map[k]) map[k] = { total: 0, count: 0 };
    map[k].total  += tx.net_amount ?? 0;
    map[k].count  += 1;
  }
  return Object.entries(map)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

// ─── Mini bar chart bar ───────────────────────────────────────────────────────

function Bar({ amount, max, label, highlight }: { amount: number; max: number; label: string; highlight?: boolean }) {
  const pct = max > 0 ? (amount / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-[9px] font-semibold text-[#9CA3AF] h-4 flex items-end">
        {amount > 0 ? `₹${fmt(amount)}` : ''}
      </span>
      <div className="w-full bg-[#F5F4F2] rounded-t-md overflow-hidden" style={{ height: 72 }}>
        <div
          className="w-full rounded-t-md transition-all duration-700"
          style={{
            height:     `${pct}%`,
            marginTop:  `${100 - pct}%`,
            background: highlight
              ? 'linear-gradient(180deg, #C84B31 0%, #E8703A 100%)'
              : '#EBEBEB',
          }}
        />
      </div>
      <span className={`text-[10px] font-semibold ${highlight ? 'text-[#C84B31]' : 'text-[#9CA3AF]'}`}>{label}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SPEarnings() {
  const [data,    setData]    = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'all' | 'month'>('all');

  const load = () => {
    setLoading(true);
    providersAPI.getMyEarnings()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const txs           = data?.transactions ?? [];
  const totalEarned   = data?.total_earned    ?? 0;
  const totalJobs     = data?.total_jobs      ?? 0;
  const commissionRate = data?.commission_rate ?? 0;
  const pendingPayout = data?.pending_payout  ?? 0;
  const thisWeek      = data?.this_week       ?? 0;
  const thisMonth     = data?.this_month      ?? 0;

  const avgPerJob        = totalJobs > 0 ? totalEarned / totalJobs : 0;
  const totalCommission  = useMemo(() => txs.reduce((s, tx) => s + (tx.commission ?? 0), 0), [txs]);
  const monthData        = useMemo(() => last6MonthsBreakdown(txs), [txs]);
  const weekData         = useMemo(() => weeklyBreakdown(txs), [txs]);
  const services         = useMemo(() => topServices(txs), [txs]);
  const monthMax         = Math.max(...monthData.map((m) => m.amount), 1);
  const weekMax          = Math.max(...weekData.map((d) => d.amount), 1);
  const currentMonthKey  = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const displayedTxs = tab === 'month'
    ? txs.filter((tx) => tx.date?.slice(0, 7) === currentMonthKey)
    : txs;

  return (
    <ProviderLayout title="Earnings" subtitle={todaySubtitle()}>

      {/* ── Refresh ────────────────────────────────────────────────────────── */}
      <div className="flex justify-end mb-4">
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-[12px] text-[#C84B31] font-medium hover:text-[#B04028] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Skeleton ───────────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          <div className="h-[180px] rounded-2xl bg-[#F5F4F2] animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-[100px] rounded-2xl bg-[#F5F4F2] animate-pulse" />
            <div className="h-[100px] rounded-2xl bg-[#F5F4F2] animate-pulse" />
          </div>
          <div className="h-[300px] rounded-2xl bg-[#F5F4F2] animate-pulse" />
        </div>
      )}

      {!loading && (
        <div className="space-y-4">

          {/* ── Hero gradient banner ─────────────────────────────────────── */}
          <div
            className="rounded-2xl p-5 sm:p-6"
            style={{ background: 'linear-gradient(135deg, #C84B31 0%, #E8703A 55%, #F2924A 100%)' }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-white/60 text-[11px] font-medium mb-1">Total Earned</p>
                <p className="text-white font-bold text-[44px] tracking-tight leading-none">₹{fmt(totalEarned)}</p>
                <p className="text-white/50 text-[11px] mt-2">Lifetime net earnings after commission</p>
              </div>
              <div className="bg-white/15 rounded-2xl px-4 py-3 text-center min-w-[90px]">
                <p className="text-white font-bold text-[26px] leading-none">{totalJobs}</p>
                <p className="text-white/60 text-[10px] mt-0.5 font-medium">Jobs Done</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/15">
              {[
                { label: 'This Week',  value: `₹${fmt(thisWeek)}`  },
                { label: 'This Month', value: `₹${fmt(thisMonth)}` },
                { label: 'Avg / Job',  value: `₹${fmt(avgPerJob)}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-white/60 text-[9px] font-medium mb-0.5 uppercase tracking-wide">{label}</p>
                  <p className="text-white font-bold text-[15px]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── 4 key metric tiles ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { Icon: Wallet,      label: 'Pending Payout',  value: `₹${fmt(pendingPayout)}`,   sub: 'Being processed'         },
              { Icon: Percent,     label: 'Commission Rate', value: `${commissionRate}%`,         sub: 'Platform fee per job'    },
              { Icon: IndianRupee, label: 'Total Deducted',  value: `₹${fmt(totalCommission)}`,  sub: 'Commission paid overall' },
              { Icon: Award,       label: 'Avg Per Job',     value: `₹${fmt(avgPerJob)}`,         sub: 'Net earnings average'    },
            ].map(({ Icon, label, value, sub }) => (
              <Card key={label} className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF0EC] flex items-center justify-center mb-3">
                    <Icon className="w-3.5 h-3.5 text-[#C84B31]" />
                  </div>
                  <p className="font-bold text-[17px] text-[#1A1A1A] leading-none">{value}</p>
                  <p className="text-[11px] font-semibold text-[#6B7280] mt-1">{label}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Main content: left + right ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">

            {/* ══ LEFT ════════════════════════════════════════════════════ */}
            <div className="space-y-4">

              {/* 6-month bar chart */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-[14px] text-[#1A1A1A]">Monthly Earnings</p>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">Last 6 months</p>
                    </div>
                    {thisMonth > 0 && (
                      <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        <span className="text-[11px] font-bold text-emerald-600">₹{fmt(thisMonth)} this month</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 items-end">
                    {monthData.map((m) => (
                      <Bar
                        key={m.month}
                        amount={m.amount}
                        max={monthMax}
                        label={m.label}
                        highlight={m.month === currentMonthKey}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Transaction list */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-5">
                  {/* Tab toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl">
                      {(['all', 'month'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTab(t)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                            tab === t ? 'bg-white text-[#C84B31] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]'
                          }`}
                        >
                          {t === 'all' ? `All (${txs.length})` : `This Month (${txs.filter(tx => tx.date?.slice(0,7) === currentMonthKey).length})`}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] font-medium">
                      ₹{fmt(displayedTxs.reduce((s, tx) => s + (tx.net_amount ?? 0), 0))} total
                    </p>
                  </div>

                  {displayedTxs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#FFF0EC] flex items-center justify-center mb-3">
                        <IndianRupee className="w-5 h-5 text-[#C84B31]/40" />
                      </div>
                      <p className="text-[13px] font-semibold text-[#6B7280]">
                        {tab === 'month' ? 'No transactions this month' : 'No transactions yet'}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF] mt-1">Completed jobs will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayedTxs.map((tx) => {
                        const initials = (tx.client_name ?? 'C').charAt(0).toUpperCase();
                        const dateStr  = tx.date
                          ? new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                          : '—';
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center gap-3 px-4 py-3 bg-[#F5F4F2] rounded-xl border border-transparent hover:border-[#EBEBEB] hover:bg-white transition-all"
                          >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C84B31] to-[#E8703A] flex items-center justify-center text-white font-bold text-[13px] shrink-0">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{tx.service_name || 'Service'}</p>
                              <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate">{tx.client_name || '—'} · {dateStr}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[13px] font-bold text-emerald-600">+₹{fmt(tx.net_amount ?? 0)}</p>
                              {(tx.commission ?? 0) > 0 && (
                                <p className="text-[10px] text-[#9CA3AF]">-₹{fmt(tx.commission)} fee</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ══ RIGHT (sticky sidebar) ═══════════════════════════════════ */}
            <div className="space-y-4 lg:sticky lg:top-[73px]">

              {/* Payout card */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-5 space-y-4">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Payout Summary</p>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Total Earned',   value: `₹${fmt(totalEarned)}`,    highlight: true  },
                      { label: 'Pending Payout', value: `₹${fmt(pendingPayout)}`,  highlight: false },
                      { label: 'Commission Rate',value: `${commissionRate}%`,       highlight: false },
                      { label: 'Total Deducted', value: `₹${fmt(totalCommission)}`,highlight: false },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className="flex items-center justify-between py-1 border-b border-[#F5F4F2] last:border-0">
                        <span className="text-[12px] text-[#6B7280]">{label}</span>
                        <span className={highlight
                          ? 'text-[14px] font-bold text-[#C84B31]'
                          : 'text-[12px] font-semibold text-[#1A1A1A]'
                        }>{value}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full h-11 bg-[#C84B31] hover:bg-[#B04028] active:bg-[#9A3522] text-white font-semibold rounded-xl shadow-none border-0 text-[13px]">
                    <ArrowDownToLine className="w-4 h-4 mr-2" /> Withdraw to Bank
                  </Button>
                </CardContent>
              </Card>

              {/* This week mini-chart */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">This Week</p>
                    <span className="text-[12px] font-bold text-[#C84B31]">₹{fmt(thisWeek)}</span>
                  </div>
                  {weekData.every((d) => d.amount === 0) ? (
                    <p className="text-[12px] text-[#9CA3AF] text-center py-3">No earnings this week</p>
                  ) : (
                    <div className="space-y-1.5">
                      {weekData.map(({ day, amount }) => (
                        <div key={day} className="flex items-center gap-2.5">
                          <span className="text-[10px] text-[#9CA3AF] w-6 shrink-0">{day}</span>
                          <div className="flex-1 h-1.5 bg-[#F5F4F2] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#C84B31] rounded-full transition-all duration-500"
                              style={{ width: weekMax > 0 ? `${(amount / weekMax) * 100}%` : '0%' }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-[#1A1A1A] w-14 text-right shrink-0">
                            {amount > 0 ? `₹${fmt(amount)}` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top services */}
              {services.length > 0 && (
                <Card className="border border-[#EBEBEB] shadow-none bg-white">
                  <CardContent className="p-5">
                    <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Top Services</p>
                    <div className="space-y-2.5">
                      {services.map((s, i) => {
                        const pct = services[0].total > 0 ? (s.total / services[0].total) * 100 : 0;
                        return (
                          <div key={s.name}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[10px] font-bold text-[#9CA3AF] w-4 shrink-0">#{i + 1}</span>
                                <span className="text-[12px] font-semibold text-[#1A1A1A] truncate">{s.name}</span>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <p className="text-[12px] font-bold text-[#C84B31]">₹{fmt(s.total)}</p>
                                <p className="text-[9px] text-[#9CA3AF]">{s.count} job{s.count !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className="h-1 bg-[#F5F4F2] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: i === 0
                                    ? 'linear-gradient(90deg, #C84B31, #E8703A)'
                                    : '#EBEBEB',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        </div>
      )}

    </ProviderLayout>
  );
}
