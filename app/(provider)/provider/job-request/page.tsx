'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Clock, Check, X, Star,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import ProviderLayout from '../_components/ProviderLayout';

// ─── Design tokens ────────────────────────────────────────────────────────────
// Primary   #C84B31   Hover #B04028   Active #9A3522
// Tint bg   #FFF0EC   Tint border #FDDDD5
// Page bg   #F5F4F2   Surface #FFFFFF
// Border    #EBEBEB
// Text-1    #1A1A1A   Text-2 #6B7280   Text-3 #9CA3AF

const TIMER_SECONDS = 60;

export default function JobRequest() {
  const router = useRouter();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  useEffect(() => {
    if (timeLeft === 0) {
      router.push('/provider');
      return;
    }
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, router]);

  const handleAccept = () => {
    toast({ title: 'Job Accepted! 🎉', description: "You've been assigned to this booking." });
    router.push('/provider/job-details');
  };

  const handleReject = () => {
    toast({ title: 'Job Declined', description: 'The request has been passed to another provider.' });
    router.push('/provider');
  };

  const circumference = 2 * Math.PI * 44;
  const progress = (timeLeft / TIMER_SECONDS) * circumference;
  const urgent = timeLeft <= 15;

  // ── Sub-components ────────────────────────────────────────────────────────

  const TimerRing = ({ size = 'lg' }: { size?: 'lg' | 'sm' }) => {
    const isLg = size === 'lg';
    return (
      <div className={cn('relative shrink-0', isLg ? 'w-24 h-24' : 'w-16 h-16')}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.2)" strokeWidth="7" fill="none" />
          <circle
            cx="50" cy="50" r="44"
            stroke="white" strokeWidth="7" fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold text-white leading-none', isLg ? 'text-2xl' : 'text-lg')}>{timeLeft}</span>
          <span className="text-white/60 text-[10px] mt-0.5">sec</span>
        </div>
      </div>
    );
  };

  const CTAButtons = ({ layout = 'row' }: { layout?: 'row' | 'col' }) => (
    <div className={cn('flex gap-3', layout === 'col' ? 'flex-col-reverse' : 'flex-row')}>
      <Button
        variant="outline"
        className={cn(
          'h-12 border border-[#EBEBEB] text-[#6B7280] hover:bg-red-50 hover:border-red-200 hover:text-red-500 font-semibold rounded-xl shadow-none transition-colors',
          layout === 'col' ? 'w-full' : 'flex-1',
        )}
        onClick={handleReject}
      >
        <X className="w-4 h-4 mr-2" /> Decline
      </Button>
      <Button
        className={cn(
          'h-12 bg-[#C84B31] hover:bg-[#B04028] active:bg-[#9A3522] text-white font-semibold rounded-xl shadow-none border-0 transition-colors',
          layout === 'col' ? 'w-full' : 'flex-[2]',
        )}
        onClick={handleAccept}
      >
        <Check className="w-4 h-4 mr-2" /> Accept Job
      </Button>
    </div>
  );

  return (
    <ProviderLayout title="Dashboard" subtitle="Wednesday, 14 March 2025">
      <div className="min-h-screen bg-[#F5F4F2] flex flex-col">
        {/* ── Page body ────────────────────────────────────────────────────────── */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-5 md:py-8 pb-[200px] md:pb-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_440px] gap-5 md:gap-8 items-start">

            {/* ══ LEFT COLUMN ══════════════════════════════════════════════════ */}
            <div className="space-y-4">

              {/* Service Details Card */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-5 md:p-6">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C84B31] opacity-40" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C84B31]" />
                        </span>
                        <span className="text-[10px] font-bold text-[#C84B31] tracking-widest uppercase">Incoming Request</span>
                      </div>
                      <h2 className="font-bold text-[22px] md:text-[24px] text-[#1A1A1A] tracking-tight">Party Makeup</h2>
                      <p className="text-[13px] text-[#9CA3AF] mt-0.5">Full glam look for special occasion</p>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-semibold border-[#FDDDD5] bg-[#FFF0EC] text-[#C84B31] shrink-0 mt-1">
                      Bridal & Makeup
                    </Badge>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 pt-5 border-t border-[#EBEBEB]">
                    {[
                      { Icon: Clock,  label: 'Duration',  value: '90 min' },
                      { Icon: MapPin, label: 'Distance',  value: '2.5 km' },
                      { Icon: Clock,  label: 'Scheduled', value: '6:00 PM' },
                    ].map(({ Icon, label, value }) => (
                      <div key={label} className="flex flex-col items-center text-center gap-1.5">
                        <div className="w-9 h-9 rounded-xl bg-[#FFF0EC] flex items-center justify-center">
                          <Icon className="w-4 h-4 text-[#C84B31]" />
                        </div>
                        <p className="text-[10px] text-[#9CA3AF] font-medium">{label}</p>
                        <p className="text-[13px] font-semibold text-[#1A1A1A]">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Client Info Card */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-5 md:p-6">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Client Details</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#FFF7ED] border border-[#EBEBEB] flex items-center justify-center text-2xl shrink-0">
                      👩
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] text-[#1A1A1A]">Ananya Singh</p>
                      <div className="flex items-center gap-1 mt-0.5 text-[#9CA3AF]">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="text-[12px] truncate">Bandra West, Mumbai</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-xl shrink-0">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-[12px] font-bold text-amber-700">4.8</span>
                    </div>
                  </div>
                  <div className="bg-[#F5F4F2] rounded-xl p-3.5 border border-[#EBEBEB]">
                    <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Note from client</p>
                    <p className="text-[13px] text-[#6B7280] leading-relaxed">
                      Need makeup for engagement party. Please bring nude and pink shades.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Location Card */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="h-40 flex flex-col items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFF0EC 100%)' }}
                  >
                    <div className="w-11 h-11 rounded-full bg-white border border-[#FDDDD5] flex items-center justify-center shadow-sm">
                      <MapPin className="w-5 h-5 text-[#C84B31]" />
                    </div>
                    <p className="text-[14px] font-medium text-[#6B7280]">Bandra West, Mumbai</p>
                    <p className="text-[11px] text-[#C84B31]/70">2.5 km from your location</p>
                  </div>
                  <button className="w-full flex items-center justify-between px-5 py-3.5 border-t border-[#EBEBEB] hover:bg-[#F5F4F2] transition-colors group">
                    <span className="text-[13px] font-semibold text-[#C84B31]">Open in Maps</span>
                    <ChevronRight className="w-4 h-4 text-[#C84B31] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </CardContent>
              </Card>

            </div>

            {/* ══ RIGHT COLUMN (sticky action panel — desktop only) ═══════════ */}
            <div className="hidden md:flex flex-col gap-4 sticky top-[73px]">

              {/* Timer + Earnings hero */}
              <div
                className="rounded-2xl p-6 flex items-center gap-5"
                style={{ background: 'linear-gradient(135deg, #C84B31 0%, #E8703A 55%, #F2924A 100%)' }}
              >
                <TimerRing size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-[11px] font-medium mb-1">Estimated Earnings</p>
                  <p className="text-white font-bold text-[42px] tracking-tight leading-none">₹1,999</p>
                  <span className="inline-flex items-center gap-1 text-white/80 bg-white/15 text-[11px] font-medium px-2.5 py-1 rounded-full mt-3">
                    After platform fee
                  </span>
                </div>
              </div>

              {/* Response card */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-0.5">Your Response</p>
                    <p className="text-[12px] text-[#9CA3AF]">You have <span className="font-semibold text-[#C84B31]">{timeLeft}s</span> to respond</p>
                  </div>
                  <CTAButtons layout="col" />
                  <p className="text-[11px] text-[#9CA3AF] text-center leading-relaxed">
                    Declining will pass this request to the next available provider.
                  </p>
                </CardContent>
              </Card>

              {/* Summary card */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-5">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Job Summary</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Service', value: 'Party Makeup' },
                      { label: 'Date', value: 'Today, 6:00 PM' },
                      { label: 'Duration', value: '90 minutes' },
                      { label: 'Location', value: 'Bandra West, Mumbai' },
                      { label: 'Client Rating', value: '⭐ 4.8' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[12px] text-[#9CA3AF]">{label}</span>
                        <span className="text-[12px] font-semibold text-[#1A1A1A]">{value}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-[#EBEBEB] flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#1A1A1A]">Total Earnings</span>
                      <span className="text-[15px] font-bold text-[#C84B31]">₹1,999</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>
        </main>

        {/* ── Mobile: Timer hero + fixed CTA ──────────────────────────────────── */}
        <div className="md:hidden">
          {/* Timer hero above CTA */}
          <div className="fixed bottom-[76px] left-0 right-0 px-4 z-40">
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: 'linear-gradient(135deg, #C84B31 0%, #E8703A 55%, #F2924A 100%)' }}
            >
              <TimerRing size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-[10px] font-medium mb-0.5">Estimated Earnings</p>
                <p className="text-white font-bold text-[32px] tracking-tight leading-none">₹1,999</p>
                <span className="inline-flex text-white/80 bg-white/15 text-[10px] font-medium px-2 py-0.5 rounded-full mt-1.5">
                  After platform fee
                </span>
              </div>
            </div>
          </div>
          {/* Fixed CTA strip */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#EBEBEB] px-4 py-4 z-50">
            <CTAButtons layout="row" />
          </div>
        </div>

      </div>
    </ProviderLayout>
  );
}