'use client';

import React, { useState, useEffect } from 'react';
import { Settings, IndianRupee, Percent, Save, RefreshCw, CheckCircle } from 'lucide-react';
import AdminLayout from '../_components/AdminLayout';
import { adminAPI, type PlatformConfig } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// ─── Design tokens (admin) ───────────────────────────────────────────────────
// Primary   #C84B31   Hover #B04028
// Tint bg   #FFF0EC   Tint border #FDDDD5
// Page bg   #F5F4F2   Surface #FFFFFF   Border #EBEBEB

function FieldCard({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#EBEBEB] rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-[#C84B31]" size={18} />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#1A1A1A]">{label}</p>
          <p className="text-[12px] text-[#6B7280] mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local form state
  const [convFee, setConvFee] = useState('');
  const [origConvFee, setOrigConvFee] = useState('');
  const [commRate, setCommRate] = useState('');

  useEffect(() => {
    adminAPI.getConfig()
      .then((res) => {
        const c = res.data;
        setConfig(c);
        setConvFee(String(c.convenience_fee));
        setOrigConvFee(String(c.original_convenience_fee));
        setCommRate(String(c.commission_rate_default));
      })
      .catch(() => toast({ title: 'Failed to load config', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    const fee = parseFloat(convFee);
    const orig = parseFloat(origConvFee);
    const comm = parseFloat(commRate);

    if (isNaN(fee) || fee < 0) return toast({ title: 'Invalid convenience fee', variant: 'destructive' });
    if (isNaN(orig) || orig < 0) return toast({ title: 'Invalid original fee', variant: 'destructive' });
    if (isNaN(comm) || comm < 0 || comm > 100) return toast({ title: 'Commission must be 0–100', variant: 'destructive' });

    setSaving(true);
    try {
      const res = await adminAPI.updateConfig({
        convenience_fee: fee,
        original_convenience_fee: orig,
        commission_rate_default: comm,
      });
      setConfig(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: 'Settings saved', description: 'Platform config updated successfully.' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Settings" subtitle="Platform configuration">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF0EC] border border-[#FDDDD5] flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#C84B31]" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#1A1A1A]">Platform Settings</h1>
            <p className="text-[13px] text-[#6B7280]">Control fees and commission rates</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-[#C84B31] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">

            {/* Convenience fee */}
            <FieldCard
              icon={IndianRupee}
              label="Convenience Fee"
              description="Added to every customer order at checkout. Set to ₹0 to waive it — customers will see a 'FREE' badge with the original fee struck through."
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                    Current Fee (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">₹</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={convFee}
                      onChange={(e) => setConvFee(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 border border-[#EBEBEB] rounded-xl text-[14px] font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C84B31]/30 focus:border-[#C84B31]"
                    />
                  </div>
                  {parseFloat(convFee) === 0 && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1.5">
                      ✓ Fee waived — customers see FREE badge
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                    Original Fee (shown struck-through)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">₹</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={origConvFee}
                      onChange={(e) => setOrigConvFee(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 border border-[#EBEBEB] rounded-xl text-[14px] font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C84B31]/30 focus:border-[#C84B31]"
                    />
                  </div>
                </div>
              </div>

              {/* Live preview */}
              <div className="bg-[#F5F4F2] rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="text-[12px] text-[#6B7280]">Preview (checkout line item)</p>
                <div className="flex items-center gap-2 text-[13px] font-semibold">
                  <span className="text-[#1A1A1A]">Convenience Fee</span>
                  {parseFloat(convFee) === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#9CA3AF] line-through text-[12px]">₹{origConvFee || config?.original_convenience_fee}</span>
                      <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 text-[11px] font-bold px-1.5 py-0.5 rounded-md">FREE</span>
                    </div>
                  ) : (
                    <span className="text-[#1A1A1A]">₹{convFee}</span>
                  )}
                </div>
              </div>
            </FieldCard>

            {/* Commission rate */}
            <FieldCard
              icon={Percent}
              label="Default Commission Rate"
              description="Applied to all providers unless overridden per-provider. This is the % AmaraGo takes from each completed booking's total price."
            >
              <div className="relative w-40">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={commRate}
                  onChange={(e) => setCommRate(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 border border-[#EBEBEB] rounded-xl text-[14px] font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C84B31]/30 focus:border-[#C84B31]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm font-medium">%</span>
              </div>
              <p className="text-[12px] text-[#6B7280]">
                Urban Company charges 20–25%. Yes Madam uses employed model (~30–35% baked in).
                Recommended: <strong>10–15%</strong> for early growth.
              </p>
            </FieldCard>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#C84B31] hover:bg-[#B04028] text-white font-semibold text-[14px] transition-colors disabled:opacity-60"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
            </button>

          </div>
        )}
      </div>
    </AdminLayout>
  );
}
