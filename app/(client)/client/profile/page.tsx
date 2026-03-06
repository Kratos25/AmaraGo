"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Edit3, Camera, Star, Award, ChevronRight,
  Bell, Shield, HelpCircle, LogOut, MapPin,
  Gift, Sparkles, Check, X, Heart
} from 'lucide-react';
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

type MenuItemType = {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  badge?: string;
  danger?: boolean;
  isToggle?: boolean;
  action?: () => void;
};

const achievements = [
  { icon: '💅', label: 'First Booking',   unlocked: true  },
  { icon: '⭐', label: 'Star Reviewer',   unlocked: true  },
  { icon: '🔥', label: '5 Bookings',      unlocked: true  },
  { icon: '💎', label: 'VIP Member',      unlocked: false },
  { icon: '🎂', label: 'Birthday Beauty', unlocked: false },
  { icon: '👑', label: 'Loyalty Queen',   unlocked: false },
];

export default function Profile() {
  const router = useRouter();
  const [isEditing, setIsEditing]     = useState(false);
  const [name, setName]               = useState('Ananya Sharma');
  const [phone, setPhone]             = useState('+91 98765 43210');
  const [email]                       = useState('ananya@email.com');
  const [editName, setEditName]       = useState(name);
  const [editPhone, setEditPhone]     = useState(phone);
  const [notifications, setNotifs]    = useState(true);

  const loyaltyPoints  = 1240;
  const nextTierPoints = 2000;
  const progress       = Math.round((loyaltyPoints / nextTierPoints) * 100);

  const handleSignOut = async () => {
    try {
      // 1. Sign out from Firebase client
      await signOut(auth);

      // 2. Clear the session cookie via API
      await fetch("/api/auth/logout", { method: "POST" });

      // 3. Redirect to login
      router.replace("/login");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const menuSections: { title: string; items: MenuItemType[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: <MapPin size={17} />,  label: 'Saved Addresses', sub: '2 addresses saved'     },
        { icon: <Gift size={17} />,    label: 'Refer & Earn',    sub: 'Get ₹200 per referral', badge: 'NEW' },
        { icon: <Heart size={17} />,   label: 'Wishlist',        sub: '3 saved services'       },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: <Bell size={17} />,   label: 'Notifications',     sub: notifications ? 'Enabled' : 'Disabled', isToggle: true, action: () => setNotifs(n => !n) },
        { icon: <Shield size={17} />, label: 'Privacy & Security', sub: 'Manage your data' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: <HelpCircle size={17} />, label: 'Help & Support', sub: 'Chat, call, FAQs'   },
        { icon: <Star size={17} />,        label: 'Rate the App',   sub: 'Share your feedback' },
      ],
    },
    {
      title: '',
      items: [
        { icon: <LogOut size={17} />, label: 'Sign Out', danger: true, action: handleSignOut, },
      ],
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .pf { font-family:'DM Sans',sans-serif; background:#faf9f8; }
        .cf { font-family:'Cormorant Garamond',serif; }

        /* Header */
        .pf-hero {
          background: linear-gradient(150deg,#c9607e 0%,#d4769a 45%,#e8a8bc 100%);
          padding: 52px 20px 72px;
          position: relative; overflow: hidden;
        }
        .pf-hero::before {
          content:''; position:absolute; top:-30%; right:-15%;
          width:220px; height:220px; border-radius:50%;
          background:rgba(255,255,255,.08);
        }
        .pf-hero::after {
          content:''; position:absolute; bottom:0; left:0; right:0;
          height:56px; background:#faf9f8;
          border-radius: 52% 52% 0 0 / 56px 56px 0 0;
        }

        /* Avatar spinning ring */
        .av-ring {
          position:relative; width:96px; height:96px;
        }
        .av-ring::before {
          content:''; position:absolute; inset:-4px; border-radius:50%;
          background:conic-gradient(#f9d0db,#e5849c,#c9607e,#f9d0db);
          animation:spin 3s linear infinite;
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        .av-inner {
          position:relative; z-index:1; width:96px; height:96px;
          border-radius:50%; background:white;
          display:flex; align-items:center; justify-content:center; overflow:hidden;
        }
        .av-cam {
          position:absolute; bottom:2px; right:2px; z-index:2;
          width:28px; height:28px; border-radius:50%;
          background:linear-gradient(135deg,#e5849c,#E5AFBC);
          border:2.5px solid white;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer;
          box-shadow:0 2px 10px rgba(229,132,156,.45);
          transition:transform .2s ease;
        }
        .av-cam:hover { transform:scale(1.1); }

        /* Stat cards */
        .pf-stat {
          flex:1; text-align:center; padding:14px 6px;
          background:white; border-radius:16px;
          border:1.5px solid #f3f4f6;
          transition:transform .2s, box-shadow .2s;
        }
        .pf-stat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(229,132,156,.1); }

        /* Loyalty card */
        .loyalty-card {
          background:linear-gradient(135deg,#e5849c,#d4769a,#c9607e);
          border-radius:22px; padding:20px 22px;
          position:relative; overflow:hidden;
        }
        .loyalty-card::before {
          content:''; position:absolute; top:-40%; right:-10%;
          width:180px; height:180px; border-radius:50%;
          background:rgba(255,255,255,.09);
        }
        .loyalty-card::after {
          content:''; position:absolute; bottom:-30%; left:-5%;
          width:120px; height:120px; border-radius:50%;
          background:rgba(255,255,255,.06);
        }

        /* Progress */
        .prog-track {
          height:8px; background:rgba(255,255,255,.25);
          border-radius:100px; overflow:hidden;
        }
        .prog-fill {
          height:100%; background:white; border-radius:100px;
          box-shadow:0 0 10px rgba(255,255,255,.5);
          transition:width 1.2s cubic-bezier(.34,1.56,.64,1);
        }

        /* Achievements */
        .ach-icon {
          width:52px; height:52px; border-radius:16px;
          display:flex; align-items:center; justify-content:center;
          font-size:22px;
          transition:transform .2s ease;
          cursor:default;
        }
        .ach-icon:hover { transform:scale(1.12) rotate(-5deg); }
        .ach-on  { background:linear-gradient(135deg,#fff5f7,#fce7ef); border:1.5px solid #f9d0db; }
        .ach-off { background:#f3f4f6; filter:grayscale(1); opacity:.4; }

        /* Menu */
        .menu-card { background:white; border-radius:18px; overflow:hidden; border:1.5px solid #f3f4f6; }
        .menu-item {
          display:flex; align-items:center; gap:13px;
          padding:15px 18px; cursor:pointer;
          border:none; background:none; width:100%; text-align:left;
          font-family:'DM Sans',sans-serif;
          transition:background .15s ease;
        }
        .menu-item:hover { background:#fdf8f9; }
        .menu-item + .menu-item { border-top:1px solid #f9f9f9; }
        .menu-icon {
          width:38px; height:38px; border-radius:12px;
          background:#fff5f7; color:#e5849c;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
          transition:transform .2s ease;
        }
        .menu-item:hover .menu-icon { transform:scale(1.08); }
        .menu-icon.danger { background:#fff5f5; color:#ef4444; }

        /* Toggle */
        .toggle { width:44px; height:24px; border-radius:100px; position:relative; flex-shrink:0; transition:background .25s; }
        .toggle-knob {
          position:absolute; top:3px; width:18px; height:18px;
          background:white; border-radius:50%;
          box-shadow:0 1px 4px rgba(0,0,0,.18);
          transition:left .25s ease;
        }

        /* Edit sheet */
        .edit-overlay {
          position:fixed; inset:0; z-index:60;
          background:rgba(0,0,0,.45);
          display:flex; align-items:flex-end;
          animation:olIn .2s ease;
        }
        @keyframes olIn { from{opacity:0} to{opacity:1} }
        .edit-sheet {
          width:100%; background:white;
          border-radius:24px 24px 0 0;
          padding:24px 20px 44px;
          animation:shUp .3s cubic-bezier(.34,1.2,.64,1);
        }
        @keyframes shUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        .pf-input {
          width:100%; border:1.5px solid #e5e7eb; border-radius:12px;
          padding:12px 14px; font-size:14px; color:#374151;
          font-family:'DM Sans',sans-serif; outline:none; background:white;
          transition:border-color .2s; box-sizing:border-box;
        }
        .pf-input:focus { border-color:#e5849c; }
        .save-btn {
          width:100%; padding:16px; margin-top:20px;
          background:linear-gradient(135deg,#e5849c,#E5AFBC);
          color:white; border:none; border-radius:14px;
          font-size:15px; font-weight:600; font-family:'DM Sans',sans-serif;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 6px 20px rgba(229,132,156,.4);
          transition:filter .2s, transform .2s;
        }
        .save-btn:hover { filter:brightness(.92); transform:scale(1.01); }

        /* Fade in stagger */
        .pf-fade { animation:pfUp .5s ease both; }
        @keyframes pfUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .d1{animation-delay:.05s} .d2{animation-delay:.1s}  .d3{animation-delay:.15s}
        .d4{animation-delay:.20s} .d5{animation-delay:.25s} .d6{animation-delay:.3s}
        .d7{animation-delay:.35s}
      `}</style>

      <div className="pf min-h-screen pb-2">

        {/* ── Hero Header ── */}
        <div className="pf-hero">
          <div className="relative z-10 flex flex-col items-center">
            {/* Avatar */}
            <div className="av-ring mb-4">
              <div className="av-inner">
                <User size={46} color="#e5849c" />
              </div>
              <div className="av-cam">
                <Camera size={13} color="white" />
              </div>
            </div>

            {/* Name */}
            <div className="flex items-center gap-2 mb-1">
              <h1 className="cf text-white font-semibold" style={{ fontSize:'2rem', lineHeight:1 }}>{name}</h1>
              <button
                onClick={() => { setEditName(name); setEditPhone(phone); setIsEditing(true); }}
                style={{ background:'rgba(255,255,255,.2)', border:'none', borderRadius:'50%',
                  width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', transition:'background .2s' }}
                onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,.32)')}
                onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,.2)')}
              >
                <Edit3 size={14} color="white" />
              </button>
            </div>
            <p className="text-white/70 text-sm mb-3">{email}</p>

            {/* Tier badge */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background:'rgba(255,255,255,.18)', backdropFilter:'blur(6px)',
              borderRadius:100, padding:'6px 16px',
            }}>
              <Sparkles size={13} color="white" />
              <span style={{ color:'white', fontSize:12.5, fontWeight:500 }}>Amara Gold Member</span>
            </div>
          </div>
        </div>

        <div className="px-5 -mt-6 relative z-10 flex flex-col gap-5">

          {/* ── Stats ── */}
          <div className="flex gap-3 pf-fade d1">
            {[
              { val: '8',          label: 'Bookings', icon: '📅' },
              { val: '₹1,240',     label: 'Points',   icon: '💎' },
              { val: '4.9★',       label: 'Rating',   icon: '⭐' },
            ].map((s) => (
              <div key={s.label} className="pf-stat">
                <div style={{ fontSize:20, marginBottom:3 }}>{s.icon}</div>
                <div className="cf font-semibold text-gray-800" style={{ fontSize:'1.35rem' }}>{s.val}</div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Loyalty Card ── psychology: show gap to next tier to motivate more bookings ── */}
          <div className="loyalty-card pf-fade d2">
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p style={{ color:'rgba(255,255,255,.7)', fontSize:11, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:3 }}>
                    Loyalty Progress
                  </p>
                  <div className="flex items-center gap-2">
                    <Award size={20} color="white" />
                    <span className="cf text-white font-semibold" style={{ fontSize:'1.5rem' }}>Gold Member</span>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ color:'rgba(255,255,255,.7)', fontSize:11 }}>Points</p>
                  <p style={{ color:'white', fontWeight:700, fontSize:22 }}>{loyaltyPoints.toLocaleString()}</p>
                </div>
              </div>

              <div className="prog-track">
                <div className="prog-fill" style={{ width:`${progress}%` }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span style={{ color:'rgba(255,255,255,.65)', fontSize:11 }}>{loyaltyPoints} pts</span>
                <span style={{ color:'rgba(255,255,255,.85)', fontSize:11, fontWeight:500 }}>
                  Only {nextTierPoints - loyaltyPoints} pts to Platinum ✨
                </span>
              </div>
            </div>
          </div>

          {/* ── Achievements ── psychology: partial completion + locked badges triggers IKEA effect ── */}
          <div className="pf-fade d3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="cf text-gray-800 font-semibold" style={{ fontSize:'1.2rem' }}>Achievements</h2>
              <span style={{ fontSize:12, color:'#e5849c', fontWeight:500 }}>
                {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8 }}>
              {achievements.map((ach) => (
                <div key={ach.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <div className={`ach-icon ${ach.unlocked ? 'ach-on' : 'ach-off'}`}>
                    {ach.icon}
                  </div>
                  <span style={{ fontSize:9.5, color: ach.unlocked ? '#6b7280' : '#d1d5db', textAlign:'center', lineHeight:1.3 }}>
                    {ach.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Menu Sections ── */}
          {menuSections.map((section, si) => (
            <div key={si} className={`pf-fade d${si + 4}`}>
              {section.title && (
                <p style={{ fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'.1em',
                  textTransform:'uppercase', marginBottom:8, paddingLeft:2 }}>
                  {section.title}
                </p>
              )}
              <div className="menu-card">
                {section.items.map((item, ii) => (
                  <button key={ii} className="menu-item" onClick={item.action}>
                    <div className={`menu-icon ${item.danger ? 'danger' : ''}`}>
                      {item.icon}
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <p style={{ fontSize:14.5, fontWeight:500, color: item.danger ? '#ef4444' : '#1f2937', margin:0 }}>
                        {item.label}
                      </p>
                      {item.sub && (
                        <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 0' }}>{item.sub}</p>
                      )}
                    </div>

                    {item.isToggle ? (
                      <div className="toggle" style={{ background: notifications ? '#e5849c' : '#d1d5db' }}>
                        <div className="toggle-knob" style={{ left: notifications ? 23 : 3 }} />
                      </div>
                    ) : item.badge ? (
                      <span style={{
                        background:'linear-gradient(135deg,#e5849c,#E5AFBC)',
                        color:'white', fontSize:10, fontWeight:600,
                        padding:'3px 9px', borderRadius:100,
                      }}>{item.badge}</span>
                    ) : !item.danger ? (
                      <ChevronRight size={16} color="#d1d5db" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p className="pf-fade d7 text-center" style={{ fontSize:11, color:'#d1d5db' }}>
            AmaraGo v1.0.0 · Made with 💗 in Mumbai
          </p>
        </div>

        {/* ── Edit Profile Bottom Sheet ── */}
        {isEditing && (
          <div className="edit-overlay" onClick={() => setIsEditing(false)}>
            <div className="edit-sheet" onClick={e => e.stopPropagation()}>

              {/* Drag handle */}
              <div style={{ width:40, height:4, background:'#e5e7eb', borderRadius:100, margin:'0 auto 22px' }} />

              <div className="flex items-center justify-between mb-6">
                <h2 className="cf text-gray-800 font-semibold" style={{ fontSize:'1.6rem' }}>Edit Profile</h2>
                <button onClick={() => setIsEditing(false)}
                  style={{ background:'#f3f4f6', border:'none', borderRadius:'50%',
                    width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <X size={16} color="#6b7280" />
                </button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div>
                  <label style={{ fontSize:12, color:'#6b7280', fontWeight:500, display:'block', marginBottom:6 }}>
                    Full Name
                  </label>
                  <input className="pf-input" value={editName}
                    onChange={e => setEditName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label style={{ fontSize:12, color:'#6b7280', fontWeight:500, display:'block', marginBottom:6 }}>
                    Phone Number
                  </label>
                  <input className="pf-input" value={editPhone}
                    onChange={e => setEditPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label style={{ fontSize:12, color:'#6b7280', fontWeight:500, display:'block', marginBottom:6 }}>
                    Email Address
                  </label>
                  <input className="pf-input" value={email} disabled
                    style={{ background:'#f9fafb', color:'#9ca3af', cursor:'not-allowed' }} />
                  <p style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>Email cannot be changed</p>
                </div>
              </div>

              <button className="save-btn" onClick={() => { setName(editName); setPhone(editPhone); setIsEditing(false); }}>
                <Check size={17} /> Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}