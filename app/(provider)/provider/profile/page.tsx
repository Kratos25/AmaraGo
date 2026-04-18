'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, Star, MapPin, Phone, Mail, Edit3, Check,
  X, Plus, Trash2, Award, BadgeCheck, Upload, FileText,
  ShieldCheck, RefreshCw, Loader2, AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import { useAuth } from '@/config/context/AuthContext';
import ProviderLayout from '../_components/ProviderLayout';
import {
  providersAPI, servicesAPI,
  type ProviderProfile, type Service, type Certification,
} from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todaySubtitle() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function profileCompleteness(p: ProviderProfile): number {
  let score = 0;
  if (p.name)                          score += 15;
  if (p.phone)                         score += 10;
  if (p.bio && p.bio.length > 20)      score += 15;
  if (p.location)                      score += 10;
  if (p.experience_years > 0)          score += 10;
  if (p.services_offered.length > 0)   score += 15;
  if (p.certifications.length > 0)     score += 10;
  if (p.profile_image)                 score += 10;
  if (p.documents?.aadhar_url)         score += 5;
  return score;
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
            i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-[#EBEBEB] fill-[#EBEBEB]',
          )}
        />
      ))}
    </div>
  );
}

// ─── EditableField ────────────────────────────────────────────────────────────

function EditableField({
  label, value, onSave, multiline = false, type = 'text', saving = false,
}: {
  label: string;
  value: string;
  onSave: (v: string) => Promise<void>;
  multiline?: boolean;
  type?: string;
  saving?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const [busy,    setBusy]    = useState(false);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setBusy(true);
    await onSave(draft);
    setBusy(false);
    setEditing(false);
  };

  const handleCancel = () => { setDraft(value); setEditing(false); };

  // sync draft when external value changes
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">{label}</p>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[11px] font-semibold text-[#C84B31]">
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
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-[#C84B31] hover:bg-[#B04028] disabled:opacity-60 text-white text-[12px] font-semibold rounded-lg transition-colors"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
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
        <p className="text-[13px] text-[#1A1A1A] leading-relaxed">{value || <span className="text-[#9CA3AF]">Not set</span>}</p>
      )}
    </div>
  );
}

// ─── DocUploadSlot ────────────────────────────────────────────────────────────

function DocUploadSlot({
  label, icon: Icon, existingUrl, onUploaded, storagePath, accept = 'image/*,.pdf',
}: {
  label: string;
  icon: React.ElementType;
  existingUrl?: string;
  onUploaded: (url: string) => Promise<void>;
  storagePath: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error,    setError]    = useState('');

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setError('Max 5 MB'); return; }
    setError('');
    setProgress(0);
    try {
      const { data } = await providersAPI.uploadFile(file, storagePath, setProgress);
      await onUploaded(data.url);
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setProgress(null);
    }
  };

  const isImage = existingUrl && /\.(jpg|jpeg|png|webp|gif)/i.test(existingUrl);

  return (
    <div className="border border-[#EBEBEB] rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#EBEBEB] bg-[#F5F4F2]">
        <div className="w-8 h-8 rounded-lg bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#C84B31]" />
        </div>
        <p className="text-[12px] font-semibold text-[#1A1A1A] flex-1">{label}</p>
        {existingUrl && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" /> Uploaded
          </span>
        )}
      </div>

      <div className="p-4">
        {existingUrl ? (
          <div className="space-y-3">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={existingUrl} alt={label} className="w-full max-h-32 object-cover rounded-lg border border-[#EBEBEB]" />
            ) : (
              <a
                href={existingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[12px] text-[#C84B31] font-medium hover:underline"
              >
                <FileText className="w-4 h-4" /> View document
              </a>
            )}
            <button
              onClick={() => inputRef.current?.click()}
              className="text-[11px] font-semibold text-[#6B7280] hover:text-[#C84B31] transition-colors"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-[#FDDDD5] rounded-xl bg-[#FFF8F6] hover:bg-[#FFF0EC] transition-colors"
          >
            <Upload className="w-5 h-5 text-[#C84B31]/50" />
            <span className="text-[11px] font-medium text-[#C84B31]/70">Click to upload</span>
            <span className="text-[10px] text-[#9CA3AF]">JPG, PNG or PDF · max 5 MB</span>
          </button>
        )}

        {progress !== null && (
          <div className="mt-2">
            <div className="h-1.5 bg-[#F5F4F2] rounded-full overflow-hidden">
              <div className="h-full bg-[#C84B31] rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-[#9CA3AF] mt-1">{progress}% uploaded</p>
          </div>
        )}

        {error && (
          <p className="mt-2 text-[11px] text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'services' | 'documents';

export default function ProviderProfilePage() {
  const { user }     = useAuth();
  const { toast }    = useToast();
  const photoRef     = useRef<HTMLInputElement>(null);

  const [profile,        setProfile]        = useState<ProviderProfile | null>(null);
  const [allServices,    setAllServices]    = useState<Service[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState<Tab>('info');
  const [photoUploading, setPhotoUploading] = useState(false);

  // Certification editor state
  const [addingCert, setAddingCert]  = useState(false);
  const [newCert,    setNewCert]     = useState<Certification>({ name: '', issuer: '', year: '' });

  // Load profile + all platform services in parallel
  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      providersAPI.getMyProfile(),
      servicesAPI.list({ active: true }),
    ]).then(([pRes, sRes]) => {
      if (pRes.status === 'fulfilled') setProfile(pRes.value.data);
      if (sRes.status === 'fulfilled') setAllServices(sRes.value.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── generic field save ─────────────────────────────────────────────────────

  const save = useCallback(async (patch: Parameters<typeof providersAPI.updateMyProfile>[0]) => {
    const { data } = await providersAPI.updateMyProfile(patch);
    setProfile(data);
    toast({ title: 'Saved', description: 'Profile updated successfully.' });
  }, [toast]);

  const saveField = useCallback((key: string, value: unknown) =>
    save({ [key]: value } as any), [save]);

  // ── profile photo upload ───────────────────────────────────────────────────

  const handlePhotoFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Too large', description: 'Max 5 MB for profile photo.', variant: 'destructive' });
      return;
    }
    setPhotoUploading(true);
    try {
      const { data } = await providersAPI.uploadFile(file, 'profile.jpg');
      await save({ profile_image: data.url });
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload photo.', variant: 'destructive' });
    } finally {
      setPhotoUploading(false);
    }
  };

  // ── service toggle ─────────────────────────────────────────────────────────

  const toggleService = async (name: string) => {
    if (!profile) return;
    const current = profile.services_offered;
    const next    = current.includes(name) ? current.filter((s) => s !== name) : [...current, name];
    await save({ services_offered: next });
  };

  // ── certifications ─────────────────────────────────────────────────────────

  const addCert = async () => {
    if (!profile || !newCert.name.trim()) return;
    const next = [...profile.certifications, { ...newCert, name: newCert.name.trim() }];
    await save({ certifications: next });
    setNewCert({ name: '', issuer: '', year: '' });
    setAddingCert(false);
  };

  const removeCert = async (i: number) => {
    if (!profile) return;
    const next = profile.certifications.filter((_, idx) => idx !== i);
    await save({ certifications: next });
  };

  // ── document upload callbacks ──────────────────────────────────────────────

  const saveDoc = useCallback(async (key: keyof NonNullable<ProviderProfile['documents']>, url: string) => {
    if (!profile) return;
    const docs = { ...(profile.documents ?? {}), [key]: url };
    await save({ documents: docs });
  }, [profile, save]);

  // ── derived ────────────────────────────────────────────────────────────────

  const completeness = profile ? profileCompleteness(profile) : 0;
  const avatarUrl    = profile?.profile_image ?? user?.photoURL;
  const initials     = (profile?.name ?? 'P').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <ProviderLayout title="My Profile" subtitle={todaySubtitle()}>
        <div className="space-y-4">
          <div className="h-[260px] rounded-2xl bg-[#F5F4F2] animate-pulse" />
          <div className="h-[48px] rounded-xl bg-[#F5F4F2] animate-pulse" />
          <div className="h-[400px] rounded-2xl bg-[#F5F4F2] animate-pulse" />
        </div>
      </ProviderLayout>
    );
  }

  if (!profile) {
    return (
      <ProviderLayout title="My Profile" subtitle={todaySubtitle()}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-8 h-8 text-[#C84B31] mb-3" />
          <p className="text-[14px] font-semibold text-[#6B7280]">Could not load profile</p>
          <button onClick={loadAll} className="mt-3 text-[12px] text-[#C84B31] font-medium flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout title="My Profile" subtitle={todaySubtitle()}>

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <Card className="border border-[#EBEBEB] shadow-none bg-white overflow-hidden mb-5">
        {/* Gradient banner */}
        <div
          className="h-24 sm:h-28 relative"
          style={{ background: 'linear-gradient(135deg, #C84B31 0%, #E8703A 55%, #F2924A 100%)' }}
        >
          {/* Profile completeness bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white/70 transition-all duration-700"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="absolute bottom-2 right-3 text-[10px] text-white/60 font-medium">
            {completeness}% complete
          </p>
        </div>

        <CardContent className="px-4 sm:px-5 pb-5 -mt-5">
          <div className="flex items-end gap-4 mb-4">
            {/* Avatar with upload */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-[#C84B31] to-[#E8703A]">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-[20px]">
                    {initials}
                  </div>
                )}
                {photoUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => photoRef.current?.click()}
                disabled={photoUploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#C84B31] border-2 border-white flex items-center justify-center text-white hover:bg-[#B04028] transition-colors disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); e.target.value = ''; }}
              />
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-[17px] sm:text-[19px] text-[#1A1A1A] tracking-tight leading-tight">
                  {profile.name}
                </h2>
                {profile.is_approved && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                )}
                {!profile.is_approved && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full shrink-0">
                    Pending Approval
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <StarRating rating={profile.rating} size="sm" />
                <span className="text-[12px] font-bold text-[#1A1A1A]">{profile.rating.toFixed(1)}</span>
                <span className="text-[11px] text-[#9CA3AF]">({profile.total_jobs} jobs)</span>
              </div>
            </div>
          </div>

          {/* Contact chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { Icon: Phone,  value: profile.phone    ?? 'Not set' },
              { Icon: Mail,   value: profile.email    ?? 'Not set' },
              { Icon: MapPin, value: profile.location || 'Location not set', full: true },
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
        {([
          { key: 'info',      label: '👤 Profile'  },
          { key: 'services',  label: '🛠 Services'  },
          { key: 'documents', label: '📄 Documents' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 py-2 px-2 sm:px-3 rounded-lg text-[12px] font-semibold transition-all',
              activeTab === key ? 'bg-white text-[#C84B31] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tabs layout ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* ══ MAIN CONTENT ══════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* ── INFO TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'info' && (
            <>
              {/* Basic info */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 sm:p-5 divide-y divide-[#EBEBEB]">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider pb-4">Basic Information</p>
                  {[
                    { label: 'Full Name',      key: 'name',             type: 'text'  },
                    { label: 'Phone',          key: 'phone',            type: 'tel'   },
                    { label: 'Location',       key: 'location',         type: 'text'  },
                    { label: 'Experience (yrs)',key: 'experience_years', type: 'number'},
                    { label: 'Bio / About',    key: 'bio',              multiline: true },
                  ].map(({ label, key, type, multiline }) => (
                    <div key={key} className="py-4 last:pb-0">
                      <EditableField
                        label={label}
                        value={String((profile as any)[key] ?? '')}
                        onSave={async (v) => {
                          const val = key === 'experience_years' ? parseInt(v) || 0 : v;
                          await saveField(key, val);
                        }}
                        type={type}
                        multiline={multiline}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Read-only email */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Email (read-only)</p>
                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl">
                    <Mail className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                    <span className="text-[13px] text-[#6B7280]">{profile.email ?? '—'}</span>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] mt-1.5">Email is linked to your Google account and cannot be changed here.</p>
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Certifications</p>
                    <button
                      onClick={() => setAddingCert(true)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#C84B31]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  {profile.certifications.length === 0 && !addingCert && (
                    <p className="text-[12px] text-[#9CA3AF] text-center py-4">No certifications added yet</p>
                  )}

                  <div className="space-y-2.5">
                    {profile.certifications.map((cert, i) => (
                      <div key={i} className="flex items-start gap-3 px-3 py-2.5 bg-[#F5F4F2] rounded-xl border border-[#EBEBEB]">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center shrink-0 mt-0.5">
                          <Award className="w-4 h-4 text-[#C84B31]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#1A1A1A] leading-tight">{cert.name}</p>
                          {cert.issuer && <p className="text-[11px] text-[#6B7280] mt-0.5">{cert.issuer}</p>}
                          {cert.year   && <p className="text-[10px] text-[#9CA3AF] mt-0.5">{cert.year}</p>}
                        </div>
                        <button
                          onClick={() => removeCert(i)}
                          className="text-[#9CA3AF] hover:text-red-500 transition-colors shrink-0 mt-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {addingCert && (
                    <div className="mt-3 space-y-2 border border-[#FDDDD5] bg-[#FFF8F6] rounded-xl p-3">
                      <input
                        autoFocus
                        placeholder="Certificate name *"
                        value={newCert.name}
                        onChange={(e) => setNewCert((p) => ({ ...p, name: e.target.value }))}
                        className="w-full text-[12px] bg-white border border-[#EBEBEB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C84B31]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Issuer (optional)"
                          value={newCert.issuer}
                          onChange={(e) => setNewCert((p) => ({ ...p, issuer: e.target.value }))}
                          className="w-full text-[12px] bg-white border border-[#EBEBEB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C84B31]"
                        />
                        <input
                          placeholder="Year (optional)"
                          value={newCert.year}
                          onChange={(e) => setNewCert((p) => ({ ...p, year: e.target.value }))}
                          className="w-full text-[12px] bg-white border border-[#EBEBEB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C84B31]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addCert}
                          className="flex-1 h-8 bg-[#C84B31] text-white text-[12px] font-semibold rounded-lg hover:bg-[#B04028]"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setAddingCert(false); setNewCert({ name: '', issuer: '', year: '' }); }}
                          className="flex-1 h-8 bg-[#F5F4F2] border border-[#EBEBEB] text-[#6B7280] text-[12px] font-semibold rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* ── SERVICES TAB ─────────────────────────────────────────────── */}
          {activeTab === 'services' && (
            <Card className="border border-[#EBEBEB] shadow-none bg-white">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Platform Services</p>
                  <span className="text-[11px] font-semibold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-2 py-0.5 rounded-full">
                    {profile.services_offered.length} selected
                  </span>
                </div>
                <p className="text-[11px] text-[#9CA3AF] mb-4">
                  Tap a service to toggle whether you offer it. Changes are saved immediately.
                </p>

                {allServices.length === 0 ? (
                  <p className="text-[12px] text-[#9CA3AF] text-center py-8">Loading services…</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allServices.map((svc) => {
                      const selected = profile.services_offered.includes(svc.name);
                      return (
                        <button
                          key={svc.id}
                          onClick={() => toggleService(svc.name)}
                          className={cn(
                            'flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-full border transition-all active:scale-95',
                            selected
                              ? 'bg-[#C84B31] border-[#C84B31] text-white shadow-sm'
                              : 'bg-white border-[#EBEBEB] text-[#6B7280] hover:border-[#FDDDD5] hover:bg-[#FFF8F6]',
                          )}
                        >
                          {selected && <Check className="w-3 h-3 flex-shrink-0" />}
                          {svc.name}
                          {svc.discounted_price
                            ? <span className={cn('text-[10px] font-medium', selected ? 'text-white/70' : 'text-[#9CA3AF]')}>₹{svc.discounted_price}</span>
                            : <span className={cn('text-[10px] font-medium', selected ? 'text-white/70' : 'text-[#9CA3AF]')}>₹{svc.base_price}</span>
                          }
                        </button>
                      );
                    })}
                  </div>
                )}

                {profile.services_offered.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[#EBEBEB]">
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Currently Offering</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.services_offered.map((s) => (
                        <span key={s} className="text-[11px] font-semibold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-2.5 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── DOCUMENTS TAB ────────────────────────────────────────────── */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-700 leading-relaxed">
                  Documents are required for account verification. Upload clear photos or scanned copies. 
                  They are stored securely and only reviewed by the AmaraGo team.
                </p>
              </div>

              <DocUploadSlot
                label="Aadhar Card"
                icon={ShieldCheck}
                existingUrl={profile.documents?.aadhar_url}
                storagePath="docs/aadhar"
                onUploaded={(url) => saveDoc('aadhar_url', url)}
              />

              <DocUploadSlot
                label="PAN Card"
                icon={FileText}
                existingUrl={profile.documents?.pan_url}
                storagePath="docs/pan"
                onUploaded={(url) => saveDoc('pan_url', url)}
              />

              <Card className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center shrink-0">
                        <Award className="w-3.5 h-3.5 text-[#C84B31]" />
                      </div>
                      <p className="text-[12px] font-semibold text-[#1A1A1A]">Certification Documents</p>
                    </div>
                    {(profile.documents?.certification_docs ?? []).length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> {profile.documents!.certification_docs!.length} uploaded
                      </span>
                    )}
                  </div>

                  {/* Existing cert docs */}
                  {(profile.documents?.certification_docs ?? []).length > 0 && (
                    <div className="space-y-2 mb-3">
                      {profile.documents!.certification_docs!.map((url, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#F5F4F2] rounded-xl border border-[#EBEBEB]">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-[#C84B31] font-medium hover:underline truncate">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            Certification {i + 1}
                          </a>
                          <button
                            onClick={async () => {
                              const next = profile.documents!.certification_docs!.filter((_, idx) => idx !== i);
                              await save({ documents: { ...profile.documents, certification_docs: next } });
                            }}
                            className="text-[#9CA3AF] hover:text-red-500 transition-colors shrink-0 ml-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload new cert doc */}
                  <DocUploadSlot
                    label=""
                    icon={Upload}
                    storagePath={`docs/cert_${Date.now()}`}
                    onUploaded={async (url) => {
                      const current = profile.documents?.certification_docs ?? [];
                      await save({ documents: { ...profile.documents, certification_docs: [...current, url] } });
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ══ RIGHT SIDEBAR ══════════════════════════════════════════════════ */}
        <div className="space-y-4 lg:sticky lg:top-[73px]">

          {/* Profile completeness */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Profile Completeness</p>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="relative w-14 h-14 shrink-0"
                  style={{
                    background: `conic-gradient(#C84B31 ${completeness * 3.6}deg, #F5F4F2 0deg)`,
                    borderRadius: '50%',
                  }}
                >
                  <div className="absolute inset-1.5 bg-white rounded-full flex items-center justify-center">
                    <span className="text-[13px] font-bold text-[#C84B31]">{completeness}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1A1A1A]">
                    {completeness < 50 ? 'Getting started' : completeness < 80 ? 'Looking good' : 'Almost perfect!'}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    {completeness < 80 ? 'Complete your profile to get more bookings' : 'Great profile!'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { label: 'Photo',         done: !!profile.profile_image         },
                  { label: 'Bio',           done: profile.bio.length > 20         },
                  { label: 'Phone',         done: !!profile.phone                 },
                  { label: 'Location',      done: !!profile.location              },
                  { label: 'Services',      done: profile.services_offered.length > 0 },
                  { label: 'Certification', done: profile.certifications.length > 0  },
                  { label: 'Aadhar',        done: !!profile.documents?.aadhar_url },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0', done ? 'bg-emerald-100' : 'bg-[#F5F4F2]')}>
                      {done
                        ? <Check className="w-2.5 h-2.5 text-emerald-600" />
                        : <div className="w-1.5 h-1.5 rounded-full bg-[#EBEBEB]" />
                      }
                    </div>
                    <span className={cn('text-[12px]', done ? 'text-[#1A1A1A] font-medium' : 'text-[#9CA3AF]')}>{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Stats</p>
              <div className="space-y-2">
                {[
                  { label: 'Rating',         value: profile.rating ? profile.rating.toFixed(1) + ' ★' : 'No ratings yet' },
                  { label: 'Jobs Done',      value: String(profile.total_jobs)                                           },
                  { label: 'Experience',     value: profile.experience_years ? `${profile.experience_years} yr${profile.experience_years !== 1 ? 's' : ''}` : 'Not set' },
                  { label: 'Services',       value: String(profile.services_offered.length)                              },
                  { label: 'Commission',     value: `${profile.commission_rate}%`                                        },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#F5F4F2] last:border-0">
                    <span className="text-[12px] text-[#6B7280]">{label}</span>
                    <span className="text-[12px] font-bold text-[#1A1A1A]">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Refresh */}
          <button
            onClick={loadAll}
            className="w-full flex items-center justify-center gap-1.5 h-9 bg-[#F5F4F2] border border-[#EBEBEB] text-[#6B7280] text-[12px] font-semibold rounded-xl hover:bg-[#EBEBEB] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Profile
          </button>
        </div>
      </div>

    </ProviderLayout>
  );
}

