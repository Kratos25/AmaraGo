'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Plus, Edit3, Trash2, Check, X, Star, ImagePlus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import { packagesAPI, type Package } from '@/lib/api';
import { InlineInput, Toggle } from './shared';

export default function PackagesTab() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: '', tagline: '', duration: '',
    originalPrice: '', price: '', badge: '', servicesRaw: '',
  });
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    packagesAPI.listAll()
      .then(({ data }) => setPackages(data))
      .catch(() => toast({ title: 'Failed to load packages', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const resetDraft = () => {
    setDraft({ name: '', tagline: '', duration: '', originalPrice: '', price: '', badge: '', servicesRaw: '' });
    setPendingImage(null);
    setImagePreview(null);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!draft.name.trim()) return;
    const original_price = parseInt(draft.originalPrice) || 0;
    const price          = parseInt(draft.price) || 0;
    const services       = draft.servicesRaw.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      if (editId) {
        const { data } = await packagesAPI.update(editId, {
          name: draft.name, tagline: draft.tagline, duration: draft.duration,
          original_price, price, services, badge: draft.badge || undefined,
        });
        let imageUrl = data.image_url;
        if (pendingImage) {
          setUploadingId(editId);
          const { data: imgData } = await packagesAPI.uploadThumbnail(editId, pendingImage);
          imageUrl = imgData.url;
          setUploadingId(null);
        }
        setPackages((p) => p.map((x) => x.id === editId ? { ...data, image_url: imageUrl } : x));
        toast({ title: 'Package updated' });
        setEditId(null);
      } else {
        const { data } = await packagesAPI.create({
          name: draft.name, tagline: draft.tagline, duration: draft.duration,
          original_price, price, services, badge: draft.badge || undefined, active: true,
        } as any);
        let imageUrl: string | undefined;
        if (pendingImage) {
          setUploadingId(data.id);
          const { data: imgData } = await packagesAPI.uploadThumbnail(data.id, pendingImage);
          imageUrl = imgData.url;
          setUploadingId(null);
        }
        setPackages((p) => [...p, { ...data, image_url: imageUrl }]);
        toast({ title: 'Package added ✓' });
        setAdding(false);
      }
    } catch {
      setUploadingId(null);
      toast({ title: 'Failed to save package', variant: 'destructive' });
    }
    resetDraft();
  };

  const startEdit = (pkg: Package) => {
    setDraft({
      name: pkg.name, tagline: pkg.tagline, duration: pkg.duration,
      originalPrice: String(pkg.original_price), price: String(pkg.price),
      badge: pkg.badge ?? '',
      servicesRaw: pkg.services.join(', '),
    });
    setPendingImage(null);
    setImagePreview(pkg.image_url ?? null);
    setEditId(pkg.id);
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await packagesAPI.delete(id);
      setPackages((p) => p.filter((x) => x.id !== id));
      toast({ title: 'Package removed' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (pkg: Package, value: boolean) => {
    try {
      const { data } = await packagesAPI.update(pkg.id, { active: value });
      setPackages((p) => p.map((x) => x.id === pkg.id ? data : x));
    } catch {
      toast({ title: 'Failed to update package', variant: 'destructive' });
    }
  };

  if (loading) return <p className="text-[13px] text-[#9CA3AF] py-8 text-center">Loading packages…</p>;

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
            <InlineInput label="Included Services (comma-separated)" value={draft.servicesRaw} onChange={(v) => setDraft((p) => ({ ...p, servicesRaw: v }))} placeholder="Bridal Makeup, Hair Spa, Gold Facial" className="mb-3" />

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
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImagePick} className="hidden" id="pkg-img-input" />
                  <label htmlFor="pkg-img-input" className="cursor-pointer inline-flex items-center gap-1.5 h-8 px-3 bg-white border border-[#EBEBEB] text-[#6B7280] text-[11px] font-semibold rounded-lg hover:bg-[#F5F4F2] transition-colors">
                    <ImagePlus className="w-3.5 h-3.5" /> {imagePreview ? 'Change image' : 'Upload image'}
                  </label>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">JPEG, PNG or WebP · max 5 MB</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={!!uploadingId} className="flex items-center gap-1.5 h-9 px-4 bg-[#C84B31] hover:bg-[#B04028] disabled:opacity-60 text-white text-[12px] font-semibold rounded-xl transition-colors">
                {uploadingId ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</> : <><Check className="w-3.5 h-3.5" /> {editId ? 'Update' : 'Add Package'}</>}
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
          <Card key={pkg.id} className={cn('border shadow-none transition-all overflow-hidden', pkg.active ? 'border-[#EBEBEB] bg-white' : 'border-[#EBEBEB] bg-[#F5F4F2] opacity-70')}>
            {pkg.image_url && (
              <div className="relative w-full h-36">
                <Image src={pkg.image_url} alt={pkg.name} fill className="object-cover" />
                {uploadingId === pkg.id && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
            )}
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
                <Toggle checked={pkg.active} onChange={(v) => handleToggleActive(pkg, v)} />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {pkg.services.map((s) => (
                  <span key={s} className="text-[10px] font-medium text-[#6B7280] bg-[#F5F4F2] border border-[#EBEBEB] px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-[22px] font-bold text-[#C84B31] leading-none">₹{pkg.price.toLocaleString()}</p>
                  <p className="text-[11px] text-[#9CA3AF] line-through mt-0.5">₹{pkg.original_price.toLocaleString()}</p>
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
                  <span>{pkg.total_bookings} bookings</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(pkg)} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-[#FFF0EC] hover:text-[#C84B31] transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(pkg.id)} className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-colors">
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