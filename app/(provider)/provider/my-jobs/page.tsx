'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Clock, Check, X, Star, ChevronRight,
  Zap, Briefcase, CheckCircle2, History, Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import ProviderLayout from '../_components/ProviderLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveRequest {
  id: string;
  service: string;
  category: string;
  client: string;
  clientRating: number;
  location: string;
  distance: string;
  duration: string;
  scheduledTime: string;
  earnings: number;
  timeLimit: number;
}

interface ActiveJob {
  id: string;
  service: string;
  client: string;
  clientEmoji: string;
  location: string;
  scheduledTime: string;
  scheduledDate: string;
  duration: string;
  earnings: number;
  checklistTotal: number;
  checklistDone: number;
  startedAt: string;
}

interface UpcomingJob {
  id: string;
  service: string;
  client: string;
  clientEmoji: string;
  location: string;
  scheduledTime: string;
  scheduledDate: string;
  duration: string;
  earnings: number;
}

interface CompletedJob {
  id: string;
  service: string;
  client: string;
  clientRating: number;
  completedAt: string;
  earnings: number;
  duration: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_LIVE: LiveRequest[] = [
  {
    id: 'lr1', service: 'Party Makeup', category: 'Bridal & Makeup',
    client: 'Ananya Singh', clientRating: 4.8,
    location: 'Bandra West, Mumbai', distance: '2.5 km',
    duration: '90 min', scheduledTime: '6:00 PM', earnings: 1999, timeLimit: 60,
  },
  {
    id: 'lr2', service: 'Gold Facial', category: 'Skincare',
    client: 'Priya Mehta', clientRating: 4.6,
    location: 'Juhu, Mumbai', distance: '4.1 km',
    duration: '60 min', scheduledTime: '7:30 PM', earnings: 1599, timeLimit: 45,
  },
  {
    id: 'lr3', service: 'Hair Styling', category: 'Hair',
    client: 'Ritu Sharma', clientRating: 5.0,
    location: 'Andheri West, Mumbai', distance: '6.3 km',
    duration: '45 min', scheduledTime: '8:00 PM', earnings: 899, timeLimit: 30,
  },
];

const ACTIVE_JOBS: ActiveJob[] = [
  {
    id: 'aj1', service: 'Bridal Makeup', client: 'Sneha Reddy', clientEmoji: '👰',
    location: 'Powai, Mumbai', scheduledTime: '2:00 PM', scheduledDate: 'Today',
    duration: '120 min', earnings: 4999, checklistTotal: 6, checklistDone: 3,
    startedAt: '2:05 PM',
  },
];

const UPCOMING_JOBS: UpcomingJob[] = [
  {
    id: 'uj1', service: 'Hair Spa', client: 'Meghna Kulkarni', clientEmoji: '👩',
    location: 'Worli, Mumbai', scheduledTime: '10:00 AM', scheduledDate: 'Tomorrow',
    duration: '75 min', earnings: 999,
  },
  {
    id: 'uj2', service: 'Full Body Waxing', client: 'Divya Nair', clientEmoji: '🧖‍♀️',
    location: 'Dadar, Mumbai', scheduledTime: '12:30 PM', scheduledDate: 'Dec 28',
    duration: '60 min', earnings: 799,
  },
  {
    id: 'uj3', service: 'Nail Art', client: 'Kavita Shah', clientEmoji: '💅',
    location: 'Malad West, Mumbai', scheduledTime: '4:00 PM', scheduledDate: 'Dec 29',
    duration: '45 min', earnings: 699,
  },
];

const COMPLETED_JOBS: CompletedJob[] = [
  { id: 'cj1', service: 'Gold Facial',    client: 'Ananya S.', clientRating: 5, completedAt: 'Today, 3:45 PM',     earnings: 1599,  duration: '60 min'  },
  { id: 'cj2', service: 'Party Makeup',   client: 'Priya M.',  clientRating: 4, completedAt: 'Today, 12:30 PM',    earnings: 1999,  duration: '90 min'  },
  { id: 'cj3', service: 'Hair Spa',       client: 'Meghna K.', clientRating: 5, completedAt: 'Yesterday, 5:00 PM', earnings: 999,   duration: '75 min'  },
  { id: 'cj4', service: 'Bridal Package', client: 'Sneha R.',  clientRating: 5, completedAt: 'Dec 25, 11:00 AM',   earnings: 12000, duration: '180 min' },
];

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: 'live',      label: 'Live',      Icon: Zap       },
  { key: 'active',    label: 'Active',    Icon: Timer     },
  { key: 'upcoming',  label: 'Upcoming',  Icon: Briefcase },
  { key: 'completed', label: 'Completed', Icon: History   },
] as const;

type TabKey = typeof TABS[number]['key'];

const SUMMARY_CONFIG = [
  { key: 'live'      as TabKey, label: 'Live',     color: '#C84B31', bg: '#FFF0EC', border: '#FDDDD5' },
  { key: 'active'    as TabKey, label: 'Active',   color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'upcoming'  as TabKey, label: 'Upcoming', color: '#6B7280', bg: '#F5F4F2', border: '#EBEBEB' },
  { key: 'completed' as TabKey, label: 'Done',     color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
];

// ─── Live Request Card ────────────────────────────────────────────────────────

function LiveRequestCard({
  req, onAccept, onDecline,
}: {
  req: LiveRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const [timeLeft, setTimeLeft] = useState(req.timeLimit);
  const circumference = 2 * Math.PI * 20;
  const progress = (timeLeft / req.timeLimit) * circumference;
  const urgent = timeLeft <= 10;
  const pct = Math.round((timeLeft / req.timeLimit) * 100);

  useEffect(() => {
    if (timeLeft === 0) { onDecline(req.id); return; }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, req.id, onDecline]);

  return (
    <Card className={cn('border shadow-none bg-white transition-all', urgent ? 'border-red-200' : 'border-[#EBEBEB]')}>
      <CardContent className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Timer ring */}
          <div className="relative shrink-0 w-11 h-11">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" stroke={urgent ? '#FEE2E2' : '#FFF0EC'} strokeWidth="4" fill="none" />
              <circle
                cx="24" cy="24" r="20"
                stroke={urgent ? '#EF4444' : '#C84B31'} strokeWidth="4" fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('font-bold text-[10px] leading-none', urgent ? 'text-red-500' : 'text-[#C84B31]')}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Service info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C84B31] opacity-40" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C84B31]" />
              </span>
              <span className="text-[9px] font-bold text-[#C84B31] tracking-widest uppercase">Incoming</span>
            </div>
            <h3 className="font-bold text-[14px] text-[#1A1A1A] tracking-tight leading-tight">{req.service}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px] text-[#9CA3AF] truncate max-w-[100px]">{req.client}</span>
              <span className="text-[#EBEBEB]">·</span>
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-[11px] text-amber-600 font-semibold">{req.clientRating}</span>
            </div>
          </div>

          {/* Earnings */}
          <div className="text-right shrink-0">
            <p className="font-bold text-[16px] text-[#1A1A1A] leading-none">₹{req.earnings.toLocaleString()}</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">after fee</p>
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-1 rounded-full">
            <MapPin className="w-2.5 h-2.5 text-[#9CA3AF] shrink-0" />
            <span className="truncate max-w-[140px]">{req.location} · {req.distance}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-1 rounded-full">
            <Clock className="w-2.5 h-2.5 text-[#9CA3AF] shrink-0" />
            {req.scheduledTime} · {req.duration}
          </span>
        </div>

        {/* Timer bar */}
        <div className="h-1 bg-[#F5F4F2] rounded-full mb-3 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-1000', urgent ? 'bg-red-400' : 'bg-[#C84B31]')}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-10 border-[#EBEBEB] text-[#6B7280] hover:bg-red-50 hover:border-red-200 hover:text-red-500 font-semibold rounded-xl shadow-none text-[12px]"
            onClick={() => onDecline(req.id)}
          >
            <X className="w-3.5 h-3.5 mr-1" /> Decline
          </Button>
          <Button
            className="flex-[2] h-10 bg-[#C84B31] hover:bg-[#B04028] text-white font-semibold rounded-xl shadow-none border-0 text-[12px]"
            onClick={() => onAccept(req.id)}
          >
            <Check className="w-3.5 h-3.5 mr-1" /> Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Active Job Card ──────────────────────────────────────────────────────────

function ActiveJobCard({ job, onOpen }: { job: ActiveJob; onOpen: (id: string) => void }) {
  const pct = Math.round((job.checklistDone / job.checklistTotal) * 100);
  return (
    <Card className="border border-[#C84B31]/20 shadow-none bg-white">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center text-lg shrink-0">
            {job.clientEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full mb-1">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-40" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
              </span>
              In Progress
            </span>
            <h3 className="font-bold text-[14px] text-[#1A1A1A] leading-tight">{job.service}</h3>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate">{job.client} · Started {job.startedAt}</p>
          </div>
          <p className="font-bold text-[15px] text-[#1A1A1A] shrink-0">₹{job.earnings.toLocaleString()}</p>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="w-3 h-3 text-[#9CA3AF] shrink-0" />
          <span className="text-[11px] text-[#6B7280] truncate">{job.location}</span>
        </div>

        <div className="bg-[#F5F4F2] rounded-xl px-3 py-2.5 border border-[#EBEBEB] mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B7280]">Checklist</span>
            <span className="text-[11px] font-bold text-[#C84B31]">{job.checklistDone}/{job.checklistTotal} done</span>
          </div>
          <div className="h-1.5 bg-white rounded-full overflow-hidden border border-[#EBEBEB]">
            <div className="h-full bg-[#C84B31] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <button
          onClick={() => onOpen(job.id)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#FFF0EC] border border-[#FDDDD5] rounded-xl hover:bg-[#FFE8E0] transition-colors group"
        >
          <span className="text-[13px] font-semibold text-[#C84B31]">Continue Job</span>
          <ChevronRight className="w-4 h-4 text-[#C84B31] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </CardContent>
    </Card>
  );
}

// ─── Upcoming Job Card ────────────────────────────────────────────────────────

function UpcomingJobCard({ job }: { job: UpcomingJob }) {
  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-lg shrink-0">
            {job.clientEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[14px] text-[#1A1A1A] truncate">{job.service}</h3>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate">{job.client}</p>
          </div>
          <div className="text-right shrink-0 ml-2">
            <p className="font-bold text-[14px] text-[#1A1A1A]">₹{job.earnings.toLocaleString()}</p>
            <Badge variant="outline" className="text-[10px] border-[#EBEBEB] text-[#9CA3AF] mt-0.5">{job.scheduledDate}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#EBEBEB]">
          <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] px-2 py-1 rounded-full">
            <Clock className="w-2.5 h-2.5 shrink-0" /> {job.scheduledTime}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] px-2 py-1 rounded-full">
            <Clock className="w-2.5 h-2.5 shrink-0" /> {job.duration}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[#6B7280] bg-[#F5F4F2] px-2 py-1 rounded-full">
            <MapPin className="w-2.5 h-2.5 shrink-0" /> <span className="truncate max-w-[120px]">{job.location}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Completed Job Row ────────────────────────────────────────────────────────

function CompletedJobRow({ job }: { job: CompletedJob }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 bg-[#F5F4F2] rounded-xl border border-transparent hover:border-[#EBEBEB] transition-colors">
      <div className="w-9 h-9 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{job.service}</p>
        <p className="text-[10px] text-[#9CA3AF] mt-0.5 truncate">{job.client} · {job.completedAt}</p>
      </div>
      <div className="text-right shrink-0 ml-2">
        <p className="text-[13px] font-bold text-green-600">+₹{job.earnings.toLocaleString()}</p>
        <div className="flex items-center justify-end gap-0.5 mt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn('w-2.5 h-2.5', i < job.clientRating ? 'text-amber-400 fill-amber-400' : 'text-[#EBEBEB]')} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-[14px] font-semibold text-[#1A1A1A]">No {label}</p>
      <p className="text-[12px] text-[#9CA3AF] mt-1">Nothing here right now</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MyJobs() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('live');
  const [liveRequests, setLiveRequests] = useState<LiveRequest[]>(INITIAL_LIVE);

  const handleAccept = (id: string) => {
    setLiveRequests((prev) => prev.filter((r) => r.id !== id));
    toast({ title: 'Job Accepted! 🎉', description: "You've been assigned to this booking." });
    router.push('/provider/job-details');
  };

  const handleDecline = (id: string) => {
    setLiveRequests((prev) => prev.filter((r) => r.id !== id));
    toast({ title: 'Job Declined', description: 'Passed to the next available provider.' });
  };

  const counts: Record<TabKey, number> = {
    live:      liveRequests.length,
    active:    ACTIVE_JOBS.length,
    upcoming:  UPCOMING_JOBS.length,
    completed: COMPLETED_JOBS.length,
  };

  return (
    <ProviderLayout title="My Jobs" subtitle="Wednesday, 14 March 2025">

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
        {SUMMARY_CONFIG.map(({ key, label, color, bg, border }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex flex-col items-center py-3 px-1 sm:px-2 rounded-xl border transition-all',
              activeTab === key ? 'shadow-sm' : 'bg-white',
            )}
            style={activeTab === key ? { background: bg, borderColor: border } : { borderColor: '#EBEBEB' }}
          >
            <span
              className="font-bold text-[18px] sm:text-[20px] leading-none"
              style={{ color: activeTab === key ? color : '#1A1A1A' }}
            >
              {counts[key]}
            </span>
            <span
              className="text-[9px] sm:text-[10px] font-medium mt-1 leading-tight"
              style={{ color: activeTab === key ? color : '#9CA3AF' }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl mb-5">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-3 rounded-lg text-[11px] sm:text-[12px] font-semibold transition-all min-w-0',
              activeTab === key
                ? 'bg-white text-[#C84B31] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#6B7280]',
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {/* Label hidden on very small, shown sm+ */}
            <span className="hidden sm:inline truncate">{label}</span>
            {counts[key] > 0 && (
              <span className={cn(
                'text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full leading-none shrink-0',
                activeTab === key ? 'bg-[#FFF0EC] text-[#C84B31]' : 'bg-[#EBEBEB] text-[#9CA3AF]',
              )}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}

      {/* LIVE — 1 col mobile → 2 col sm → 3 col lg */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {liveRequests.length === 0
            ? <div className="col-span-full"><EmptyState label="live requests" icon="📭" /></div>
            : liveRequests.map((req) => (
                <LiveRequestCard key={req.id} req={req} onAccept={handleAccept} onDecline={handleDecline} />
              ))
          }
        </div>
      )}

      {/* ACTIVE — 1 col mobile → 2 col sm */}
      {activeTab === 'active' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTIVE_JOBS.length === 0
            ? <div className="col-span-full"><EmptyState label="active jobs" icon="⏳" /></div>
            : ACTIVE_JOBS.map((job) => (
                <ActiveJobCard key={job.id} job={job} onOpen={() => router.push('/provider/job-details')} />
              ))
          }
        </div>
      )}

      {/* UPCOMING — 1 col mobile → 2 col sm → 3 col lg */}
      {activeTab === 'upcoming' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {UPCOMING_JOBS.length === 0
            ? <div className="col-span-full"><EmptyState label="upcoming jobs" icon="📅" /></div>
            : UPCOMING_JOBS.map((job) => (
                <UpcomingJobCard key={job.id} job={job} />
              ))
          }
        </div>
      )}

      {/* COMPLETED */}
      {activeTab === 'completed' && (
        <div>
          {COMPLETED_JOBS.length === 0
            ? <EmptyState label="completed jobs" icon="✅" />
            : (
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#EBEBEB]">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Total Earned</p>
                      <p className="font-bold text-[20px] sm:text-[22px] text-[#1A1A1A] mt-0.5">
                        ₹{COMPLETED_JOBS.reduce((s, j) => s + j.earnings, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] sm:text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Jobs Done</p>
                      <p className="font-bold text-[20px] sm:text-[22px] text-[#1A1A1A] mt-0.5">{COMPLETED_JOBS.length}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {COMPLETED_JOBS.map((job) => (
                      <CompletedJobRow key={job.id} job={job} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          }
        </div>
      )}

    </ProviderLayout>
  );
}