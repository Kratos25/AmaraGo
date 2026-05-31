'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import { OffersCarousel } from '../../_components/OffersCarousel';

interface Props {
  currentUser: User | null;
}

export function OffersSection({ currentUser }: Props) {
  const router = useRouter();
  return (
    <section className="bg-[#F7F2F6] py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-xl md:text-3xl font-medium text-[#111827] mb-5">Offers &amp; More</h2>
        <OffersCarousel
          currentUser={currentUser}
          onBookNow={() => router.push('/client/services')}
          onProfile={() => router.push('/client/profile')}
        />
      </div>
    </section>
  );
}