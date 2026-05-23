'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  categories: { name: string; icon: string }[];
}

export function CategoriesSection({ categories }: Props) {
  const router = useRouter();

  if (categories.length === 0) return null;

  return (
    <section className="bg-[#F7F2F6] py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-3xl font-medium text-[#111827] mb-5">Explore Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => router.push(`/client/services?category=${cat.name}`)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FDE2E9] border border-[#F7F2F6] rounded-full text-sm text-gray-700 font-medium hover:border-[#E91E8C] hover:text-[#E91E8C] hover:bg-pink-50 transition-all"
            >
              <span className="text-base leading-none">{cat.icon}</span>
              <span className="text-md font-normal">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}