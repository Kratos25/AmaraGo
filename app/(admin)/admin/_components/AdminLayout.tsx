'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCircle, CalendarCheck,
  Scissors, CreditCard, Settings, Bell, Menu, X,
  ShieldCheck, LogOut, ChevronRight,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';

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
  href, label, Icon, active, onClick, compact = false,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
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
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C84B31]" />}
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
      </div>

      {/* Admin profile */}
      <div className="px-4 py-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C84B31]/20 border border-[#C84B31]/30 flex items-center justify-center text-base shrink-0 select-none">
            👤
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[13px] text-white truncate">Super Admin</p>
            <p className="text-[11px] text-[#6B7280]">admin@glamr.in</p>
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
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9CA3AF] hover:bg-white/5 hover:text-white transition-all"
        >
          <ChevronRight className="w-4 h-4 text-[#6B7280] shrink-0" />
          <span className="text-[13px] font-medium">View Client App</span>
        </button>
        <button
          onClick={() => navigate('/login')}
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
              <button className="relative w-9 h-9 rounded-full bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#EBEBEB] transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C84B31] rounded-full border border-white" />
              </button>
            )}
            <div className="h-6 w-px bg-[#EBEBEB]" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] flex items-center justify-center text-base select-none">
                👤
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1A1A1A] leading-none">Super Admin</p>
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
              <button className="relative w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-[#9CA3AF]">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C84B31] rounded-full border border-[#1C1917]" />
              </button>
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
                  <p className="font-semibold text-[14px] text-white truncate">Super Admin</p>
                  <p className="text-[11px] text-[#6B7280]">admin@glamr.in</p>
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
                onClick={() => navigate('/login')}
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