"use client";

import React, { useEffect, useRef } from "react";
import Image from 'next/image';
import Logo from '@/public/Amara_Logo.png';

// ─── Floating petal / sparkle data ───────────────────────────────────────────
const PETALS = [
  { id: 1, left: "8%",  top: "12%", size: 18, delay: 0,    dur: 6 },
  { id: 2, left: "22%", top: "28%", size: 12, delay: 0.8,  dur: 7 },
  { id: 3, left: "75%", top: "8%",  size: 22, delay: 1.5,  dur: 5 },
  { id: 4, left: "88%", top: "35%", size: 10, delay: 0.3,  dur: 8 },
  { id: 5, left: "60%", top: "72%", size: 16, delay: 2,    dur: 6 },
  { id: 6, left: "15%", top: "65%", size: 14, delay: 1.2,  dur: 7 },
  { id: 7, left: "45%", top: "88%", size: 20, delay: 0.6,  dur: 5 },
  { id: 8, left: "92%", top: "78%", size: 11, delay: 1.8,  dur: 9 },
  { id: 9, left: "35%", top: "15%", size: 9,  delay: 2.5,  dur: 6 },
  { id:10, left: "55%", top: "45%", size: 13, delay: 0.4,  dur: 8 },
];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    label: "Expert Beauticians",
    sub: "Certified professionals at your service",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" />
      </svg>
    ),
    label: "Book in 60 Seconds",
    sub: "Instant confirmation, zero wait time",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
    label: "4.9★ Rated Service",
    sub: "Loved by 10,000+ happy clients",
  },
];

// ─── Petal SVG shape ──────────────────────────────────────────────────────────
function Petal({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22C12 22 8 18 8 12C8 6 12 2 12 2Z"
        fill="white"
        fillOpacity="0.55"
      />
    </svg>
  );
}

export function LoginLeftPanel() {
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);

  // Subtle parallax on mouse move
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 30;
      const y = (e.clientY / innerHeight - 0.5) * 30;
      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translate(${-x * 0.4}px, ${-y * 0.4}px)`;
      }
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .amara-panel {
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #c96b8a 0%, #d4869e 40%, #e8b4c2 75%, #f0cdd7 100%);
        }

        .amara-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(255,255,255,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 90%, rgba(180,60,90,0.25) 0%, transparent 60%);
          pointer-events: none;
          z-index: 1;
        }

        /* Noise grain overlay */
        .amara-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 256px 256px;
          pointer-events: none;
          z-index: 2;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          pointer-events: none;
          z-index: 1;
        }

        .petal {
          position: absolute;
          pointer-events: none;
          z-index: 2;
          animation: petalFloat var(--dur) ease-in-out infinite var(--delay);
        }

        @keyframes petalFloat {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.6; }
          33% { transform: translateY(-12px) rotate(15deg) scale(1.1); opacity: 0.9; }
          66% { transform: translateY(-6px) rotate(-8deg) scale(0.95); opacity: 0.7; }
        }

        .display-font {
          font-family: 'Cormorant Garamond', serif;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .glass-card:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateX(4px);
        }

        .logo-ring {
          position: relative;
          width: 90px;
          height: 90px;
        }

        .logo-ring::before {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.4);
          animation: ringPulse 3s ease-in-out infinite;
        }

        .logo-ring::after {
          content: '';
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
          animation: ringPulse 3s ease-in-out infinite 0.5s;
        }

        @keyframes ringPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }

        .divider-line {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent);
        }

        .stat-number {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 600;
          line-height: 1;
          color: white;
        }

        .fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.7s ease forwards;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 12px;
          color: rgba(255,255,255,0.9);
          font-weight: 500;
          letter-spacing: 0.03em;
        }

        .tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 6px rgba(255,255,255,0.8);
          animation: dotBlink 2s ease-in-out infinite;
        }

        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .scroll-reveal { animation-fill-mode: both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }
        .delay-6 { animation-delay: 0.6s; }
        .delay-7 { animation-delay: 0.7s; }
      `}</style>

      <div className="amara-panel hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative">

        {/* Ambient orbs */}
        <div
          ref={orb1Ref}
          className="orb"
          style={{
            width: 400,
            height: 400,
            top: "-15%",
            left: "-15%",
            background: "radial-gradient(circle, rgba(255,180,200,0.45) 0%, transparent 70%)",
          }}
        />
        <div
          ref={orb2Ref}
          className="orb"
          style={{
            width: 500,
            height: 500,
            bottom: "-20%",
            right: "-20%",
            background: "radial-gradient(circle, rgba(160,40,80,0.35) 0%, transparent 70%)",
          }}
        />

        {/* Floating petals */}
        {PETALS.map((p) => (
          <div
            key={p.id}
            className="petal"
            style={{
              left: p.left,
              top: p.top,
              "--dur": `${p.dur}s`,
              "--delay": `${p.delay}s`,
            } as React.CSSProperties}
          >
            <Petal size={p.size} />
          </div>
        ))}

        {/* Content container */}
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">

          {/* Live badge */}
          <div className="fade-in-up scroll-reveal delay-1">
            <div className="tag-pill">
              <span className="tag-dot" />
              Now serving Mumbai & beyond
            </div>
          </div>

          {/* Logo */}
          <div className="fade-in-up scroll-reveal delay-2 flex flex-col items-center gap-5">
            <div className="">
              <div >
                <Image src={Logo} alt="Amara Logo" className="w-24 h-24 rounded-2xl shadow-xl" />
              </div>
            </div>

            <div className="text-center">
              <p className="display-font text-white text-sm font-bold tracking-[0.25em] uppercase mb-1">
                Welcome to
              </p>
              <h1 className="display-font text-white font-semibold tracking-tight"
                style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", lineHeight: 1.1 }}>
                Amara Beauty
              </h1>
              <p className="display-font text-white/80 italic font-light"
                style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }}>
                Parlour
              </p>
            </div>
          </div>

          {/* Tagline */}
          <div className="fade-in-up scroll-reveal delay-3 text-center">
            <p className="text-white/85 font-light text-base leading-relaxed tracking-wide">
              Premium beauty & wellness,<br />
              <span className="text-white font-medium">delivered to your doorstep.</span>
            </p>
          </div>

          {/* Divider */}
          <div className="fade-in-up scroll-reveal delay-3 w-full">
            <div className="divider-line" />
          </div>

          {/* Feature cards */}
          <div className="fade-in-up scroll-reveal delay-4 w-full flex flex-col gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="glass-card px-4 py-3 flex items-center gap-4">
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{f.label}</p>
                  <p className="text-white/65 text-xs mt-0.5">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="fade-in-up scroll-reveal delay-5 w-full">
            <div className="divider-line" />
          </div>

          {/* Stats row */}
          <div className="fade-in-up scroll-reveal delay-6 w-full grid grid-cols-3 gap-2 text-center">
            {[
              { val: "10K+", label: "Happy Clients" },
              { val: "4.9★", label: "Avg Rating" },
              { val: "50+", label: "Services" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="stat-number">{s.val}</span>
                <span className="text-white/60 text-xs tracking-wide">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Bottom quote */}
          <div className="fade-in-up scroll-reveal delay-7 text-center">
            <p className="display-font italic text-white/50 text-sm">
              "Beauty begins the moment you decide<br />to be yourself."
            </p>
          </div>
        </div>
      </div>
    </>
  );
}