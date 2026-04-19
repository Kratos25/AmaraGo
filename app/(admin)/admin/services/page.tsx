'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Scissors, Package, LayoutGrid, Ticket } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import AdminLayout from '../_components/AdminLayout';
import CategoriesTab from './_components/CategoriesTab';
import ServicesTab   from './_components/ServicesTab';
import PackagesTab   from './_components/PackagesTab';
import OffersTab     from './_components/OffersTab';
import { Suspense } from 'react';

type TabKey = 'services' | 'packages' | 'categories' | 'offers';

const TABS = [
  { key: 'services'   as TabKey, label: 'Services',        Icon: Scissors   },
  { key: 'packages'   as TabKey, label: 'Packages',         Icon: Package    },
  { key: 'categories' as TabKey, label: 'Categories',       Icon: LayoutGrid },
  { key: 'offers'     as TabKey, label: 'Offers & Coupons', Icon: Ticket     },
];

function AdminServicesInner() {
  const searchParams = useSearchParams();
  const tabParam     = searchParams.get('tab') as TabKey | null;
  const openAdd      = searchParams.get('openAdd') === 'true';

  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam && TABS.some((t) => t.key === tabParam) ? tabParam : 'services',
  );

  useEffect(() => {
    if (tabParam && TABS.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <AdminLayout title="Services" subtitle="Manage services, packages, categories and offers">
      <div className="flex gap-1 bg-[#F5F4F2] p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-shrink-0 flex items-center gap-2 py-2 px-3 sm:px-5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap',
              activeTab === key ? 'bg-white text-[#C84B31] shadow-sm' : 'text-[#9CA3AF] hover:text-[#6B7280]',
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'services'   && <ServicesTab autoOpenAdd={openAdd} />}
      {activeTab === 'packages'   && <PackagesTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'offers'     && <OffersTab />}
    </AdminLayout>
  );
}


export default function AdminServices() {
  return (
    <Suspense fallback={null}>
      <AdminServicesInner />
    </Suspense>
  );
}
