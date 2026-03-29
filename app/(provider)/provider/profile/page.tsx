'use client';

import React, { useState, useRef } from 'react';
import {
  Camera, Star, MapPin, Phone, Mail, Edit3, Check,
  X, Plus, Trash2, Award, TrendingUp, Users, Clock, BadgeCheck,
} from 'lucide-react';
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  client: string;
  clientEmoji: string;
  rating: number;
  comment: string;
  service: string;
  date: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const REVIEWS: Review[] = [
  {
    id: 'r1', client: 'Ananya Singh', clientEmoji: '👩', rating: 5,
    comment: 'Meera is absolutely amazing! My bridal makeup was flawless. She understood exactly what I wanted and delivered beyond expectations.',
    service: 'Bridal Makeup', date: 'Dec 25, 2024',
  },
  {
    id: 'r2', client: 'Priya Mehta', clientEmoji: '👩‍🦱', rating: 5,
    comment: 'Highly professional and punctual. The party makeup lasted all night. Will definitely book again!',
    service: 'Party Makeup', date: 'Dec 20, 2024',
  },
  {
    id: 'r3', client: 'Divya Nair', clientEmoji: '🧖‍♀️', rating: 4,
    comment: 'Great facial experience. Very knowledgeable about skincare. My skin felt so refreshed afterwards.',
    service: 'Gold Facial', date: 'Dec 15, 2024',
  },
];

const STAT_CARDS = [
  { Icon: Star,       label: 'Rating',    value: '4.9',  sub: '312 reviews',  color: 'text-amber-500', bg: 'bg-amber-50',  border: 'border-amber-100' },
  { Icon: Users,      label: 'Clients',   value: '156',  sub: 'Total served', color: 'text-blue-500',  bg: 'bg-blue-50',   border: 'border-blue-100'  },
  { Icon: TrendingUp, label: 'Success',   value: '98%',  sub: 'Job success',  color: 'text-green-500', bg: 'bg-green-50',  border: 'border-green-100' },
  { Icon: Clock,      label: 'Response',  value: '< 2m', sub: 'Avg response', color: 'text-[#C84B31]', bg: 'bg-[#FFF0EC]', border: 'border-[#FDDDD5]' },
];

const SERVICES_OFFERED = [
  'Bridal Makeup', 'Party Makeup', 'HD Makeup', 'Airbrush Makeup',
  'Gold Facial', 'HydraFacial', 'Hair Spa', 'Hair Styling',
];

const CERTIFICATIONS = [
  { name: 'VLCC Certified Beautician',      year: '2020' },
  { name: 'Schwarzkopf Hair Professional',  year: '2021' },
  { name: 'MAC Cosmetics Workshop',          year: '2022' },
];

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
            i < rating ? 'text-amber-400 fill-amber-400' : 'text-[#EBEBEB] fill-[#EBEBEB]',
          )}
        />
      ))}
    </div>
  );
}

// ─── Editable Field ───────────────────────────────────────────────────────────
// On mobile, "hover" doesn't exist — Edit button is always visible on touch devices

function EditableField({
  label, value, onSave, multiline = false, type = 'text',
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  const handleSave   = () => { onSave(draft); setEditing(false); };
  const handleCancel = () => { setDraft(value); setEditing(false); };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">{label}</p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            // Always visible (not opacity-0) so it works on touch devices too
            className="flex items-center gap-1 text-[11px] font-semibold text-[#C84B31]"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full text-[13px] text-[#1A1A1A] bg-[#F5F4F2] border border-[#C84B31]/30 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31]/20"
              autoFocus
            />
          ) : (
            <input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full text-[13px] text-[#1A1A1A] bg-[#F5F4F2] border border-[#C84B31]/30 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31]/20"
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-[#C84B31] hover:bg-[#B04028] text-white text-[12px] font-semibold rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-[#F5F4F2] border border-[#EBEBEB] text-[#6B7280] text-[12px] font-semibold rounded-lg hover:bg-[#EBEBEB] transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-[#1A1A1A] leading-relaxed">{value}</p>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProviderProfile() {
  const { toast }      = useToast();
  const fileInputRef   = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name:       'Meera Patel',
    tagline:    'Certified Beauty Professional · 5+ years experience',
    phone:      '+91 98765 43210',
    email:      'meera.patel@gmail.com',
    location:   'Bandra West, Mumbai, Maharashtra',
    bio:        'Passionate beauty professional specializing in bridal and editorial makeup. I bring out the natural beauty in every client with personalized, high-quality services delivered at your doorstep.',
    experience: '5 years',
    languages:  'Hindi, English, Marathi',
  });

  const [services, setServices]           = useState(SERVICES_OFFERED);
  const [newService, setNewService]       = useState('');
  const [addingService, setAddingService] = useState(false);
  const [activeTab, setActiveTab]         = useState<'overview' | 'reviews' | 'portfolio'>('overview');

  const update = (key: keyof typeof profile) => (val: string) => {
    setProfile((p) => ({ ...p, [key]: val }));
    toast({ title: 'Profile updated', description: `${key} has been saved.` });
  };

  const addService    = () => {
    if (!newService.trim()) return;
    setServices((p) => [...p, newService.trim()]);
    setNewService('');
    setAddingService(false);
  };
  const removeService = (s: string) => setServices((p) => p.filter((x) => x !== s));

  return (
    <ProviderLayout title="My Profile" subtitle="Manage your public profile and settings">

      {/* ── Profile hero card (full width on mobile) ──────────────────────── */}
      <Card className="border border-[#EBEBEB] shadow-none bg-white overflow-hidden mb-5">
        {/* Gradient banner */}
        <div
          className="h-24 sm:h-28 relative"
          style={{ background: 'linear-gradient(135deg, #C84B31 0%, #E8703A 55%, #F2924A 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <CardContent className="px-4 sm:px-5 pb-5 -mt-5">
          {/* Avatar row — on mobile: avatar left, name/stats right */}
          <div className="flex items-end gap-4 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-4xl select-none">
                👩‍🦰
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#C84B31] border-2 border-white flex items-center justify-center text-white hover:bg-[#B04028] transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
            </div>

            {/* Name + badges inline on mobile */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-[17px] sm:text-[19px] text-[#1A1A1A] tracking-tight leading-tight">
                  {profile.name}
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full shrink-0">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <StarRating rating={5} size="sm" />
                <span className="text-[12px] font-bold text-[#1A1A1A]">4.9</span>
                <span className="text-[11px] text-[#9CA3AF]">(312)</span>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-[11px] sm:text-[12px] text-[#9CA3AF] mb-4 leading-snug">{profile.tagline}</p>

          {/* Stats row — horizontal scroll on very small screens */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {STAT_CARDS.map(({ Icon, label, value, color, bg, border }) => (
              <div
                key={label}
                className={cn('flex flex-col items-center text-center py-2.5 px-1 rounded-xl border', bg, border)}
              >
                <Icon className={cn('w-3.5 h-3.5 mb-1', color)} />
                <p className={cn('font-bold text-[13px] sm:text-[15px] leading-none', color)}>{value}</p>
                <p className="text-[9px] sm:text-[10px] text-[#9CA3AF] mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Contact chips — 2-col grid on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { Icon: Phone,  value: profile.phone    },
              { Icon: Mail,   value: profile.email    },
              { Icon: MapPin, value: profile.location, full: true },
            ].map(({ Icon, value, full }) => (
              <div
                key={value}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 bg-[#F5F4F2] rounded-xl border border-[#EBEBEB]',
                  full && 'sm:col-span-2',
                )}
              >
                <Icon className="w-3.5 h-3.5 text-[#C84B31] shrink-0" />
                <span className="text-[11px] sm:text-[12px] text-[#6B7280] truncate">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl mb-5">
        {(['overview', 'reviews', 'portfolio'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 px-2 sm:px-3 rounded-lg text-[12px] font-semibold transition-all capitalize',
              activeTab === tab ? 'bg-white text-[#C84B31] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Two-column on desktop, single-col on mobile ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">

        {/* ══ LEFT COLUMN — shown below tabs on mobile, beside on desktop ═══ */}
        <div className="space-y-4 order-2 lg:order-1">

          {/* Certifications */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Certifications</p>
              <div className="space-y-3">
                {CERTIFICATIONS.map((cert) => (
                  <div key={cert.name} className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center shrink-0 mt-0.5">
                      <Award className="w-4 h-4 text-[#C84B31]" />
                    </div>
                    <div>
                      <p className="text-[12px] sm:text-[13px] font-semibold text-[#1A1A1A] leading-tight">{cert.name}</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">{cert.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account health */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Account Health</p>
              <div className="space-y-3">
                {[
                  { label: 'Profile completeness', value: 85, color: '#C84B31' },
                  { label: 'Response rate',         value: 97, color: '#2563EB' },
                  { label: 'Job completion',        value: 98, color: '#16A34A' },
                  { label: 'Client satisfaction',   value: 96, color: '#D97706' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] sm:text-[12px] font-medium text-[#6B7280]">{label}</span>
                      <span className="text-[11px] sm:text-[12px] font-bold" style={{ color }}>{value}%</span>
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
            </CardContent>
          </Card>

        </div>

        {/* ══ RIGHT COLUMN — tab content ════════════════════════════════════ */}
        <div className="space-y-4 order-1 lg:order-2">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 sm:p-5 divide-y divide-[#EBEBEB]">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider pb-4">Personal Information</p>
                  {[
                    { label: 'Full Name',   key: 'name'       as const },
                    { label: 'Phone',       key: 'phone'      as const, type: 'tel'   },
                    { label: 'Email',       key: 'email'      as const, type: 'email' },
                    { label: 'Location',    key: 'location'   as const },
                    { label: 'Experience',  key: 'experience' as const },
                    { label: 'Languages',   key: 'languages'  as const },
                    { label: 'Bio / About', key: 'bio'        as const, multiline: true },
                  ].map(({ label, key, type, multiline }) => (
                    <div key={key} className="py-4 last:pb-0">
                      <EditableField
                        label={label}
                        value={profile[key]}
                        onSave={update(key)}
                        type={type}
                        multiline={multiline}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Services offered */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Services Offered</p>
                    <button
                      onClick={() => setAddingService(true)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#C84B31]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {services.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-2.5 py-1.5 rounded-full"
                      >
                        {s}
                        {/* Always-visible × on mobile (no hover) */}
                        <button
                          onClick={() => removeService(s)}
                          className="text-[#C84B31]/50 hover:text-[#C84B31] transition-colors"
                          aria-label={`Remove ${s}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {addingService && (
                    <div className="mt-3 flex gap-2">
                      <input
                        autoFocus
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addService()}
                        placeholder="e.g. Eyebrow Threading"
                        className="flex-1 min-w-0 text-[12px] bg-[#F5F4F2] border border-[#C84B31]/30 rounded-xl px-3 py-2 focus:outline-none focus:border-[#C84B31]"
                      />
                      <button onClick={addService} className="w-9 h-9 shrink-0 rounded-xl bg-[#C84B31] text-white flex items-center justify-center hover:bg-[#B04028]">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setAddingService(false); setNewService(''); }} className="w-9 h-9 shrink-0 rounded-xl bg-[#F5F4F2] border border-[#EBEBEB] text-[#6B7280] flex items-center justify-center">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── REVIEWS ── */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {/* Rating summary */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-5 sm:gap-8">
                    <div className="text-center shrink-0">
                      <p className="font-bold text-[44px] sm:text-[52px] text-[#1A1A1A] leading-none">4.9</p>
                      <StarRating rating={5} size="md" />
                      <p className="text-[10px] text-[#9CA3AF] mt-1.5">312 reviews</p>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const pcts: Record<number, number> = { 5: 87, 4: 9, 3: 3, 2: 1, 1: 0 };
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-[10px] text-[#9CA3AF] w-3 shrink-0 text-right">{star}</span>
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                            <div className="flex-1 h-1.5 bg-[#F5F4F2] rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pcts[star]}%` }} />
                            </div>
                            <span className="text-[10px] text-[#9CA3AF] w-7 text-right shrink-0">{pcts[star]}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Review cards */}
              {REVIEWS.map((review) => (
                <Card key={review.id} className="border border-[#EBEBEB] shadow-none bg-white">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-lg shrink-0">
                        {review.clientEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Stack name + date on very small screens */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-[13px] sm:text-[14px] text-[#1A1A1A] leading-tight">{review.client}</p>
                          <span className="text-[10px] text-[#9CA3AF] shrink-0 mt-0.5">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <StarRating rating={review.rating} size="sm" />
                          <Badge variant="outline" className="text-[9px] border-[#FDDDD5] bg-[#FFF0EC] text-[#C84B31] py-0 px-1.5">
                            {review.service}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-[12px] text-[#6B7280] leading-relaxed">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ── PORTFOLIO ── */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Portfolio Photos</p>
                    <button className="flex items-center gap-1 text-[11px] font-semibold text-[#C84B31]">
                      <Plus className="w-3.5 h-3.5" /> Add Photos
                    </button>
                  </div>
                  {/* 3-col on all sizes — photos are square so they fit fine */}
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <button
                        key={i}
                        className="aspect-square rounded-xl border-2 border-dashed border-[#FDDDD5] bg-[#FFF0EC] flex flex-col items-center justify-center gap-1.5 hover:bg-[#FFE8E0] transition-colors active:scale-95"
                      >
                        <Camera className="w-5 h-5 text-[#C84B31]" />
                        <span className="text-[9px] sm:text-[10px] font-medium text-[#C84B31]">Add photo</span>
                      </button>
                    ))}
                    {[
                      { label: 'Bridal Look', emoji: '👰' },
                      { label: 'Party Glam',  emoji: '💄' },
                      { label: 'HD Makeup',   emoji: '✨' },
                    ].map(({ label, emoji }) => (
                      <div
                        key={label}
                        className="aspect-square rounded-xl border border-[#EBEBEB] bg-gradient-to-br from-[#FFF0EC] to-[#F5F4F2] flex flex-col items-center justify-center gap-1.5 relative group overflow-hidden"
                      >
                        <span className="text-2xl sm:text-3xl">{emoji}</span>
                        <span className="text-[9px] sm:text-[10px] font-semibold text-[#6B7280] text-center px-1">{label}</span>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                          <button className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Specialisations */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Specialisations</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Bridal Makeup',   icon: '👰', pct: 95 },
                      { label: 'Airbrush Makeup', icon: '💨', pct: 88 },
                      { label: 'Skin Treatments', icon: '✨', pct: 80 },
                      { label: 'Hair Styling',    icon: '💇‍♀️', pct: 72 },
                    ].map(({ label, icon, pct }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-base w-5 shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] font-medium text-[#1A1A1A]">{label}</span>
                            <span className="text-[11px] font-bold text-[#C84B31]">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-[#F5F4F2] rounded-full overflow-hidden">
                            <div className="h-full bg-[#C84B31] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

        </div>
      </div>

    </ProviderLayout>
  );
}