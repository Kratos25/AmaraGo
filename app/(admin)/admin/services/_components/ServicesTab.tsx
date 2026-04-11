'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit3, Trash2, Check, X, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import {
  Service, Category,
  SEED_SERVICES, SEED_CATEGORIES,
  InlineInput, InlineSelect, Toggle,
} from './shared';

export default function ServicesTab() {
  const { toast } = useToast();
  const categories                  = SEED_CATEGORIES;
  const [services, setServices]     = useState<Service[]>(SEED_SERVICES);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('all');
  const [adding, setAdding]         = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: '', categoryId: '', duration: '',
    basePrice: '', discountedPrice: '', description: '',
  });

  const resetDraft = () => setDraft({ name: '', categoryId: '', duration: '', basePrice: '', discountedPrice: '', description: '' });

  const filtered = useMemo(() => services.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'all' || s.categoryId === catFilter;
    return matchSearch && matchCat;
  }), [services, search, catFilter]);

  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';
  const getCatIcon = (id: string) => categories.find((c) => c.id === id)?.icon ?? '';

  const handleSave = () => {
    if (!draft.name.trim() || !draft.categoryId) return;
    const base = parseInt(draft.basePrice) || 0;
    const disc = parseInt(draft.discountedPrice) || undefined;
    if (editId) {
      setServices((p) => p.map((s) => s.id === editId
        ? { ...s, ...draft, basePrice: base, discountedPrice: disc } : s));
      toast({ title: 'Service updated' });
      setEditId(null);
    } else {
      setServices((p) => [...p, {
        id: `s${Date.now()}`, name: draft.name, categoryId: draft.categoryId,
        duration: draft.duration, basePrice: base, discountedPrice: disc,
        description: draft.description, rating: 0, bookings: 0, active: true, popular: false,
      }]);
      toast({ title: 'Service added ✓' });
      setAdding(false);
    }
    resetDraft();
  };

  const startEdit = (s: Service) => {
    setDraft({ name: s.name, categoryId: s.categoryId, duration: s.duration, basePrice: String(s.basePrice), discountedPrice: String(s.discountedPrice ?? ''), description: s.description });
    setEditId(s.id);
    setAdding(false);
  };

  const catOptions = [
    { label: 'Select category', value: '' },
    ...categories.map((c) => ({ label: `${c.icon} ${c.name}`, value: c.id })),
  ];

  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services…"
            className="w-full pl-10 pr-4 h-10 text-[13px] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] text-[#1A1A1A] placeholder:text-[#9CA3AF]"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="h-10 px-3 text-[12px] font-semibold text-[#6B7280] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        {!adding && !editId && (
          <button
            onClick={() => { setAdding(true); setEditId(null); }}
            className="h-10 px-4 flex items-center gap-2 bg-[#C84B31] hover:bg-[#B04028] text-white text-[12px] font-semibold rounded-xl transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {(adding || editId) && (
        <Card className="border border-[#C84B31]/20 shadow-none bg-[#FFF0EC]">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[12px] font-bold text-[#C84B31] mb-4">
              {editId ? '✏️ Edit Service' : '+ New Service'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <InlineInput label="Service Name" value={draft.name} onChange={(v) => setDraft((p) => ({ ...p, name: v }))} placeholder="e.g. Gold Facial" />
              <InlineSelect label="Category" value={draft.categoryId} onChange={(v) => setDraft((p) => ({ ...p, categoryId: v }))} options={catOptions} />
              <InlineInput label="Duration" value={draft.duration} onChange={(v) => setDraft((p) => ({ ...p, duration: v }))} placeholder="e.g. 60 min" />
              <InlineInput label="Base Price (₹)" value={draft.basePrice} onChange={(v) => setDraft((p) => ({ ...p, basePrice: v }))} placeholder="e.g. 2000" type="number" />
              <InlineInput label="Discounted Price (₹, optional)" value={draft.discountedPrice} onChange={(v) => setDraft((p) => ({ ...p, discountedPrice: v }))} placeholder="e.g. 1599" type="number" />
              <InlineInput label="Description" value={draft.description} onChange={(v) => setDraft((p) => ({ ...p, description: v }))} placeholder="Short description" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex items-center gap-1.5 h-9 px-4 bg-[#C84B31] hover:bg-[#B04028] text-white text-[12px] font-semibold rounded-xl transition-colors">
                <Check className="w-3.5 h-3.5" /> {editId ? 'Update' : 'Add Service'}
              </button>
              <button onClick={() => { setAdding(false); setEditId(null); resetDraft(); }} className="flex items-center gap-1.5 h-9 px-4 bg-white border border-[#EBEBEB] text-[#6B7280] text-[12px] font-semibold rounded-xl hover:bg-[#F5F4F2] transition-colors">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border border-[#EBEBEB] shadow-none bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#F5F4F2]">
                {['Service', 'Category', 'Duration', 'Pricing', 'Stats', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[#EBEBEB] hover:bg-[#FFF0EC]/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">{s.name}</p>
                    {s.popular && (
                      <span className="text-[9px] font-bold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-1.5 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-0.5 rounded-full">
                      {getCatIcon(s.categoryId)} {getCatName(s.categoryId)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-[#6B7280]">{s.duration}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.discountedPrice ? (
                      <>
                        <p className="text-[13px] font-bold text-[#1A1A1A]">₹{s.discountedPrice.toLocaleString()}</p>
                        <p className="text-[10px] text-[#9CA3AF] line-through">₹{s.basePrice.toLocaleString()}</p>
                      </>
                    ) : (
                      <p className="text-[13px] font-bold text-[#1A1A1A]">₹{s.basePrice.toLocaleString()}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[11px] font-semibold text-[#1A1A1A]">{s.rating || '—'}</span>
                    </div>
                    <p className="text-[10px] text-[#9CA3AF]">{s.bookings.toLocaleString()} bookings</p>
                  </td>
                  <td className="px-4 py-3">
                    <Toggle checked={s.active} onChange={(v) => setServices((p) => p.map((x) => x.id === s.id ? { ...x, active: v } : x))} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(s)} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#FFF0EC] hover:text-[#C84B31] transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setServices((p) => p.filter((x) => x.id !== s.id)); toast({ title: 'Service removed' }); }} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[13px] font-semibold text-[#1A1A1A]">No services found</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Try a different search or category</p>
          </div>
        )}
      </Card>
    </div>
  );
}