'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Check, X, Star, MapPin, Phone,
  ChevronRight, TrendingUp, TrendingDown, Users,
  BadgeCheck, Clock, Briefcase, AlertTriangle,
  MoreHorizontal, Eye, Ban, RefreshCw, Download,
  SlidersHorizontal, IndianRupee,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import AdminLayout from '../_components/AdminLayout';
import { providersAPI, type ProviderProfile } from '@/lib/api';

// ─── Design tokens ─────────────────────────────────────────────────────────
// Primary #C84B31  Tint #FFF0EC/#FDDDD5  Page #F5F4F2
// Border #EBEBEB  Text-1 #1A1A1A  Text-2 #6B7280  Text-3 #9CA3AF

// ─── Types ──────────────────────────────────────────────────────────────────

type SPStatus = 'active' | 'pending' | 'suspended' | 'inactive';
type TabKey   = 'all' | 'active' | 'pending' | 'suspended' | 'top';

interface ServiceProvider {
  id: string;
  name: string;
  emoji: string;
  phone: string;
  location: string;
  experience: string;
  specialties: string[];
  rating: number;
  reviews: number;
  jobsCompleted: number;
  jobsThisMonth: number;
  earningsTotal: number;
  earningsThisMonth: number;
  responseRate: number;
  completionRate: number;
  status: SPStatus;
  joinedAt: string;
  lastActive: string;
  isOnline: boolean;
}

// ─── API → local shape mapper ─────────────────────────────────────────────────

function mapProvider(p: ProviderProfile): ServiceProvider {
  return {
    id:               p.uid,
    name:             p.name,
    emoji:            '✨',
    phone:            p.phone ?? '',
    location:         p.location ?? '',
    experience:       p.experience_years ? `${p.experience_years} years` : '—',
    specialties:      p.services_offered ?? [],
    rating:           p.rating ?? 0,
    reviews:          0,
    jobsCompleted:    p.total_jobs ?? 0,
    jobsThisMonth:    0,
    earningsTotal:    0,
    earningsThisMonth: 0,
    responseRate:     0,
    completionRate:   0,
    status:           p.is_approved ? 'active' : 'pending',
    joinedAt:         p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—',
    lastActive:       p.is_online ? 'Online now' : '—',
    isOnline:         p.is_online ?? false,
  };
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SPStatus, { label: string; dot: string; bg: string; border: string; text: string }> = {
  active:    { label: 'Active',     dot: 'bg-green-500',   bg: 'bg-green-50',   border: 'border-green-100',   text: 'text-green-700'  },
  pending:   { label: 'Pending',    dot: 'bg-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-700'  },
  suspended: { label: 'Suspended',  dot: 'bg-red-500',     bg: 'bg-red-50',     border: 'border-red-100',     text: 'text-red-600'    },
  inactive:  { label: 'Inactive',   dot: 'bg-[#9CA3AF]',  bg: 'bg-[#F5F4F2]', border: 'border-[#EBEBEB]',   text: 'text-[#9CA3AF]' },
};

const TABS: { key: TabKey; label: string; color?: string }[] = [
  { key: 'all',       label: 'All Providers' },
  { key: 'active',    label: 'Active'        },
  { key: 'pending',   label: 'Pending'       },
  { key: 'suspended', label: 'Suspended'     },
  { key: 'top',       label: '⭐ Top Rated'  },
];

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({
  sp, onApprove, onReject, onSuspend, onReactivate, onView,
}: {
  sp: ServiceProvider;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSuspend: (id: string) => void;
  onReactivate: (id: string) => void;
  onView: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sc = STATUS_CONFIG[sp.status];

  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white hover:border-[#FDDDD5] hover:shadow-sm transition-all group">
      <CardContent className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar with online dot */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center text-xl select-none">
              {sp.emoji}
            </div>
            {sp.isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[14px] text-[#1A1A1A]">{sp.name}</h3>
              {sp.status === 'active' && sp.rating >= 4.8 && (
                <span className="text-[9px] font-bold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-1.5 py-0.5 rounded-full">
                  TOP RATED
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <MapPin className="w-3 h-3 text-[#9CA3AF] shrink-0" />
              <span className="text-[11px] text-[#9CA3AF] truncate">{sp.location}</span>
              <span className="text-[#EBEBEB]">·</span>
              <span className="text-[11px] text-[#9CA3AF]">{sp.experience}</span>
            </div>
          </div>

          {/* Status + menu */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', sc.bg, sc.border, sc.text)}>
              {sc.label}
            </span>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((p) => !p)}
                className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#EBEBEB] transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-9 w-40 bg-white border border-[#EBEBEB] rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    <button onClick={() => { onView(sp.id); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                      <Eye className="w-3.5 h-3.5 text-[#9CA3AF]" /> View Profile
                    </button>
                    {sp.status === 'active' && (
                      <button onClick={() => { onSuspend(sp.id); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50">
                        <Ban className="w-3.5 h-3.5" /> Suspend
                      </button>
                    )}
                    {(sp.status === 'suspended' || sp.status === 'inactive') && (
                      <button onClick={() => { onReactivate(sp.id); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-green-600 hover:bg-green-50">
                        <RefreshCw className="w-3.5 h-3.5" /> Reactivate
                      </button>
                    )}
                    <button onClick={() => { setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                      <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" /> Call
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {sp.specialties.slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] font-semibold text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-0.5 rounded-full">
              {s}
            </span>
          ))}
          {sp.specialties.length > 3 && (
            <span className="text-[10px] font-semibold text-[#9CA3AF] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-0.5 rounded-full">
              +{sp.specialties.length - 3}
            </span>
          )}
        </div>

        {/* Stats grid — only for non-pending */}
        {sp.status !== 'pending' ? (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Rating',    value: sp.rating ? `${sp.rating}★` : '—', color: 'text-amber-500' },
              { label: 'Jobs',      value: sp.jobsCompleted.toString(),        color: 'text-blue-500'  },
              { label: 'Response',  value: `${sp.responseRate}%`,              color: 'text-[#C84B31]' },
              { label: 'Earnings',  value: `₹${(sp.earningsThisMonth / 1000).toFixed(0)}K`, color: 'text-green-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#F5F4F2] rounded-xl px-2 py-2 text-center border border-[#EBEBEB]">
                <p className={cn('font-bold text-[13px] leading-none', color)}>{value}</p>
                <p className="text-[9px] text-[#9CA3AF] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Pending: show applied time + phone */
          <div className="flex items-center gap-3 mb-4 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-amber-700">Applied {sp.joinedAt}</p>
              <p className="text-[10px] text-amber-600 mt-0.5">{sp.phone}</p>
            </div>
          </div>
        )}

        {/* Last active */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-[#9CA3AF]">
            {sp.isOnline ? (
              <span className="flex items-center gap-1 text-green-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online now
              </span>
            ) : (
              `Last active: ${sp.lastActive}`
            )}
          </span>
          <span className="text-[10px] text-[#9CA3AF]">Joined {sp.joinedAt}</span>
        </div>

        {/* CTAs */}
        {sp.status === 'pending' ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-9 bg-[#C84B31] hover:bg-[#B04028] text-white font-semibold text-[12px] rounded-xl shadow-none border-0"
              onClick={() => onApprove(sp.id)}
            >
              <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
            </Button>
            <Button
              variant="outline"
              className="h-9 border-[#EBEBEB] text-[#6B7280] hover:bg-red-50 hover:border-red-200 hover:text-red-500 font-semibold text-[12px] rounded-xl shadow-none"
              onClick={() => onReject(sp.id)}
            >
              <X className="w-3.5 h-3.5 mr-1.5" /> Reject
            </Button>
          </div>
        ) : (
          <button
            onClick={() => onView(sp.id)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl hover:bg-[#FFF0EC] hover:border-[#FDDDD5] transition-colors group"
          >
            <span className="text-[12px] font-semibold text-[#6B7280] group-hover:text-[#C84B31] transition-colors">View Full Profile</span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#C84B31] group-hover:translate-x-0.5 transition-all" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-[15px] font-bold text-[#1A1A1A]">{label}</p>
      <p className="text-[12px] text-[#9CA3AF] mt-1">{sub}</p>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AdminServiceProviders() {
  const router   = useRouter();
  const { toast } = useToast();

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState<'rating' | 'jobs' | 'earnings' | 'recent'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  useEffect(() => {
    providersAPI.list().then(({ data }) => setProviders(data.map(mapProvider))).catch(() => {});
  }, []);

  // Counts per tab
  const counts: Record<TabKey, number> = useMemo(() => ({
    all:       providers.length,
    active:    providers.filter((p) => p.status === 'active').length,
    pending:   providers.filter((p) => p.status === 'pending').length,
    suspended: providers.filter((p) => p.status === 'suspended').length,
    top:       providers.filter((p) => p.status === 'active' && p.rating >= 4.7).length,
  }), [providers]);

  // All unique specialties
  const allSpecialties = useMemo(() => {
    const s = new Set<string>();
    providers.forEach((p) => p.specialties.forEach((sp) => s.add(sp)));
    return ['All', ...Array.from(s)];
  }, [providers]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = providers.filter((p) => {
      const matchTab =
        activeTab === 'all'       ? true :
        activeTab === 'top'       ? (p.status === 'active' && p.rating >= 4.7) :
        p.status === activeTab;
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase()) ||
        p.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase()));
      const matchSpecialty =
        selectedSpecialty === 'All' || p.specialties.includes(selectedSpecialty);
      return matchTab && matchSearch && matchSpecialty;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'rating')   return b.rating - a.rating;
      if (sortBy === 'jobs')     return b.jobsCompleted - a.jobsCompleted;
      if (sortBy === 'earnings') return b.earningsTotal - a.earningsTotal;
      return 0; // recent — keep original order
    });

    return list;
  }, [providers, activeTab, search, selectedSpecialty, sortBy]);

  // Actions
  const handleApprove = async (id: string) => {
    const sp = providers.find((p) => p.id === id);
    try {
      await providersAPI.setApproval(id, true);
      setProviders((prev) => prev.map((p) => p.id === id ? { ...p, status: 'active', joinedAt: 'Just now' } : p));
      toast({ title: `${sp?.name} approved ✓`, description: 'Provider is now active.' });
    } catch {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    const sp = providers.find((p) => p.id === id);
    try {
      await providersAPI.setApproval(id, false);
      setProviders((prev) => prev.filter((p) => p.id !== id));
      toast({ title: `${sp?.name} rejected`, description: 'Application has been declined.' });
    } catch {
      toast({ title: 'Failed to reject', variant: 'destructive' });
    }
  };

  const handleSuspend = (id: string) => {
    const sp = providers.find((p) => p.id === id);
    setProviders((prev) => prev.map((p) => p.id === id ? { ...p, status: 'suspended', isOnline: false } : p));
    toast({ title: `${sp?.name} suspended`, description: 'Provider has been suspended.' });
  };

  const handleReactivate = (id: string) => {
    const sp = providers.find((p) => p.id === id);
    setProviders((prev) => prev.map((p) => p.id === id ? { ...p, status: 'active' } : p));
    toast({ title: `${sp?.name} reactivated ✓`, description: 'Provider is active again.' });
  };

  const handleView = (id: string) => router.push(`/admin/providers/${id}`);

  // Summary stats
  const totalEarnings     = providers.filter((p) => p.status === 'active').reduce((s, p) => s + p.earningsThisMonth, 0);
  const avgRating         = providers.filter((p) => p.rating > 0).reduce((s, p, _, a) => s + p.rating / a.length, 0);
  const onlineCount       = providers.filter((p) => p.isOnline).length;

  return (
    <AdminLayout
      title="Service Providers"
      subtitle="Manage, review and monitor all providers"
      topBarRight={
        <Button
          className="h-9 px-4 bg-[#C84B31] hover:bg-[#B04028] text-white font-semibold text-[13px] rounded-xl shadow-none border-0"
          onClick={() => router.push('/admin/providers/invite')}
        >
          + Invite Provider
        </Button>
      }
    >

      {/* ── Summary strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Providers', value: providers.length, Icon: Users,        color: 'text-[#C84B31]', bg: 'bg-[#FFF0EC]', border: 'border-[#FDDDD5]' },
          { label: 'Online Now',      value: onlineCount,      Icon: BadgeCheck,   color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-100' },
          { label: 'Avg Rating',      value: `${avgRating.toFixed(1)}★`, Icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'MTD Earnings',    value: `₹${(totalEarnings / 1000).toFixed(0)}K`, Icon: IndianRupee, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
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

      {/* ── Search + filter bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location or specialty…"
            className="w-full pl-10 pr-4 h-10 text-[13px] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31]/20 text-[#1A1A1A] placeholder:text-[#9CA3AF]"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-10 px-3 text-[12px] font-semibold text-[#6B7280] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] cursor-pointer"
        >
          <option value="recent">Sort: Recent</option>
          <option value="rating">Sort: Rating</option>
          <option value="jobs">Sort: Jobs Done</option>
          <option value="earnings">Sort: Earnings</option>
        </select>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((p) => !p)}
          className={cn(
            'h-10 px-4 flex items-center gap-2 rounded-xl border text-[12px] font-semibold transition-colors',
            showFilters ? 'bg-[#FFF0EC] border-[#FDDDD5] text-[#C84B31]' : 'bg-white border-[#EBEBEB] text-[#6B7280] hover:bg-[#F5F4F2]',
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
        </button>

        {/* Export */}
        <button className="h-10 px-4 flex items-center gap-2 rounded-xl border border-[#EBEBEB] bg-white text-[12px] font-semibold text-[#6B7280] hover:bg-[#F5F4F2] transition-colors">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* ── Specialty filter chips ───────────────────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white border border-[#EBEBEB] rounded-xl">
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider self-center mr-1">Specialty:</p>
          {allSpecialties.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSpecialty(s)}
              className={cn(
                'text-[11px] font-semibold px-3 py-1 rounded-full border transition-all',
                selectedSpecialty === s
                  ? 'bg-[#C84B31] border-[#C84B31] text-white'
                  : 'bg-[#F5F4F2] border-[#EBEBEB] text-[#6B7280] hover:border-[#C84B31] hover:text-[#C84B31]',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl mb-5 overflow-x-auto no-scrollbar">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 py-2 px-3 sm:px-4 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap',
              activeTab === key ? 'bg-white text-[#C84B31] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]',
            )}
          >
            {label}
            {counts[key] > 0 && (
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                activeTab === key ? 'bg-[#FFF0EC] text-[#C84B31]' : 'bg-[#EBEBEB] text-[#9CA3AF]',
              )}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Pending alert banner ─────────────────────────────────────────────── */}
      {counts.pending > 0 && activeTab !== 'pending' && (
        <button
          onClick={() => setActiveTab('pending')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 hover:bg-amber-100 transition-colors group"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[12px] font-semibold text-amber-700 flex-1 text-left">
            {counts.pending} provider{counts.pending > 1 ? 's' : ''} waiting for approval
          </p>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* ── Grid ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={activeTab === 'pending' ? '📭' : activeTab === 'suspended' ? '🚫' : '🔍'}
            label={search ? 'No results found' : `No ${activeTab === 'all' ? '' : activeTab} providers`}
            sub={search ? 'Try a different search term' : 'Nothing here right now'}
          />
        ) : (
          filtered.map((sp) => (
            <ProviderCard
              key={sp.id}
              sp={sp}
              onApprove={handleApprove}
              onReject={handleReject}
              onSuspend={handleSuspend}
              onReactivate={handleReactivate}
              onView={handleView}
            />
          ))
        )}
      </div>

      {/* ── Results count ─────────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <p className="text-center text-[11px] text-[#9CA3AF] mt-6">
          Showing {filtered.length} of {providers.length} providers
        </p>
      )}

    </AdminLayout>
  );
}