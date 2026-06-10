"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SiteFooter } from '@/app/(client)/client/home/_sections/SiteFooter';
import { Home, Scissors, Calendar, User, ShoppingCart, ChevronDown, ChevronRight, LogIn, LogOut, Search } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useCart } from "@/config/context/CartContext";
import { useSearchVisibility } from '@/config/context/SearchVisibilityContext';
import { Service } from '@/app/(client)/client/home/_types';
import { LogoutOverlay } from '@/components/ui/LogoutOverlay';

const navLinks = [
  { href: "/client/home",      label: "Home",      icon: Home     },
  { href: "/client/services",  label: "Services",  icon: Scissors },
  { href: "/client/bookings",  label: "Bookings",  icon: Calendar },
];



function ProfileDropdown() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    setLoggingOut(true);
    setOpen(false);
    await signOut(auth);
    await fetch("/api/logout", { method: "POST" });
    setTimeout(() => { window.location.href = "/client/home"; }, 1500);
  };

  return (
    <>
    {loggingOut && <LogoutOverlay />}
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 p-2 rounded-full hover:bg-white transition-colors"
        aria-label="Profile menu"
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <User size={22} className="text-gray-700" />
        )}
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {user ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.displayName ?? "My Account"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => { router.push("/client/profile"); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User size={15} /> View Profile
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => { router.push("/login"); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogIn size={15} /> Login / Sign Up
            </button>
          )}
        </div>
      )}
    </div>
    </>
  );
}

// ── Cart icon (dark theme for white navbar) ─────────────────
function CartIconDark() {
  const { itemCount } = useCart();
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/client/cart")}
      className="relative p-3 rounded-full bg-[#FFFFFF] border border-gray-100 shadow-sm transition-colors hover:bg-gray-50"
      aria-label="Cart"
    >
      <ShoppingCart size={20} className="text-[#E8708E]" />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#D32F2F] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}

// ── Compact navbar search ────────────────────────────────────────────
function NavbarSearch({
  services,
  onNavigate,
}: {
  services: Service[];
  onNavigate: (id: string) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return services.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, services]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/client/services?q=${encodeURIComponent(query.trim())}`);
      setFocused(false);
      setQuery('');
    }
  };

  const showDropdown = focused && query.trim().length > 0;

  return (
    <div ref={ref} className="relative w-full">  {/* ← relative anchor for dropdown */}
      <form onSubmit={handleSubmit}>
        <div className="flex items-center bg-white rounded-full border border-[#E8708E]/40 shadow-sm h-9 px-3 gap-2">
          <Search size={14} className="text-[#E8708E] flex-shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search services…"
            className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button
              type="submit"
              className="text-[10px] font-bold text-white bg-[#E8708E] px-2.5 py-1 rounded-full flex-shrink-0"
            >
              Go
            </button>
          )}
        </div>
      </form>

      {/* Dropdown — z-[9999] to float above everything */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[9999]">
          {results.length > 0 ? (
            <>
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onNavigate(s.id);
                    setFocused(false);
                    setQuery('');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50 transition-colors text-left border-b border-gray-50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.duration} · {s.discountedPrice}</p>
                  </div>
                  {s.discount && (
                    <span className="text-[10px] font-bold text-[#E91E8C] bg-[#E91E8C]/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {s.discount}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  router.push(`/client/services?q=${encodeURIComponent(query.trim())}`);
                  setFocused(false);
                }}
                className="w-full px-4 py-2.5 text-xs font-semibold text-[#E91E8C] hover:bg-pink-50 transition-colors text-center"
              >
                See all results for "{query}" →
              </button>
            </>
          ) : (
            <div className="px-4 py-4 text-sm text-gray-400 text-center">
              No services found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Floating cart bar ───────────────────────────────────────
function FloatingCartBar() {
  const { itemCount, subtotal } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  if (itemCount === 0 || pathname === '/client/checkout' || pathname === '/client/cart') return null;

  return (
    <>
      {/* Mobile: sticky bar above bottom tab nav */}
      <div className="md:hidden fixed bottom-16 inset-x-0 z-40 px-3 pb-2">
        <button
          onClick={() => router.push('/client/checkout')}
          className="w-full flex items-center justify-between bg-[#111827] text-white rounded-2xl px-4 py-3.5 shadow-2xl active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="bg-[#E8708E] text-white text-xs font-bold min-w-[22px] h-[22px] rounded-full flex items-center justify-center px-1">
              {itemCount}
            </span>
            <span className="text-sm font-semibold">View Cart</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
            <ChevronRight size={16} className="text-[#E8708E]" />
          </div>
        </button>
      </div>

      {/* Desktop: floating pill bottom-right */}
      <div className="hidden md:block fixed bottom-8 right-8 z-40">
        <button
          onClick={() => router.push('/client/checkout')}
          className="flex items-center gap-3 bg-[#111827] text-white rounded-full pl-4 pr-5 py-3 shadow-2xl hover:bg-[#1f2937] transition-all hover:scale-105 active:scale-100"
        >
          <ShoppingCart size={17} className="text-[#E8708E]" />
          <span className="text-sm font-semibold">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
          <span className="w-px h-4 bg-white/20" />
          <span className="text-sm font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
          <span className="text-xs font-bold text-[#E8708E] uppercase tracking-wide">Checkout →</span>
        </button>
      </div>
    </>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { heroSearchVisible, navServices, navigateToService } = useSearchVisibility();
  const { itemCount } = useCart();

  const isCheckout = pathname === '/client/checkout';
  const isCart = pathname === '/client/cart';
  const showCartBar = itemCount > 0 && !isCheckout && !isCart;

  const isHomePage = pathname === '/client/home';
  // On home: show when hero search scrolls out of view. On all other pages: always show.
  const showNavSearch = isHomePage ? !heroSearchVisible : true;

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFEAEF]">

      {/* ── Desktop top nav ─────────────────────────────────────── */}
      <header className={`hidden md:flex sticky top-0 z-50 h-16 items-center transition-all duration-300 ${
        scrolled ? 'bg-white/70 backdrop-blur-xl shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-8">

          {/* Logo — shrinks slightly when search is present */}
          <Link href="/client/home" className="flex items-center gap-0 select-none flex-shrink-0">
            <span className="text-[#E8708E] font-extrabold text-2xl tracking-tight">Amara</span>
            <span className="text-[#111827] font-extrabold text-2xl tracking-tight">Go</span>
          </Link>

          {/* Nav links — hidden when navbar search is shown to save space */}
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-5 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                    active ? "text-[#111827]" : "text-gray-500 hover:text-[#111827] hover:bg-gray-50"
                  }`}
                >
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gradient-to-r from-[#E8708E] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Navbar search — slides in with animation */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              showNavSearch ? "opacity-100 max-w-xs w-full" : "opacity-0 max-w-0 w-0 pointer-events-none"
            }`}
          >
            {showNavSearch && <NavbarSearch services={navServices} onNavigate={navigateToService} />}
          </div>

          {/* Right — Cart + Profile */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <CartIconDark />
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      <header className={`md:hidden sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm' : 'bg-transparent border-b border-transparent'
      }`}>
        {/* Row 1: logo + cart + profile — always visible */}
        <div className="h-14 flex items-center justify-between px-4">
          <Link href="/client/home" className="flex items-center gap-0 select-none">
            <span className="text-[#E91E8C] font-extrabold text-xl tracking-tight">Amara</span>
            <span className="text-[#111827] font-extrabold text-xl tracking-tight">Go</span>
          </Link>
          <div className="flex items-center gap-1">
            <CartIconDark />
            <ProfileDropdown />
          </div>
        </div>

        {/* Row 2: compact search — slides down when hero search is off-screen */}
        <div className={`transition-all duration-300 ease-in-out ${
          showNavSearch ? 'max-h-14 opacity-100 pb-2 px-4' : 'max-h-0 opacity-0 pointer-events-none'
        }`}>
          {showNavSearch && <NavbarSearch services={navServices} onNavigate={navigateToService} />}
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────── */}
      <main className={`${showCartBar ? 'pb-36' : 'pb-20'} md:pb-0`}>
        {children}
        {!isCheckout && <SiteFooter />}
      </main>

      {/* ── Floating cart bar ───────────────────────────────────── */}
      <FloatingCartBar />

      {/* ── Mobile bottom tab bar ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#111827]">
        <div className="flex h-16">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${active ? 'text-[#E91E8C]' : 'text-gray-500'}`}>
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}