'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, MapPin, Phone, Mail, Star, Briefcase,
  CheckCircle, Ban, RefreshCw, UserCheck, Shield,
  Percent, Calendar, Clock, FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import AdminLayout from '../../_components/AdminLayout';
import { providersAPI, type ProviderProfile } from '@/lib/api';

// ─── Status helpers ───────────────────────────────────────────────────────────

function getStatus(p: ProviderProfile): { label: string; bg: string; text: string; border: string } {
  if (p.is_suspended) return { label: 'Suspended', bg: 'bg-red-50',   text: 'text-red-600',   border: 'border-red-100'   };
  if (p.is_approved)  return { label: 'Active',    bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' };
  return                     { label: 'Pending',   bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' };
}

function relativeTime(iso?: string) {
  if (!iso) return '—';
  try {
    const d = Date.now() - new Date(iso).getTime();
    const m = Math.floor(d/60000), h = Math.floor(d/3600000), days = Math.floor(d/86400000);
    if (m < 2) return 'just now'; if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`; if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProviderDetailPage() {
  const router    = useRouter();
  const params    = useParams();
  const uid       = params.id as string;
  const { toast } = useToast();

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    providersAPI.getById(uid)
      .then(({ data }) => setProvider(data))
      .catch(() => toast({ title: 'Failed to load provider', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [uid]);

  const handleApprove = async () => {
    if (!provider || actioning) return;
    setActioning(true);
    try {
      await providersAPI.setApproval(uid, true);
      setProvider((p) => p ? { ...p, is_approved: true } : p);
      toast({ title: `${provider.name} approved ✓` });
    } catch { toast({ title: 'Failed to approve', variant: 'destructive' }); }
    finally { setActioning(false); }
  };

  const handleReject = async () => {
    if (!provider || actioning) return;
    setActioning(true);
    try {
      await providersAPI.setApproval(uid, false);
      setProvider((p) => p ? { ...p, is_approved: false } : p);
      toast({ title: `${provider.name} rejected` });
    } catch { toast({ title: 'Failed to reject', variant: 'destructive' }); }
    finally { setActioning(false); }
  };

  const handleSuspend = async () => {
    if (!provider || actioning) return;
    setActioning(true);
    try {
      await providersAPI.suspend(uid, true);
      setProvider((p) => p ? { ...p, is_suspended: true, is_online: false } : p);
      toast({ title: `${provider.name} suspended` });
    } catch { toast({ title: 'Failed to suspend', variant: 'destructive' }); }
    finally { setActioning(false); }
  };

  const handleReactivate = async () => {
    if (!provider || actioning) return;
    setActioning(true);
    try {
      await providersAPI.suspend(uid, false);
      setProvider((p) => p ? { ...p, is_suspended: false } : p);
      toast({ title: `${provider.name} reactivated ✓` });
    } catch { toast({ title: 'Failed to reactivate', variant: 'destructive' }); }
    finally { setActioning(false); }
  };

  if (loading) {
    return (
      <AdminLayout title="Provider Profile" subtitle="Loading…" topBarRight={
        <button onClick={() => router.back()} className="h-9 px-4 flex items-center gap-2 rounded-xl border border-[#EBEBEB] bg-white text-[13px] font-semibold text-[#6B7280] hover:bg-[#F5F4F2]">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      }>
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-white border border-[#EBEBEB] rounded-2xl p-6 animate-pulse">
              <div className="h-4 w-48 bg-[#F5F4F2] rounded mb-3" />
              <div className="h-3 w-32 bg-[#F5F4F2] rounded" />
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  if (!provider) {
    return (
      <AdminLayout title="Provider Profile" subtitle="Not found" topBarRight={
        <button onClick={() => router.back()} className="h-9 px-4 flex items-center gap-2 rounded-xl border border-[#EBEBEB] bg-white text-[13px] font-semibold text-[#6B7280] hover:bg-[#F5F4F2]">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      }>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-[15px] font-bold text-[#1A1A1A]">Provider not found</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">This provider may have been removed.</p>
        </div>
      </AdminLayout>
    );
  }

  const sc = getStatus(provider);
  const initials = provider.name.split(' ').map((n) => n[0]).join('').slice(0,2).toUpperCase();

  return (
    <AdminLayout
      title={provider.name}
      subtitle={`${sc.label} · Joined ${provider.created_at ? new Date(provider.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}`}
      topBarRight={
        <button onClick={() => router.back()} className="h-9 px-4 flex items-center gap-2 rounded-xl border border-[#EBEBEB] bg-white text-[13px] font-semibold text-[#6B7280] hover:bg-[#F5F4F2]">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5 items-start">

        {/* ── LEFT ─────────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Profile header */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#FFF0EC] border-2 border-[#FDDDD5] flex items-center justify-center">
                    {provider.profile_image
                      ? <img src={provider.profile_image} alt={provider.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      : <span className="text-[26px] font-bold text-[#C84B31]">{initials}</span>}
                  </div>
                  {provider.is_online && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-bold text-[20px] text-[#1A1A1A]">{provider.name}</h2>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', sc.bg, sc.border, sc.text)}>
                      {sc.label}
                    </span>
                    {provider.is_approved && provider.rating >= 4.8 && (
                      <span className="text-[10px] font-bold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-2 py-0.5 rounded-full">TOP RATED</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[12px] text-[#6B7280]">
                    {provider.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{provider.email}</span>}
                    {provider.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{provider.phone}</span>}
                    {provider.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{provider.location}</span>}
                  </div>
                  <p className="text-[12px] text-[#9CA3AF] mt-1">
                    {provider.is_online ? (
                      <span className="flex items-center gap-1 text-green-600 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online now
                      </span>
                    ) : `Last seen ${relativeTime(provider.last_seen_at)}`}
                  </p>
                </div>
              </div>

              {provider.bio && (
                <p className="mt-4 pt-4 border-t border-[#EBEBEB] text-[13px] text-[#6B7280] leading-relaxed">{provider.bio}</p>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Rating',      value: provider.rating ? `${provider.rating}★` : '—', Icon: Star,    color: 'text-amber-500', bg: 'bg-amber-50',  border: 'border-amber-100' },
              { label: 'Jobs Done',   value: String(provider.total_jobs ?? 0),              Icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50',   border: 'border-blue-100' },
              { label: 'Commission',  value: `${provider.commission_rate ?? 15}%`,          Icon: Percent,  color: 'text-[#C84B31]', bg: 'bg-[#FFF0EC]', border: 'border-[#FDDDD5]' },
              { label: 'Experience',  value: provider.experience_years ? `${provider.experience_years} yrs` : '—', Icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
            ].map(({ label, value, Icon, color, bg, border }) => (
              <Card key={label} className="border border-[#EBEBEB] shadow-none bg-white">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border shrink-0', bg, border)}>
                    <Icon className={cn('w-4 h-4', color)} />
                  </div>
                  <div>
                    <p className={cn('font-bold text-[18px] leading-none', color)}>{value}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Services offered */}
          {provider.services_offered && provider.services_offered.length > 0 && (
            <Card className="border border-[#EBEBEB] shadow-none bg-white">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Services Offered</p>
                <div className="flex flex-wrap gap-2">
                  {provider.services_offered.map((s) => (
                    <span key={s} className="text-[12px] font-semibold text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-3 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {provider.documents && (
            <Card className="border border-[#EBEBEB] shadow-none bg-white">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Documents</p>
                <div className="space-y-2">
                  {[
                    { label: 'Aadhar Card', url: provider.documents.aadhar_url },
                    { label: 'PAN Card',    url: provider.documents.pan_url    },
                  ].map(({ label, url }) => url && (
                    <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl hover:bg-[#FFF0EC] hover:border-[#FDDDD5] transition-colors group">
                      <FileText className="w-4 h-4 text-[#C84B31] shrink-0" />
                      <span className="text-[13px] font-semibold text-[#1A1A1A] group-hover:text-[#C84B31] flex-1">{label}</span>
                      <span className="text-[10px] text-[#9CA3AF] bg-green-50 border border-green-100 px-2 py-0.5 rounded-full text-green-600">Uploaded</span>
                    </a>
                  ))}
                  {provider.documents.certification_docs?.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl hover:bg-[#FFF0EC] hover:border-[#FDDDD5] transition-colors group">
                      <FileText className="w-4 h-4 text-[#C84B31] shrink-0" />
                      <span className="text-[13px] font-semibold text-[#1A1A1A] group-hover:text-[#C84B31] flex-1">Certificate {i + 1}</span>
                      <span className="text-[10px] text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">Uploaded</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* ── RIGHT (sticky action panel) ───────────────────────────────────── */}
        <div className="flex flex-col gap-4 md:sticky md:top-[73px]">

          {/* Contact */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5 space-y-3">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Contact</p>
              {provider.phone && (
                <a href={`tel:${provider.phone}`}
                  className="flex items-center gap-3 px-3 py-2.5 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl hover:bg-[#FFF0EC] hover:border-[#FDDDD5] transition-colors">
                  <Phone className="w-4 h-4 text-[#C84B31]" />
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">{provider.phone}</span>
                </a>
              )}
              {provider.email && (
                <a href={`mailto:${provider.email}`}
                  className="flex items-center gap-3 px-3 py-2.5 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl hover:bg-[#FFF0EC] hover:border-[#FDDDD5] transition-colors">
                  <Mail className="w-4 h-4 text-[#C84B31]" />
                  <span className="text-[13px] font-semibold text-[#1A1A1A] truncate">{provider.email}</span>
                </a>
              )}
              {provider.location && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl">
                  <MapPin className="w-4 h-4 text-[#C84B31]" />
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">{provider.location}</span>
                </div>
              )}
              {provider.service_radius_km && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl">
                  <Shield className="w-4 h-4 text-[#C84B31]" />
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">Service radius: {provider.service_radius_km} km</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account info */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Account</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Joined',      value: provider.created_at ? new Date(provider.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                  { label: 'Last Seen',   value: relativeTime(provider.last_seen_at) },
                  { label: 'Commission',  value: `${provider.commission_rate ?? 15}%` },
                  { label: 'Provider ID', value: provider.uid.slice(0, 10) + '…' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[12px] text-[#9CA3AF]">{label}</span>
                    <span className="text-[12px] font-semibold text-[#1A1A1A]">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-5 space-y-2.5">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Actions</p>

              {!provider.is_approved && !provider.is_suspended && (
                <Button className="w-full h-10 bg-[#C84B31] hover:bg-[#B04028] text-white font-semibold text-[13px] rounded-xl shadow-none border-0"
                  onClick={handleApprove} disabled={actioning}>
                  <UserCheck className="w-4 h-4 mr-2" /> Approve Provider
                </Button>
              )}

              {!provider.is_approved && !provider.is_suspended && (
                <Button variant="outline" className="w-full h-10 border-[#EBEBEB] text-[#6B7280] hover:bg-red-50 hover:border-red-200 hover:text-red-500 font-semibold text-[13px] rounded-xl shadow-none"
                  onClick={handleReject} disabled={actioning}>
                  <Ban className="w-4 h-4 mr-2" /> Reject Application
                </Button>
              )}

              {provider.is_approved && !provider.is_suspended && (
                <Button variant="outline" className="w-full h-10 border-[#EBEBEB] text-red-600 hover:bg-red-50 hover:border-red-200 font-semibold text-[13px] rounded-xl shadow-none"
                  onClick={handleSuspend} disabled={actioning}>
                  <Ban className="w-4 h-4 mr-2" /> Suspend Provider
                </Button>
              )}

              {provider.is_suspended && (
                <Button className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-semibold text-[13px] rounded-xl shadow-none border-0"
                  onClick={handleReactivate} disabled={actioning}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Reactivate Provider
                </Button>
              )}

              {provider.phone && (
                <a href={`tel:${provider.phone}`}
                  className="w-full h-10 flex items-center justify-center gap-2 border border-[#EBEBEB] rounded-xl text-[13px] font-semibold text-[#6B7280] hover:bg-[#F5F4F2] transition-colors">
                  <Phone className="w-4 h-4" /> Call Provider
                </a>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </AdminLayout>
  );
}
