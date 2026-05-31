'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { bookingsAPI, type Booking } from '@/lib/api';
import { ArrowLeft, Phone, MessageCircle, MapPin, Camera, CheckCircle, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import ProviderLayout from '@/app/(provider)/provider/_components/ProviderLayout';

// ─── Design tokens ────────────────────────────────────────────────────────────
// Primary   #C84B31   Hover #B04028   Active #9A3522
// Tint bg   #FFF0EC   Tint border #FDDDD5
// Page bg   #F5F4F2   Surface #FFFFFF
// Border    #EBEBEB
// Text-1    #1A1A1A   Text-2 #6B7280   Text-3 #9CA3AF

type JobStatus = 'assigned' | 'in_progress' | 'completed';

interface ChecklistState {
  skinPrep: boolean;
  foundation: boolean;
  eyes: boolean;
  lips: boolean;
  finishing: boolean;
}

const checklistItems = [
  { key: 'skinPrep'     as keyof ChecklistState, label: 'Skin Prep & Primer' },
  { key: 'foundation'   as keyof ChecklistState, label: 'Foundation & Concealer' },
  { key: 'eyes'         as keyof ChecklistState, label: 'Eye Makeup' },
  { key: 'lips'         as keyof ChecklistState, label: 'Lip Makeup' },
  { key: 'finishing'    as keyof ChecklistState, label: 'Setting & Finishing' },
];

const STATUS_CONFIG = {
  assigned:    { label: 'Assigned',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:   { label: 'Completed',   className: 'bg-green-50 text-green-700 border-green-200' },
};

export default function JobDetails() {
  return <Suspense fallback={null}><JobDetailsInner /></Suspense>;
}

function JobDetailsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id') ?? '';
  const { toast } = useToast();
  const [jobStatus, setJobStatus] = useState<JobStatus>('assigned');
  const [checklist, setChecklist] = useState<ChecklistState>({
    skinPrep: false, foundation: false, eyes: false, lips: false, finishing: false,
  });
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    bookingsAPI.getById(bookingId)
      .then(({ data }) => {
        setBooking(data);
        if (data.status === 'active') setJobStatus('in_progress');
        else if (data.status === 'completed') setJobStatus('completed');
      })
      .catch(() => toast({ title: 'Failed to load booking', variant: 'destructive' }));
  }, [bookingId]);

  const allChecked = Object.values(checklist).every(Boolean);
  const checkedCount = Object.values(checklist).filter(Boolean).length;

  const handleStartJob = async () => {
    try {
      if (bookingId) await bookingsAPI.updateStatus(bookingId, 'active');
      setJobStatus('in_progress');
      toast({ title: 'Job Started', description: 'Timer has begun. Complete the service checklist.' });
    } catch {
      toast({ title: 'Failed to start job', variant: 'destructive' });
    }
  };

  const handleCompleteJob = async () => {
    try {
      if (bookingId) await bookingsAPI.updateStatus(bookingId, 'completed');
      setJobStatus('completed');
      toast({ title: 'Job Completed! 🎉', description: 'Great work! Your earnings have been added.' });
    } catch {
      toast({ title: 'Failed to complete job', variant: 'destructive' });
    }
  };

  return (
    <ProviderLayout title="Job Details" subtitle="Wednesday, 14 March 2025">

      {/* ── Page header row ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/provider')}
          className="w-9 h-9 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#F5F4F2] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[18px] text-[#1A1A1A] tracking-tight">Job Details</h1>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">{booking?.service_name ?? 'Loading…'} · {booking?.address?.split(',')[0] ?? '—'}</p>
        </div>
        <Badge
          variant="outline"
          className={cn('text-[11px] font-semibold shrink-0', STATUS_CONFIG[jobStatus].className)}
        >
          {STATUS_CONFIG[jobStatus].label}
        </Badge>
      </div>

      {/* ── Two-column grid ──────────────────────────────────────────────────
          Mobile pb accounts for:
            fixed CTA bar  ~68px  (bottom-16 + py-4 + button height)
            bottom nav bar ~64px
          → pb-36 gives comfortable clearance for both layers.
          Desktop: no fixed bars, pb-8 is sufficient.
      ──────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_400px] gap-5 md:gap-7 items-start pb-16 md:pb-8">

        {/* ══ LEFT COLUMN ════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Client card */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5 md:p-6">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Client</p>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-[#FFF7ED] border border-[#EBEBEB] flex items-center justify-center text-2xl shrink-0">
                  👩
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[17px] text-[#1A1A1A]">{booking?.client_name ?? '—'}</h3>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5">{booking?.service_name ?? '—'}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-xl shrink-0">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-[12px] font-bold text-amber-700">4.8</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-[13px] text-[#6B7280] mb-5 bg-[#F5F4F2] rounded-xl px-3.5 py-3 border border-[#EBEBEB]">
                <MapPin className="w-3.5 h-3.5 text-[#C84B31] mt-0.5 shrink-0" />
                <span>{booking?.address ?? '—'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-11 border-[#EBEBEB] text-[#6B7280] hover:bg-[#F5F4F2] hover:text-[#1A1A1A] font-semibold rounded-xl shadow-none text-[13px]"
                  onClick={() => booking?.client_phone && window.open(`tel:${booking.client_phone}`)}
                >
                  <Phone className="w-4 h-4 mr-2 text-[#C84B31]" /> Call
                </Button>
                <Button
                  variant="outline"
                  className="h-11 border-[#EBEBEB] text-[#6B7280] hover:bg-[#F5F4F2] hover:text-[#1A1A1A] font-semibold rounded-xl shadow-none text-[13px]"
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-[#C84B31]" /> Message
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Service checklist */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Service Checklist</p>
                <span className="text-[11px] font-semibold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-2.5 py-1 rounded-full">
                  {checkedCount}/{checklistItems.length} done
                </span>
              </div>

              <div className="h-1.5 bg-[#F5F4F2] rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full bg-[#C84B31] rounded-full transition-all duration-500"
                  style={{ width: `${(checkedCount / checklistItems.length) * 100}%` }}
                />
              </div>

              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <label
                    key={item.key}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors',
                      checklist[item.key]
                        ? 'bg-[#FFF0EC] border border-[#FDDDD5]'
                        : 'bg-[#F5F4F2] border border-transparent hover:border-[#EBEBEB]',
                      jobStatus !== 'in_progress' && 'pointer-events-none opacity-60',
                    )}
                  >
                    <Checkbox
                      checked={checklist[item.key]}
                      onCheckedChange={(checked) =>
                        setChecklist((prev) => ({ ...prev, [item.key]: checked as boolean }))
                      }
                      disabled={jobStatus !== 'in_progress'}
                      className="border-[#EBEBEB] data-[state=checked]:bg-[#C84B31] data-[state=checked]:border-[#C84B31]"
                    />
                    <span className={cn(
                      'text-[13px] font-medium flex-1',
                      checklist[item.key] ? 'line-through text-[#9CA3AF]' : 'text-[#1A1A1A]',
                    )}>
                      {item.label}
                    </span>
                    {checklist[item.key] && (
                      <CheckCircle className="w-4 h-4 text-[#C84B31] shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photo upload */}
          {jobStatus === 'in_progress' && (
            <Card className="border border-[#EBEBEB] shadow-none bg-white">
              <CardContent className="p-5 md:p-6">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Upload Photos</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Before', 'After'].map((label) => (
                    <button
                      key={label}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#FDDDD5] bg-[#FFF0EC] flex flex-col items-center justify-center gap-2 hover:bg-[#FFE8E0] transition-colors group"
                    >
                      <Camera className="w-6 h-6 text-[#C84B31] group-hover:scale-110 transition-transform" />
                      <span className="text-[12px] font-medium text-[#C84B31]">{label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile completion banner (in scroll flow, above fixed bars) */}
          {jobStatus === 'completed' && (
            <div className="md:hidden">
              <Card className="border border-green-200 bg-green-50 shadow-none">
                <CardContent className="p-5 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="font-bold text-[18px] text-green-800">Great Job!</h3>
                  <p className="text-[13px] text-green-600 mb-2">Your earnings have been credited</p>
                  <p className="font-bold text-[32px] text-green-700">₹{booking ? Math.round(booking.total_price * 0.85).toLocaleString('en-IN') : '—'}</p>
                </CardContent>
              </Card>
            </div>
          )}

        </div>

        {/* ══ RIGHT COLUMN (desktop sticky) ══════════════════════════════ */}
        <div className="hidden md:flex flex-col gap-4 sticky top-[73px]">

          <div
            className="rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg, #C84B31 0%, #E8703A 55%, #F2924A 100%)' }}
          >
            <p className="text-white/60 text-[11px] font-medium mb-1">Job Earnings</p>
            <p className="text-white font-bold text-[42px] tracking-tight leading-none">₹{booking ? Math.round(booking.total_price * 0.85).toLocaleString('en-IN') : '—'}</p>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/15">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-white/80 text-[12px]">{booking?.date ?? '—'}</span>
              </div>
              <div className="w-px h-3 bg-white/20" />
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-white/80 text-[12px]">{booking?.address?.split(',')[0] ?? '—'}</span>
              </div>
            </div>
          </div>

          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Job Summary</p>
              <div className="space-y-3">
                {[
                  { label: 'Service',  value: booking?.service_name ?? '—' },
                  { label: 'Date',     value: booking ? `${booking.date}, ${booking.time}` : '—' },
                  { label: 'Address',  value: booking?.address?.split(',').slice(0,2).join(',') ?? '—' },
                  { label: 'Status',   value: STATUS_CONFIG[jobStatus].label },
                  { label: 'Progress', value: `${checkedCount}/${checklistItems.length} steps` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[12px] text-[#9CA3AF]">{label}</span>
                    <span className="text-[12px] font-semibold text-[#1A1A1A]">{value}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-[#EBEBEB] flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">Total Earnings</span>
                  <span className="text-[15px] font-bold text-[#C84B31]">₹{booking ? Math.round(booking.total_price * 0.85).toLocaleString('en-IN') : '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {jobStatus === 'assigned' && (
              <Button
                className="w-full h-12 bg-[#C84B31] hover:bg-[#B04028] active:bg-[#9A3522] text-white font-semibold rounded-xl shadow-none border-0 text-[14px]"
                onClick={handleStartJob}
              >
                Start Job
              </Button>
            )}
            {jobStatus === 'in_progress' && (
              <Button
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-none border-0 text-[14px] disabled:opacity-50"
                onClick={handleCompleteJob}
                disabled={!allChecked}
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Complete Job
              </Button>
            )}
            {jobStatus === 'completed' && (
              <Button
                variant="outline"
                className="w-full h-12 border-[#EBEBEB] text-[#6B7280] hover:bg-[#F5F4F2] font-semibold rounded-xl shadow-none text-[14px]"
                onClick={() => router.push('/provider')}
              >
                Back to Dashboard
              </Button>
            )}
            {jobStatus === 'in_progress' && !allChecked && (
              <p className="text-[11px] text-[#9CA3AF] text-center">
                Complete all checklist items to finish the job
              </p>
            )}
          </div>

          {jobStatus === 'completed' && (
            <Card className="border border-green-200 shadow-none bg-green-50">
              <CardContent className="p-5 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-[16px] text-green-800">Great Job!</h3>
                <p className="text-[12px] text-green-600 mt-0.5">Your earnings have been credited</p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* ── Mobile fixed CTA ────────────────────────────────────────────────
          bottom-16 = 64px  → sits directly on top of the bottom nav bar.
          z-40 keeps it below the nav (z-50) so the nav stays accessible.
      ──────────────────────────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#EBEBEB] px-4 py-4 z-40">
        {jobStatus === 'assigned' && (
          <Button
            className="w-full h-12 bg-[#C84B31] hover:bg-[#B04028] text-white font-semibold rounded-xl shadow-none border-0"
            onClick={handleStartJob}
          >
            Start Job
          </Button>
        )}
        {jobStatus === 'in_progress' && (
          <div className="space-y-2">
            <Button
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-none border-0 disabled:opacity-50"
              onClick={handleCompleteJob}
              disabled={!allChecked}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Complete Job
            </Button>
            {!allChecked && (
              <p className="text-[11px] text-[#9CA3AF] text-center">
                Complete all checklist items first ({checkedCount}/{checklistItems.length})
              </p>
            )}
          </div>
        )}
        {jobStatus === 'completed' && (
          <Button
            variant="outline"
            className="w-full h-12 border-[#EBEBEB] text-[#6B7280] font-semibold rounded-xl shadow-none"
            onClick={() => router.push('/provider')}
          >
            Back to Dashboard
          </Button>
        )}
      </div>

    </ProviderLayout>
  );
}