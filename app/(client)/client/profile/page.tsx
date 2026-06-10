"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/config/context/AuthContext';
import {
  User, Edit3, Camera, Star, Award, ChevronRight,
  Bell, Shield, HelpCircle, LogOut, MapPin, Plus, Trash2,
  Gift, Sparkles, Check, X, Heart, FileText, ShieldCheck, Phone,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usersAPI, loyaltyAPI } from '@/lib/api';
import { addressesAPI } from '@/lib/api';
import { useWishlist } from '@/config/context/WishlistContext';
import { ProviderRegistrationModal } from '@/app/(client)/client/_components/ProviderRegistrationModal';
import { LogoutOverlay } from '@/components/ui/LogoutOverlay';

type MenuItemType = {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  badge?: string;
  danger?: boolean;
  isToggle?: boolean;
  href?: string;
  action?: () => void;
};

const BASE_ACHIEVEMENTS = [
  { icon: '💅', label: 'First Booking',   requiredBookings: 1,  requiredPoints: 0   },
  { icon: '⭐', label: 'Star Reviewer',   requiredBookings: 1,  requiredPoints: 0,  requiresReview: true },
  { icon: '🔥', label: '5 Bookings',      requiredBookings: 5,  requiredPoints: 0   },
  { icon: '💎', label: 'VIP Member',      requiredBookings: 0,  requiredPoints: 500 },
  { icon: '🎂', label: 'Birthday Beauty', requiredBookings: 10, requiredPoints: 0   },
  { icon: '👑', label: 'Loyalty Queen',   requiredBookings: 0,  requiredPoints: 1000},
];

export default function Profile() {
  const router           = useRouter();
  const { user }         = useAuth();
  const { wishlist }     = useWishlist();
  const [isEditing, setIsEditing]   = useState(false);
  const [name, setName]             = useState(user?.displayName ?? 'User');
  const [phone, setPhone]           = useState('');
  const email                       = user?.email ?? '';
  const photoURL                    = user?.photoURL ?? null;
  const [editName, setEditName]     = useState(name);
  const [editPhone, setEditPhone]   = useState(phone);
  const [notifications, setNotifs]  = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [addresses, setAddresses]   = useState<any[]>([]);
  const [addrsLoading, setAddrsLoading] = useState(false);
  const [addingAddr, setAddingAddr] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrText, setNewAddrText]   = useState('');
  const [loggingOut, setLoggingOut]     = useState(false);

  const fetchAddresses = async () => {
    setAddrsLoading(true);
    try {
      const { data } = await addressesAPI.list();
      setAddresses(data);
    } catch {}
    finally { setAddrsLoading(false); }
  };

  // Fetch addresses on mount so the count in the menu is correct
  useEffect(() => {
    fetchAddresses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveAddress = async () => {
    if (!newAddrLabel.trim() || !newAddrText.trim()) return;
    try {
      await addressesAPI.create({ label: newAddrLabel, address: newAddrText, is_default: addresses.length === 0 });
      setNewAddrLabel(''); setNewAddrText(''); setAddingAddr(false);
      fetchAddresses();
    } catch {}
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await addressesAPI.delete(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersAPI.updateMe({ name: editName, phone: editPhone });
      setName(editName); setPhone(editPhone); setIsEditing(false);
    } catch {
      setName(editName); setPhone(editPhone); setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user?.displayName) { setName(user.displayName); setEditName(user.displayName); }
  }, [user]);

  useEffect(() => {
    usersAPI.getMe()
      .then(({ data }) => {
        if (data.phone) { setPhone(data.phone); setEditPhone(data.phone); }
        if (data.name)  { setName(data.name);   setEditName(data.name);   }
        if ((data as any).role === 'provider') setIsProvider(true);
      })
      .catch(() => {});
  }, []);

  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [loyaltyTier, setLoyaltyTier]     = useState('Silver');
  const [tierProgress, setTierProgress]   = useState(0);

  // Compute achievement unlock state from real data
  const achievements = BASE_ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked:
      (a.requiredBookings === 0 || bookingsCount >= a.requiredBookings) &&
      (a.requiredPoints  === 0 || loyaltyPoints  >= a.requiredPoints),
  }));
  const [nextTier, setNextTier]           = useState<string | null>('Gold');
  const [pointsNeeded, setPointsNeeded]   = useState(2000);

  useEffect(() => {
    import('@/lib/api').then(({ loyaltyAPI }) => {
      loyaltyAPI.getMe()
        .then(({ data }) => {
          setLoyaltyPoints(data.points ?? 0);
          setLoyaltyTier(data.tier ?? 'Silver');
          setTierProgress(data.tier_progress ?? 0);
          setNextTier(data.next_tier ?? null);
          setPointsNeeded(data.points_needed_for_next_tier ?? 0);
        })
        // Also fetch bookings count from profile API
        .then(() => usersAPI.getMe().then(({ data }) => setBookingsCount((data as any).bookings_count ?? 0)).catch(() => {}))
        .catch(() => {});
    });
  }, []);

  const progress = tierProgress;

  const handleSignOut = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    } catch (e) {
      console.error(e);
      setLoggingOut(false);
    }
  };

  const menuSections: { title: string; items: MenuItemType[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: <MapPin size={17} />, label: 'Saved Addresses', sub: `${addresses.length} address${addresses.length !== 1 ? 'es' : ''} saved`, action: () => setShowAddresses(true) },
        { icon: <Gift size={17} />,   label: 'Refer & Earn',    sub: 'Get ₹200 per referral', badge: 'NEW' },
        { icon: <Heart size={17} />,  label: 'Wishlist',        sub: `${wishlist?.length ?? 0} saved service${wishlist?.length !== 1 ? 's' : ''}`, href: '/client/wishlist' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: <Bell size={17} />,   label: 'Notifications',      sub: notifications ? 'Enabled' : 'Disabled', isToggle: true, action: () => setNotifs((n) => !n) },
        { icon: <Shield size={17} />, label: 'Privacy & Security', sub: 'Manage your data' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: <HelpCircle size={17} />, label: 'Help & Support',      sub: 'Chat, call, FAQs'      },
        { icon: <Star size={17} />,        label: 'Rate the App',        sub: 'Share your feedback'   },
        { icon: <FileText size={17} />,    label: 'Terms & Conditions',  sub: 'Usage terms',          href: '/client/terms'   },
        { icon: <ShieldCheck size={17} />, label: 'Privacy Policy',      sub: 'How we use your data', href: '/client/privacy' },
      ],
    },
    {
      title: '',
      items: [
        { icon: <LogOut size={17} />, label: 'Sign Out', danger: true, action: handleSignOut },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {loggingOut && <LogoutOverlay />}

      {/* ── Address Manager Drawer ── */}
      {showAddresses && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-900">Saved Addresses</h2>
              <button onClick={() => { setShowAddresses(false); setAddingAddr(false); }} className="p-2 rounded-full hover:bg-gray-100">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {addrsLoading ? (
                <div className="space-y-3">
                  {[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : addresses.length === 0 && !addingAddr ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <MapPin size={32} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No saved addresses yet</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-xl mt-0.5">{addr.icon ?? '📍'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900">{addr.label}</p>
                        {addr.is_default && <span className="text-[10px] bg-[#e5849c]/15 text-[#e5849c] font-semibold px-2 py-0.5 rounded-full">Default</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{addr.address}</p>
                    </div>
                    <button onClick={() => handleDeleteAddress(addr.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}

              {addingAddr && (
                <div className="p-4 bg-[#fdf0f3] rounded-2xl border border-[#e5849c]/20 space-y-3">
                  <input
                    placeholder="Label (e.g. Home, Office)"
                    value={newAddrLabel}
                    onChange={e => setNewAddrLabel(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e5849c]/40"
                  />
                  <textarea
                    placeholder="Full address"
                    value={newAddrText}
                    onChange={e => setNewAddrText(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e5849c]/40 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setAddingAddr(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSaveAddress} className="flex-1 py-2.5 rounded-xl bg-[#e5849c] text-white text-sm font-semibold hover:brightness-90">Save</button>
                  </div>
                </div>
              )}
            </div>
            {!addingAddr && (
              <div className="px-6 py-4 border-t border-gray-100">
                <button
                  onClick={() => setAddingAddr(true)}
                  className="w-full flex items-center justify-center gap-2 bg-[#111827] text-white py-3.5 rounded-2xl text-sm font-semibold hover:bg-[#1f2937] transition-colors"
                >
                  <Plus size={16} /> Add New Address
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Dark hero ── */}
      <div className="bg-[#111827] px-4 pt-8 pb-16 md:pt-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-[#e5849c]/40 flex items-center justify-center overflow-hidden">
              {photoURL ? (
                <Image
                  src={photoURL}
                  alt={name}
                  width={96}
                  height={96}
                  style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '50%' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User size={40} className="text-[#e5849c]" />
              )}
            </div>
            <button
              onClick={() => { setEditName(name); setEditPhone(phone); setIsEditing(true); }}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#e5849c] border-2 border-[#111827] flex items-center justify-center hover:bg-[#d4738b] transition-colors"
            >
              <Camera size={14} className="text-white" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-white">{name}</h1>
            <button
              onClick={() => { setEditName(name); setEditPhone(phone); setIsEditing(true); }}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Edit3 size={13} className="text-white" />
            </button>
          </div>
          <p className="text-white/50 text-sm">{email}</p>
          {phone && <p className="text-white/50 text-sm mb-1">{phone}</p>}
          {!phone && (
            <button
              onClick={() => { setEditName(name); setEditPhone(''); setIsEditing(true); }}
              className="text-[#e5849c] text-xs font-semibold mb-1 hover:underline"
            >
              + Add phone number
            </button>
          )}
          <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full">
            <Sparkles size={13} className="text-[#e5849c]" />
            <span className="text-white text-xs font-medium">Amara Gold Member</span>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 -mt-10 relative z-10 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: String(bookingsCount), label: 'Bookings', icon: '📅' },
            { val: loyaltyPoints.toLocaleString('en-IN'), label: 'Points',   icon: '💎' },
            { val: loyaltyTier,           label: 'Tier',    icon: '⭐' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl px-3 py-4 text-center border border-gray-100 shadow-sm">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-base font-extrabold text-[#111827]">{s.val}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Phone number prompt for Google sign-in users */}
        {!phone && (
          <div className="bg-[#fff5f7] border border-[#e5849c]/30 rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e5849c]/15 flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-[#e5849c]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111827]">Add your phone number</p>
              <p className="text-xs text-gray-500">Required for booking confirmations</p>
            </div>
            <button
              onClick={() => { setEditName(name); setEditPhone(''); setIsEditing(true); }}
              className="text-xs font-bold text-[#e5849c] bg-white border border-[#e5849c]/30 px-3 py-1.5 rounded-full hover:bg-[#fdf0f3] transition-colors flex-shrink-0"
            >
              Add
            </button>
          </div>
        )}

        {/* Loyalty */}
        <div className="bg-[#111827] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div>
              <p className="text-white/40 text-[10px] tracking-widest uppercase mb-1">Loyalty Progress</p>
              <div className="flex items-center gap-2">
                <Award size={18} className="text-[#e5849c]" />
                <span className="text-white font-bold">Gold Member</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[10px]">Points</p>
              <p className="text-white font-extrabold text-xl">{loyaltyPoints.toLocaleString()}</p>
            </div>
          </div>
          <div className="h-2 bg-white/15 rounded-full overflow-hidden relative z-10">
            <div className="h-full bg-[#e5849c] rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-2 relative z-10">
            <span className="text-white/40 text-[10px]">{loyaltyPoints} pts</span>
            <span className="text-white/60 text-[10px] font-medium">{pointsNeeded} pts to {nextTier ?? 'Platinum'} ✨</span>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#111827]">Achievements</h2>
            <span className="text-xs text-[#e5849c] font-semibold">
              {achievements.filter((a) => a.unlocked).length}/{achievements.length} unlocked
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {achievements.map((ach) => (
              <div key={ach.label} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${ach.unlocked ? 'bg-[#fff5f7] border border-[#f9d0db]' : 'bg-gray-100 grayscale opacity-40'}`}>
                  {ach.icon}
                </div>
                <span className="text-[9px] text-gray-500 text-center leading-tight">{ach.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu sections */}
        {menuSections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 px-1">
                {section.title}
              </p>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {section.items.map((item, ii) => (
                item.href ? (
                <button
                  key={ii}
                  onClick={() => router.push(item.href!)}
                  className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50 ${ii > 0 ? 'border-t border-gray-50' : ''}`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#fff5f7] text-[#e5849c]">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#111827]">{item.label}</p>
                    {item.sub && <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>}
                  </div>
                  <ChevronRight size={15} className="text-gray-300" />
                </button>
                ) : (
                <button
                  key={ii}
                  onClick={item.action}
                  className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50 ${ii > 0 ? 'border-t border-gray-50' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.danger ? 'bg-red-50 text-red-400' : 'bg-[#fff5f7] text-[#e5849c]'}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${item.danger ? 'text-red-500' : 'text-[#111827]'}`}>{item.label}</p>
                    {item.sub && <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>}
                  </div>
                  {item.isToggle ? (
                    <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notifications ? 'bg-[#e5849c]' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifications ? 'left-6' : 'left-1'}`} />
                    </div>
                  ) : item.badge ? (
                    <span className="text-[10px] font-bold bg-[#e5849c] text-white px-2 py-0.5 rounded-full">{item.badge}</span>
                  ) : !item.danger ? (
                    <ChevronRight size={15} className="text-gray-300" />
                  ) : null}
                </button>
                )
              ))}
            </div>
          </div>
        ))}

        {/* ── Become a Provider banner ─────────────────────────────── */}
        {!isProvider && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#e5849c] to-[#d45070] p-5">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💼</span>
                <h3 className="text-white font-extrabold text-base">Join AmaraGo as a Provider</h3>
              </div>
              <p className="text-white/80 text-xs leading-relaxed mb-4">
                Earn money by offering your beauty & wellness skills. Set your own schedule, grow your client base, and get paid weekly.
              </p>
              <div className="flex items-center gap-3 mb-4">
                {['Flexible hours', 'Weekly payouts', 'Free training'].map((perk) => (
                  <span key={perk} className="text-[10px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-full">
                    {perk}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setShowProviderModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-white text-[#e5849c] font-bold text-sm py-3 rounded-xl hover:bg-white/90 transition-colors shadow-sm"
              >
                Apply Now
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
        {isProvider && (
          <button
            onClick={() => router.push('/provider')}
            className="w-full flex items-center gap-4 bg-gradient-to-r from-[#111827] to-[#1f2937] rounded-2xl px-5 py-4 text-left hover:brightness-110 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#e5849c]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💼</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Provider Dashboard</p>
              <p className="text-white/50 text-xs mt-0.5">Manage your bookings and earnings</p>
            </div>
            <ChevronRight size={18} className="text-[#e5849c] flex-shrink-0" />
          </button>
        )}

        <p className="text-center text-[10px] text-gray-300 pt-2">AmaraGo v1.0.0 · Made with 💗 in Mumbai</p>
      </div>

      {/* Provider Registration Modal */}
      {showProviderModal && user && (
        <ProviderRegistrationModal
          user={user}
          onClose={() => setShowProviderModal(false)}
          onSuccess={() => { setIsProvider(true); setShowProviderModal(false); }}
        />
      )}

      {/* Edit Profile bottom sheet */}
      {isEditing && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-end"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-6 pb-10 max-w-lg mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#111827]">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Full Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e5849c] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Phone Number</label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e5849c] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Email Address</label>
                <input
                  value={email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#1f2937] disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Check size={16} />
              }
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}