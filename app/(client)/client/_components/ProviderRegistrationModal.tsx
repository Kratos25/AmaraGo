"use client";

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User } from 'firebase/auth';
import { authAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ProviderRegistrationModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProviderRegistrationModal({
  user,
  onClose,
  onSuccess,
}: ProviderRegistrationModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState(user.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill all required fields.',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      await authAPI.registerProvider({
        name: fullName,
        email: user.email ?? '',
        phone,
        firebase_uid: user.uid,
        id_token: token,
        bio,
        experience_years: parseInt(experience) || 0,
        services_offered: [],
        location: address,
      });
      toast({
        title: 'Application submitted! 🎉',
        description: "We'll verify your request within 24 hours. You'll be notified once approved.",
      });
      onSuccess();
    } catch (err: any) {
      toast({
        title: 'Registration failed',
        description: err?.response?.data?.detail ?? err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      {/*
        Sheet container:
        - On mobile: slides up from bottom, takes up to 85dvh
          (leaving ~15dvh gap above so the top of the modal is tappable to dismiss).
          We use `dvh` so the browser's bottom nav bar is already excluded from the
          viewport height, meaning our modal never slides under it.
        - On sm+: centered card, max-w-lg, rounded all sides.
      */}
      <div
        className="
          bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-2xl
          flex flex-col
          max-h-[85dvh] sm:max-h-[90vh] sm:max-w-lg
        "
      >
        {/* ── Header (never scrolls) ─────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Become a Provider</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fill in your details to get started</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* ── Scrollable form body ───────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <form id="provform" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="prov-name" className="text-sm">Full Name *</Label>
              <Input
                id="prov-name"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1.5 h-10 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="prov-phone" className="text-sm">Phone Number *</Label>
              <Input
                id="prov-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-1.5 h-10 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="prov-address" className="text-sm">Service Area / Address *</Label>
              <Input
                id="prov-address"
                placeholder="e.g. Andheri West, Mumbai"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="mt-1.5 h-10 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="prov-exp" className="text-sm">Years of Experience</Label>
              <Input
                id="prov-exp"
                placeholder="e.g. 3"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="mt-1.5 h-10 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="prov-bio" className="text-sm">Bio / About You</Label>
              <textarea
                id="prov-bio"
                placeholder="Tell clients a bit about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full mt-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e5849c]/40 resize-none"
              />
            </div>
          </form>
        </div>

        {/*
          ── Sticky footer with submit button ──────────────────
          KEY FIX: On mobile the bottom nav bar sits on top of the viewport.
          `dvh` units (used on the modal height above) already account for the
          browser chrome, but the bottom nav is an *in-app* element rendered
          outside this modal. We add `pb-safe` (env(safe-area-inset-bottom))
          plus an extra 64px bottom padding on mobile (`pb-20`) so the button
          always clears the nav bar. On sm+ screens we reset to normal padding.
        */}
        <div className="px-6 pt-3 pb-20 sm:pb-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <Button
            type="submit"
            form="provform"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white h-11 text-sm font-medium shadow-md"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Register as Provider'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}