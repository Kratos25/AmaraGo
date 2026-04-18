'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Phone, Mail,
  ChevronRight, Users, TrendingUp, Heart,
  MoreHorizontal, Eye, Download,
  IndianRupee, CalendarCheck,
  Crown, Clock, User,
  LayoutGrid, List, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import AdminLayout from '../_components/AdminLayout';
import { adminAPI, type ClientStats } from '@/lib/api';
import { exportToExcel } from '@/lib/exportExcel';

// ─── Types ──────────────────────────────────────────────────────────────────

type TabKey = 'all' | 'vip' | 'new' | 'returning';

// ─── Configs ─────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',       label: 'All Clients'   },
  { key: 'vip',       label: '👑 VIP'        },
  { key: 'returning', label: 'Returning'     },
  { key: 'new',       label: 'New (0 orders)'},
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtMonth(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function completionRate(c: ClientStats) {
  return c.total_bookings ? Math.round((c.completed_bookings / c.total_bookings) * 100) : 0;
}

// ─── Client Card ─────────────────────────────────────────────────────────────

function ClientCard({ client, onView }: { client: ClientStats; onView: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cr = completionRate(client);

  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white hover:border-[#FDDDD5] hover:shadow-sm transition-all">
      <CardContent className="p-4 sm:p-5">

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center overflow-hidden text-xl select-none">
              {client.profile_image
                ? <img src={client.profile_image} alt={client.name} className="w-full h-full object-cover" />
                : <User className="w-5 h-5 text-[#C84B31]" />}
            </div>
            {client.is_vip && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[8px]">👑</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-[14px] text-[#1A1A1A] truncate">{client.name}</h3>
              {client.is_vip && (
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">VIP</span>
              )}
            </div>
            {client.phone ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-[#9CA3AF] shrink-0" />
                <span className="text-[11px] text-[#9CA3AF] truncate">{client.phone}</span>
              </div>
            ) : client.email ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-[#9CA3AF] shrink-0" />
                <span className="text-[11px] text-[#9CA3AF] truncate">{client.email}</span>
              </div>
            ) : null}
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#EBEBEB] transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 w-40 bg-white border border-[#EBEBEB] rounded-xl shadow-lg z-20 py-1">
                  <button onClick={() => { onView(client.uid); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                    <Eye className="w-3.5 h-3.5 text-[#9CA3AF]" /> View Profile
                  </button>
                  {client.phone && (
                    <a href={`tel:${client.phone}`} onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                      <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" /> Call
                    </a>
                  )}
                  {client.email && (
                    <a href={`mailto:${client.email}`} onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                      <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" /> Email
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Bookings',  value: client.total_bookings,                                                                                          color: 'text-blue-500'   },
            { label: 'Spent',     value: client.total_spend >= 1000 ? `₹${(client.total_spend/1000).toFixed(1)}K` : `₹${client.total_spend}`,           color: 'text-[#C84B31]' },
            { label: 'Avg Order', value: client.avg_booking_value > 0 ? `₹${Math.round(client.avg_booking_value)}` : '—',                               color: 'text-purple-500' },
            { label: 'Done',      value: `${cr}%`,                                                                                                       color: 'text-green-600'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#F5F4F2] rounded-xl px-2 py-2 text-center border border-[#EBEBEB]">
              <p className={cn('font-bold text-[12px] sm:text-[13px] leading-none', color)}>{value}</p>
              <p className="text-[9px] text-[#9CA3AF] mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Completion bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[9px] text-[#9CA3AF] mb-1">
            <span>{client.completed_bookings} completed</span>
            <span>{client.cancelled_bookings} cancelled</span>
          </div>
          <div className="h-1.5 bg-[#EBEBEB] rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: `${cr}%` }} />
          </div>
        </div>

        {/* Favourite service */}
        {client.favorite_service && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#F5F4F2] rounded-xl border border-[#EBEBEB]">
            <Heart className="w-3.5 h-3.5 text-[#C84B31] shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-[#9CA3AF] font-medium">Favourite Service</p>
              <p className="text-[11px] font-semibold text-[#1A1A1A] truncate">{client.favorite_service}</p>
            </div>
          </div>
        )}

        {/* Dates row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#9CA3AF]" />
            <span className="text-[10px] text-[#9CA3AF]">
              {client.last_booking_date ? `Last: ${client.last_booking_date}` : 'No bookings yet'}
            </span>
          </div>
          <span className="text-[10px] text-[#9CA3AF]">Joined {fmtMonth(client.created_at)}</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => onView(client.uid)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl hover:bg-[#FFF0EC] hover:border-[#FDDDD5] transition-colors group"
        >
          <span className="text-[12px] font-semibold text-[#6B7280] group-hover:text-[#C84B31] transition-colors">View Profile &amp; Bookings</span>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#C84B31] group-hover:translate-x-0.5 transition-all" />
        </button>

      </CardContent>
    </Card>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function ClientRow({ client, onView }: { client: ClientStats; onView: (id: string) => void }) {
  const cr = completionRate(client);
  return (
    <tr
      className="border-b border-[#EBEBEB] hover:bg-[#FFF0EC]/30 cursor-pointer transition-colors"
      onClick={() => onView(client.uid)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center overflow-hidden shrink-0">
            {client.profile_image
              ? <img src={client.profile_image} alt={client.name} className="w-full h-full object-cover" />
              : <User className="w-4 h-4 text-[#C84B31]" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[12px] font-semibold text-[#1A1A1A]">{client.name}</p>
              {client.is_vip && <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">VIP</span>}
            </div>
            <p className="text-[10px] text-[#9CA3AF] truncate max-w-[160px]">{client.email ?? client.phone ?? '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-[12px] text-[#6B7280]">{client.phone ?? '—'}</td>
      <td className="px-4 py-3 text-center">
        <p className="text-[13px] font-bold text-blue-500">{client.total_bookings}</p>
        <p className="text-[9px] text-[#9CA3AF]">{cr}% done</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-[13px] font-bold text-[#C84B31]">
          {client.total_spend >= 1000 ? `₹${(client.total_spend/1000).toFixed(1)}K` : `₹${client.total_spend}`}
        </p>
        <p className="text-[10px] text-[#9CA3AF]">avg ₹{Math.round(client.avg_booking_value)}</p>
      </td>
      <td className="px-4 py-3 text-[11px] text-[#6B7280] max-w-[140px] truncate">{client.favorite_service ?? '—'}</td>
      <td className="px-4 py-3 text-[10px] text-[#9CA3AF]">{client.last_booking_date ?? '—'}</td>
      <td className="px-4 py-3 text-[10px] text-[#9CA3AF]">{fmtDate(client.created_at)}</td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onView(client.uid)}
          className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#FFF0EC] hover:text-[#C84B31] transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-[15px] font-bold text-[#1A1A1A]">{label}</p>
      <p className="text-[12px] text-[#9CA3AF] mt-1">{sub}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminClients() {
  const router    = useRouter();
  const { toast } = useToast();

  const [clients, setClients]     = useState<ClientStats[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState<'spend' | 'bookings' | 'recent' | 'avg'>('spend');
  const [viewMode, setViewMode]   = useState<'card' | 'table'>('card');

  useEffect(() => {
    adminAPI.listClientsStats()
      .then(({ data }) => setClients(data))
      .catch(() => toast({ title: 'Failed to load clients', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  // Counts per tab
  const counts = useMemo<Record<TabKey, number>>(() => ({
    all:       clients.length,
    vip:       clients.filter((c) => c.is_vip).length,
    returning: clients.filter((c) => c.total_bookings > 1).length,
    new:       clients.filter((c) => c.total_bookings === 0).length,
  }), [clients]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    const list = clients.filter((c) => {
      const matchTab =
        activeTab === 'all'       ? true :
        activeTab === 'vip'       ? c.is_vip :
        activeTab === 'returning' ? c.total_bookings > 1 :
        /* new */                   c.total_bookings === 0;
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').includes(search);
      return matchTab && matchSearch;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'spend')    return b.total_spend - a.total_spend;
      if (sortBy === 'bookings') return b.total_bookings - a.total_bookings;
      if (sortBy === 'avg')      return b.avg_booking_value - a.avg_booking_value;
      return (b.created_at ?? '').localeCompare(a.created_at ?? '');
    });
  }, [clients, activeTab, search, sortBy]);

  // Summary stats
  const totalRevenue  = clients.reduce((s, c) => s + c.total_spend, 0);
  const totalBookings = clients.reduce((s, c) => s + c.total_bookings, 0);
  const avgSpend      = clients.length ? Math.round(totalRevenue / clients.length) : 0;
  const vipCount      = clients.filter((c) => c.is_vip).length;
  const topSpenders   = [...clients]
    .filter((c) => c.total_spend > 0)
    .sort((a, b) => b.total_spend - a.total_spend)
    .slice(0, 5);

  const handleView = (id: string) => router.push(`/admin/clients/${id}`);

  const handleExport = () => {
    const rows = clients.map((c) => ({
      Name:               c.name,
      Email:              c.email ?? '',
      Phone:              c.phone ?? '',
      'Total Bookings':   c.total_bookings,
      Completed:          c.completed_bookings,
      Cancelled:          c.cancelled_bookings,
      'Total Spend (₹)':  c.total_spend,
      'Avg Order (₹)':    Math.round(c.avg_booking_value),
      'Favorite Service': c.favorite_service ?? '',
      'Last Booking':     c.last_booking_date ?? '',
      Joined:             fmtDate(c.created_at),
      VIP:                c.is_vip ? 'Yes' : 'No',
    }));
    exportToExcel([{ name: 'Clients', rows }], 'clients');
    toast({ title: 'Exported ✓', description: 'clients.xlsx downloaded.' });
  };

  return (
    <AdminLayout
      title="Clients"
      subtitle="Manage and monitor all client accounts"
      topBarRight={
        <button
          className="h-9 px-4 flex items-center gap-2 rounded-xl bg-[#C84B31] text-white text-[12px] font-semibold hover:bg-[#B04028] transition-colors"
          onClick={handleExport}
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      }
    >

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Clients',  value: clients.length,          Icon: Users,         color: 'text-[#C84B31]',  bg: 'bg-[#FFF0EC]',  border: 'border-[#FDDDD5]' },
          { label: 'Total Revenue',  value: totalRevenue >= 100000 ? `₹${(totalRevenue/100000).toFixed(1)}L` : `₹${(totalRevenue/1000).toFixed(0)}K`, Icon: IndianRupee, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'Total Bookings', value: totalBookings,           Icon: CalendarCheck, color: 'text-blue-500',   bg: 'bg-blue-50',    border: 'border-blue-100'   },
          { label: 'VIP Clients',    value: vipCount,                Icon: Crown,         color: 'text-amber-500',  bg: 'bg-amber-50',   border: 'border-amber-100'  },
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

      {/* ── Top Spenders highlight ────────────────────────────────────────── */}
      {topSpenders.length > 0 && (
        <Card className="border border-[#EBEBEB] shadow-none bg-white mb-5">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-[14px] text-[#1A1A1A]">Top Spenders</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">Highest lifetime value</p>
              </div>
              <button onClick={() => setActiveTab('vip')} className="text-[12px] font-semibold text-[#C84B31] hover:opacity-80 flex items-center gap-1">
                View VIPs <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {topSpenders.map((c, i) => (
                <button
                  key={c.uid}
                  onClick={() => handleView(c.uid)}
                  className="flex flex-col items-center gap-2 shrink-0 px-4 py-3 bg-[#F5F4F2] rounded-xl border border-[#EBEBEB] hover:border-[#FDDDD5] hover:bg-[#FFF0EC] transition-all min-w-[90px]"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center overflow-hidden">
                      {c.profile_image
                        ? <img src={c.profile_image} alt={c.name} className="w-full h-full object-cover" />
                        : <User className="w-5 h-5 text-[#C84B31]" />}
                    </div>
                    {i === 0 && <span className="absolute -top-1 -right-1 text-[10px]">🥇</span>}
                    {i === 1 && <span className="absolute -top-1 -right-1 text-[10px]">🥈</span>}
                    {i === 2 && <span className="absolute -top-1 -right-1 text-[10px]">🥉</span>}
                  </div>
                  <p className="text-[11px] font-semibold text-[#1A1A1A] text-center leading-tight">{c.name.split(' ')[0]}</p>
                  <p className="text-[11px] font-bold text-[#C84B31]">
                    {c.total_spend >= 1000 ? `₹${(c.total_spend/1000).toFixed(1)}K` : `₹${c.total_spend}`}
                  </p>
                  <p className="text-[9px] text-[#9CA3AF]">{c.total_bookings} bookings</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Avg spend insight ─────────────────────────────────────────────── */}
      {avgSpend > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#FFF0EC] border border-[#FDDDD5] rounded-xl mb-5">
          <TrendingUp className="w-4 h-4 text-[#C84B31] shrink-0" />
          <p className="text-[12px] text-[#C84B31] font-semibold flex-1">
            Average spend per client: <span className="font-black">₹{avgSpend.toLocaleString()}</span>
          </p>
        </div>
      )}

      {/* ── Search + controls ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full pl-10 pr-4 h-10 text-[13px] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31]/20 text-[#1A1A1A] placeholder:text-[#9CA3AF]"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-10 px-3 text-[12px] font-semibold text-[#6B7280] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] cursor-pointer"
        >
          <option value="spend">Sort: Highest Spend</option>
          <option value="bookings">Sort: Most Bookings</option>
          <option value="avg">Sort: Avg Order</option>
          <option value="recent">Sort: Recently Joined</option>
        </select>

        {/* Card / Table toggle */}
        <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl border border-[#EBEBEB]">
          {(['card', 'table'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5',
                viewMode === mode ? 'bg-white text-[#C84B31] shadow-sm' : 'text-[#9CA3AF]',
              )}
            >
              {mode === 'card'
                ? <><LayoutGrid className="w-3.5 h-3.5" /> Cards</>
                : <><List className="w-3.5 h-3.5" /> Table</>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl mb-5 overflow-x-auto">
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

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-[#C84B31] animate-spin" />
        </div>

      ) : filtered.length === 0 ? (
        <EmptyState
          icon={activeTab === 'vip' ? '👑' : activeTab === 'new' ? '🔔' : '🔍'}
          label={search ? 'No clients found' : `No ${activeTab === 'all' ? '' : activeTab} clients`}
          sub={search ? 'Try a different search term' : 'Nothing here right now'}
        />

      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard key={client.uid} client={client} onView={handleView} />
          ))}
        </div>

      ) : (
        <Card className="border border-[#EBEBEB] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-[#EBEBEB] bg-[#F5F4F2]">
                  {['Client', 'Phone', 'Bookings', 'Revenue', 'Fav. Service', 'Last Booking', 'Joined', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <ClientRow key={client.uid} client={client} onView={handleView} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Footer count ─────────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <p className="text-center text-[11px] text-[#9CA3AF] mt-6">
          Showing {filtered.length} of {clients.length} clients
        </p>
      )}

    </AdminLayout>
  );
}
