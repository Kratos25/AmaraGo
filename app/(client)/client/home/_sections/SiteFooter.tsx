'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export function SiteFooter() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <footer className="bg-[#111827] text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-0 mb-4">
              <span className="text-[#E8708E] font-extrabold text-2xl">Amara</span>
              <span className="text-white font-extrabold text-2xl">Go</span>
            </div>
            <p className="text-gray-400 text-sm mb-3">+1 (7635) 547-12-97</p>
            <p className="text-gray-400 text-sm">support@amara.go</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => router.push('/client/services')}
                  className="text-gray-400 text-sm hover:text-white transition-colors"
                >
                  Product
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/client/home')}
                  className="text-gray-400 text-sm hover:text-white transition-colors"
                >
                  Information
                </button>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-bold text-sm mb-4">About</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => router.push('/client/home')}
                  className="text-gray-400 text-sm hover:text-white transition-colors"
                >
                  Company
                </button>
              </li>
              <li>
                <button className="text-gray-400 text-sm hover:text-white transition-colors">
                  Site Map
                </button>
              </li>
            </ul>
          </div>

          {/* Subscribe */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-bold text-sm mb-4">Subscribe</h4>
            <div className="flex items-center bg-white rounded-md overflow-hidden w-full">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Get updates..."
                className="flex-1 min-w-0 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
              />
              <button className="flex-shrink-0 px-2 py-2.5 text-[#E8708E] hover:text-[#d45070] transition-colors">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-gray-500 text-xs text-center sm:text-left">
            © 2026 AmaraGo. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-colors">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-colors">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" aria-label="Twitter" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-colors">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}