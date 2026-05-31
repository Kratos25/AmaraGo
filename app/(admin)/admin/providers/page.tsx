'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Check, X, Star, MapPin, Phone,
  ChevronRight, Users, BadgeCheck, Clock, AlertTriangle,
  MoreHorizontal, Eye, Ban, RefreshCw, Download,
  SlidersHorizontal, AlertCircle, Percent,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import AdminLayout from '../_components/AdminLayout';
import { providersAPI, type ProviderProfile } from '@/lib/api';
import { Suspense } from 'react';
import { exportToExcel } from '@/lib/exportExcel';

type SPStatus = 'active' | 'pending' | 'suspended';
type TabKey   = 'all' | 'active' | 'pending' | 'suspended' | 'top';

interface SP {
  id: string; name: string; profileImage: string | null; phone: string;
  location: string; experience: string; specialties: string[]; rating: number;
  jobsCompleted: number; commissionRate: number; status: SPStatus;
  joinedAt: string; lastActive: string; isOnline: boolean;
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

function mapSP(p: ProviderProfile): SP {
  const status: SPStatus = p.is_suspended ? 'suspended' : p.is_approved ? 'active' : 'pending';
  return {
    id: p.uid, name: p.name, profileImage: p.profile_image ?? null, phone: p.phone ?? '',
    location: p.location ?? '', experience: p.experience_years ? `${p.experience_years} yrs` : '—',
    specialties: p.services_offered ?? [], rating: p.rating ?? 0, jobsCompleted: p.total_jobs ?? 0,
    commissionRate: p.commission_rate ?? 15, status,
    joinedAt: p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—',
    lastActive: p.is_online ? 'Online now' : relativeTime(p.last_seen_at),
    isOnline: p.is_online ?? false,
  };
}

const SC: Record<SPStatus, { label: string; bg: string; border: string; text: string }> = {
  active:    { label: 'Active',    bg: 'bg-green-50',   border: 'border-green-100',   text: 'text-green-700'  },
  pending:   { label: 'Pending',   bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-700'  },
  suspended: { label: 'Suspended', bg: 'bg-red-50',     border: 'border-red-100',     text: 'text-red-600'    },
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' }, { key: 'suspended', label: 'Suspended' },
  { key: 'top', label: '⭐ Top Rated' },
];

const REJECT_REASONS  = ['Incomplete documents','Not in serviceable area','Failed verification','Duplicate application','Other'];
const SUSPEND_REASONS = ['Customer complaints','No-show on bookings','Code of conduct violation','Fraud or misrepresentation','Other'];

function ReasonModal({ title, desc, reasons, onConfirm, onClose }: {
  title: string; desc: string; reasons: string[]; onConfirm: (r: string) => void; onClose: () => void;
}) {
  const [r, setR] = useState(reasons[0]); const [custom, setCustom] = useState('');
  const final = r === 'Other' ? custom.trim() : r;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-[#EBEBEB] shadow-xl w-full max-w-sm p-6 z-10">
        <h3 className="font-bold text-[16px] text-[#1A1A1A] mb-1">{title}</h3>
        <p className="text-[12px] text-[#9CA3AF] mb-4">{desc}</p>
        <div className="flex flex-col gap-2 mb-4">
          {reasons.map((opt) => (
            <label key={opt} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer',
              r === opt ? 'bg-red-50 border-red-200' : 'bg-[#F5F4F2] border-transparent hover:border-[#EBEBEB]')}>
              <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0', r === opt ? 'border-red-500' : 'border-[#EBEBEB]')}>
                {r === opt && <div className="w-2 h-2 rounded-full bg-red-500" />}
              </div>
              <input type="radio" className="sr-only" checked={r === opt} onChange={() => setR(opt)} />
              <span className="text-[13px] font-medium text-[#1A1A1A]">{opt}</span>
            </label>
          ))}
        </div>
        {r === 'Other' && (
          <textarea value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Describe the reason…"
            rows={2} className="w-full mb-4 px-3 py-2 text-[13px] border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] resize-none" />
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-[#EBEBEB] text-[13px] font-semibold text-[#6B7280] hover:bg-[#F5F4F2]">Cancel</button>
          <button onClick={() => onConfirm(final)} disabled={r === 'Other' && !custom.trim()}
            className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold disabled:opacity-50">Confirm</button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, src, isOnline }: { name: string; src: string | null; isOnline: boolean }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0,2).toUpperCase();
  return (
    <div className="relative shrink-0">
      <div className="w-11 h-11 rounded-full overflow-hidden bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center">
        {src ? <img src={src} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : <span className="text-[14px] font-bold text-[#C84B31]">{initials}</span>}
      </div>
      {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#EBEBEB] rounded-2xl p-5 animate-pulse">
      <div className="flex gap-3 mb-4"><div className="w-11 h-11 rounded-full bg-[#F5F4F2]" /><div className="flex-1 space-y-2"><div className="h-3.5 w-28 bg-[#F5F4F2] rounded" /><div className="h-2.5 w-20 bg-[#F5F4F2] rounded" /></div><div className="h-5 w-14 bg-[#F5F4F2] rounded-full" /></div>
      <div className="flex gap-1.5 mb-4">{[1,2,3].map((i)=><div key={i} className="h-5 w-16 bg-[#F5F4F2] rounded-full" />)}</div>
      <div className="grid grid-cols-4 gap-2 mb-4">{[1,2,3,4].map((i)=><div key={i} className="h-12 bg-[#F5F4F2] rounded-xl" />)}</div>
      <div className="h-9 w-full bg-[#F5F4F2] rounded-xl" />
    </div>
  );
}

function ProviderCard({ sp, onApprove, onReject, onSuspend, onReactivate, onView }: {
  sp: SP; onApprove(id:string):void; onReject(id:string):void;
  onSuspend(id:string):void; onReactivate(id:string):void; onView(id:string):void;
}) {
  const [menu, setMenu] = useState(false);
  const sc = SC[sp.status];
  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white hover:border-[#FDDDD5] hover:shadow-sm transition-all">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <Avatar name={sp.name} src={sp.profileImage} isOnline={sp.isOnline} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[14px] text-[#1A1A1A]">{sp.name}</h3>
              {sp.status === 'active' && sp.rating >= 4.8 && (
                <span className="text-[9px] font-bold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-1.5 py-0.5 rounded-full">TOP</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <MapPin className="w-3 h-3 text-[#9CA3AF] shrink-0" />
              <span className="text-[11px] text-[#9CA3AF] truncate max-w-[120px]">{sp.location || '—'}</span>
              <span className="text-[#EBEBEB]">·</span>
              <span className="text-[11px] text-[#9CA3AF]">{sp.experience}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', sc.bg, sc.border, sc.text)}>{sc.label}</span>
            <div className="relative">
              <button onClick={() => setMenu((p)=>!p)} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#EBEBEB]">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {menu && (<>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-9 w-44 bg-white border border-[#EBEBEB] rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                  <button onClick={() => { onView(sp.id); setMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                    <Eye className="w-3.5 h-3.5 text-[#9CA3AF]" /> View Profile
                  </button>
                  {sp.phone && (
                    <button onClick={() => { window.open(`tel:${sp.phone}`); setMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                      <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" /> Call {sp.phone}
                    </button>
                  )}
                  {sp.status === 'active' && (
                    <button onClick={() => { onSuspend(sp.id); setMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50">
                      <Ban className="w-3.5 h-3.5" /> Suspend
                    </button>
                  )}
                  {sp.status === 'suspended' && (
                    <button onClick={() => { onReactivate(sp.id); setMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-green-600 hover:bg-green-50">
                      <RefreshCw className="w-3.5 h-3.5" /> Reactivate
                    </button>
                  )}
                </div>
              </>)}
            </div>
          </div>
        </div>

        {sp.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {sp.specialties.slice(0,3).map((s) => (
              <span key={s} className="text-[10px] font-semibold text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-0.5 rounded-full">{s}</span>
            ))}
            {sp.specialties.length > 3 && <span className="text-[10px] font-semibold text-[#9CA3AF] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-0.5 rounded-full">+{sp.specialties.length-3}</span>}
          </div>
        )}

        {sp.status !== 'pending' ? (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { l:'Rating', v: sp.rating ? `${sp.rating}★` : '—', c:'text-amber-500' },
              { l:'Jobs',   v: String(sp.jobsCompleted),            c:'text-blue-500'  },
              { l:'Comm.',  v: `${sp.commissionRate}%`,             c:'text-[#C84B31]' },
              { l:'Joined', v: sp.joinedAt,                         c:'text-[#6B7280]' },
            ].map(({ l, v, c }) => (
              <div key={l} className="bg-[#F5F4F2] rounded-xl px-2 py-2 text-center border border-[#EBEBEB]">
                <p className={cn('font-bold text-[12px] leading-none truncate', c)}>{v}</p>
                <p className="text-[9px] text-[#9CA3AF] mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-3 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <div><p className="text-[11px] font-semibold text-amber-700">Applied {sp.joinedAt}</p><p className="text-[10px] text-amber-600 mt-0.5">{sp.phone}</p></div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          {sp.isOnline
            ? <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online now</span>
            : <span className="text-[10px] text-[#9CA3AF]">Last seen: {sp.lastActive}</span>}
          <span className="text-[10px] text-[#9CA3AF] flex items-center gap-0.5"><Percent className="w-2.5 h-2.5" />{sp.commissionRate}%</span>
        </div>

        {sp.status === 'pending' ? (
          <div className="grid grid-cols-2 gap-2">
            <Button className="h-9 bg-[#C84B31] hover:bg-[#B04028] text-white font-semibold text-[12px] rounded-xl shadow-none border-0" onClick={() => onApprove(sp.id)}>
              <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
            </Button>
            <Button variant="outline" className="h-9 border-[#EBEBEB] text-[#6B7280] hover:bg-red-50 hover:border-red-200 hover:text-red-500 font-semibold text-[12px] rounded-xl shadow-none" onClick={() => onReject(sp.id)}>
              <X className="w-3.5 h-3.5 mr-1.5" /> Reject
            </Button>
          </div>
        ) : (
          <button onClick={() => onView(sp.id)} className="w-full flex items-center justify-between px-4 py-2.5 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl hover:bg-[#FFF0EC] hover:border-[#FDDDD5] transition-colors group">
            <span className="text-[12px] font-semibold text-[#6B7280] group-hover:text-[#C84B31]">View Full Profile</span>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#C84B31] group-hover:translate-x-0.5 transition-all" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function AdminServiceProviders() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { toast }    = useToast();

  const [providers,    setProviders]    = useState<SP[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [activeTab,    setActiveTab]    = useState<TabKey>('all');
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState<'rating'|'jobs'|'recent'>('recent');
  const [showFilters,  setShowFilters]  = useState(false);
  const [selectedSpec, setSelectedSpec] = useState('All');
  const [rejectTarget,  setRejectTarget]  = useState<SP | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<SP | null>(null);

  const fetchProviders = () => {
    setLoading(true); setError(false);
    providersAPI.list()
      .then(({ data }) => setProviders(data.map(mapSP)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProviders(); }, []);
  useEffect(() => {
    const tab = searchParams.get('tab') as TabKey | null;
    if (tab && ['all','active','pending','suspended','top'].includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  const counts = useMemo<Record<TabKey,number>>(() => ({
    all: providers.length,
    active: providers.filter((p) => p.status==='active').length,
    pending: providers.filter((p) => p.status==='pending').length,
    suspended: providers.filter((p) => p.status==='suspended').length,
    top: providers.filter((p) => p.status==='active' && p.rating>=4.7).length,
  }), [providers]);

  const allSpecs = useMemo(() => {
    const s = new Set<string>(); providers.forEach((p) => p.specialties.forEach((sp) => s.add(sp)));
    return ['All', ...Array.from(s)];
  }, [providers]);

  const filtered = useMemo(() => {
    const list = providers.filter((p) => {
      const matchTab = activeTab==='all' ? true : activeTab==='top' ? (p.status==='active'&&p.rating>=4.7) : p.status===activeTab;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase()) || p.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase()));
      return matchTab && matchSearch && (selectedSpec==='All' || p.specialties.includes(selectedSpec));
    });
    return [...list].sort((a,b) => sortBy==='rating' ? b.rating-a.rating : sortBy==='jobs' ? b.jobsCompleted-a.jobsCompleted : 0);
  }, [providers, activeTab, search, selectedSpec, sortBy]);

  const handleApprove = async (id: string) => {
    const sp = providers.find((p) => p.id===id);
    try {
      await providersAPI.setApproval(id, true);
      setProviders((prev) => prev.map((p) => p.id===id ? {...p, status:'active'} : p));
      toast({ title: `${sp?.name} approved ✓` });
    } catch { toast({ title:'Failed to approve', variant:'destructive' }); }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    const { id, name } = rejectTarget; setRejectTarget(null);
    try {
      await providersAPI.setApproval(id, false, reason);
      setProviders((prev) => prev.filter((p) => p.id!==id));
      toast({ title:`${name} rejected`, description:`Reason: ${reason}` });
    } catch { toast({ title:'Failed to reject', variant:'destructive' }); }
  };

  const handleSuspendConfirm = async (reason: string) => {
    if (!suspendTarget) return;
    const { id, name } = suspendTarget; setSuspendTarget(null);
    try {
      await providersAPI.suspend(id, true, reason);
      setProviders((prev) => prev.map((p) => p.id===id ? {...p, status:'suspended', isOnline:false} : p));
      toast({ title:`${name} suspended`, description:`Reason: ${reason}` });
    } catch { toast({ title:'Failed to suspend', variant:'destructive' }); }
  };

  const handleReactivate = async (id: string) => {
    const sp = providers.find((p) => p.id===id);
    try {
      await providersAPI.suspend(id, false);
      setProviders((prev) => prev.map((p) => p.id===id ? {...p, status:'active'} : p));
      toast({ title:`${sp?.name} reactivated ✓` });
    } catch { toast({ title:'Failed to reactivate', variant:'destructive' }); }
  };

  const avgRating = providers.filter((p)=>p.rating>0).reduce((s,p,_,a)=>s+p.rating/a.length,0);

  return (
    <>
      {rejectTarget  && <ReasonModal title="Reject Application" desc={`Reason for rejecting ${rejectTarget.name}`}  reasons={REJECT_REASONS}  onConfirm={handleRejectConfirm}  onClose={()=>setRejectTarget(null)}  />}
      {suspendTarget && <ReasonModal title="Suspend Provider"   desc={`Reason for suspending ${suspendTarget.name}`} reasons={SUSPEND_REASONS} onConfirm={handleSuspendConfirm} onClose={()=>setSuspendTarget(null)} />}

      <AdminLayout title="Service Providers" subtitle="Manage, review and monitor all providers"
        topBarRight={<Button className="h-9 px-4 bg-[#C84B31] hover:bg-[#B04028] text-white font-semibold text-[13px] rounded-xl shadow-none border-0" onClick={()=>router.push('/admin/providers/invite')}>+ Invite Provider</Button>}>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label:'Total Providers', value:providers.length,       Icon:Users,      color:'text-[#C84B31]', bg:'bg-[#FFF0EC]', border:'border-[#FDDDD5]' },
            { label:'Online Now',      value:providers.filter((p)=>p.isOnline).length, Icon:BadgeCheck, color:'text-green-600', bg:'bg-green-50', border:'border-green-100' },
            { label:'Avg Rating',      value:`${avgRating.toFixed(1)}★`, Icon:Star,   color:'text-amber-500', bg:'bg-amber-50',  border:'border-amber-100' },
            { label:'Pending Review',  value:counts.pending,          Icon:Clock,      color:'text-orange-600', bg:'bg-orange-50', border:'border-orange-100' },
          ].map(({ label, value, Icon, color, bg, border }) => (
            <Card key={label} className="border border-[#EBEBEB] shadow-none bg-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border shrink-0', bg, border)}><Icon className={cn('w-4 h-4', color)} /></div>
                <div><p className={cn('font-bold text-[18px] leading-none', color)}>{value}</p><p className="text-[10px] text-[#9CA3AF] mt-0.5">{label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-3"><AlertCircle className="w-6 h-6 text-red-400" /></div>
            <p className="text-[14px] font-semibold text-[#1A1A1A]">Failed to load providers</p>
            <p className="text-[12px] text-[#9CA3AF] mt-1 mb-4">Check your connection and try again</p>
            <button onClick={fetchProviders} className="h-9 px-5 rounded-xl bg-[#C84B31] text-white text-[12px] font-semibold hover:bg-[#B04028] flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Retry</button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" /><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by name, location or specialty…" className="w-full pl-10 pr-4 h-10 text-[13px] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] placeholder:text-[#9CA3AF]" /></div>
              <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as typeof sortBy)} className="h-10 px-3 text-[12px] font-semibold text-[#6B7280] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none cursor-pointer"><option value="recent">Sort: Recent</option><option value="rating">Sort: Rating</option><option value="jobs">Sort: Jobs</option></select>
              <button onClick={()=>setShowFilters((p)=>!p)} className={cn('h-10 px-4 flex items-center gap-2 rounded-xl border text-[12px] font-semibold transition-colors', showFilters ? 'bg-[#FFF0EC] border-[#FDDDD5] text-[#C84B31]' : 'bg-white border-[#EBEBEB] text-[#6B7280] hover:bg-[#F5F4F2]')}><SlidersHorizontal className="w-3.5 h-3.5" /> Filter</button>
              <button onClick={()=>{ exportToExcel([{ name:'Providers', rows: providers.map((p)=>({ Name:p.name, Phone:p.phone, Location:p.location, Specialties:p.specialties.join(', '), Rating:p.rating, Jobs:p.jobsCompleted, Commission:`${p.commissionRate}%`, Status:p.status, Joined:p.joinedAt })) }], 'service-providers'); toast({ title:'Exported ✓' }); }} className="h-10 px-4 flex items-center gap-2 rounded-xl border border-[#EBEBEB] bg-white text-[12px] font-semibold text-[#6B7280] hover:bg-[#F5F4F2]"><Download className="w-3.5 h-3.5" /> Export</button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white border border-[#EBEBEB] rounded-xl">
                {allSpecs.map((s) => <button key={s} onClick={()=>setSelectedSpec(s)} className={cn('text-[11px] font-semibold px-3 py-1 rounded-full border transition-all', selectedSpec===s ? 'bg-[#C84B31] border-[#C84B31] text-white' : 'bg-[#F5F4F2] border-[#EBEBEB] text-[#6B7280] hover:border-[#C84B31] hover:text-[#C84B31]')}>{s}</button>)}
              </div>
            )}

            <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl mb-5 overflow-x-auto no-scrollbar">
              {TABS.map(({ key, label }) => (
                <button key={key} onClick={()=>setActiveTab(key)} className={cn('flex-shrink-0 flex items-center gap-1.5 py-2 px-3 sm:px-4 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap', activeTab===key ? 'bg-white text-[#C84B31] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]')}>
                  {label}
                  {counts[key] > 0 && <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', activeTab===key ? 'bg-[#FFF0EC] text-[#C84B31]' : 'bg-[#EBEBEB] text-[#9CA3AF]')}>{counts[key]}</span>}
                </button>
              ))}
            </div>

            {counts.pending > 0 && activeTab !== 'pending' && (
              <button onClick={()=>setActiveTab('pending')} className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 hover:bg-amber-100 transition-colors group">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-[12px] font-semibold text-amber-700 flex-1 text-left">{counts.pending} provider{counts.pending>1?'s':''} waiting for approval</p>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading ? Array.from({length:6}).map((_,i)=><SkeletonCard key={i} />) : filtered.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-5xl mb-4">{activeTab==='pending'?'📭':activeTab==='suspended'?'🚫':'🔍'}</div>
                  <p className="text-[15px] font-bold text-[#1A1A1A]">{search ? 'No results found' : `No ${activeTab==='all'?'':activeTab} providers`}</p>
                  <p className="text-[12px] text-[#9CA3AF] mt-1">{search ? 'Try a different search term' : 'Nothing here right now'}</p>
                </div>
              ) : filtered.map((sp) => (
                <ProviderCard key={sp.id} sp={sp}
                  onApprove={handleApprove}
                  onReject={(id)=>setRejectTarget(providers.find((p)=>p.id===id)??null)}
                  onSuspend={(id)=>setSuspendTarget(providers.find((p)=>p.id===id)??null)}
                  onReactivate={handleReactivate}
                  onView={(id)=>router.push(`/admin/providers/${id}`)}
                />
              ))}
            </div>

            {!loading && filtered.length > 0 && <p className="text-center text-[11px] text-[#9CA3AF] mt-6">Showing {filtered.length} of {providers.length} providers</p>}
          </>
        )}
      </AdminLayout>
    </>
  );
}

export default function AdminService() {
  return <Suspense fallback={null}><AdminServiceProviders /></Suspense>;
}
