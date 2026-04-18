'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCircle, CalendarCheck,
  Scissors, CreditCard, Settings, Bell, Menu, X,
  ShieldCheck, LogOut, ChevronRight, UserCheck, CalendarPlus,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import Image from 'next/image';
import Logo from '@/public/Amara_Logo.png';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { adminAPI, type Notification } from '@/lib/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
// Primary   #C84B31   Hover #B04028
// Tint bg   #FFF0EC   Tint border #FDDDD5
// Page bg   #F5F4F2   Surface #FFFFFF
// Border    #EBEBEB
// Text-1    #1A1A1A   Text-2 #6B7280   Text-3 #9CA3AF
// Admin accent: deep charcoal sidebar #1C1917

interface NavItemDef {
  href: string;
  label: string;
  Icon: React.ElementType;
}

interface NavGroupDef {
  label: string;
  items: NavItemDef[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin',           label: 'Dashboard',        Icon: LayoutDashboard },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/providers', label: 'Service Providers', Icon: Users      },
      { href: '/admin/clients',   label: 'Clients',           Icon: UserCircle },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/bookings',  label: 'Bookings',          Icon: CalendarCheck },
      { href: '/admin/services',  label: 'Services',          Icon: Scissors      },
      { href: '/admin/payments',  label: 'Payments',          Icon: CreditCard    },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings',  label: 'Settings',          Icon: Settings },
    ],
  },
];

// Flat list for mobile drawer
const ALL_NAV_ITEMS: NavItemDef[] = NAV_GROUPS.flatMap((g) => g.items);

// Mobile bottom tabs (most-used 5)
const MOBILE_TABS: NavItemDef[] = [
  { href: '/admin',           label: 'Home',      Icon: LayoutDashboard },
  { href: '/admin/providers', label: 'Providers', Icon: Users           },
  { href: '/admin/bookings',  label: 'Bookings',  Icon: CalendarCheck   },
  { href: '/admin/payments',  label: 'Payments',  Icon: CreditCard      },
  { href: '/admin/settings',  label: 'Settings',  Icon: Settings        },
];

// ─── Notification Panel ───────────────────────────────────────────────────────

function NotificationPanel({
  notifications,
  loading,
  onClose,
  onNavigate,
}: {
  notifications: Notification[];
  loading: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
}) {
  return (
    <div className="absolute right-0 top-12 w-[340px] bg-white border border-[#EBEBEB] rounded-2xl shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#EBEBEB]">
        <p className="font-bold text-[14px] text-[#1A1A1A]">Notifications</p>
        <button onClick={onClose} className="w-6 h-6 rounded-full bg-[#F5F4F2] flex items-center justify-center text-[#6B7280] hover:bg-[#EBEBEB]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="max-h-[380px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-[#C84B31] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 text-[#9CA3AF]" />
            </div>
            <p className="text-[13px] font-semibold text-[#1A1A1A]">No notifications</p>
            <p className="text-[11px] text-[#9CA3AF] mt-1 text-center">You're all caught up! Check back later.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EBEBEB]">
            {notifications.map((n) => {
              const isPending = n.type === 'pending_approval';
              const href = isPending
                ? `/admin/providers?tab=pending`
                : `/admin/bookings`;
              return (
                <button
                  key={n.id}
                  onClick={() => { onClose(); onNavigate(href); }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#FFF0EC]/50 transition-colors text-left"
                >
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 mt-0.5',
                    isPending
                      ? 'bg-amber-50 border-amber-100'
                      : 'bg-[#FFF0EC] border-[#FDDDD5]',
                  )}>
                    {isPending
                      ? <UserCheck className="w-4 h-4 text-amber-600" />
                      : <CalendarPlus className="w-4 h-4 text-[#C84B31]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#1A1A1A]">{n.title}</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  topBarRight?: React.ReactNode;
  showBell?: boolean;
}

// ─── Sidebar NavItem ──────────────────────────────────────────────────────────

function NavItem({
  href, label, Icon, active, onClick, compact = false, badge,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl text-left transition-all',
        compact ? 'px-3 py-3' : 'px-3 py-2.5',
        active
          ? 'bg-[#C84B31]/10 text-[#C84B31]'
          : 'text-[#9CA3AF] hover:bg-white/5 hover:text-white',
      )}
    >
      <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#C84B31]' : 'text-[#6B7280]')} />
      <span className={cn(compact ? 'text-[14px]' : 'text-[13px]', active ? 'font-semibold' : 'font-medium')}>
        {label}
      </span>
      {badge ? (
        <span className="ml-auto min-w-[18px] h-4 bg-[#C84B31] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : active ? (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C84B31]" />
      ) : null}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminLayout({
  children,
  title,
  subtitle,
  topBarRight,
  showBell = true,
}: AdminLayoutProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminName, setAdminName]   = useState('Super Admin');
  const [adminEmail, setAdminEmail] = useState('');

  // Notifications
  const [bellOpen, setBellOpen]             = useState(false);
  const [notifications, setNotifications]   = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading]     = useState(false);
  const [pendingCount, setPendingCount]     = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  // ── Notification read-state via localStorage ─────────────────────────────
  const getSeenIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem('admin_seen_notifs') ?? '[]'); }
    catch { return []; }
  };
  const markAllSeen = (notifs: Notification[]) => {
    try {
      const ids = notifs.map((n) => n.id);
      localStorage.setItem('admin_seen_notifs', JSON.stringify(ids));
    } catch {}
  };
  const countUnread = (notifs: Notification[]) => {
    const seen = new Set(getSeenIds());
    return notifs.filter((n) => !seen.has(n.id)).length;
  };

  // Fetch on mount — only badge unseen notifications
  useEffect(() => {
    adminAPI.getNotifications()
      .then(({ data }) => {
        setNotifications(data);
        setPendingCount(countUnread(data));
      })
      .catch(() => {});
  }, []);

  const openBell = () => {
    setBellOpen((prev) => {
      if (!prev) {
        setNotifLoading(true);
        adminAPI.getNotifications()
          .then(({ data }) => {
            setNotifications(data);
            // Mark all as seen immediately when panel opens
            markAllSeen(data);
            setPendingCount(0);
          })
          .catch(() => setNotifications([]))
          .finally(() => setNotifLoading(false));
      }
      return !prev;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  // Fetch real admin name + email from Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setAdminEmail(user.email ?? '');
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const name = snap.data()?.name ?? snap.data()?.displayName ?? '';
          if (name) setAdminName(name);
        }
        // fallback to Firebase displayName
        if (user.displayName) setAdminName(user.displayName);
      } catch {
        if (user.displayName) setAdminName(user.displayName);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear session cookie
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // ignore errors, proceed to redirect anyway
    }
    router.replace('/login');
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const navigate = (href: string) => {
    router.push(href);
    setMobileMenuOpen(false);
  };

  // ── Sidebar content (shared between desktop + mobile drawer) ──────────────
  const SidebarContent = ({ compact = false }: { compact?: boolean }) => (
    <>
      {/* Brand */}
      <div className={cn('border-b border-white/8', compact ? 'px-5 pt-6 pb-5' : 'px-5 pt-6 pb-5')}>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              // style={{ background: 'linear-gradient(135deg, #C84B31, #F2924A)' }}
            >
              <Image src={Logo} alt="Amara Logo" className="w-8 h-8 rounded-lg" />
              {/* <Star className="w-4 h-4 text-white" /> */}
            </div>
            <span className="font-bold text-[15px] text-[#ffffff] tracking-tight">AmaraGo</span>
            <span className="ml-1.5 text-[10px] font-bold text-[#C84B31] bg-[#C84B31]/15 px-1.5 py-0.5 rounded-md">ADMIN</span>
          </div>
        </div>
      </div>

      {/* Admin profile */}
      <div className="px-4 py-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C84B31]/20 border border-[#C84B31]/30 flex items-center justify-center text-base shrink-0 select-none">
            👤
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[13px] text-white truncate">{adminName}</p>
            <p className="text-[11px] text-[#6B7280] truncate">{adminEmail}</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[9px] font-bold text-[#4B5563] uppercase tracking-widest px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, Icon }) => (
                <NavItem
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  active={isActive(href)}
                  onClick={() => navigate(href)}
                  compact={compact}
                  badge={undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-white/8 space-y-0.5">
        <button
          onClick={() => navigate('/client/home')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9CA3AF] hover:bg-white/5 hover:text-white transition-all"
        >
          <ChevronRight className="w-4 h-4 text-[#6B7280] shrink-0" />
          <span className="text-[13px] font-medium">View Client App</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9CA3AF] hover:bg-red-900/20 hover:text-red-400 transition-all group"
        >
          <LogOut className="w-4 h-4 text-[#6B7280] shrink-0 group-hover:text-red-400 transition-colors" />
          <span className="text-[13px] font-medium">Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F5F4F2] flex">

      {/* ════════════════════════════════════════
          DESKTOP SIDEBAR — dark charcoal
      ════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-[232px] shrink-0 h-screen sticky top-0 z-40 bg-[#1C1917]">
        <SidebarContent />
      </aside>

      {/* ════════════════════════════════════════
          PAGE BODY
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">

        {/* ── Desktop top bar ── */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-[#EBEBEB] sticky top-0 z-30">
          <div>
            <h1 className="font-bold text-[20px] text-[#1A1A1A] tracking-tight">{title}</h1>
            {subtitle && <p className="text-[13px] text-[#9CA3AF] mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {topBarRight}
            {showBell && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={openBell}
                  className="relative w-9 h-9 rounded-full bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#EBEBEB] transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#C84B31] rounded-full border border-white flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <NotificationPanel
                    notifications={notifications}
                    loading={notifLoading}
                    onClose={() => setBellOpen(false)}
                    onNavigate={navigate}
                  />
                )}
              </div>
            )}
            <div className="h-6 w-px bg-[#EBEBEB]" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] flex items-center justify-center text-base select-none">
                👤
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1A1A1A] leading-none">{adminName}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Mobile top bar ── */}
        <header className="md:hidden sticky top-0 z-40 bg-[#1C1917] px-4 py-3.5 flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #C84B31, #F2924A)' }}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[15px] text-white tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {showBell && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={openBell}
                  className="relative w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-[#9CA3AF]"
                >
                  <Bell className="w-4 h-4" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#C84B31] rounded-full border border-[#1C1917] flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="fixed left-4 right-4 top-16 z-50">
                    <NotificationPanel
                      notifications={notifications}
                      loading={notifLoading}
                      onClose={() => setBellOpen(false)}
                      onNavigate={navigate}
                    />
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-[#9CA3AF]"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>

        {/* ── Mobile bottom nav ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1C1917] border-t border-white/8 flex items-center justify-around px-2 pt-2 pb-5 z-50">
          {MOBILE_TABS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <button
                key={href}
                onClick={() => navigate(href)}
                className="flex flex-col items-center gap-1 px-3 py-1 min-w-0"
              >
                <Icon className={cn('w-5 h-5 transition-colors', active ? 'text-[#C84B31]' : 'text-[#4B5563]')} />
                <span className={cn('text-[9px] font-medium truncate', active ? 'text-[#C84B31]' : 'text-[#4B5563]')}>
                  {label}
                </span>
                {active && <div className="w-1 h-1 rounded-full bg-[#C84B31]" />}
              </button>
            );
          })}
        </nav>

      </div>

      {/* ════════════════════════════════════════
          MOBILE DRAWER
      ════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed top-0 right-0 h-full w-[288px] bg-[#1C1917] z-50 flex flex-col shadow-2xl">
            {/* Drawer close */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #C84B31, #F2924A)' }}
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-[15px] text-white tracking-tight">Glamr</span>
                  <span className="ml-1.5 text-[10px] font-bold text-[#C84B31] bg-[#C84B31]/15 px-1.5 py-0.5 rounded-md">ADMIN</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-[#9CA3AF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Admin profile */}
            <div className="px-4 py-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C84B31]/20 border border-[#C84B31]/30 flex items-center justify-center text-lg select-none">
                  👤
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[14px] text-white truncate">{adminName}</p>
                  <p className="text-[11px] text-[#6B7280] truncate">{adminEmail}</p>
                </div>
              </div>
            </div>

            {/* Nav groups */}
            <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[9px] font-bold text-[#4B5563] uppercase tracking-widest px-3 mb-1">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map(({ href, label, Icon }) => (
                      <NavItem
                        key={href}
                        href={href}
                        label={label}
                        Icon={Icon}
                        active={isActive(href)}
                        onClick={() => navigate(href)}
                        compact
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Bottom */}
            <div className="px-3 py-3 border-t border-white/8 space-y-0.5">
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[#9CA3AF] hover:bg-white/5 hover:text-white transition-all"
              >
                <ChevronRight className="w-4 h-4 text-[#6B7280] shrink-0" />
                <span className="text-[14px] font-medium">View Client App</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[#9CA3AF] hover:bg-red-900/20 hover:text-red-400 transition-all group"
              >
                <LogOut className="w-4 h-4 text-[#6B7280] shrink-0 group-hover:text-red-400" />
                <span className="text-[14px] font-medium">Log out</span>
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}