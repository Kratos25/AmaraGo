'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, MapPin, Clock,
  CheckCircle2, RefreshCw, Calendar, Briefcase,
  IndianRupee, AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/app/lib/utils';
import ProviderLayout from '../_components/ProviderLayout';
import { providersAPI, type Booking } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todaySubtitle() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/** Parse "10:00 AM", "2:30 PM", "14:30", "09:00" → { h, m } */
function parseTime(timeStr: string): { h: number; m: number } {
  if (!timeStr) return { h: 0, m: 0 };
  const upper = timeStr.toUpperCase().trim();
  const isPM  = upper.includes('PM');
  const isAM  = upper.includes('AM');
  const clean = upper.replace('AM', '').replace('PM', '').trim();
  const [hStr, mStr] = clean.split(':');
  let h = parseInt(hStr || '0', 10);
  const m = parseInt(mStr || '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return { h: 0, m: 0 };
  if (isPM && h !== 12) h += 12;
  if (isAM && h === 12) h = 0;
  return { h, m };
}

function fmt12(h: number, m: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh   = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getWeekDates(anchor: Date): Date[] {
  const monday = new Date(anchor);
  const day    = monday.getDay();
  monday.setDate(anchor.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date) {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const DAY_LABELS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Status styles ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, {
  dot: string; bg: string; border: string; text: string; label: string;
}> = {
  pending:   { dot: 'bg-amber-400',   bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-700',  label: 'Pending'     },
  confirmed: { dot: 'bg-[#C84B31]',   bg: 'bg-[#FFF0EC]',  border: 'border-[#FDDDD5]',   text: 'text-[#C84B31]',  label: 'Confirmed'   },
  active:    { dot: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', label: 'In Progress' },
  completed: { dot: 'bg-[#9CA3AF]',   bg: 'bg-[#F5F4F2]',  border: 'border-[#EBEBEB]',   text: 'text-[#6B7280]',  label: 'Completed'   },
  cancelled: { dot: 'bg-red-400',     bg: 'bg-red-50',     border: 'border-red-100',     text: 'text-red-600',    label: 'Cancelled'   },
};

// ─── Timeline constants ───────────────────────────────────────────────────────

const TIMELINE_START  = 7;   // 7 AM
const TIMELINE_END    = 23;  // 11 PM
const PX_PER_HOUR     = 60;
const DEFAULT_DURATION = 60; // minutes, used when duration is unknown

// ─── Availability default ─────────────────────────────────────────────────────

interface AvailabilitySlot { day: string; enabled: boolean; from: string; to: string; }

const DEFAULT_AVAILABILITY: AvailabilitySlot[] = [
  { day: 'Mon', enabled: true,  from: '09:00', to: '20:00' },
  { day: 'Tue', enabled: true,  from: '09:00', to: '20:00' },
  { day: 'Wed', enabled: true,  from: '09:00', to: '20:00' },
  { day: 'Thu', enabled: true,  from: '09:00', to: '20:00' },
  { day: 'Fri', enabled: true,  from: '09:00', to: '21:00' },
  { day: 'Sat', enabled: true,  from: '08:00', to: '22:00' },
  { day: 'Sun', enabled: false, from: '10:00', to: '18:00' },
];

// ─── Week strip ───────────────────────────────────────────────────────────────

function WeekStrip({
  weekDates, selectedDate, onSelect, onPrev, onNext, bookings, todayStr,
}: {
  weekDates: Date[];
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  bookings: Booking[];
  todayStr: string;
}) {
  const selStr = toDateStr(selectedDate);

  const weekEarnings = bookings
    .filter((b) => weekDates.some((d) => toDateStr(d) === b.date) && b.status !== 'cancelled')
    .reduce((s, b) => s + b.total_price, 0);

  const weekJobs = bookings.filter(
    (b) => weekDates.some((d) => toDateStr(d) === b.date) && b.status !== 'cancelled',
  );

  const busiestDay = (() => {
    const counts = weekDates.map((d) => ({
      label: DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
      count: bookings.filter((b) => b.date === toDateStr(d) && b.status !== 'cancelled').length,
    }));
    const max = counts.reduce((a, b) => (b.count > a.count ? b : a), counts[0]);
    return max.count > 0 ? max.label : '—';
  })();

  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white mb-4">
      <CardContent className="p-4">
        {/* Month header + nav */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[15px] text-[#1A1A1A]">
            {MONTH_NAMES[weekDates[0].getMonth()]}
            {weekDates[0].getMonth() !== weekDates[6].getMonth()
              ? ` – ${MONTH_NAMES[weekDates[6].getMonth()]}` : ''}{' '}
            {weekDates[0].getFullYear()}
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
            const ds       = toDateStr(d);
            const isToday  = ds === todayStr;
            const isSel    = ds === selStr;
            const jobCount = bookings.filter((b) => b.date === ds && b.status !== 'cancelled').length;

            return (
              <button
                key={ds}
                onClick={() => onSelect(d)}
                className={cn(
                  'flex flex-col items-center py-2 rounded-xl transition-all',
                  isSel   ? 'bg-[#C84B31] shadow-sm'
                  : isToday ? 'bg-[#FFF0EC] border border-[#FDDDD5]'
                  : 'hover:bg-[#F5F4F2]',
                )}
              >
                <span className={cn('text-[10px] font-medium mb-1', isSel ? 'text-white/70' : 'text-[#9CA3AF]')}>
                  {DAY_LABELS[i]}
                </span>
                <span className={cn(
                  'font-bold text-[15px] leading-none',
                  isSel ? 'text-white' : isToday ? 'text-[#C84B31]' : 'text-[#1A1A1A]',
                )}>
                  {d.getDate()}
                </span>
                <div className="flex gap-0.5 mt-1.5 h-1.5">
                  {Array.from({ length: Math.min(jobCount, 3) }).map((_, k) => (
                    <span key={k} className={cn('w-1 h-1 rounded-full', isSel ? 'bg-white/70' : 'bg-[#C84B31]')} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Week summary strip */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#EBEBEB] flex-wrap">
          <div>
            <p className="text-[10px] text-[#9CA3AF] font-medium">This week</p>
            <p className="text-[13px] font-bold text-[#1A1A1A]">{weekJobs.length} job{weekJobs.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="w-px h-6 bg-[#EBEBEB]" />
          <div>
            <p className="text-[10px] text-[#9CA3AF] font-medium">Projected</p>
            <p className="text-[13px] font-bold text-[#C84B31]">₹{fmt(weekEarnings)}</p>
          </div>
          <div className="w-px h-6 bg-[#EBEBEB]" />
          <div>
            <p className="text-[10px] text-[#9CA3AF] font-medium">Busiest</p>
            <p className="text-[13px] font-bold text-[#1A1A1A]">{busiestDay}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Day Timeline ─────────────────────────────────────────────────────────────

function DayTimeline({ date, bookings, todayStr }: { date: Date; bookings: Booking[]; todayStr: string }) {
  const ds      = toDateStr(date);
  const isToday = ds === todayStr;
  const dayJobs = bookings
    .filter((b) => b.date === ds && b.status !== 'cancelled')
    .sort((a, b) => {
      const ta = parseTime(a.time);
      const tb = parseTime(b.time);
      return (ta.h * 60 + ta.m) - (tb.h * 60 + tb.m);
    });

  const hours    = Array.from({ length: TIMELINE_END - TIMELINE_START }, (_, i) => TIMELINE_START + i);
  const totalH   = (TIMELINE_END - TIMELINE_START) * PX_PER_HOUR;
  const now      = new Date();
  const nowMinFS = isToday ? (now.getHours() - TIMELINE_START) * 60 + now.getMinutes() : -1;
  const nowTop   = (nowMinFS / 60) * PX_PER_HOUR;

  const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const dayEarnings = dayJobs.reduce((s, b) => s + b.total_price, 0);

  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white">
      <CardContent className="p-4">
        {/* Day header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[14px] text-[#1A1A1A]">
              {isToday ? 'Today' : `${DAY_LABELS[dayIdx]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`}
            </h3>
            {dayJobs.length > 0 && (
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">₹{fmt(dayEarnings)} projected</p>
            )}
          </div>
          <span className="text-[11px] font-semibold text-[#9CA3AF] bg-[#F5F4F2] border border-[#EBEBEB] px-2.5 py-1 rounded-full">
            {dayJobs.length} job{dayJobs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {dayJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0EC] flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-[#C84B31]/40" />
            </div>
            <p className="text-[13px] font-semibold text-[#6B7280]">No jobs scheduled</p>
            <p className="text-[11px] text-[#9CA3AF] mt-1">Enjoy your free day</p>
          </div>
        ) : (
          /* ── Timeline ── */
          <div className="relative overflow-x-hidden">
            <div className="relative" style={{ height: totalH }}>
              {/* Hour gridlines */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 flex items-center gap-2 pointer-events-none"
                  style={{ top: (h - TIMELINE_START) * PX_PER_HOUR }}
                >
                  <span className="text-[10px] text-[#9CA3AF] w-11 shrink-0 text-right select-none">
                    {fmt12(h, 0)}
                  </span>
                  <div className="flex-1 h-px bg-[#EBEBEB]" />
                </div>
              ))}

              {/* "Now" red line */}
              {isToday && nowMinFS >= 0 && nowMinFS < (TIMELINE_END - TIMELINE_START) * 60 && (
                <div
                  className="absolute left-13 right-0 flex items-center gap-1 z-20 pointer-events-none"
                  style={{ top: nowTop, left: '3.25rem' }}
                >
                  <div className="w-2 h-2 rounded-full bg-[#C84B31] shrink-0 -ml-1" />
                  <div className="flex-1 h-px bg-[#C84B31]" />
                </div>
              )}

              {/* Booking blocks */}
              {dayJobs.map((booking) => {
                const { h, m }  = parseTime(booking.time);
                const topMin    = (h - TIMELINE_START) * 60 + m;
                const topPx     = (topMin / 60) * PX_PER_HOUR;
                const heightPx  = Math.max((DEFAULT_DURATION / 60) * PX_PER_HOUR, 44);
                const s         = STATUS_STYLE[booking.status] ?? STATUS_STYLE.pending;
                const isShort   = heightPx < 56;

                return (
                  <div
                    key={booking.id}
                    className={cn(
                      'absolute rounded-xl border px-3 py-2 text-left transition-all hover:brightness-95 cursor-default z-10',
                      s.bg, s.border,
                    )}
                    style={{ top: Math.max(topPx, 0), height: heightPx, left: '3.25rem', right: 0 }}
                  >
                    <div className="flex items-start justify-between gap-2 h-full overflow-hidden">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className={cn('font-bold text-[12px] leading-tight truncate', s.text)}>
                          {booking.service_name ?? 'Service'}
                        </p>
                        {!isShort ? (
                          <>
                            <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">
                              {booking.client_name ?? '—'}
                            </p>
                            <p className="text-[10px] text-[#9CA3AF] truncate flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              {booking.time}
                            </p>
                          </>
                        ) : (
                          <p className="text-[10px] text-[#6B7280] truncate">
                            {booking.client_name ?? '—'} · {booking.time}
                          </p>
                        )}
                      </div>
                      <span className={cn('text-[11px] font-bold shrink-0', s.text)}>
                        ₹{fmt(booking.total_price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Week sidebar (desktop) ───────────────────────────────────────────────────

function WeekSidebar({
  weekDates, selectedDate, onSelect, bookings, todayStr,
}: {
  weekDates: Date[];
  selectedDate: Date;
  onSelect: (d: Date) => void;
  bookings: Booking[];
  todayStr: string;
}) {
  const selStr = toDateStr(selectedDate);

  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white sticky top-[73px]">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">This Week</p>
        <div className="space-y-2">
          {weekDates.map((d) => {
            const ds      = toDateStr(d);
            const isToday = ds === todayStr;
            const isSel   = ds === selStr;
            const dayJobs = bookings.filter((b) => b.date === ds && b.status !== 'cancelled');
            const dayIdx  = d.getDay() === 0 ? 6 : d.getDay() - 1;
            const earnings = dayJobs.reduce((s, b) => s + b.total_price, 0);

            return (
              <button
                key={ds}
                onClick={() => onSelect(d)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left',
                  isSel   ? 'bg-[#FFF0EC] border-[#FDDDD5]'
                  : isToday ? 'bg-white border-[#FDDDD5]'
                  : 'bg-[#F5F4F2] border-transparent hover:border-[#EBEBEB]',
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
                      <p className={cn('text-[12px] font-semibold truncate', isSel ? 'text-[#C84B31]' : 'text-[#1A1A1A]')}>
                        {dayJobs.length} job{dayJobs.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF] truncate">
                        {dayJobs.map((b) => b.service_name ?? 'Service').join(', ')}
                      </p>
                    </>
                  )}
                </div>
                {dayJobs.length > 0 && (
                  <span className={cn('text-[11px] font-bold shrink-0', isSel ? 'text-[#C84B31]' : 'text-[#6B7280]')}>
                    ₹{fmt(earnings)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-[#EBEBEB] space-y-1.5">
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Legend</p>
          {(['pending', 'confirmed', 'active', 'completed'] as const).map((k) => {
            const s = STATUS_STYLE[k];
            return (
              <div key={k} className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', s.dot)} />
                <span className="text-[11px] text-[#6B7280]">{s.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Availability Manager ─────────────────────────────────────────────────────

function AvailabilityManager() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(DEFAULT_AVAILABILITY);
  const [saved, setSaved] = useState(false);

  const toggle = (i: number) => {
    setSlots((p) => p.map((s, idx) => idx === i ? { ...s, enabled: !s.enabled } : s));
    setSaved(false);
  };

  const update = (i: number, field: 'from' | 'to', val: string) => {
    setSlots((p) => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
    setSaved(false);
  };

  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-[14px] text-[#1A1A1A]">Working Hours</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Set when you're available for bookings</p>
          </div>
          <button
            onClick={() => setSaved(true)}
            className={cn(
              'h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors border',
              saved
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
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

              <span className={cn('text-[13px] font-semibold w-8 shrink-0', slot.enabled ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]')}>
                {slot.day}
              </span>

              {slot.enabled ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="time" value={slot.from}
                    onChange={(e) => update(i, 'from', e.target.value)}
                    className="flex-1 min-w-0 text-[12px] font-medium text-[#1A1A1A] bg-[#F5F4F2] border border-[#EBEBEB] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C84B31]"
                  />
                  <span className="text-[11px] text-[#9CA3AF] shrink-0">to</span>
                  <input
                    type="time" value={slot.to}
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

        {/* Active summary */}
        <div className="mt-4 pt-3 border-t border-[#EBEBEB] flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-[#9CA3AF]">Active days:</span>
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

// ─── Main page ────────────────────────────────────────────────────────────────

type View = 'week' | 'availability';

export default function Schedule() {
  const today      = useMemo(() => new Date(), []);
  const todayStr   = useMemo(() => toDateStr(today), [today]);

  const [view,         setView]         = useState<View>('week');
  const [weekAnchor,   setWeekAnchor]   = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [bookings,     setBookings]     = useState<Booking[]>([]);
  const [loading,      setLoading]      = useState(true);

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);

  const load = () => {
    setLoading(true);
    providersAPI.getMyJobs()
      .then(({ data }) => setBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const shiftWeek = (dir: 1 | -1) => {
    const next = new Date(weekAnchor);
    next.setDate(weekAnchor.getDate() + dir * 7);
    setWeekAnchor(next);
    setSelectedDate(next);
  };

  // Stats for top bar
  const totalBookings   = bookings.filter((b) => b.status !== 'cancelled').length;
  const activeToday     = bookings.filter((b) => b.date === todayStr && b.status !== 'cancelled').length;
  const upcomingCount   = bookings.filter((b) => b.date >= todayStr && ['pending', 'confirmed'].includes(b.status)).length;

  return (
    <ProviderLayout title="Schedule" subtitle={todaySubtitle()}>

      {/* ── Top quick-stats ── */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
          {[
            { label: 'All Jobs',   value: String(totalBookings), Icon: Briefcase },
            { label: 'Today',      value: String(activeToday),   Icon: Calendar  },
            { label: 'Upcoming',   value: String(upcomingCount), Icon: Clock     },
          ].map(({ label, value, Icon }) => (
            <Card key={label} className="border border-[#EBEBEB] shadow-none bg-white">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0EC] flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#C84B31]" />
                </div>
                <div>
                  <p className="font-bold text-[16px] text-[#1A1A1A] leading-none">{value}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── View toggle + refresh ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl">
          {(['week', 'availability'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-4 py-2 rounded-lg text-[12px] font-semibold transition-all',
                view === v ? 'bg-white text-[#C84B31] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]',
              )}
            >
              {v === 'week' ? '📅 Calendar' : '⏰ Hours'}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-[12px] text-[#C84B31] font-medium hover:text-[#B04028] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-3">
          <div className="h-[200px] rounded-2xl bg-[#F5F4F2] animate-pulse" />
          <div className="h-[400px] rounded-2xl bg-[#F5F4F2] animate-pulse" />
        </div>
      )}

      {/* ── Calendar view ── */}
      {!loading && view === 'week' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          <div>
            <WeekStrip
              weekDates={weekDates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              onPrev={() => shiftWeek(-1)}
              onNext={() => shiftWeek(1)}
              bookings={bookings}
              todayStr={todayStr}
            />
            <DayTimeline date={selectedDate} bookings={bookings} todayStr={todayStr} />
          </div>
          <div className="hidden lg:block">
            <WeekSidebar
              weekDates={weekDates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              bookings={bookings}
              todayStr={todayStr}
            />
          </div>
        </div>
      )}

      {/* ── Availability view ── */}
      {!loading && view === 'availability' && (
        <div className="max-w-lg">
          <AvailabilityManager />
        </div>
      )}

    </ProviderLayout>
  );
}
