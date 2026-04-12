"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, ChevronRight, Search, Star, CheckCircle, XCircle, Loader } from 'lucide-react';
import { bookingsAPI, type Booking as APIBooking } from '@/lib/api';

type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  service: string;
  category: string;
  expert: string;
  expertImage: string;
  expertRating: number;
  date: string;
  time: string;
  duration: string;
  address: string;
  price: number;
  status: BookingStatus;
  image: string;
}

const statusConfig: Record<BookingStatus, { label: string; color: string; bg: string; dot: string; icon: React.ReactNode }> = {
  upcoming:  { label: 'Upcoming',  color: 'text-blue-600',  bg: 'bg-blue-50',  dot: 'bg-blue-500',  icon: <Loader size={12} className="text-blue-600" /> },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500', icon: <CheckCircle size={12} className="text-green-600" /> },
  cancelled: { label: 'Cancelled', color: 'text-red-500',   bg: 'bg-red-50',   dot: 'bg-red-400',   icon: <XCircle size={12} className="text-red-500" /> },
};

const tabs: { key: 'all' | BookingStatus; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function Bookings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | BookingStatus>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [apiBookings, setApiBookings] = useState<APIBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsAPI.list()
      .then(({ data }) => setApiBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allBookings: Booking[] = apiBookings.map((b) => ({
    id: b.id,
    service: b.service_name ?? 'Service',
    category: '',
    expert: b.provider_name ?? 'Pending Assignment',
    expertImage: '',
    expertRating: 0,
    date: b.date,
    time: b.time,
    duration: '',
    address: b.address,
    price: b.total_price,
    status: (
      b.status === 'completed' ? 'completed' :
      b.status === 'cancelled' ? 'cancelled' : 'upcoming'
    ) as BookingStatus,
    image: '',
  }));

  const upcoming = allBookings.filter((b) => b.status === 'upcoming').length;

  const filtered = allBookings
    .filter((b) => activeTab === 'all' || b.status === activeTab)
    .filter((b) =>
      b.service.toLowerCase().includes(search.toLowerCase()) ||
      b.expert.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        .bk-page { font-family: 'DM Sans', sans-serif; }
        .playfair { font-family: 'Playfair Display', serif; }

        .bk-card {
          background: white;
          border-radius: 20px;
          border: 1.5px solid #f3f4f6;
          overflow: hidden;
          transition: all 0.3s ease;
          animation: bkSlideUp 0.4s ease both;
        }
        .bk-card:hover {
          border-color: #fce7ef;
          box-shadow: 0 8px 28px rgba(229,132,156,0.13);
          transform: translateY(-2px);
        }
        @keyframes bkSlideUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .d0{animation-delay:.05s} .d1{animation-delay:.10s} .d2{animation-delay:.15s} .d3{animation-delay:.20s}

        .bk-tab {
          padding: 8px 18px;
          border-radius: 100px;
          font-size: 13.5px;
          font-weight: 500;
          white-space: nowrap;
          border: 1.5px solid transparent;
          transition: all 0.22s ease;
          cursor: pointer;
          background: none;
        }
        .bk-tab.on  { background: linear-gradient(135deg,#e5849c,#E5AFBC); color:white; box-shadow:0 4px 12px rgba(229,132,156,.3); }
        .bk-tab.off { background: white; color:#6b7280; border-color:#e5e7eb; }
        .bk-tab.off:hover { border-color:#e5849c; color:#e5849c; }

        .bk-search {
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          padding: 11px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: border-color 0.2s;
        }
        .bk-search:focus-within { border-color: #e5849c; }
        .bk-search input { border:none; outline:none; width:100%; font-size:14px; font-family:'DM Sans',sans-serif; color:#374151; background:transparent; }

        .bk-divider { height:1px; background:#f3f4f6; }

        .bk-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 500;
        }

        .bk-btn {
          padding: 9px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-family: 'DM Sans', sans-serif;
        }
        .bk-btn-primary { background: linear-gradient(135deg,#e5849c,#E5AFBC); color:white; }
        .bk-btn-primary:hover { filter:brightness(.9); transform:scale(1.02); }
        .bk-btn-outline { background:white; color:#e5849c; border:1.5px solid #e5849c !important; }
        .bk-btn-outline:hover { background:#fff5f7; }

        .bk-info { display:flex; align-items:center; gap:6px; color:#6b7280; font-size:13px; }
        .bk-stat { background:white; border-radius:16px; padding:14px 18px; border:1.5px solid #f3f4f6; flex:1; text-align:center; }
      `}</style>

      <div className="bk-page min-h-screen bg-gray-50">

        {/* Hero header */}
        <header className="relative overflow-hidden px-5 pt-12 pb-8"
          style={{ background: 'linear-gradient(135deg, #e5849c 0%, #d4769a 50%, #E5AFBC 100%)' }}>
          {/* Decorative circles */}
          <div className="absolute" style={{ top:'-20%', right:'-5%', width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
          <div className="absolute" style={{ bottom:'-30%', left:'-8%', width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />

          <div className="relative z-10">
            <p className="text-white/70 text-sm tracking-widest uppercase mb-1">My</p>
            <h1 className="playfair text-white font-semibold mb-6" style={{ fontSize:'2.4rem' }}>Bookings</h1>

            {/* Stats */}
            <div className="flex gap-3">
              {[
                { val: allBookings.length, label: 'Total' },
                { val: upcoming,            label: 'Upcoming' },
                { val: allBookings.filter(b => b.status === 'completed').length, label: 'Completed' },
              ].map((s) => (
                <div key={s.label} className="bk-stat">
                  <div className="playfair text-gray-800 font-semibold" style={{ fontSize:'1.6rem' }}>{s.val}</div>
                  <div className="text-gray-500" style={{ fontSize:11 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="px-5 pb-28">

          {/* Search */}
          <div className="bk-search mt-5 mb-4">
            <Search size={16} color="#9ca3af" />
            <input placeholder="Search service or expert..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ color:'#9ca3af', background:'none', border:'none', cursor:'pointer', fontSize:16 }}>✕</button>}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 pb-1 mb-5" style={{ overflowX:'auto', scrollbarWidth:'none' }}>
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`bk-tab ${activeTab === tab.key ? 'on' : 'off'}`}>
                {tab.label}
                {tab.key === 'upcoming' && upcoming > 0 && (
                  <span style={{ marginLeft:6, background:'rgba(255,255,255,0.28)', borderRadius:100, padding:'1px 7px', fontSize:11 }}>
                    {upcoming}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Cards */}
          {filtered.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px 24px', textAlign:'center' }}>
              <div style={{ fontSize:60, marginBottom:16 }}>📋</div>
              <h3 className="playfair text-gray-700 font-semibold mb-2" style={{ fontSize:'1.3rem' }}>No bookings found</h3>
              <p className="text-gray-500 mb-6" style={{ fontSize:14 }}>
                {search ? 'Try a different search term' : 'Book a service and it will appear here'}
              </p>
              <button className="bk-btn bk-btn-primary" onClick={() => router.push('/client/services')}>
                Explore Services
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {filtered.map((booking, i) => {
                const cfg = statusConfig[booking.status];
                const isOpen = expandedId === booking.id;

                return (
                  <div key={booking.id} className={`bk-card d${i}`}>

                    {/* Main row */}
                    <div style={{ display:'flex', gap:14, padding:'16px 16px 14px' }}>

                      {/* Thumbnail */}
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <img src={booking.image} alt={booking.service}
                          style={{ width:86, height:86, borderRadius:14, objectFit:'cover' }} />
                        <div style={{
                          position:'absolute', top:-5, right:-5,
                          width:14, height:14, borderRadius:'50%',
                          border:'2px solid white',
                        }} className={cfg.dot} />
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                          <h3 style={{ fontWeight:600, color:'#1f2937', fontSize:15, lineHeight:1.3 }}
                            className="line-clamp-2">{booking.service}</h3>
                          <span className={`bk-pill ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>

                        <p style={{ fontSize:12, color:'#9ca3af', marginTop:2, marginBottom:10 }}>
                          {booking.category} • #{booking.id}
                        </p>

                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          <div className="bk-info">
                            <Calendar size={13} color="#e5849c" />
                            {booking.date} · {booking.time}
                          </div>
                          <div className="bk-info">
                            <Clock size={13} color="#e5849c" />
                            {booking.duration}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bk-divider" />

                    {/* Expert + price */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <img src={booking.expertImage} alt={booking.expert}
                          style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:'2px solid #fce7ef' }} />
                        <div>
                          <p style={{ fontSize:13.5, fontWeight:500, color:'#1f2937' }}>{booking.expert}</p>
                          <div style={{ display:'flex', alignItems:'center', gap:3, color:'#f59e0b', fontSize:12 }}>
                            <Star size={11} fill="#f59e0b" />
                            <span style={{ color:'#6b7280' }}>{booking.expertRating}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:18, fontWeight:700, color:'#e5849c' }}>₹{booking.price.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Expanded address */}
                    {isOpen && (
                      <>
                        <div className="bk-divider" />
                        <div style={{ padding:'10px 16px 12px' }}>
                          <div className="bk-info">
                            <MapPin size={13} color="#e5849c" />
                            {booking.address}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="bk-divider" />

                    {/* Actions */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', gap:12 }}>
                      <button
                        onClick={() => setExpandedId(isOpen ? null : booking.id)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#e5849c', fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:3, fontFamily:"'DM Sans',sans-serif" }}
                      >
                        {isOpen ? 'Less' : 'Details'}
                        <ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }} />
                      </button>

                      <div style={{ display:'flex', gap:8 }}>
                        {booking.status === 'upcoming' && (
                          <>
                            <button className="bk-btn bk-btn-outline">Reschedule</button>
                            <button className="bk-btn bk-btn-primary">Track</button>
                          </>
                        )}
                        {booking.status === 'completed' && (
                          <>
                            <button className="bk-btn bk-btn-outline">Rate ★</button>
                            <button className="bk-btn bk-btn-primary"
                              onClick={() => router.push('/client/bookings/new?serviceId=1')}>
                              Book Again
                            </button>
                          </>
                        )}
                        {booking.status === 'cancelled' && (
                          <button className="bk-btn bk-btn-primary"
                            onClick={() => router.push('/client/services')}>
                            Book Again
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}