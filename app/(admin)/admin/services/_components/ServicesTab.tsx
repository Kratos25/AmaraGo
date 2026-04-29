'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, Plus, Edit3, Trash2, Check, X, Star, ImagePlus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import {
  Service, Category,
  InlineInput, InlineSelect, Toggle,
} from './shared';
import { servicesAPI, categoriesAPI, type Service as APIService, type Category as APICategory } from '@/lib/api';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function ServicesTab({ autoOpenAdd = false }: { autoOpenAdd?: boolean }) {
  const { toast } = useToast();
  const [allCategories, setAllCategories]   = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [services, setServices]             = useState<Service[]>([]);
  const [search, setSearch]                 = useState('');
  const [catFilter, setCatFilter]           = useState('all');
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('all');
  const [adding, setAdding]                 = useState(false);
  const [editId, setEditId]                 = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: '', categoryId: '', duration: '',
    basePrice: '', discountedPrice: '', description: '',
  });
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch all categories for the filter dropdown
    categoriesAPI.list()
      .then(({ data }) => setAllCategories(data.map((c: APICategory) => ({
        id: c.id, name: c.name, icon: c.icon, serviceCount: c.service_count,
        active: c.active, description: c.description,
      }))))
      .catch(() => {});

    // Fetch only active categories for the Add Service form
    categoriesAPI.listActive()
      .then(({ data }) => setActiveCategories(data.map((c: APICategory) => ({
        id: c.id, name: c.name, icon: c.icon, serviceCount: c.service_count,
        active: c.active, description: c.description,
      }))))
      .catch(() => {});

    // Fetch ALL services (admin view — includes inactive)
    servicesAPI.listAll()
      .then(({ data }) => setServices(data.map((s: APIService) => ({
        id: s.id, name: s.name, categoryId: s.category_id,
        duration: s.duration, basePrice: s.base_price, discountedPrice: s.discounted_price,
        description: s.description, active: s.active, popular: s.popular,
        rating: s.rating, bookings: s.total_bookings, imageUrl: s.image_url,
      }))))
      .catch(() => {});
  }, []);

  // Auto-open add form when navigated here from dashboard
  useEffect(() => {
    if (autoOpenAdd) {
      setAdding(true);
      setEditId(null);
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [autoOpenAdd]);

  const resetDraft = () => {
    setDraft({ name: '', categoryId: '', duration: '', basePrice: '', discountedPrice: '', description: '' });
    setPendingImage(null);
    setImagePreview(null);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const filtered = useMemo(() => services.filter((s) => {
    const matchSearch  = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat     = catFilter === 'all' || s.categoryId === catFilter;
    const matchStatus  =
      statusFilter === 'all'      ? true :
      statusFilter === 'active'   ? s.active :
      !s.active;
    return matchSearch && matchCat && matchStatus;
  }), [services, search, catFilter, statusFilter]);

  const getCatName = (id: string) => allCategories.find((c) => c.id === id)?.name ?? '—';
  const getCatIcon = (id: string) => allCategories.find((c) => c.id === id)?.icon ?? '';

  const handleSave = async () => {
    if (!draft.name.trim() || !draft.categoryId) return;
    const base = parseInt(draft.basePrice) || 0;
    const disc = parseInt(draft.discountedPrice) || undefined;
    try {
      if (editId) {
        const { data } = await servicesAPI.update(editId, {
          name: draft.name, category_id: draft.categoryId, duration: draft.duration,
          base_price: base, discounted_price: disc, description: draft.description,
        });
        let imageUrl = data.image_url;
        if (pendingImage) {
          setUploadingId(editId);
          const { data: imgData } = await servicesAPI.uploadThumbnail(editId, pendingImage);
          imageUrl = imgData.url;
          setUploadingId(null);
        }
        setServices((p) => p.map((s) => s.id === editId
          ? { ...s, name: data.name, categoryId: data.category_id, duration: data.duration,
              basePrice: data.base_price, discountedPrice: data.discounted_price,
              description: data.description, imageUrl } : s));
        toast({ title: 'Service updated' });
        setEditId(null);
      } else {
        const { data } = await servicesAPI.create({
          name: draft.name, category_id: draft.categoryId, duration: draft.duration,
          base_price: base, discounted_price: disc, description: draft.description,
          active: true, popular: false,
        } as any);
        let imageUrl: string | undefined;
        if (pendingImage) {
          setUploadingId(data.id);
          const { data: imgData } = await servicesAPI.uploadThumbnail(data.id, pendingImage);
          imageUrl = imgData.url;
          setUploadingId(null);
        }
        setServices((p) => [...p, {
          id: data.id, name: data.name, categoryId: data.category_id,
          duration: data.duration, basePrice: data.base_price, discountedPrice: data.discounted_price,
          description: data.description, rating: 0, bookings: 0, active: true, popular: false,
          imageUrl,
        }]);
        toast({ title: 'Service added ✓' });
        setAdding(false);
      }
    } catch {
      setUploadingId(null);
      toast({ title: 'Failed to save service', variant: 'destructive' });
    }
    resetDraft();
  };

  const startEdit = (s: Service) => {
    setDraft({ name: s.name, categoryId: s.categoryId, duration: s.duration, basePrice: String(s.basePrice), discountedPrice: String(s.discountedPrice ?? ''), description: s.description });
    setPendingImage(null);
    setImagePreview((s as any).imageUrl ?? null);
    setEditId(s.id);
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await servicesAPI.delete(id);
      setServices((p) => p.filter((s) => s.id !== id));
      toast({ title: 'Service deleted' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await servicesAPI.update(id, { active });
      setServices((p) => p.map((s) => s.id === id ? { ...s, active } : s));
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  // Active categories for the Add/Edit form
  const catOptions = [
    { label: 'Select category', value: '' },
    ...activeCategories.map((c) => ({ label: `${c.icon} ${c.name}`, value: c.id })),
  ];

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all',      label: `All (${services.length})`                             },
    { key: 'active',   label: `Active (${services.filter((s) => s.active).length})`  },
    { key: 'inactive', label: `Inactive (${services.filter((s) => !s.active).length})` },
  ];

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border',
              statusFilter === key
                ? 'bg-[#C84B31] text-white border-[#C84B31]'
                : 'bg-white text-[#6B7280] border-[#EBEBEB] hover:border-[#FDDDD5]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + category filter + Add button */}
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
          {allCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
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
        <div ref={formRef}>
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

              {/* Thumbnail upload */}
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-[#6B7280] mb-1.5">Thumbnail Image</p>
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-[#EBEBEB] shrink-0">
                      <Image src={imagePreview} alt="preview" fill className="object-cover" unoptimized={imagePreview.startsWith('blob:')} />
                      <button
                        type="button"
                        onClick={() => { setPendingImage(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-14 rounded-lg border-2 border-dashed border-[#FDDDD5] bg-[#FFF8F6] flex items-center justify-center shrink-0">
                      <ImagePlus className="w-5 h-5 text-[#C84B31]/40" />
                    </div>
                  )}
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImagePick} className="hidden" id="svc-img-input" />
                    <label htmlFor="svc-img-input" className="cursor-pointer inline-flex items-center gap-1.5 h-8 px-3 bg-white border border-[#EBEBEB] text-[#6B7280] text-[11px] font-semibold rounded-lg hover:bg-[#F5F4F2] transition-colors">
                      <ImagePlus className="w-3.5 h-3.5" /> {imagePreview ? 'Change image' : 'Upload image'}
                    </label>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">JPEG, PNG or WebP · max 5 MB</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={!!uploadingId} className="flex items-center gap-1.5 h-9 px-4 bg-[#C84B31] hover:bg-[#B04028] disabled:opacity-60 text-white text-[12px] font-semibold rounded-xl transition-colors">
                  {uploadingId ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</> : <><Check className="w-3.5 h-3.5" /> {editId ? 'Update' : 'Add Service'}</>}
                </button>
                <button onClick={() => { setAdding(false); setEditId(null); resetDraft(); }} className="flex items-center gap-1.5 h-9 px-4 bg-white border border-[#EBEBEB] text-[#6B7280] text-[12px] font-semibold rounded-xl hover:bg-[#F5F4F2] transition-colors">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="border border-[#EBEBEB] shadow-none bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#F5F4F2]">
                {['', 'Service', 'Category', 'Duration', 'Pricing', 'Stats', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className={cn('border-b border-[#EBEBEB] transition-colors', s.active ? 'hover:bg-[#FFF0EC]/30' : 'bg-[#F5F4F2]/60 hover:bg-[#F5F4F2]')}>
                  {/* Thumbnail */}
                  <td className="px-3 py-3">
                    {(s as any).imageUrl ? (
                      <div className="relative w-12 h-9 rounded-md overflow-hidden border border-[#EBEBEB]">
                        <Image src={(s as any).imageUrl} alt={s.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-9 rounded-md border border-dashed border-[#EBEBEB] bg-[#F5F4F2] flex items-center justify-center">
                        <ImagePlus className="w-3.5 h-3.5 text-[#D1D5DB]" />
                      </div>
                    )}
                    {uploadingId === s.id && <Loader2 className="w-3 h-3 animate-spin text-[#C84B31] mt-1" />}
                  </td>
                  <td className="px-4 py-3">
                    <p className={cn('text-[13px] font-semibold', s.active ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]')}>{s.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {s.popular && (
                        <span className="text-[9px] font-bold text-[#C84B31] bg-[#FFF0EC] border border-[#FDDDD5] px-1.5 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      {!s.active && (
                        <span className="text-[9px] font-bold text-[#9CA3AF] bg-[#F5F4F2] border border-[#EBEBEB] px-1.5 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
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
                    <Toggle checked={s.active} onChange={(v) => handleToggleActive(s.id, v)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(s)} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#FFF0EC] hover:text-[#C84B31] transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-colors">
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
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Try a different search or filter</p>
          </div>
        )}
      </Card>
    </div>
  );
}

