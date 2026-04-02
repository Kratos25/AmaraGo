'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Check, X, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import { Package, SEED_PACKAGES, InlineInput, Toggle } from './shared';

export default function PackagesTab() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>(SEED_PACKAGES);
  const [adding, setAdding]     = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: '', tagline: '', duration: '',
    originalPrice: '', price: '', badge: '', servicesRaw: '',
  });

  const resetDraft = () => setDraft({ name: '', tagline: '', duration: '', originalPrice: '', price: '', badge: '', servicesRaw: '' });

  const handleSave = () => {
    if (!draft.name.trim()) return;
    const orig  = parseInt(draft.originalPrice) || 0;
    const price = parseInt(draft.price) || 0;
    const svcs  = draft.servicesRaw.split(',').map((s) => s.trim()).filter(Boolean);
    if (editId) {
      setPackages((p) => p.map((x) => x.id === editId
        ? { ...x, name: draft.name, tagline: draft.tagline, duration: draft.duration, originalPrice: orig, price, savings: orig - price, services: svcs, badge: draft.badge || undefined }
        : x,
      ));
      toast({ title: 'Package updated' });
      setEditId(null);
    } else {
      setPackages((p) => [...p, {
        id: `pkg${Date.now()}`, name: draft.name, tagline: draft.tagline,
        services: svcs, duration: draft.duration, originalPrice: orig,
        price, savings: orig - price, rating: 0, bookings: 0,
        active: true, badge: draft.badge || undefined,
      }]);
      toast({ title: 'Package added ✓' });
      setAdding(false);
    }
    resetDraft();
  };

  const startEdit = (pkg: Package) => {
    setDraft({ name: pkg.name, tagline: pkg.tagline, duration: pkg.duration, originalPrice: String(pkg.originalPrice), price: String(pkg.price), badge: pkg.badge ?? '', servicesRaw: pkg.services.join(', ') });
    setEditId(pkg.id);
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Add / Edit form */}
      {(adding || editId) && (
        <Card className="border border-[#C84B31]/20 shadow-none bg-[#FFF0EC]">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[12px] font-bold text-[#C84B31] mb-4">
              {editId ? '✏️ Edit Package' : '+ New Package'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <InlineInput label="Package Name"      value={draft.name}          onChange={(v) => setDraft((p) => ({ ...p, name: v }))}          placeholder="e.g. Bridal Glow"  />
              <InlineInput label="Tagline"           value={draft.tagline}       onChange={(v) => setDraft((p) => ({ ...p, tagline: v }))}       placeholder="Short catchy tagline" />
              <InlineInput label="Duration"          value={draft.duration}      onChange={(v) => setDraft((p) => ({ ...p, duration: v }))}      placeholder="e.g. 5 hours"      />
              <InlineInput label="Badge (optional)"  value={draft.badge}         onChange={(v) => setDraft((p) => ({ ...p, badge: v }))}         placeholder="e.g. 🔥 Best Seller" />
              <InlineInput label="Original Price (₹)" value={draft.originalPrice} onChange={(v) => setDraft((p) => ({ ...p, originalPrice: v }))} placeholder="e.g. 15000" type="number" />
              <InlineInput label="Offer Price (₹)"  value={draft.price}         onChange={(v) => setDraft((p) => ({ ...p, price: v }))}         placeholder="e.g. 12999" type="number" />
            </div>
            <InlineInput label="Included Services (comma-separated)" value={draft.servicesRaw} onChange={(v) => setDraft((p) => ({ ...p, servicesRaw: v }))} placeholder="Bridal Makeup, Hair Spa, Gold Facial" className="mb-4" />
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex items-center gap-1.5 h-9 px-4 bg-[#C84B31] hover:bg-[#B04028] text-white text-[12px] font-semibold rounded-xl transition-colors">
                <Check className="w-3.5 h-3.5" /> {editId ? 'Update' : 'Add Package'}
              </button>
              <button onClick={() => { setAdding(false); setEditId(null); resetDraft(); }} className="flex items-center gap-1.5 h-9 px-4 bg-white border border-[#EBEBEB] text-[#6B7280] text-[12px] font-semibold rounded-xl hover:bg-[#F5F4F2] transition-colors">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {!adding && !editId && (
          <button
            onClick={() => { setAdding(true); setEditId(null); }}
            className="flex flex-col items-center justify-center gap-2 py-12 border-2 border-dashed border-[#FDDDD5] bg-[#FFF0EC] rounded-2xl hover:bg-[#FFE8E0] transition-colors group min-h-[200px]"
          >
            <Plus className="w-7 h-7 text-[#C84B31] group-hover:scale-110 transition-transform" />
            <span className="text-[13px] font-semibold text-[#C84B31]">Create Package</span>
          </button>
        )}
        {packages.map((pkg) => (
          <Card key={pkg.id} className={cn('border shadow-none transition-all', pkg.active ? 'border-[#EBEBEB] bg-white' : 'border-[#EBEBEB] bg-[#F5F4F2] opacity-70')}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  {pkg.badge && (
                    <span className="inline-block text-[10px] font-bold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-2 py-0.5 rounded-full mb-1.5">
                      {pkg.badge}
                    </span>
                  )}
                  <h3 className="font-bold text-[15px] text-[#1A1A1A] leading-tight">{pkg.name}</h3>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5 leading-snug">{pkg.tagline}</p>
                </div>
                <Toggle checked={pkg.active} onChange={(v) => setPackages((p) => p.map((x) => x.id === pkg.id ? { ...x, active: v } : x))} />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {pkg.services.map((s) => (
                  <span key={s} className="text-[10px] font-medium text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-[22px] font-bold text-[#C84B31] leading-none">₹{pkg.price.toLocaleString()}</p>
                  <p className="text-[11px] text-[#9CA3AF] line-through mt-0.5">₹{pkg.originalPrice.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                    Save ₹{pkg.savings.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">{pkg.duration}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#EBEBEB]">
                <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />{pkg.rating || '—'}
                  </span>
                  <span>{pkg.bookings} bookings</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(pkg)} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#FFF0EC] hover:text-[#C84B31] transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setPackages((p) => p.filter((x) => x.id !== pkg.id)); toast({ title: 'Package removed' }); }} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}