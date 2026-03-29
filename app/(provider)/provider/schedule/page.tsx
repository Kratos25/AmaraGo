'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, MapPin, Clock,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/app/lib/utils';
import ProviderLayout from '../_components/ProviderLayout';

// ─── Design tokens ────────────────────────────────────────────────────────────
// Primary   #C84B31   Hover #B04028
// Tint bg   #FFF0EC   Tint border #FDDDD5
// Page bg   #F5F4F2   Surface #FFFFFF
// Border    #EBEBEB
// Text-1    #1A1A1A   Text-2 #6B7280   Text-3 #9CA3AF

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduledJob {
  id: string;
  service: string;
  client: string;
  clientEmoji: string;
  location: string;
  startHour: number;   // 0–23
  startMin: number;
  durationMin: number;
  earnings: number;
  status: 'confirmed' | 'in_progress' | 'completed';
  date: string; // 'YYYY-MM-DD'
}

interface AvailabilitySlot {
  day: string;
  enabled: boolean;
  from: string;
  to: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// Build dates relative to "today" = Dec 27 2024 for consistency with app
const TODAY = new Date(2025, 2, 14); // March 14 2025

function dateStr(offset: number) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

const JOBS: ScheduledJob[] = [
  {
    id: 'j1', service: 'Bridal Makeup', client: 'Sneha Reddy', clientEmoji: '👰',
    location: 'Powai, Mumbai', startHour: 14, startMin: 0, durationMin: 120,
    earnings: 4999, status: 'in_progress', date: dateStr(0),
  },
  {
    id: 'j2', service: 'Gold Facial', client: 'Ananya S.', clientEmoji: '👩',
    location: 'Bandra West', startHour: 10, startMin: 0, durationMin: 60,
    earnings: 1599, status: 'completed', date: dateStr(0),
  },
  {
    id: 'j3', service: 'Hair Spa', client: 'Meghna K.', clientEmoji: '🧖‍♀️',
    location: 'Worli, Mumbai', startHour: 10, startMin: 0, durationMin: 75,
    earnings: 999, status: 'confirmed', date: dateStr(1),
  },
  {
    id: 'j4', service: 'Full Body Waxing', client: 'Divya Nair', clientEmoji: '✨',
    location: 'Dadar, Mumbai', startHour: 12, startMin: 30, durationMin: 60,
    earnings: 799, status: 'confirmed', date: dateStr(1),
  },
  {
    id: 'j5', service: 'Party Makeup', client: 'Priya M.', clientEmoji: '💄',
    location: 'Juhu, Mumbai', startHour: 18, startMin: 0, durationMin: 90,
    earnings: 1999, status: 'confirmed', date: dateStr(2),
  },
  {
    id: 'j6', service: 'Nail Art', client: 'Kavita Shah', clientEmoji: '💅',
    location: 'Malad West', startHour: 16, startMin: 0, durationMin: 45,
    earnings: 699, status: 'confirmed', date: dateStr(3),
  },
  {
    id: 'j7', service: 'Hair Styling', client: 'Ritu Sharma', clientEmoji: '👱‍♀️',
    location: 'Andheri West', startHour: 11, startMin: 0, durationMin: 60,
    earnings: 899, status: 'confirmed', date: dateStr(5),
  },
];

const DEFAULT_AVAILABILITY: AvailabilitySlot[] = [
  { day: 'Mon', enabled: true,  from: '09:00', to: '20:00' },
  { day: 'Tue', enabled: true,  from: '09:00', to: '20:00' },
  { day: 'Wed', enabled: true,  from: '09:00', to: '20:00' },
  { day: 'Thu', enabled: true,  from: '09:00', to: '20:00' },
  { day: 'Fri', enabled: true,  from: '09:00', to: '21:00' },
  { day: 'Sat', enabled: true,  from: '08:00', to: '22:00' },
  { day: 'Sun', enabled: false, from: '10:00', to: '18:00' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt12(h: number, m: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

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

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_STYLE = {
  confirmed:   { dot: 'bg-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700'  },
  in_progress: { dot: 'bg-[#C84B31]',  bg: 'bg-[#FFF0EC]', border: 'border-[#FDDDD5]',  text: 'text-[#C84B31]' },
  completed:   { dot: 'bg-green-500',  bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-700' },
};

// ─── Week Calendar strip ──────────────────────────────────────────────────────

function WeekStrip({
  weekDates,
  selectedDate,
  onSelect,
  onPrev,
  onNext,
  jobs,
}: {
  weekDates: Date[];
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  jobs: ScheduledJob[];
}) {
  const todayStr = TODAY.toISOString().split('T')[0];
  const selStr   = selectedDate.toISOString().split('T')[0];

  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white mb-5">
      <CardContent className="p-4">
        {/* Month + nav */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[15px] text-[#1A1A1A]">
            {MONTH_NAMES[weekDates[0].getMonth()]}
            {weekDates[0].getMonth() !== weekDates[6].getMonth()
              ? ` – ${MONTH_NAMES[weekDates[6].getMonth()]}` : ''
            } {weekDates[0].getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              className="w-8 h-8 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#EBEBEB] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              className="w-8 h-8 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#EBEBEB] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((d, i) => {
            const ds = d.toISOString().split('T')[0];
            const isToday    = ds === todayStr;
            const isSelected = ds === selStr;
            const jobCount   = jobs.filter((j) => j.date === ds).length;

            return (
              <button
                key={ds}
                onClick={() => onSelect(d)}
                className={cn(
                  'flex flex-col items-center py-2 rounded-xl transition-all',
                  isSelected
                    ? 'bg-[#C84B31] shadow-sm'
                    : isToday
                    ? 'bg-[#FFF0EC] border border-[#FDDDD5]'
                    : 'hover:bg-[#F5F4F2]',
                )}
              >
                <span className={cn(
                  'text-[10px] font-medium mb-1',
                  isSelected ? 'text-white/70' : 'text-[#9CA3AF]',
                )}>
                  {DAY_LABELS[i]}
                </span>
                <span className={cn(
                  'font-bold text-[15px] leading-none',
                  isSelected ? 'text-white' : isToday ? 'text-[#C84B31]' : 'text-[#1A1A1A]',
                )}>
                  {d.getDate()}
                </span>
                {/* Job dots */}
                <div className="flex gap-0.5 mt-1.5 h-1.5">
                  {Array.from({ length: Math.min(jobCount, 3) }).map((_, k) => (
                    <span
                      key={k}
                      className={cn('w-1 h-1 rounded-full', isSelected ? 'bg-white/70' : 'bg-[#C84B31]')}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Week summary */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#EBEBEB]">
          {(() => {
            const weekJobs = jobs.filter((j) => weekDates.some((d) => d.toISOString().split('T')[0] === j.date));
            const weekEarnings = weekJobs.reduce((s, j) => s + j.earnings, 0);
            return (
              <>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] font-medium">This week</p>
                  <p className="text-[13px] font-bold text-[#1A1A1A]">{weekJobs.length} jobs</p>
                </div>
                <div className="w-px h-6 bg-[#EBEBEB]" />
                <div>
                  <p className="text-[10px] text-[#9CA3AF] font-medium">Projected</p>
                  <p className="text-[13px] font-bold text-[#C84B31]">₹{weekEarnings.toLocaleString()}</p>
                </div>
                <div className="w-px h-6 bg-[#EBEBEB]" />
                <div>
                  <p className="text-[10px] text-[#9CA3AF] font-medium">Busiest</p>
                  <p className="text-[13px] font-bold text-[#1A1A1A]">
                    {(() => {
                      const counts = weekDates.map((d) => ({
                        label: DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
                        count: jobs.filter((j) => j.date === d.toISOString().split('T')[0]).length,
                      }));
                      const max = counts.reduce((a, b) => (b.count > a.count ? b : a), counts[0]);
                      return max.count > 0 ? max.label : '—';
                    })()}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Day Timeline ─────────────────────────────────────────────────────────────

const TIMELINE_START = 8;  // 8 AM
const TIMELINE_END   = 22; // 10 PM
const PX_PER_HOUR    = 64;

function DayTimeline({ date, jobs }: { date: Date; jobs: ScheduledJob[] }) {
  const router = useRouter();
  const ds = date.toISOString().split('T')[0];
  const dayJobs = jobs.filter((j) => j.date === ds);
  const hours = Array.from({ length: TIMELINE_END - TIMELINE_START }, (_, i) => TIMELINE_START + i);
  const totalH = (TIMELINE_END - TIMELINE_START) * PX_PER_HOUR;

  const isToday = ds === TODAY.toISOString().split('T')[0];
  const now = TODAY; // in real app: new Date()
  const nowMinFromStart = isToday
    ? (now.getHours() - TIMELINE_START) * 60 + now.getMinutes()
    : -1;
  const nowTop = (nowMinFromStart / 60) * PX_PER_HOUR;

  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white mb-5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[14px] text-[#1A1A1A]">
            {isToday ? 'Today' : DAY_LABELS[(date.getDay() === 0 ? 6 : date.getDay() - 1)]},&nbsp;
            {date.getDate()} {MONTH_NAMES[date.getMonth()]}
          </h3>
          <span className="text-[11px] font-semibold text-[#9CA3AF] bg-[#F5F4F2] border border-[#EBEBEB] px-2.5 py-1 rounded-full">
            {dayJobs.length} job{dayJobs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {dayJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-[13px] font-semibold text-[#1A1A1A]">No jobs scheduled</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Enjoy your free day</p>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <div className="relative" style={{ height: totalH }}>
              {/* Hour lines */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 flex items-center gap-2"
                  style={{ top: (h - TIMELINE_START) * PX_PER_HOUR }}
                >
                  <span className="text-[10px] text-[#9CA3AF] w-10 shrink-0 text-right">
                    {fmt12(h, 0)}
                  </span>
                  <div className="flex-1 h-px bg-[#EBEBEB]" />
                </div>
              ))}

              {/* "Now" indicator */}
              {isToday && nowMinFromStart >= 0 && nowMinFromStart < (TIMELINE_END - TIMELINE_START) * 60 && (
                <div
                  className="absolute left-12 right-0 flex items-center gap-1 z-20 pointer-events-none"
                  style={{ top: nowTop }}
                >
                  <div className="w-2 h-2 rounded-full bg-[#C84B31] shrink-0" />
                  <div className="flex-1 h-px bg-[#C84B31]" />
                </div>
              )}

              {/* Job blocks */}
              {dayJobs.map((job) => {
                const topMin  = (job.startHour - TIMELINE_START) * 60 + job.startMin;
                const topPx   = (topMin / 60) * PX_PER_HOUR;
                const heightPx = Math.max((job.durationMin / 60) * PX_PER_HOUR, 36);
                const s = STATUS_STYLE[job.status];
                const short = heightPx < 52;

                return (
                  <button
                    key={job.id}
                    onClick={() => router.push('/provider/job-details')}
                    className={cn(
                      'absolute left-14 right-0 rounded-xl border px-3 py-2 text-left transition-all hover:brightness-95 z-10',
                      s.bg, s.border,
                    )}
                    style={{ top: topPx, height: heightPx }}
                  >
                    <div className="flex items-start justify-between gap-2 h-full overflow-hidden">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className={cn('font-bold text-[12px] leading-tight truncate', s.text)}>
                          {job.service}
                        </p>
                        {!short && (
                          <>
                            <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">{job.client}</p>
                            <p className="text-[10px] text-[#9CA3AF] truncate">{fmt12(job.startHour, job.startMin)}</p>
                          </>
                        )}
                        {short && (
                          <p className="text-[10px] text-[#6B7280] truncate">{job.client} · {fmt12(job.startHour, job.startMin)}</p>
                        )}
                      </div>
                      <span className={cn('text-[11px] font-bold shrink-0', s.text)}>
                        ₹{job.earnings.toLocaleString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Availability Manager ─────────────────────────────────────────────────────

function AvailabilityManager() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(DEFAULT_AVAILABILITY);
  const [saved, setSaved] = useState(false);

  const toggle = (i: number) => {
    setSlots((prev) => prev.map((s, idx) => idx === i ? { ...s, enabled: !s.enabled } : s));
    setSaved(false);
  };

  const update = (i: number, field: 'from' | 'to', val: string) => {
    setSlots((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
    setSaved(false);
  };

  const handleSave = () => setSaved(true);

  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Availability</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Set when you're open for bookings</p>
          </div>
          <button
            onClick={handleSave}
            className={cn(
              'h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors border',
              saved
                ? 'bg-green-50 border-green-100 text-green-600'
                : 'bg-[#C84B31] border-[#C84B31] text-white hover:bg-[#B04028]',
            )}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>

        <div className="space-y-2">
          {slots.map((slot, i) => (
            <div
              key={slot.day}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all',
                slot.enabled ? 'bg-white border-[#EBEBEB]' : 'bg-[#F5F4F2] border-transparent',
              )}
            >
              {/* Toggle */}
              <button
                onClick={() => toggle(i)}
                className={cn(
                  'relative shrink-0 w-9 h-5 rounded-full transition-colors',
                  slot.enabled ? 'bg-[#C84B31]' : 'bg-[#EBEBEB]',
                )}
              >
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                  slot.enabled ? 'left-[18px]' : 'left-0.5',
                )} />
              </button>

              {/* Day label */}
              <span className={cn(
                'text-[13px] font-semibold w-8 shrink-0',
                slot.enabled ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]',
              )}>
                {slot.day}
              </span>

              {slot.enabled ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="time"
                    value={slot.from}
                    onChange={(e) => update(i, 'from', e.target.value)}
                    className="flex-1 min-w-0 text-[12px] font-medium text-[#1A1A1A] bg-[#F5F4F2] border border-[#EBEBEB] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C84B31]"
                  />
                  <span className="text-[11px] text-[#9CA3AF] shrink-0">to</span>
                  <input
                    type="time"
                    value={slot.to}
                    onChange={(e) => update(i, 'to', e.target.value)}
                    className="flex-1 min-w-0 text-[12px] font-medium text-[#1A1A1A] bg-[#F5F4F2] border border-[#EBEBEB] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C84B31]"
                  />
                </div>
              ) : (
                <span className="text-[12px] text-[#9CA3AF] flex-1">Unavailable</span>
              )}
            </div>
          ))}
        </div>

        {/* Active days summary */}
        <div className="mt-4 pt-3 border-t border-[#EBEBEB] flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-[#9CA3AF]">Active:</span>
          {slots.filter((s) => s.enabled).map((s) => (
            <span key={s.day} className="text-[10px] font-bold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-2 py-0.5 rounded-full">
              {s.day}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type View = 'week' | 'availability';

export default function Schedule() {
  const [view, setView]               = useState<View>('week');
  const [weekAnchor, setWeekAnchor]   = useState(TODAY);
  const [selectedDate, setSelectedDate] = useState(TODAY);

  const weekDates = getWeekDates(weekAnchor);

  const shiftWeek = (dir: 1 | -1) => {
    const next = new Date(weekAnchor);
    next.setDate(weekAnchor.getDate() + dir * 7);
    setWeekAnchor(next);
    setSelectedDate(next);
  };

  return (
    <ProviderLayout title="Schedule" subtitle="Wednesday, 14 March 2025">

      {/* ── View toggle ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl mb-5 w-full sm:w-auto sm:inline-flex">
        {(['week', 'availability'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'flex-1 sm:flex-none px-4 py-2 rounded-lg text-[12px] font-semibold transition-all capitalize',
              view === v
                ? 'bg-white text-[#C84B31] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#6B7280]',
            )}
          >
            {v === 'week' ? '📅 Calendar' : '⏰ Availability'}
          </button>
        ))}
      </div>

      {/* ── Calendar view ───────────────────────────────────────────────── */}
      {view === 'week' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">

          {/* Left: week strip + day timeline */}
          <div>
            <WeekStrip
              weekDates={weekDates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              onPrev={() => shiftWeek(-1)}
              onNext={() => shiftWeek(1)}
              jobs={JOBS}
            />
            <DayTimeline date={selectedDate} jobs={JOBS} />
          </div>

          {/* Right: upcoming list for the week */}
          <div className="hidden lg:block sticky top-[73px]">
            <Card className="border border-[#EBEBEB] shadow-none bg-white">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">This Week</p>
                <div className="space-y-3">
                  {weekDates.map((d) => {
                    const ds = d.toISOString().split('T')[0];
                    const dayJobs = JOBS.filter((j) => j.date === ds);
                    const isToday = ds === TODAY.toISOString().split('T')[0];
                    const isSel   = ds === selectedDate.toISOString().split('T')[0];
                    const dayIdx  = d.getDay() === 0 ? 6 : d.getDay() - 1;

                    return (
                      <button
                        key={ds}
                        onClick={() => setSelectedDate(d)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left',
                          isSel ? 'bg-[#FFF0EC] border-[#FDDDD5]' : 'bg-[#F5F4F2] border-transparent hover:border-[#EBEBEB]',
                        )}
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0',
                          isSel ? 'bg-[#C84B31]' : isToday ? 'bg-white border border-[#FDDDD5]' : 'bg-white border border-[#EBEBEB]',
                        )}>
                          <span className={cn('text-[9px] font-medium leading-none', isSel ? 'text-white/70' : 'text-[#9CA3AF]')}>
                            {DAY_LABELS[dayIdx]}
                          </span>
                          <span className={cn('font-bold text-[13px] leading-none mt-0.5', isSel ? 'text-white' : isToday ? 'text-[#C84B31]' : 'text-[#1A1A1A]')}>
                            {d.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {dayJobs.length === 0 ? (
                            <p className="text-[12px] text-[#9CA3AF]">Free day</p>
                          ) : (
                            <>
                              <p className={cn('text-[12px] font-semibold', isSel ? 'text-[#C84B31]' : 'text-[#1A1A1A]')}>
                                {dayJobs.length} job{dayJobs.length !== 1 ? 's' : ''}
                              </p>
                              <p className="text-[10px] text-[#9CA3AF] truncate">
                                {dayJobs.map((j) => j.service).join(', ')}
                              </p>
                            </>
                          )}
                        </div>
                        {dayJobs.length > 0 && (
                          <span className={cn('text-[11px] font-bold shrink-0', isSel ? 'text-[#C84B31]' : 'text-[#6B7280]')}>
                            ₹{dayJobs.reduce((s, j) => s + j.earnings, 0).toLocaleString()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-[#EBEBEB] space-y-1.5">
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Legend</p>
                  {[
                    { s: STATUS_STYLE.confirmed,   label: 'Confirmed'   },
                    { s: STATUS_STYLE.in_progress, label: 'In Progress' },
                    { s: STATUS_STYLE.completed,   label: 'Completed'   },
                  ].map(({ s, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', s.dot)} />
                      <span className="text-[11px] text-[#6B7280]">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {/* ── Availability view ────────────────────────────────────────────── */}
      {view === 'availability' && (
        <div className="max-w-lg">
          <AvailabilityManager />
        </div>
      )}

    </ProviderLayout>
  );
}