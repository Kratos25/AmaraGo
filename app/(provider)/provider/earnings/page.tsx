'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ArrowDownToLine, Filter, Briefcase, Percent, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProviderLayout from '@/app/(provider)/provider/_components/ProviderLayout';

// ─── Design tokens ────────────────────────────────────────────────────────────
// Primary   #C84B31   Hover #B04028   Active #9A3522
// Tint bg   #FFF0EC   Tint border #FDDDD5
// Page bg   #F5F4F2   Surface #FFFFFF
// Border    #EBEBEB
// Text-1    #1A1A1A   Text-2 #6B7280   Text-3 #9CA3AF

interface Transaction {
  id: string;
  service: string;
  client: string;
  amount: number;
  date: string;
}

const transactions: Transaction[] = [
  { id: '1', service: 'Gold Facial',     client: 'Ananya S.',  amount: 1599,  date: 'Today, 3:45 PM'  },
  { id: '2', service: 'Party Makeup',    client: 'Priya M.',   amount: 1999,  date: 'Today, 12:30 PM' },
  { id: '3', service: 'Hair Spa',        client: 'Meghna K.',  amount: 999,   date: 'Yesterday'       },
  { id: '4', service: 'Bridal Package',  client: 'Sneha R.',   amount: 12000, date: 'Dec 25'          },
];

export default function SPEarnings() {
  const router = useRouter();

  return (
    <ProviderLayout title="Earnings" subtitle="Wednesday, 14 March 2025">

      {/* ── Two-column grid on desktop ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_400px] gap-5 md:gap-7 items-start">

        {/* ══ LEFT COLUMN ════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { Icon: Briefcase, label: 'Total Jobs',  value: '156'   },
              { Icon: Percent,   label: 'Commission',  value: '15%'   },
              { Icon: Clock,     label: 'Pending',     value: '₹4.2K' },
            ].map(({ Icon, label, value }) => (
              <Card key={label} className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF0EC] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#C84B31]" />
                  </div>
                  <p className="font-bold text-[18px] text-[#1A1A1A] leading-none">{value}</p>
                  <p className="text-[11px] text-[#9CA3AF] font-medium">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Transactions */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Recent Transactions</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[12px] font-medium text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F5F4F2] rounded-lg px-2.5"
                >
                  <Filter className="w-3.5 h-3.5 mr-1.5" /> Filter
                </Button>
              </div>

              <div className="space-y-2.5">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3.5 bg-[#F5F4F2] rounded-xl border border-transparent hover:border-[#EBEBEB] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center text-lg shrink-0">
                      ✨
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{tx.service}</p>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">{tx.client} · {tx.date}</p>
                    </div>
                    <span className="text-[14px] font-bold text-green-600 shrink-0">
                      +₹{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ══ RIGHT COLUMN (sticky) ══════════════════════════════════════ */}
        <div className="hidden md:flex flex-col gap-4 sticky top-[73px]">

          {/* Balance hero */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg, #C84B31 0%, #E8703A 55%, #F2924A 100%)' }}
          >
            <p className="text-white/60 text-[11px] font-medium mb-1">Total Balance</p>
            <p className="text-white font-bold text-[42px] tracking-tight leading-none">₹24,580</p>
            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/15">
              <div>
                <p className="text-white/60 text-[10px] font-medium mb-0.5">This Week</p>
                <p className="text-white font-bold text-[18px]">₹8,450</p>
                <span className="inline-flex items-center gap-1 text-white/80 bg-white/15 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1">
                  <TrendingUp className="w-2.5 h-2.5" /> +18%
                </span>
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-medium mb-0.5">This Month</p>
                <p className="text-white font-bold text-[18px]">₹24,580</p>
              </div>
            </div>
          </div>

          {/* Withdraw */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5 space-y-4">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Payout</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Available',  value: '₹24,580', highlight: true },
                  { label: 'Pending',    value: '₹4,200' },
                  { label: 'Commission', value: '15%' },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[12px] text-[#9CA3AF]">{label}</span>
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

          {/* Weekly breakdown */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">This Week</p>
              <div className="space-y-2">
                {[
                  { day: 'Mon', amount: 1599, max: 12000 },
                  { day: 'Tue', amount: 2998, max: 12000 },
                  { day: 'Wed', amount: 999,  max: 12000 },
                  { day: 'Thu', amount: 0,    max: 12000 },
                  { day: 'Fri', amount: 2854, max: 12000 },
                ].map(({ day, amount, max }) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-[11px] text-[#9CA3AF] w-7 shrink-0">{day}</span>
                    <div className="flex-1 h-2 bg-[#F5F4F2] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C84B31] rounded-full transition-all duration-500"
                        style={{ width: `${(amount / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#1A1A1A] w-14 text-right shrink-0">
                      {amount ? `₹${amount.toLocaleString()}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* ── Mobile: balance hero + withdraw (below stats) ────────────────── */}
      <div className="md:hidden mt-4 space-y-4">

        {/* Balance hero */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #C84B31 0%, #E8703A 55%, #F2924A 100%)' }}
        >
          <p className="text-white/60 text-[11px] font-medium mb-1">Total Balance</p>
          <p className="text-white font-bold text-[38px] tracking-tight leading-none">₹24,580</p>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/15">
            <div>
              <p className="text-white/60 text-[10px] font-medium mb-0.5">This Week</p>
              <p className="text-white font-bold text-[16px]">₹8,450</p>
              <span className="inline-flex items-center gap-1 text-white/80 bg-white/15 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1">
                <TrendingUp className="w-2.5 h-2.5" /> +18%
              </span>
            </div>
            <div>
              <p className="text-white/60 text-[10px] font-medium mb-0.5">This Month</p>
              <p className="text-white font-bold text-[16px]">₹24,580</p>
            </div>
          </div>
          <Button className="w-full h-10 mt-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl shadow-none border border-white/20 text-[13px]">
            <ArrowDownToLine className="w-4 h-4 mr-2" /> Withdraw to Bank
          </Button>
        </div>

      </div>

    </ProviderLayout>
  );
}