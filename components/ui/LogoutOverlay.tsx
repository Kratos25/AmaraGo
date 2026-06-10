'use client';

import React from 'react';
import Image from 'next/image';
import Logo from '@/public/Amara_Logo.png';

export function LogoutOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-6 animate-fade-in">
      <div className="flex flex-col items-center gap-3">
        <Image src={Logo} alt="AmaraGo" className="w-16 h-16 rounded-2xl" />
        <h1 className="text-2xl font-bold text-white tracking-tight">AmaraGo</h1>
      </div>

      <div className="w-48 h-1 rounded-full bg-white/20 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[#e5849c] to-[#E91E8C] animate-line-loader-once" />
      </div>

      <p className="text-sm text-white/70">Signing you out…</p>
    </div>
  );
}
