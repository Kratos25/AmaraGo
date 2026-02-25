"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Scissors, Calendar, User } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5849c] shadow-lg z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around py-2">
            <Link
              href="/client/home"
              className={`flex flex-col items-center py-1 px-3 ${
                isActive('/client/home') ? 'text-[#e5849c]' : 'text-gray-600'
              }`}
            >
              <Home size={24} />
              <span className="text-xs mt-1">Home</span>
            </Link>

            <Link
              href="/client/services"
              className={`flex flex-col items-center py-1 px-3 ${
                isActive('/client/services') ? 'text-[#e5849c]' : 'text-gray-600'
              }`}
            >
              <Scissors size={24} />
              <span className="text-xs mt-1">Services</span>
            </Link>

            <Link
              href="/client/bookings"
              className={`flex flex-col items-center py-1 px-3 ${
                isActive('/client/bookings') ? 'text-[#e5849c]' : 'text-gray-600'
              }`}
            >
              <Calendar size={24} />
              <span className="text-xs mt-1">Bookings</span>
            </Link>

            <Link
              href="/client/profile"
              className={`flex flex-col items-center py-1 px-3 ${
                isActive('/client/profile') ? 'text-[#e5849c]' : 'text-gray-600'
              }`}
            >
              <User size={24} />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}