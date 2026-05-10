"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Scissors, Calendar, User, ShoppingCart, ChevronDown, LogIn, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useCart } from "@/config/context/CartContext";

const navLinks = [
  { href: "/client/home",     label: "Home",     icon: Home     },
  { href: "/client/services", label: "Services", icon: Scissors },
  { href: "/client/bookings", label: "Bookings", icon: Calendar },
  { href: "/client/profile",  label: "Profile",  icon: User     },
];



function ProfileDropdown() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [open, setOpen] = useState(false);
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
    await signOut(auth);
    await fetch("/api/logout", { method: "POST" });
    setOpen(false);
    router.push("/client/home");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Profile menu"
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <User size={22} className="text-white" />
        )}
        <ChevronDown size={14} className={`text-white/70 transition-transform ${open ? "rotate-180" : ""}`} />
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
  );
}

// ── Cart icon (dark theme for white navbar) ─────────────────
function CartIconDark() {
  const { itemCount } = useCart();
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/client/cart")}
      className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      aria-label="Cart"
    >
      <ShoppingCart size={22} className="text-[#111827]" />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#E91E8C] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FEF0F5]">

      {/* ── Desktop top nav ─────────────────────────────────────── */}
      <header className="hidden md:flex sticky top-0 z-50 h-16 bg-white border-b border-gray-200 shadow-sm items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-8">

          {/* Logo */}
          <Link href="/client/home" className="flex items-center gap-0 select-none">
            <span className="text-[#E91E8C] font-extrabold text-2xl tracking-tight">Amara</span>
            <span className="text-[#111827] font-extrabold text-2xl tracking-tight">Go</span>
          </Link>

          {/* Nav links */}
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
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#E91E8C] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right — Cart + Profile */}
          <div className="flex items-center gap-1">
            <CartIconDark />
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* ── Mobile top bar (logo + cart + profile) ──────────────── */}
      <header className="md:hidden sticky top-0 z-50 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
        <Link href="/client/home" className="flex items-center gap-0 select-none">
          <span className="text-[#E91E8C] font-extrabold text-xl tracking-tight">Amara</span>
          <span className="text-[#111827] font-extrabold text-xl tracking-tight">Go</span>
        </Link>
        <div className="flex items-center gap-1">
          <CartIconDark />
          <ProfileDropdown />
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────── */}
      <main className="pb-20 md:pb-0">{children}</main>

      {/* ── Mobile bottom tab bar ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#111827]">
        <div className="flex h-16">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${
                  active ? "text-[#E91E8C]" : "text-gray-500"
                }`}
              >
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