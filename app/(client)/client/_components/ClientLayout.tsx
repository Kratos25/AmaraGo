"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scissors, Calendar, User } from "lucide-react";

const navLinks = [
  { href: "/client/home",     label: "Home",     icon: Home     },
  { href: "/client/services", label: "Services", icon: Scissors },
  { href: "/client/bookings", label: "Bookings", icon: Calendar },
  { href: "/client/profile",  label: "Profile",  icon: User     },
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white">

      {/* ── Desktop top nav (md and above) ──────────────────────── */}
      <header className="hidden md:flex sticky top-0 z-50 h-16 bg-[#111827] shadow-lg items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-8">

          {/* Logo */}
          <Link href="/client/home" className="flex items-center gap-0.5 select-none">
            <span className="text-[#e5849c] font-extrabold text-2xl tracking-tight">Amara</span>
            <span className="text-white font-extrabold text-2xl tracking-tight">Go</span>
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
                    active ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#e5849c] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right spacer — keeps logo+links centred */}
          <div className="w-28" />
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────── */}
      <main className="pb-20 md:pb-0">{children}</main>

      {/* ── Mobile bottom tab bar (hidden on md+) ───────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#111827]">
        <div className="flex h-16">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${
                  active ? "text-[#e5849c]" : "text-gray-500"
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
