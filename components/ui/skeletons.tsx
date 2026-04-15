/**
 * Named skeleton loaders for consistent shimmer UX across the client app.
 * Each loader mirrors the exact layout of its real counterpart.
 */

import { Skeleton } from "./skeleton";

// ── Home Page Skeletons ────────────────────────────────────────────────────────

export function BannerSkeleton() {
  return <Skeleton className="w-full h-44 rounded-3xl" />;
}

export function CategoryRowSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <Skeleton className="w-14 h-3 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <Skeleton className="w-full h-36" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ServiceRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PackageCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 min-w-[240px]">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-2/3 rounded" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function PackageRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <PackageCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CouponCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-4 flex items-center gap-4 min-w-[280px]">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-3 w-full rounded" />
      </div>
    </div>
  );
}

// ── Services Page Skeletons ────────────────────────────────────────────────────

export function ServiceListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-3">
          <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
            <div className="flex justify-between items-center pt-1">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-7 w-20 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Bookings Page Skeletons ────────────────────────────────────────────────────

export function BookingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
    </div>
  );
}

export function BookingListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <BookingCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Profile Page Skeletons ─────────────────────────────────────────────────────

export function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <Skeleton className="w-24 h-24 rounded-full" />
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className="h-3 w-40 rounded" />
    </div>
  );
}

export function LoyaltyCardSkeleton() {
  return (
    <div className="bg-gradient-to-r from-gray-200 to-gray-100 rounded-3xl p-5 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-24 rounded bg-white/40" />
        <Skeleton className="h-5 w-16 rounded-full bg-white/40" />
      </div>
      <Skeleton className="h-8 w-32 rounded bg-white/40" />
      <Skeleton className="h-2.5 w-full rounded-full bg-white/40" />
      <Skeleton className="h-3 w-40 rounded bg-white/40" />
    </div>
  );
}