'use client';

import React from 'react';

export function MidBannerSection() {
  return (
    <section className="bg-[#F7F2F6] pt-8 md:pt-20 border-pink-100 flex items-end">
      <div className="w-full">
        <img
          src="/assets/banners/mid-banner-professional.png"
          alt="Beauty service at home"
          className="w-full object-cover"
        />
      </div>
    </section>
  );
}