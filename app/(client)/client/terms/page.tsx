'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';

const sections = [
  {
    title: '1. Services',
    body: 'We provide a platform to connect users with independent beauty service providers.',
  },
  {
    title: '2. Bookings',
    body: null,
    bullets: [
      'All bookings must be made through the app.',
      'Prices are fixed and non-negotiable.',
    ],
  },
  {
    title: '3. Payments',
    body: null,
    bullets: [
      'Payments must be made via the app.',
      'Cash payments are discouraged.',
    ],
  },
  {
    title: '4. Cancellations & Refunds',
    body: null,
    bullets: [
      'Users can cancel bookings within the allowed time window.',
      'Refunds will be processed as per policy.',
      'Last-minute cancellations may incur charges.',
    ],
  },
  {
    title: '5. Service Quality',
    body: null,
    bullets: [
      'We strive for quality but do not guarantee specific results.',
      'Issues must be reported within 24 hours of the service.',
    ],
  },
  {
    title: '6. User Responsibilities',
    body: 'Users must:',
    bullets: [
      'Provide a correct address and accurate details.',
      'Maintain respectful behaviour towards service providers.',
    ],
  },
  {
    title: '7. Liability',
    body: 'We act as a platform and are not directly liable for:',
    bullets: [
      'Service outcomes or results.',
      'Allergic reactions caused by products used.',
      'Damages caused by providers.',
    ],
  },
  {
    title: '8. Account Suspension',
    body: 'We reserve the right to suspend accounts for:',
    bullets: [
      'Misuse of the platform.',
      'Fraudulent activity.',
      'Abuse or harassment of service providers.',
    ],
  },
  {
    title: '9. Modifications',
    body: 'We may update these terms at any time. Continued use of the app constitutes acceptance of the revised terms.',
  },
  {
    title: '10. Governing Law',
    body: 'These terms are governed by and construed in accordance with Indian law.',
  },
];

export default function TermsPage() {
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
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e5849c]/20 flex items-center justify-center">
            <FileText size={20} className="text-[#e5849c]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Terms &amp; Conditions</h1>
            <p className="text-white/40 text-xs mt-0.5">Last updated: April 2026</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3 relative z-10">
        {/* Intro card */}
        <div className="bg-[#fff5f7] border border-[#f9d0db] rounded-2xl px-4 py-4">
          <p className="text-sm text-[#c0607a] leading-relaxed">
            Welcome to <span className="font-bold">AmaraGo</span>. By using our platform, you agree to the
            following terms and conditions. Please read them carefully.
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
              <ul className="space-y-1.5">
                {sec.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#e5849c] flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {/* Footer note */}
        <div className="bg-[#111827] rounded-2xl px-4 py-4">
          <p className="text-white/70 text-xs text-center leading-relaxed">
            By using the AmaraGo app, you confirm that you have read and agree to these Terms &amp; Conditions.
          </p>
        </div>

        <p className="text-center text-[10px] text-gray-300 pt-1">AmaraGo v1.0.0 · Made with 💗 in Mumbai</p>
      </div>
    </div>
  );
}
