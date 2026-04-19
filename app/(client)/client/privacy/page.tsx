'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

const sections = [
  {
    title: '1. Information We Collect',
    body: 'We collect the following information to provide our services:',
    bullets: [
      'Full name',
      'Phone number',
      'Address details',
      'Booking history and preferences',
      'Payment information (processed securely by our payment partners)',
    ],
  },
  {
    title: '2. How We Use Your Data',
    body: 'Your data is used to:',
    bullets: [
      'Process and manage your bookings.',
      'Improve our services and personalise your experience.',
      'Provide customer support.',
      'Send important service notifications.',
    ],
  },
  {
    title: '3. Data Sharing',
    body: 'We may share your data with:',
    bullets: [
      'Service providers — only the details needed to fulfil your booking.',
      'Payment partners — for secure payment processing.',
    ],
    note: 'We do NOT sell your personal data to third parties.',
  },
  {
    title: '4. Data Security',
    body: 'We use industry-standard secure systems and encryption to protect your personal data from unauthorised access, disclosure, or misuse.',
  },
  {
    title: '5. Cookies & Tracking',
    body: 'We may use cookies and similar technologies to improve your experience, remember preferences, and understand how you use our platform.',
  },
  {
    title: '6. Your Rights',
    body: 'You have the right to:',
    bullets: [
      'Request deletion of your personal data.',
      'Update or correct your information at any time via your profile.',
      'Opt out of non-essential communications.',
    ],
  },
  {
    title: '7. Third-Party Services',
    body: 'Our app may link to or integrate with third-party services (e.g. payment gateways, maps). We are not responsible for the privacy practices of those third parties.',
  },
  {
    title: '8. Policy Updates',
    body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes. Continued use of the app after changes constitutes acceptance.',
  },
  {
    title: '9. Contact Us',
    body: 'For any privacy-related concerns or data requests, please contact us at:',
    contact: 'support@amarago.in',
  },
];

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-[#111827] px-4 pt-8 pb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-5 transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e5849c]/20 flex items-center justify-center">
            <ShieldCheck size={20} className="text-[#e5849c]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Privacy Policy</h1>
            <p className="text-white/40 text-xs mt-0.5">Last updated: April 2026</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3 relative z-10">
        {/* Intro card */}
        <div className="bg-[#fff5f7] border border-[#f9d0db] rounded-2xl px-4 py-4">
          <p className="text-sm text-[#c0607a] leading-relaxed">
            At <span className="font-bold">AmaraGo</span>, we value and respect your privacy. This policy
            explains how we collect, use, and protect your personal information.
          </p>
        </div>

        {/* Sections */}
        {sections.map((sec) => (
          <div key={sec.title} className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
            <h2 className="text-sm font-bold text-[#111827] mb-2">{sec.title}</h2>
            {sec.body && (
              <p className="text-sm text-gray-600 leading-relaxed mb-2">{sec.body}</p>
            )}
            {sec.bullets && (
              <ul className="space-y-1.5 mb-2">
                {sec.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#e5849c] flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {sec.note && (
              <p className="text-xs font-semibold text-[#e5849c] bg-[#fff5f7] px-3 py-2 rounded-xl mt-1">
                🔒 {sec.note}
              </p>
            )}
            {sec.contact && (
              <a
                href={`mailto:${sec.contact}`}
                className="text-sm font-semibold text-[#e5849c] underline underline-offset-2"
              >
                {sec.contact}
              </a>
            )}
          </div>
        ))}

        {/* Footer note */}
        <div className="bg-[#111827] rounded-2xl px-4 py-4">
          <p className="text-white/70 text-xs text-center leading-relaxed">
            By using the AmaraGo app, you confirm that you have read and agree to this Privacy Policy.
          </p>
        </div>

        <p className="text-center text-[10px] text-gray-300 pt-1">AmaraGo v1.0.0 · Made with 💗 in Mumbai</p>
      </div>
    </div>
  );
}
