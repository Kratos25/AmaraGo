'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home, ClipboardList, Wallet, User, BookOpen,
  Calendar, Settings, LogOut, Bell, Menu, X,
  ArrowLeftRight,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import Image from 'next/image';
import Logo from '@/public/Amara_Logo.png';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { providersAPI, type ProviderProfile, type ProviderNotification } from '@/lib/api';
import { useAuth } from '@/config/context/AuthContext';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Design tokens ────────────────────────────────────────────────────────────
// Primary   #C84B31   Hover #B04028
// Tint bg   #FFF0EC   Tint border #FDDDD5
// Page bg   #F5F4F2   Surface #FFFFFF
// Border    #EBEBEB
// Text-1    #1A1A1A   Text-2 #6B7280   Text-3 #9CA3AF

const NAV_ITEMS = [
  { href: '/provider',           label: 'Dashboard', Icon: Home },
  { href: '/provider/my-jobs',   label: 'My Jobs',   Icon: ClipboardList },
  { href: '/provider/schedule',  label: 'Schedule',  Icon: Calendar },
  { href: '/provider/earnings',  label: 'Earnings',  Icon: Wallet },
  { href: '/provider/profile',   label: 'Profile',   Icon: User },
  { href: '/provider/training',  label: 'Training',  Icon: BookOpen },
] as const;

const MOBILE_NAV_ITEMS = [
  { href: '/provider',          label: 'Home',     Icon: Home },
  { href: '/provider/my-jobs',     label: 'My Jobs',     Icon: ClipboardList },
  { href: '/provider/earnings', label: 'Earnings', Icon: Wallet },
  { href: '/provider/profile',  label: 'Profile',  Icon: User },
] as const;

// ─── Online Switch ────────────────────────────────────────────────────────────

function OnlineSwitch({ checked, onCheckedChange }: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      style={{ padding: 3 }}
      className={cn(
        'relative inline-flex h-[28px] w-[52px] shrink-0 cursor-pointer rounded-full',
        'transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        checked ? 'bg-white' : 'bg-white/25',
      )}
    >
      <span className={cn(
        'h-[22px] w-[22px] rounded-full shadow-sm',
        'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        checked ? 'bg-[#C84B31] translate-x-[24px]' : 'bg-white/65 translate-x-0',
      )} />
    </button>
  );
}

// ─── Notification Panel ───────────────────────────────────────────────────────

function ProviderNotifPanel({
  notifications,
  loading,
  onClose,
  onNavigate,
}: {
  notifications: ProviderNotification[];
  loading: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
}) {
  const ICON_CFG = {
    new_booking:        { emoji: '📋', bg: 'bg-[#FFF0EC]', border: 'border-[#FDDDD5]' },
    new_rating:         { emoji: '⭐', bg: 'bg-amber-50',   border: 'border-amber-100' },
    booking_cancelled:  { emoji: '❌', bg: 'bg-red-50',     border: 'border-red-100'   },
    job_offer:          { emoji: '🛎️', bg: 'bg-orange-50',  border: 'border-orange-100' },
  };

  return (
    <div className="absolute right-0 top-12 w-[320px] bg-white border border-[#EBEBEB] rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#EBEBEB]">
        <p className="font-bold text-[14px] text-[#1A1A1A]">Notifications</p>
        <button onClick={onClose} className="w-6 h-6 rounded-full bg-[#F5F4F2] flex items-center justify-center text-[#6B7280] hover:bg-[#EBEBEB]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="max-h-[380px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-[#C84B31] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center mb-3 text-xl">
              🔔
            </div>
            <p className="text-[13px] font-semibold text-[#1A1A1A]">No notifications</p>
            <p className="text-[11px] text-[#9CA3AF] mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EBEBEB]">
            {notifications.map((n) => {
              const cfg = ICON_CFG[n.type] ?? ICON_CFG.new_booking;
              const href = n.type === 'new_booking' || n.type === 'booking_cancelled'
                ? '/provider/my-jobs'
                : '/provider/my-jobs';
              return (
                <button
                  key={n.id}
                  onClick={() => onNavigate(href)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#FFF0EC]/50 transition-colors text-left"
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 text-sm', cfg.bg, cfg.border)}>
                    {cfg.emoji}
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

// ─── Provider Layout ──────────────────────────────────────────────────────────

interface ProviderLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  topBarRight?: React.ReactNode;
  showBell?: boolean;
}

export default function ProviderLayout({
  children,
  title,
  subtitle,
  topBarRight,
  showBell = true,
}: ProviderLayoutProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [profile, setProfile]               = useState<ProviderProfile | null>(null);
  const [isOnline, setIsOnline]             = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications
  const [bellOpen, setBellOpen]             = useState(false);
  const [notifLoading, setNotifLoading]     = useState(false);
  const [notifications, setNotifications]   = useState<ProviderNotification[]>([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  const getSeenIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem('provider_seen_notifs') ?? '[]'); }
    catch { return []; }
  };
  const markAllSeen = (notifs: ProviderNotification[]) => {
    try { localStorage.setItem('provider_seen_notifs', JSON.stringify(notifs.map((n) => n.id))); }
    catch {}
  };
  const countUnread = (notifs: ProviderNotification[]) => {
    const seen = new Set(getSeenIds());
    return notifs.filter((n) => !seen.has(n.id)).length;
  };

  useEffect(() => {
    providersAPI.getMyNotifications()
      .then(({ data }) => { setNotifications(data); setUnreadCount(countUnread(data)); })
      .catch(() => {});
  }, []);

  const openBell = () => {
    setBellOpen((prev) => {
      if (!prev) {
        setNotifLoading(true);
        providersAPI.getMyNotifications()
          .then(({ data }) => {
            setNotifications(data);
            markAllSeen(data);
            setUnreadCount(0);
          })
          .catch(() => {})
          .finally(() => setNotifLoading(false));
      }
      return !prev;
    });
  };

  // Close bell on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  // Load initial profile + online status from backend
  useEffect(() => {
    providersAPI.getMyProfile()
      .then(({ data }) => { setProfile(data); setIsOnline(data.is_online); })
      .catch(() => {});
  }, []);

  // Derived display values — prefer backend profile, fall back to Firebase user
  const photoURL    = user?.photoURL   ?? profile?.profile_image ?? null;
  const displayName = profile?.name    ?? user?.displayName      ?? 'Provider';
  const displayEmail= profile?.email   ?? user?.email            ?? '';
  const roleLabel   = profile?.services_offered?.length
    ? profile.services_offered.slice(0, 2).join(' & ')
    : 'Service Professional';
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  // ── Profile avatar (photo or gradient initials) ────────────────────────────
  const Avatar = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
    const dim = size === 'md' ? 'w-10 h-10' : 'w-9 h-9';
    if (photoURL) {
      return (
        <div className={cn(dim, 'rounded-full overflow-hidden border border-[#EBEBEB] shrink-0 select-none')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoURL} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      );
    }
    return (
      <div className={cn(dim, 'rounded-full shrink-0 select-none flex items-center justify-center text-white font-bold text-xs')}
        style={{ background: 'linear-gradient(135deg, #C84B31, #F2924A)' }}>
        {initials}
      </div>
    );
  };

  const handleOnlineToggle = async (value: boolean) => {
    setIsOnline(value); // optimistic
    try {
      const { data } = await providersAPI.toggleOnline(value);
      setProfile(data);
      setIsOnline(data.is_online);
    } catch {
      setIsOnline(!value); // revert on error
    }
  };

  const isActive = (href: string) =>
    href === '/provider' ? pathname === '/provider' : pathname.startsWith(href);

  // ── Reusable "Go to Client Page" button ───────────────────────────────────
  const ClientPageButton = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
    <button
      onClick={() => router.push('/')}
      className={cn(
        'flex items-center gap-2 rounded-xl border border-[#FDDDD5] bg-[#FFF0EC]',
        'text-[#C84B31] font-semibold transition-all hover:bg-[#FFE8E0] hover:border-[#C84B31]/30 active:scale-95',
        size === 'sm' ? 'px-3 py-1.5 text-[12px]' : 'px-3.5 py-2 text-[13px]',
      )}
    >
      <ArrowLeftRight className={cn('shrink-0', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      Client Page
    </button>
  );

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

  // ── Sidebar bottom actions (shared between desktop sidebar + mobile drawer) ─
  const SidebarBottom = ({ itemPy = 'py-2.5', textSize = 'text-[13px]', onNav }: {
    itemPy?: string;
    textSize?: string;
    onNav?: () => void;
  }) => (
    <div className="px-3 py-3 border-t border-[#EBEBEB] space-y-0.5">
      {/* Go to Client Page */}
      <button
        onClick={() => { router.push('/client/home'); onNav?.(); }}
        className={cn(
          'w-full flex items-center gap-3 px-3 rounded-xl transition-all group',
          'text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] hover:bg-[#FFE8E0]',
          itemPy,
        )}
      >
        <ArrowLeftRight className="w-4 h-4 shrink-0 text-[#C84B31]" />
        <span className={cn(textSize, 'font-semibold')}>Client Page</span>
      </button>

      <button
        onClick={() => { router.push('/provider/settings'); onNav?.(); }}
        className={cn(
          'w-full flex items-center gap-3 px-3 rounded-xl text-[#6B7280] hover:bg-[#F5F4F2] hover:text-[#1A1A1A] transition-all',
          itemPy,
        )}
      >
        <Settings className="w-4 h-4 text-[#9CA3AF] shrink-0" />
        <span className={cn(textSize, 'font-medium')}>Settings</span>
      </button>

      <button
        onClick={handleLogout}
        className={cn(
          'w-full flex items-center gap-3 px-3 rounded-xl text-[#6B7280] hover:bg-red-50 hover:text-red-600 transition-all group',
          itemPy,
        )}
      >
        <LogOut className="w-4 h-4 text-[#9CA3AF] shrink-0 group-hover:text-red-500 transition-colors" />
        <span className={cn(textSize, 'font-medium')}>Log out</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F4F2] flex">

      {/* ════════════════════════════════════════
          DESKTOP SIDEBAR
      ════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 h-screen bg-white border-r border-[#EBEBEB] sticky top-0 z-40">

        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-[#EBEBEB]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              // style={{ background: 'linear-gradient(135deg, #C84B31, #F2924A)' }}
            >
              <Image src={Logo} alt="Amara Logo" className="w-8 h-8 rounded-lg" />
              {/* <Star className="w-4 h-4 text-white" /> */}
            </div>
            <span className="font-bold text-[15px] text-[#1A1A1A] tracking-tight">AmaraGo</span>
          </div>
        </div>

        {/* Profile + online toggle */}
        <div className="px-4 py-4 border-b border-[#EBEBEB]">
          <div className="flex items-center gap-3 mb-3">
            <Avatar size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[#1A1A1A] truncate">{displayName}</p>
              <p className="text-[11px] text-[#9CA3AF] truncate">{displayEmail || roleLabel}</p>
            </div>
          </div>
          <div
            className="rounded-xl px-3 py-2.5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #C84B31 0%, #E8703A 55%, #F2924A 100%)' }}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-35" />}
                <span className={cn('relative inline-flex rounded-full h-2 w-2', isOnline ? 'bg-white' : 'bg-white/30')} />
              </span>
              <p className="text-[12px] font-semibold text-white">{isOnline ? 'Online' : 'Offline'}</p>
            </div>
            <OnlineSwitch checked={isOnline} onCheckedChange={handleOnlineToggle} />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                  active ? 'bg-[#FFF0EC] text-[#C84B31]' : 'text-[#6B7280] hover:bg-[#F5F4F2] hover:text-[#1A1A1A]',
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#C84B31]' : 'text-[#9CA3AF]')} />
                <span className={cn('text-[13px]', active ? 'font-semibold' : 'font-medium')}>{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C84B31]" />}
              </button>
            );
          })}
        </nav>

        <SidebarBottom />
      </aside>

      {/* ════════════════════════════════════════
          PAGE BODY
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">

        {/* ── Desktop top bar ── */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-[#EBEBEB] sticky top-0 z-30">
          <div>
            <h1 className="font-bold text-xl text-[#1A1A1A] tracking-tight">{title}</h1>
            {subtitle && <p className="text-[13px] text-[#9CA3AF] mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {topBarRight}

            {/* Go to Client Page */}
            <ClientPageButton size="sm" />

            {showBell && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={openBell}
                  className="relative w-9 h-9 rounded-full bg-[#F5F4F2] flex items-center justify-center text-[#6B7280] hover:bg-[#EBEBEB] transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#C84B31] rounded-full border border-white flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <ProviderNotifPanel
                    notifications={notifications}
                    loading={notifLoading}
                    onClose={() => setBellOpen(false)}
                    onNavigate={(href) => { router.push(href); setBellOpen(false); }}
                  />
                )}
              </div>
            )}
            <div className="h-6 w-px bg-[#EBEBEB]" />
            <div className="flex items-center gap-2.5">
              <Avatar size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A] truncate max-w-[140px]">{displayName}</p>
                {displayEmail && <p className="text-[11px] text-[#9CA3AF] truncate max-w-[140px]">{displayEmail}</p>}
              </div>
            </div>
          </div>
        </header>

        {/* ── Mobile top bar ── */}
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-[#EBEBEB] px-4 py-3.5 flex items-center gap-3">
          <Avatar size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[#9CA3AF] text-[11px]">{getGreeting()}</p>
            <h1 className="font-bold text-[15px] text-[#1A1A1A] tracking-tight truncate">{displayName}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Go to Client Page (mobile icon-only) */}
            <button
              onClick={() => router.push('/')}
              className="w-9 h-9 rounded-full bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center text-[#C84B31] hover:bg-[#FFE8E0] transition-colors"
              aria-label="Go to client page"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            {showBell && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={openBell}
                  className="relative w-9 h-9 rounded-full bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280]"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#C84B31] rounded-full border border-white flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="fixed left-4 right-4 top-16 z-50">
                    <ProviderNotifPanel
                      notifications={notifications}
                      loading={notifLoading}
                      onClose={() => setBellOpen(false)}
                      onNavigate={(href) => { router.push(href); setBellOpen(false); }}
                    />
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 rounded-full bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280]"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ── Scrollable page content ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-28 md:p-8 md:pb-8">
          {children}
        </div>

        {/* ── Mobile bottom nav ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#EBEBEB] flex items-center justify-around px-2 pt-2 pb-5 z-50">
          {MOBILE_NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="flex flex-col items-center gap-1 px-5 py-1"
              >
                <Icon className={cn('w-5 h-5 transition-colors', active ? 'text-[#C84B31]' : 'text-[#9CA3AF]')} />
                <span className={cn('text-[10px] font-medium', active ? 'text-[#C84B31]' : 'text-[#9CA3AF]')}>
                  {label}
                </span>
                {active && <div className="w-1 h-1 rounded-full bg-[#C84B31]" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ════════════════════════════════════════
          MOBILE SLIDE-OUT DRAWER
      ════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed top-0 right-0 h-full w-[280px] bg-white z-50 flex flex-col shadow-xl">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-[#EBEBEB]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  // style={{ background: 'linear-gradient(135deg, #C84B31, #F2924A)' }}
                >
                  <Image src={Logo} alt="Amara Logo" className="w-8 h-8 rounded-lg" />
                  {/* <Star className="w-4 h-4 text-white" /> */}
                </div>
                <span className="font-bold text-[15px] text-[#1A1A1A] tracking-tight">AmaraGo</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F5F4F2] flex items-center justify-center text-[#6B7280]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile + online */}
            <div className="px-4 py-4 border-b border-[#EBEBEB]">
              <div className="flex items-center gap-3 mb-3">
                <Avatar size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#1A1A1A] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#9CA3AF] truncate">{roleLabel}</p>
                  {displayEmail && <p className="text-[10px] text-[#9CA3AF] truncate">{displayEmail}</p>}
                </div>
              </div>
              <div
                className="rounded-xl px-3 py-2.5 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #C84B31 0%, #E8703A 55%, #F2924A 100%)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-35" />}
                    <span className={cn('relative inline-flex rounded-full h-2 w-2', isOnline ? 'bg-white' : 'bg-white/30')} />
                  </span>
                  <p className="text-[12px] font-semibold text-white">{isOnline ? 'Online' : 'Offline'}</p>
                </div>
                <OnlineSwitch checked={isOnline} onCheckedChange={handleOnlineToggle} />
              </div>
            </div>

            {/* All nav links */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <button
                    key={href}
                    onClick={() => { router.push(href); setMobileMenuOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all',
                      active ? 'bg-[#FFF0EC] text-[#C84B31]' : 'text-[#6B7280] hover:bg-[#F5F4F2] hover:text-[#1A1A1A]',
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#C84B31]' : 'text-[#9CA3AF]')} />
                    <span className={cn('text-[14px]', active ? 'font-semibold' : 'font-medium')}>{label}</span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C84B31]" />}
                  </button>
                );
              })}
            </nav>

            <SidebarBottom itemPy="py-3" textSize="text-[14px]" onNav={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}

    </div>
  );
}