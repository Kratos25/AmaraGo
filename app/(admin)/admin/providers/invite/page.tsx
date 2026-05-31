'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Share2, Link2, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/app/lib/utils';
import AdminLayout from '../../_components/AdminLayout';

const REGISTRATION_URL = process.env.NEXT_PUBLIC_FRONTEND_URL
  ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?as=provider`
  : 'https://amarago-frontend-d4iefytflq-el.a.run.app/login?as=provider';

export default function InviteProviderPage() {
  const router    = useRouter();
  const { toast } = useToast();

  const [copied,   setCopied]   = useState(false);
  const [phone,    setPhone]    = useState('');
  const [message,  setMessage]  = useState(
    `Hi! 👋 You're invited to join AmaraGo as a service provider.\n\nSign up here: ${REGISTRATION_URL}\n\nEarn great income by offering your skills on our platform!`,
  );
  const [sending, setSending] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(REGISTRATION_URL);
      setCopied(true);
      toast({ title: 'Link copied!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const sendWhatsApp = () => {
    if (!phone.trim()) {
      toast({ title: 'Enter a phone number', variant: 'destructive' });
      return;
    }
    const cleaned = phone.replace(/\D/g, '');
    const international = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
    const url = `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSending(false);
    setPhone('');
    toast({ title: 'WhatsApp opened ✓', description: 'Send the message to invite the provider.' });
  };

  const shareLinkNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join AmaraGo as a Provider', url: REGISTRATION_URL });
      } catch { /* user cancelled */ }
    } else {
      copyLink();
    }
  };

  return (
    <AdminLayout
      title="Invite Provider"
      subtitle="Share the registration link with potential providers"
      topBarRight={
        <Button variant="outline" className="h-9 px-4 border-[#EBEBEB] text-[#6B7280] hover:bg-[#F5F4F2] font-semibold text-[13px] rounded-xl shadow-none"
          onClick={() => router.back()}>
          ← Back
        </Button>
      }
    >
      <div className="max-w-2xl space-y-5">

        {/* Registration link card */}
        <Card className="border border-[#EBEBEB] shadow-none bg-white">
          <CardContent className="p-5 sm:p-6">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Registration Link</p>
            <p className="text-[12px] text-[#6B7280] mb-4">
              Share this link with the provider. They can sign up and will appear in your pending approvals queue.
            </p>
            <div className="flex items-center gap-2 p-3 bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl mb-4 overflow-hidden">
              <Link2 className="w-4 h-4 text-[#C84B31] shrink-0" />
              <span className="text-[12px] text-[#1A1A1A] font-medium truncate flex-1">{REGISTRATION_URL}</span>
            </div>
            <div className="flex gap-2.5">
              <button onClick={copyLink}
                className={cn('flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border text-[13px] font-semibold transition-all',
                  copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-[#EBEBEB] text-[#6B7280] hover:bg-[#F5F4F2]')}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button onClick={shareLinkNative}
                className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border border-[#C84B31] bg-[#FFF0EC] text-[#C84B31] text-[13px] font-semibold hover:bg-[#FFE8E0] transition-colors">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp invite card */}
        <Card className="border border-[#EBEBEB] shadow-none bg-white">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[13px] font-bold text-[#1A1A1A]">Send via WhatsApp</p>
            </div>
            <p className="text-[12px] text-[#9CA3AF] mb-4">Enter the provider&apos;s phone number to open WhatsApp with a pre-filled invite message.</p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Phone Number</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-10 px-3 flex items-center bg-[#F5F4F2] border border-[#EBEBEB] rounded-xl text-[13px] font-semibold text-[#6B7280] shrink-0">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="flex-1 h-10 px-3 text-[13px] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full mt-1 px-3 py-2.5 text-[12px] bg-white border border-[#EBEBEB] rounded-xl focus:outline-none focus:border-[#C84B31] resize-none leading-relaxed"
                />
              </div>

              <Button
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold text-[13px] rounded-xl shadow-none border-0"
                onClick={sendWhatsApp}
                disabled={!phone.trim() || sending}
              >
                <MessageSquare className="w-4 h-4 mr-2" /> Open WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="border border-[#EBEBEB] shadow-none bg-[#FFF0EC]">
          <CardContent className="p-5">
            <p className="text-[12px] font-bold text-[#C84B31] mb-2">Tips for recruiting providers</p>
            <ul className="space-y-1.5">
              {[
                'After the provider signs up, approve them from the Pending tab.',
                'Set a custom commission rate on their profile after approval.',
                'New providers appear in your notifications for quick approval.',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-[11px] text-[#6B7280]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C84B31] mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
