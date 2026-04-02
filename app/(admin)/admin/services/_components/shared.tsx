'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  icon: string;
  serviceCount: number;
  active: boolean;
  description: string;
}

export interface Service {
  id: string;
  name: string;
  categoryId: string;
  duration: string;
  basePrice: number;
  discountedPrice?: number;
  rating: number;
  bookings: number;
  active: boolean;
  popular: boolean;
  description: string;
}

export interface Package {
  id: string;
  name: string;
  tagline: string;
  services: string[];
  duration: string;
  originalPrice: number;
  price: number;
  savings: number;
  rating: number;
  bookings: number;
  active: boolean;
  badge?: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  active: boolean;
  applicableFor: 'all' | 'new_users' | 'returning';
  autoApply: boolean;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Hair Care',     icon: '✂️', serviceCount: 5, active: true,  description: 'Cuts, styling, spa & coloring' },
  { id: 'cat2', name: 'Skin Care',     icon: '🧴', serviceCount: 6, active: true,  description: 'Facials, cleanup & treatments' },
  { id: 'cat3', name: 'Makeup',        icon: '💄', serviceCount: 4, active: true,  description: 'Party, bridal & HD makeup'     },
  { id: 'cat4', name: 'Nail Art',      icon: '💅', serviceCount: 3, active: true,  description: 'Nail art, gel & extensions'    },
  { id: 'cat5', name: 'Spa & Massage', icon: '🧖‍♀️', serviceCount: 4, active: true,  description: 'Body treatments & relaxation' },
  { id: 'cat6', name: 'Waxing',        icon: '🪒', serviceCount: 4, active: true,  description: 'Full body & bikini waxing'     },
  { id: 'cat7', name: 'Bridal',        icon: '👰', serviceCount: 3, active: true,  description: 'Complete bridal packages'      },
  { id: 'cat8', name: 'Eyebrows',      icon: '👁️', serviceCount: 2, active: false, description: 'Shaping & threading'           },
];

export const SEED_SERVICES: Service[] = [
  { id: 's1',  name: 'Classic Haircut + Blow Dry', categoryId: 'cat1', duration: '60 min',  basePrice: 1200, discountedPrice: 899,      rating: 4.8, bookings: 1240, active: true,  popular: true,  description: 'Precision cut with professional blow dry finish.' },
  { id: 's2',  name: 'Hair Spa Treatment',          categoryId: 'cat1', duration: '75 min',  basePrice: 1500, discountedPrice: 1099,     rating: 4.6, bookings: 876,  active: true,  popular: false, description: 'Deep conditioning and scalp massage.' },
  { id: 's3',  name: 'Keratin Treatment',           categoryId: 'cat1', duration: '180 min', basePrice: 5000, discountedPrice: undefined, rating: 4.7, bookings: 312,  active: true,  popular: false, description: 'Smoothing treatment for frizz-free hair.' },
  { id: 's4',  name: 'HydraFacial Signature',       categoryId: 'cat2', duration: '75 min',  basePrice: 4500, discountedPrice: 3299,     rating: 4.9, bookings: 956,  active: true,  popular: true,  description: 'Deep cleanse, exfoliate and hydrate.' },
  { id: 's5',  name: 'Gold Facial',                 categoryId: 'cat2', duration: '60 min',  basePrice: 2000, discountedPrice: 1599,     rating: 4.8, bookings: 1450, active: true,  popular: true,  description: '24K gold-infused brightening facial.' },
  { id: 's6',  name: 'Party Makeup',                categoryId: 'cat3', duration: '90 min',  basePrice: 2500, discountedPrice: 1999,     rating: 4.8, bookings: 1120, active: true,  popular: true,  description: 'Full glam look for any occasion.' },
  { id: 's7',  name: 'Bridal Makeup',               categoryId: 'cat3', duration: '180 min', basePrice: 6000, discountedPrice: 4999,     rating: 4.9, bookings: 432,  active: true,  popular: true,  description: 'Head-to-toe bridal transformation.' },
  { id: 's8',  name: 'Gel Nail Extension',          categoryId: 'cat4', duration: '120 min', basePrice: 2800, discountedPrice: 2099,     rating: 4.7, bookings: 562,  active: true,  popular: false, description: 'Long-lasting gel nail extensions.' },
  { id: 's9',  name: 'Nail Art Design',             categoryId: 'cat4', duration: '45 min',  basePrice: 700,  discountedPrice: undefined, rating: 4.6, bookings: 890,  active: true,  popular: false, description: 'Custom nail art and designs.' },
  { id: 's10', name: 'Aroma Body Massage',          categoryId: 'cat5', duration: '90 min',  basePrice: 2500, discountedPrice: 1999,     rating: 4.8, bookings: 678,  active: true,  popular: false, description: 'Relaxing aromatherapy full body massage.' },
  { id: 's11', name: 'Full Body Waxing',            categoryId: 'cat6', duration: '60 min',  basePrice: 1200, discountedPrice: 999,      rating: 4.5, bookings: 987,  active: true,  popular: false, description: 'Complete full body waxing service.' },
  { id: 's12', name: 'Eyebrow Threading',           categoryId: 'cat8', duration: '15 min',  basePrice: 150,  discountedPrice: undefined, rating: 4.4, bookings: 2100, active: false, popular: false, description: 'Precise eyebrow shaping and threading.' },
];

export const SEED_PACKAGES: Package[] = [
  { id: 'pkg1', name: 'Bridal Glow Package',  tagline: 'Everything you need to shine on your big day',  services: ['Bridal Makeup', 'Hair Spa', 'Gold Facial', 'Nail Art', 'Body Massage'], duration: '5 hours',   originalPrice: 15000, price: 12999, savings: 2001, rating: 4.9, bookings: 148, active: true,  badge: '🔥 Best Seller' },
  { id: 'pkg2', name: 'Luxury Spa Day',        tagline: 'A complete day of pampering and relaxation',    services: ['Aroma Body Massage', 'HydraFacial', 'Body Polishing'],               duration: '4 hours',   originalPrice: 10500, price: 8499,  savings: 2001, rating: 4.8, bookings: 89,  active: true,  badge: '✨ Premium'    },
  { id: 'pkg3', name: 'Party Ready Package',   tagline: 'Look stunning for any event',                   services: ['Party Makeup', 'Hair Styling', 'Nail Art'],                           duration: '3 hours',   originalPrice: 5200,  price: 3999,  savings: 1201, rating: 4.7, bookings: 234, active: true,  badge: undefined       },
  { id: 'pkg4', name: 'Monthly Glow Kit',      tagline: 'Your monthly self-care ritual',                 services: ['Gold Facial', 'Hair Spa', 'Full Body Waxing'],                        duration: '3.5 hours', originalPrice: 4700,  price: 3499,  savings: 1201, rating: 4.6, bookings: 312, active: false, badge: undefined       },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Shared UI components ─────────────────────────────────────────────────────

export function InlineInput({
  label, value, onChange, placeholder, type = 'text', className,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[13px] text-[#1A1A1A] bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31]/20 placeholder:text-[#9CA3AF]"
      />
    </div>
  );
}

export function InlineSelect({
  label, value, onChange, options, className,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[]; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-[13px] text-[#1A1A1A] bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#C84B31] cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function InlineDateInput({
  label, value, onChange, min, className,
}: {
  label: string; value: string; onChange: (v: string) => void;
  min?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-1">
        {label}
      </label>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-[13px] text-[#1A1A1A] bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31]/20"
      />
    </div>
  );
}

export function Toggle({
  checked, onChange,
}: {
  checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none',
        checked ? 'bg-[#C84B31]' : 'bg-[#EBEBEB]',
      )}
    >
      <span className={cn(
        'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 mt-0.5',
        checked ? 'translate-x-5' : 'translate-x-0.5',
      )} />
    </button>
  );
}