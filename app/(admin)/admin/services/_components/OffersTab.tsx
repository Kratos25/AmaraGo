'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, Copy, AlertCircle, Percent, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import { couponsAPI, Coupon } from '@/lib/api';
import {
  InlineInput, InlineSelect, InlineDateInput, Toggle,
} from './shared';

const APPLICABLE_OPTIONS = [
  { label: 'All Users',       value: 'all'       },
  { label: 'New Users Only',  value: 'new_users' },
  { label: 'Returning Users', value: 'returning' },
];

const TODAY = new Date().toISOString().split('T')[0];

const EMPTY_DRAFT = {
  code: '', description: '', type: 'percentage' as 'percentage' | 'flat',
  value: '', minOrder: '', maxDiscount: '',
  usageLimit: '', validFrom: '', validTo: '',
  applicable_for: 'all' as Coupon['applicable_for'],
  autoApply: false,
};

export default function OffersTab() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [adding, setAdding]   = useState(false);
  const [draft, setDraft]     = useState(EMPTY_DRAFT);

  const set = (fields: Partial<typeof EMPTY_DRAFT>) =>
    setDraft((p) => ({ ...p, ...fields }));

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await couponsAPI.list();
      setCoupons(data);
    } catch {
      toast({ title: 'Failed to load coupons', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.code.trim() || !draft.value || !draft.usageLimit || !draft.validFrom || !draft.validTo) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await couponsAPI.create({
        code:            draft.code.toUpperCase(),
        description:     draft.description,
        type:            draft.type,
        value:           parseFloat(draft.value),
        min_order:       parseFloat(draft.minOrder) || 0,
        max_discount:    draft.maxDiscount ? parseFloat(draft.maxDiscount) : undefined,
        usage_limit:     parseInt(draft.usageLimit),
        // used_count:      0,
        valid_from:      draft.validFrom,
        valid_to:        draft.validTo,
        applicable_for:  draft.applicable_for,
        auto_apply:      draft.autoApply,
        active:          true,
      });
      toast({ title: `Coupon ${draft.code.toUpperCase()} created ✓` });
      setDraft(EMPTY_DRAFT);
      setAdding(false);
      await fetchCoupons();
    } catch (e: any) {
      toast({ title: e.response?.data?.detail || 'Error creating coupon', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle ────────────────────────────────────────────────────────────────
  const handleToggle = async (id: string, current: boolean) => {
    setCoupons((p) => p.map((c) => c.id === id ? { ...c, active: !current } : c));
    try {
      await couponsAPI.update(id, { active: !current });
    } catch {
      setCoupons((p) => p.map((c) => c.id === id ? { ...c, active: current } : c));
      toast({ title: 'Failed to update coupon', variant: 'destructive' });
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setCoupons((p) => p.filter((c) => c.id !== id));
    try {
      await couponsAPI.delete(id);
      toast({ title: 'Coupon deleted' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
      await fetchCoupons();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: `${code} copied!` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#FDDDD5] border-t-[#C84B31] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Coupons',  value: coupons.length,                                                color: 'text-[#C84B31]'  },
          { label: 'Active',         value: coupons.filter((c) => c.active).length,                        color: 'text-green-600'  },
          { label: 'Total Redeemed', value: coupons.reduce((s, c) => s + c.used_count, 0).toLocaleString(), color: 'text-blue-500'   },
          { label: 'Auto-Apply',     value: coupons.filter((c) => c.auto_apply && c.active).length,         color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border border-[#EBEBEB] shadow-none bg-white">
            <CardContent className="p-4">
              <p className={cn('font-bold text-[20px] leading-none', color)}>{value}</p>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create form */}
      {adding && (
        <Card className="border border-[#C84B31]/20 shadow-none bg-[#FFF0EC]">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[12px] font-bold text-[#C84B31] mb-4">+ New Coupon</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <InlineInput label="Coupon Code *"    value={draft.code}        onChange={(v) => set({ code: v.toUpperCase() })} placeholder="e.g. WELCOME20" />
              <InlineInput label="Description"      value={draft.description} onChange={(v) => set({ description: v })}       placeholder="Short description" />
              <InlineSelect
                label="Discount Type"
                value={draft.type}
                onChange={(v) => set({ type: v as any })}
                options={[
                  { label: 'Percentage (%)',  value: 'percentage' },
                  { label: 'Flat Amount (₹)', value: 'flat'       },
                ]}
              />
              <InlineInput
                label={draft.type === 'percentage' ? 'Discount % *' : 'Discount ₹ *'}
                value={draft.value}
                onChange={(v) => set({ value: v })}
                type="number"
                placeholder={draft.type === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
              />
              <InlineInput label="Min Order (₹)"     value={draft.minOrder}    onChange={(v) => set({ minOrder: v })}    type="number" placeholder="e.g. 500"  />
              {draft.type === 'percentage' && (
                <InlineInput label="Max Discount Cap (₹)" value={draft.maxDiscount} onChange={(v) => set({ maxDiscount: v })} type="number" placeholder="e.g. 500" />
              )}
              <InlineInput label="Total Usage Limit *" value={draft.usageLimit} onChange={(v) => set({ usageLimit: v })} type="number" placeholder="e.g. 1000" />
              <InlineDateInput label="Valid From *" value={draft.validFrom} onChange={(v) => set({ validFrom: v })}  min={TODAY} />
              <InlineDateInput label="Valid To *"   value={draft.validTo}   onChange={(v) => set({ validTo: v })}    min={draft.validFrom || TODAY} />
              <InlineSelect label="Applicable For" value={draft.applicable_for} onChange={(v) => set({ applicable_for: v as any })} options={APPLICABLE_OPTIONS} />
            </div>
            <label className="flex items-center gap-2.5 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.autoApply}
                onChange={(e) => set({ autoApply: e.target.checked })}
                className="w-4 h-4 rounded border-[#EBEBEB] accent-[#C84B31]"
              />
              <span className="text-[12px] font-medium text-[#1A1A1A]">
                Auto-apply this coupon (shown to eligible users automatically)
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 h-9 px-4 bg-[#C84B31] hover:bg-[#B04028] disabled:opacity-60 text-white text-[12px] font-semibold rounded-xl transition-colors"
              >
                {saving
                  ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Check className="w-3.5 h-3.5" />
                }
                {saving ? 'Creating...' : 'Create Coupon'}
              </button>
              <button
                onClick={() => { setDraft(EMPTY_DRAFT); setAdding(false); }}
                className="flex items-center gap-1.5 h-9 px-4 bg-white border border-[#EBEBEB] text-[#6B7280] text-[12px] font-semibold rounded-xl hover:bg-[#F5F4F2] transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create button */}
      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 h-10 px-4 bg-[#C84B31] hover:bg-[#B04028] text-white text-[12px] font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      )}

      {/* Empty state */}
      {coupons.length === 0 && !adding && (
        <div className="py-16 text-center">
          <p className="text-[14px] font-semibold text-[#1A1A1A]">No coupons yet</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Create your first coupon above</p>
        </div>
      )}

      {/* Coupon cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {coupons.map((coupon) => {
          const usagePct = coupon.usage_limit > 0
            ? Math.round((coupon.used_count / coupon.usage_limit) * 100)
            : 0;
          const applicableLabel = APPLICABLE_OPTIONS.find((o) => o.value === coupon.applicable_for)?.label ?? '';

          return (
            <Card
              key={coupon.code}
              className={cn(
                'border shadow-none transition-all relative overflow-hidden',
                coupon.active ? 'border-[#EBEBEB] bg-white' : 'border-[#EBEBEB] bg-[#F5F4F2] opacity-70',
              )}
            >
              <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl', coupon.active ? 'bg-[#C84B31]' : 'bg-[#9CA3AF]')} />
              <CardContent className="p-4 sm:p-5 pl-5 sm:pl-6">
                {/* Code row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[18px] text-[#1A1A1A] tracking-widest font-mono">{coupon.code}</span>
                      <button onClick={() => copyCode(coupon.code)} className="w-6 h-6 rounded-md bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#9CA3AF] hover:text-[#C84B31] transition-colors">
                        <Copy className="w-3 h-3" />
                      </button>
                      {coupon.auto_apply && (
                        <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full">AUTO</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#9CA3AF]">{coupon.description}</p>
                  </div>
                  <Toggle checked={coupon.active} onChange={() => handleToggle(coupon.id, coupon.active)} />
                </div>

                {/* Discount highlight */}
                <div className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl border mb-3', coupon.active ? 'bg-[#FFF0EC] border-[#FDDDD5]' : 'bg-[#F5F4F2] border-[#EBEBEB]')}>
                  <div className="flex items-center gap-2">
                    {coupon.type === 'percentage'
                      ? <Percent className="w-4 h-4 text-[#C84B31]" />
                      : <IndianRupee className="w-4 h-4 text-[#C84B31]" />
                    }
                    <span className="font-bold text-[20px] text-[#C84B31] leading-none">
                      {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                    </span>
                  </div>
                  {coupon.max_discount && (
                    <span className="text-[10px] text-[#9CA3AF]">up to ₹{coupon.max_discount}</span>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: 'Min Order',  value: `₹${coupon.min_order.toLocaleString()}` },
                    { label: 'Valid Till', value: coupon.valid_to },
                    { label: 'For',        value: applicableLabel },
                    { label: 'Redeemed',   value: `${coupon.used_count} / ${coupon.usage_limit.toLocaleString()}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#F5F4F2] rounded-lg px-2.5 py-2 border border-[#EBEBEB]">
                      <p className="text-[9px] text-[#9CA3AF] font-medium">{label}</p>
                      <p className="text-[11px] font-semibold text-[#1A1A1A] mt-0.5 leading-tight">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Usage progress */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-[#9CA3AF]">Usage</span>
                    <span className="text-[10px] font-semibold text-[#1A1A1A]">{usagePct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#F5F4F2] rounded-full overflow-hidden border border-[#EBEBEB]">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', usagePct > 90 ? 'bg-red-400' : usagePct > 70 ? 'bg-amber-400' : 'bg-[#C84B31]')}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                  {usagePct > 90 && (
                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Almost at usage limit
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#EBEBEB]">
                  <span className="text-[10px] text-[#9CA3AF]">{coupon.valid_from} → {coupon.valid_to}</span>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="w-7 h-7 rounded-lg bg-[#F5F4F2] border border-[#EBEBEB] flex items-center justify-center text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}