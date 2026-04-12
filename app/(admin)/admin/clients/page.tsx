'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Star, MapPin, Phone, Mail,
  ChevronRight, Users, TrendingUp, Heart,
  MoreHorizontal, Eye, Ban, RefreshCw, Download,
  SlidersHorizontal, IndianRupee, CalendarCheck,
  ShoppingBag, AlertTriangle, UserX, Crown, Clock,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import AdminLayout from '../_components/AdminLayout';
import { Button } from '@/components/ui/button';
import { adminAPI, type UserProfile } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

type ClientStatus = 'active' | 'inactive' | 'blocked';
type TabKey       = 'all' | 'active' | 'inactive' | 'blocked' | 'vip';

interface Client {
  id: string;
  name: string;
  emoji: string;
  phone: string;
  email: string;
  location: string;
  status: ClientStatus;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpend: number;
  spendThisMonth: number;
  avgBookingValue: number;
  favoriteService: string;
  lastBooking: string;
  joinedAt: string;
  rating: number; // avg rating they give to providers
  isVip: boolean;
}

// ─── API → local shape mapper ─────────────────────────────────────────────────

function mapClient(u: UserProfile): Client {
  return {
    id:                u.uid,
    name:              u.name,
    emoji:             '👤',
    phone:             u.phone ?? '',
    email:             u.email ?? '',
    location:          '',
    status:            'active',
    totalBookings:     0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalSpend:        0,
    spendThisMonth:    0,
    avgBookingValue:   0,
    favoriteService:   '—',
    lastBooking:       u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—',
    joinedAt:          u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—',
    rating:            0,
    isVip:             false,
  };
}

// ─── Configs ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ClientStatus, { label: string; dot: string; bg: string; border: string; text: string }> = {
  active:   { label: 'Active',   dot: 'bg-green-500',  bg: 'bg-green-50',   border: 'border-green-100',   text: 'text-green-700'  },
  inactive: { label: 'Inactive', dot: 'bg-[#9CA3AF]',  bg: 'bg-[#F5F4F2]', border: 'border-[#EBEBEB]',   text: 'text-[#9CA3AF]'  },
  blocked:  { label: 'Blocked',  dot: 'bg-red-500',    bg: 'bg-red-50',     border: 'border-red-100',     text: 'text-red-600'    },
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',      label: 'All Clients'  },
  { key: 'active',   label: 'Active'       },
  { key: 'inactive', label: 'Inactive'     },
  { key: 'blocked',  label: 'Blocked'      },
  { key: 'vip',      label: '👑 VIP'       },
];

// ─── Client Card ─────────────────────────────────────────────────────────────

function ClientCard({
  client, onBlock, onUnblock, onView,
}: {
  client: Client;
  onBlock:    (id: string) => void;
  onUnblock:  (id: string) => void;
  onView:     (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sc  = STATUS_CONFIG[client.status];
  const completionRate = client.totalBookings
    ? Math.round((client.completedBookings / client.totalBookings) * 100)
    : 0;

  return (
    <Card className="border border-[#EBEBEB] shadow-none bg-white hover:border-[#FDDDD5] hover:shadow-sm transition-all">
      <CardContent className="p-4 sm:p-5">

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center text-xl select-none">
              {client.emoji}
            </div>
            {client.isVip && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[8px]">
                👑
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-[14px] text-[#1A1A1A]">{client.name}</h3>
              {client.isVip && (
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">VIP</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#9CA3AF] shrink-0" />
              <span className="text-[11px] text-[#9CA3AF] truncate">{client.location}</span>
            </div>
          </div>

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
                    <button onClick={() => { onView(client.id); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                      <Eye className="w-3.5 h-3.5 text-[#9CA3AF]" /> View Profile
                    </button>
                    <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                      <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" /> Call Client
                    </button>
                    <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F5F4F2]">
                      <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" /> Send Email
                    </button>
                    <div className="border-t border-[#EBEBEB] my-1" />
                    {client.status !== 'blocked' ? (
                      <button onClick={() => { onBlock(client.id); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50">
                        <Ban className="w-3.5 h-3.5" /> Block Client
                      </button>
                    ) : (
                      <button onClick={() => { onUnblock(client.id); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-green-600 hover:bg-green-50">
                        <RefreshCw className="w-3.5 h-3.5" /> Unblock
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Bookings',  value: client.totalBookings,                               color: 'text-blue-500'   },
            { label: 'Spent',     value: `₹${(client.totalSpend / 1000).toFixed(0)}K`,       color: 'text-[#C84B31]'  },
            { label: 'Avg Order', value: `₹${client.avgBookingValue.toLocaleString()}`,       color: 'text-purple-500' },
            { label: 'Completion',value: `${completionRate}%`,                                color: 'text-green-600'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#F5F4F2] rounded-xl px-2 py-2 text-center border border-[#EBEBEB]">
              <p className={cn('font-bold text-[12px] sm:text-[13px] leading-none', color)}>{value}</p>
              <p className="text-[9px] text-[#9CA3AF] mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Favourite service + rating row */}
        <div className="flex items-center justify-between mb-3 px-3 py-2.5 bg-[#F5F4F2] rounded-xl border border-[#EBEBEB]">
          <div className="flex items-center gap-2 min-w-0">
            <Heart className="w-3.5 h-3.5 text-[#C84B31] shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-[#9CA3AF] font-medium">Favourite</p>
              <p className="text-[11px] font-semibold text-[#1A1A1A] truncate">{client.favoriteService}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-[12px] font-bold text-amber-600">{client.rating.toFixed(1)}</span>
            <span className="text-[10px] text-[#9CA3AF]">avg given</span>
          </div>
        </div>

        {/* Last booking + join date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#9CA3AF]" />
            <span className="text-[10px] text-[#9CA3AF]">Last: {client.lastBooking}</span>
          </div>
          <span className="text-[10px] text-[#9CA3AF]">Joined {client.joinedAt}</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => onView(client.id)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl hover:bg-[#FFF0EC] hover:border-[#FDDDD5] transition-colors group"
        >
          <span className="text-[12px] font-semibold text-[#6B7280] group-hover:text-[#C84B31] transition-colors">View Profile & Bookings</span>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#C84B31] group-hover:translate-x-0.5 transition-all" />
        </button>

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

// ─── Main page ────────────────────────────────────────────────────────────────

import { exportToExcel } from '@/lib/exportExcel';

export default function AdminClients() {
  const router    = useRouter();
  const { toast } = useToast();

  const [clients, setClients]         = useState<Client[]>([]);
  const [activeTab, setActiveTab]     = useState<TabKey>('all');
  const [search, setSearch]           = useState('');
  const [sortBy, setSortBy]           = useState<'recent' | 'spend' | 'bookings' | 'rating'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState('All');

  useEffect(() => {
    adminAPI.listClients().then(({ data }) => setClients(data.map(mapClient))).catch(() => {});
  }, []);

  // Counts
  const counts: Record<TabKey, number> = useMemo(() => ({
    all:      clients.length,
    active:   clients.filter((c) => c.status === 'active').length,
    inactive: clients.filter((c) => c.status === 'inactive').length,
    blocked:  clients.filter((c) => c.status === 'blocked').length,
    vip:      clients.filter((c) => c.isVip).length,
  }), [clients]);

  // Unique locations
  const locations = useMemo(() => {
    const s = new Set(clients.map((c) => c.location.split(',')[0].trim()));
    return ['All', ...Array.from(s)];
  }, [clients]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = clients.filter((c) => {
      const matchTab =
        activeTab === 'all'      ? true :
        activeTab === 'vip'      ? c.isVip :
        c.status === activeTab;
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.location.toLowerCase().includes(search.toLowerCase());
      const matchLocation =
        locationFilter === 'All' || c.location.startsWith(locationFilter);
      return matchTab && matchSearch && matchLocation;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'spend')    return b.totalSpend - a.totalSpend;
      if (sortBy === 'bookings') return b.totalBookings - a.totalBookings;
      if (sortBy === 'rating')   return b.rating - a.rating;
      return 0;
    });
  }, [clients, activeTab, search, locationFilter, sortBy]);

  // Summary stats
  const totalRevenue   = clients.reduce((s, c) => s + c.totalSpend, 0);
  const totalBookings  = clients.reduce((s, c) => s + c.totalBookings, 0);
  const avgSpend       = clients.length ? Math.round(totalRevenue / clients.length) : 0;
  const vipCount       = clients.filter((c) => c.isVip).length;

  // Actions
  const handleBlock = (id: string) => {
    const c = clients.find((x) => x.id === id);
    setClients((prev) => prev.map((x) => x.id === id ? { ...x, status: 'blocked' } : x));
    toast({ title: `${c?.name} blocked`, description: 'Client has been blocked from making bookings.' });
  };

  const handleUnblock = (id: string) => {
    const c = clients.find((x) => x.id === id);
    setClients((prev) => prev.map((x) => x.id === id ? { ...x, status: 'active' } : x));
    toast({ title: `${c?.name} unblocked ✓`, description: 'Client can now make bookings again.' });
  };

  const handleView = (id: string) => router.push(`/admin/clients/${id}`);

  const handleExport = () => {
    const rows = clients.map((c) => ({
      Name:               c.name,
      Email:              c.email,
      Phone:              c.phone,
      Location:           c.location,
      Status:             c.status,
      'Total Bookings':   c.totalBookings,
      'Completed':        c.completedBookings,
      'Cancelled':        c.cancelledBookings,
      'Total Spend (₹)':  c.totalSpend,
      'Avg Order (₹)':    c.avgBookingValue,
      'Favourite Service':c.favoriteService,
      'Last Booking':     c.lastBooking,
      'Joined':           c.joinedAt,
      VIP:                c.isVip ? 'Yes' : 'No',
    }));
    exportToExcel([{ name: 'Clients', rows }], 'clients');
    toast({ title: 'Exported ✓', description: 'clients.xlsx downloaded.' });
  };

  return (
    <AdminLayout
      title="Clients"
      subtitle="Manage and monitor all client accounts"
      topBarRight={
        <Button
          className="h-9 px-4 bg-[#C84B31] hover:bg-[#B04028] text-white font-semibold text-[13px] rounded-xl shadow-none border-0"
          onClick={handleExport}
        >
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export
        </Button>
      }
    >

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Clients',   value: clients.length,                                       Icon: Users,         color: 'text-[#C84B31]', bg: 'bg-[#FFF0EC]', border: 'border-[#FDDDD5]' },
          { label: 'Total Revenue',   value: `₹${(totalRevenue / 100000).toFixed(1)}L`,            Icon: IndianRupee,   color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'Total Bookings',  value: totalBookings,                                        Icon: CalendarCheck, color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
          { label: 'VIP Clients',     value: vipCount,                                             Icon: Crown,         color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-100'  },
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

      {/* ── Top spenders highlight ─────────────────────────────────────────── */}
      <Card className="border border-[#EBEBEB] shadow-none bg-white mb-5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-[14px] text-[#1A1A1A]">Top Spenders</p>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">Highest lifetime value clients</p>
            </div>
            <button onClick={() => setActiveTab('vip')} className="text-[12px] font-semibold text-[#C84B31] hover:opacity-80 flex items-center gap-1">
              View VIPs <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {[...clients]
              .filter((c) => c.status === 'active')
              .sort((a, b) => b.totalSpend - a.totalSpend)
              .slice(0, 5)
              .map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => handleView(c.id)}
                  className="flex flex-col items-center gap-2 shrink-0 px-4 py-3 bg-[#F5F4F2] rounded-xl border border-[#EBEBEB] hover:border-[#FDDDD5] hover:bg-[#FFF0EC] transition-all min-w-[90px]"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center text-xl">
                      {c.emoji}
                    </div>
                    {i === 0 && (
                      <span className="absolute -top-1 -right-1 text-[10px]">🥇</span>
                    )}
                    {i === 1 && (
                      <span className="absolute -top-1 -right-1 text-[10px]">🥈</span>
                    )}
                    {i === 2 && (
                      <span className="absolute -top-1 -right-1 text-[10px]">🥉</span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-[#1A1A1A] text-center leading-tight">{c.name.split(' ')[0]}</p>
                  <p className="text-[11px] font-bold text-[#C84B31]">₹{(c.totalSpend / 1000).toFixed(0)}K</p>
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Search + controls ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone or location…"
            className="w-full pl-10 pr-4 h-10 text-[13px] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31]/20 text-[#1A1A1A] placeholder:text-[#9CA3AF]"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-10 px-3 text-[12px] font-semibold text-[#6B7280] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] cursor-pointer"
        >
          <option value="recent">Sort: Recent</option>
          <option value="spend">Sort: Highest Spend</option>
          <option value="bookings">Sort: Most Bookings</option>
          <option value="rating">Sort: Rating Given</option>
        </select>
        <button
          onClick={() => setShowFilters((p) => !p)}
          className={cn(
            'h-10 px-4 flex items-center gap-2 rounded-xl border text-[12px] font-semibold transition-colors',
            showFilters ? 'bg-[#FFF0EC] border-[#FDDDD5] text-[#C84B31]' : 'bg-white border-[#EBEBEB] text-[#6B7280] hover:bg-[#F5F4F2]',
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
        </button>
      </div>

      {/* ── Location filter chips ─────────────────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white border border-[#EBEBEB] rounded-xl">
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider self-center mr-1">Area:</p>
          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocationFilter(loc)}
              className={cn(
                'text-[11px] font-semibold px-3 py-1 rounded-full border transition-all',
                locationFilter === loc
                  ? 'bg-[#C84B31] border-[#C84B31] text-white'
                  : 'bg-[#F5F4F2] border-[#EBEBEB] text-[#6B7280] hover:border-[#C84B31] hover:text-[#C84B31]',
              )}
            >
              {loc}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
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

      {/* ── Blocked alert ─────────────────────────────────────────────────── */}
      {counts.blocked > 0 && activeTab !== 'blocked' && (
        <button
          onClick={() => setActiveTab('blocked')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl mb-5 hover:bg-red-100 transition-colors group"
        >
          <UserX className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-[12px] font-semibold text-red-600 flex-1 text-left">
            {counts.blocked} client{counts.blocked > 1 ? 's' : ''} currently blocked
          </p>
          <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* ── Client grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={activeTab === 'blocked' ? '🚫' : activeTab === 'vip' ? '👑' : '🔍'}
            label={search ? 'No clients found' : `No ${activeTab === 'all' ? '' : activeTab} clients`}
            sub={search ? 'Try a different search term' : 'Nothing here right now'}
          />
        ) : (
          filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onBlock={handleBlock}
              onUnblock={handleUnblock}
              onView={handleView}
            />
          ))
        )}
      </div>

      {/* ── Footer count ─────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <p className="text-center text-[11px] text-[#9CA3AF] mt-6">
          Showing {filtered.length} of {clients.length} clients
        </p>
      )}

    </AdminLayout>
  );
}