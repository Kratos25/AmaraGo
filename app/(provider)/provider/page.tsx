'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Briefcase,
  Wallet, MapPin, Clock, User, BookOpen,
  Award, BarChart2, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/app/lib/utils';
import ProviderLayout from './_components/ProviderLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  service: string;
  client: string;
  time: string;
  status: 'upcoming' | 'active' | 'completed';
  icon: string;
}

interface StatItem {
  label: string;
  value: string;
  Icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  sub?: React.ReactNode;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, Icon, trend, trendUp, sub }: StatItem) {
  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <div className="flex w-full md:justify-between md:items-start mb-2 md:mb-3 justify-center">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0EC] flex items-center justify-center">
              <Icon className="w-4 h-4 text-[#C84B31]" />
            </div>
            {trend && (
              <span className={cn(
                'hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-medium border',
                trendUp ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100',
              )}>
                {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#9CA3AF] font-medium">{label}</p>
          <p className="font-bold text-xl md:text-2xl text-[#1A1A1A] tracking-tight leading-none mt-1">{value}</p>
          {trend && (
            <span className={cn(
              'inline-flex md:hidden items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full mt-2 font-medium border',
              trendUp ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100',
            )}>
              {trendUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {trend}
            </span>
          )}
          {sub && <div className="mt-1.5">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: Job }) {
  return (
    <Card className="border border-[#EBEBEB] shadow-none hover:border-[#C84B31]/25 hover:shadow-sm transition-all cursor-pointer group bg-white">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[#FFF7ED] flex items-center justify-center text-lg shrink-0 group-hover:bg-[#FDEEE5] transition-colors">
          {job.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#1A1A1A] truncate">{job.service}</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{job.client}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-sm text-[#1A1A1A]">{job.time}</p>
          <Badge variant="outline" className={cn(
            'text-[10px] mt-1 font-medium border',
            job.status === 'active'
              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
              : 'text-amber-700 bg-amber-50 border-amber-100',
          )}>
            {job.status === 'active' ? 'In Progress' : 'Upcoming'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Countdown Bar ────────────────────────────────────────────────────────────

function CountdownBar({ seconds = 15 }: { seconds?: number }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);
  const pct = (remaining / seconds) * 100;
  const urgent = remaining <= 5;
  return (
    <div className="flex items-center gap-2.5 px-5 py-3 border-t border-[#FDDDD5] bg-[#FFFAF9] mx-4 rounded-xl">
      <Clock className="w-3 h-3 text-[#C84B31]/40 shrink-0" />
      <span className={cn('text-[11px] font-medium', urgent ? 'text-red-500' : 'text-[#C84B31]/60')}>
        Expires in {remaining}s
      </span>
      <div className="flex-1 h-[3px] rounded-full bg-[#FDE8E2] overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', urgent ? 'bg-red-400' : 'bg-[#C84B31]/50')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SPDashboard() {
  const router = useRouter();

  const stats: StatItem[] = [
    { label: "Today's Earnings", value: '₹2,450', Icon: Wallet,   trend: '+12%', trendUp: true },
    { label: 'Jobs Completed',   value: '156',    Icon: Briefcase, trend: '+8%',  trendUp: true },
    { label: 'Avg Rating',       value: '4.9',    Icon: Award,
      sub: <span className="text-amber-400 text-[12px]">★★★★★</span> },
  ];

  const jobs: Job[] = [
    { id: '1', service: 'Gold Facial',   client: 'Ananya S.', time: '2:00 PM', status: 'upcoming', icon: '✨' },
    { id: '2', service: 'Hair Spa',      client: 'Priya M.',  time: '4:30 PM', status: 'upcoming', icon: '💆‍♀️' },
    { id: '3', service: 'Bridal Makeup', client: 'Sneha R.',  time: '6:00 PM', status: 'active',   icon: '💄' },
  ];

  const quickActions = [
    { label: 'Earnings',   path: '/provider/earnings', Icon: Wallet },
    { label: 'My Profile', path: '/provider/profile',  Icon: User },
    { label: 'Schedule',   path: '/provider/schedule', Icon: Calendar },
    { label: 'Training',   path: '/provider/training', Icon: BookOpen },
  ];

  return (
    <ProviderLayout title="Dashboard" subtitle="Wednesday, 14 March 2025">

      <div className="space-y-5 md:space-y-6">

        {/* ── ROW 1: Earnings + New Request ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

          {/* This Week's Earnings */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[15px] text-[#1A1A1A] tracking-tight">This Week's Earnings</h2>
            </div>
            <Card className="border border-[#EBEBEB] shadow-none bg-white overflow-hidden flex flex-col">
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-bold text-[#9CA3AF] tracking-widest uppercase">Weekly Total</span>
                  </div>
                  <p className="font-bold text-[22px] text-[#1A1A1A] tracking-tight leading-tight">&#8377;14,820</p>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-[#9CA3AF]">
                    <TrendingUp className="w-3 h-3 shrink-0 text-emerald-500" />
                    +&#8377;1,640 vs last week
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-[#C84B31]" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-5 py-3 border-t border-[#EBEBEB] bg-[#FAFAFA] mx-4 rounded-xl">
                <Clock className="w-3 h-3 text-[#9CA3AF] shrink-0" />
                <span className="text-[11px] font-medium text-[#9CA3AF]">Updated just now</span>
              </div>
              <div className="flex gap-2.5 p-4">
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

          {/* New Request */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[15px] text-[#1A1A1A] tracking-tight">New Request</h2>
              <span className="text-[11px] bg-[#FFF0EC] text-[#C84B31] px-2.5 py-1 rounded-full font-semibold border border-[#FDDDD5]">
                Expires soon
              </span>
            </div>
            <Card className="border border-[#EBEBEB] shadow-none bg-white overflow-hidden flex flex-col">
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C84B31] opacity-40" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C84B31]" />
                    </span>
                    <span className="text-[10px] font-bold text-[#C84B31] tracking-widest uppercase">Incoming</span>
                  </div>
                  <p className="font-bold text-[22px] text-[#1A1A1A] tracking-tight leading-tight">Party Makeup</p>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-[#9CA3AF]">
                    <MapPin className="w-3 h-3 shrink-0" />
                    Ananya Singh · 2.5 km away
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[22px] text-[#1A1A1A] tracking-tight leading-tight">&#8377;1,999</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">estimated</p>
                </div>
              </div>
              <CountdownBar seconds={15} />
              <div className="flex gap-2.5 p-4">
                <button
                  className="flex-1 h-9 rounded-xl border border-[#C84B31]/30 bg-[#FFF0EC] text-[#C84B31] text-[13px] font-semibold hover:bg-[#FDDDD5] transition-colors"
                  onClick={() => router.push('/provider/job-request')}
                >
                  Accept Job
                </button>
                <button
                  className="flex-1 h-9 rounded-xl border border-[#EBEBEB] bg-white text-[#6B7280] text-[13px] font-semibold hover:bg-[#FFF0EC] hover:border-[#FDDDD5] hover:text-[#C84B31] transition-colors"
                  onClick={() => router.push('/provider/job-request')}
                >
                  View Details
                </button>
              </div>
            </Card>
          </div>

        </div>

        {/* ── ROW 2: Stat cards (previously row 1) ── */}
        <div className="grid grid-cols-3 gap-3 md:gap-5">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* ── Today's Schedule + Quick Actions ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[15px] text-[#1A1A1A] tracking-tight">Today's Schedule</h2>
              <button className="text-[#C84B31] text-[13px] font-medium hover:text-[#B04028] transition-colors">
                See all
              </button>
            </div>
            <div className="space-y-2.5">
              {jobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          </div>

          <div>
            <h2 className="font-bold text-[15px] text-[#1A1A1A] tracking-tight mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((a) => (
                <Card
                  key={a.label}
                  className="border border-[#EBEBEB] shadow-none hover:border-[#C84B31]/25 hover:shadow-sm transition-all cursor-pointer group bg-white"
                  onClick={() => router.push(a.path)}
                >
                  <CardContent className="p-4 md:p-5 flex flex-col items-center gap-2.5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF0EC] flex items-center justify-center group-hover:bg-[#FDDDD5] transition-colors">
                      <a.Icon className="w-5 h-5 text-[#C84B31]" />
                    </div>
                    <span className="font-semibold text-[13px] text-[#1A1A1A]">{a.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

        </div>

      </div>

    </ProviderLayout>
  );
}