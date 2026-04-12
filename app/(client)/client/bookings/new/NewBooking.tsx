"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar, Clock, MapPin, ArrowLeft, CheckCircle,
  ChevronRight, Tag, Sparkles, Star, Timer, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bookingsAPI, couponsAPI, servicesAPI, addressesAPI, type Address as APIAddress } from '@/lib/api';

interface LocalService {
  id: string; name: string; category: string; duration: string;
  rating: number; discountedPrice: number; originalPrice: number;
}
interface PaymentOption { id: string; label: string; icon: string; subtitle: string; }

const paymentOptions: PaymentOption[] = [
  { id: 'upi',    label: 'UPI / GPay',     icon: '📱', subtitle: 'Instant transfer'  },
  { id: 'card',   label: 'Card',           icon: '💳', subtitle: 'Credit / Debit'    },
  { id: 'wallet', label: 'Blush Wallet',   icon: '👛', subtitle: '₹0 balance'        },
  { id: 'cash',   label: 'Pay on Service', icon: '💵', subtitle: 'Cash on delivery'  },
];

const STEPS = ['Date & Time', 'Address', 'Summary'];

export default function Booking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId');

  const [service, setService]           = useState<LocalService | null>(null);
  const [apiAddresses, setApiAddresses] = useState<APIAddress[]>([]);
  const [pageLoading, setPageLoading]   = useState(true);
  const [currentStep, setCurrentStep]   = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<APIAddress | null>(null);
  const [newAddress, setNewAddress]           = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('upi');
  const [coupon, setCoupon]               = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<boolean>(false);
  const [couponError, setCouponError]     = useState<boolean>(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  useEffect(() => {
    if (!serviceId) { router.back(); return; }
    Promise.all([servicesAPI.getById(serviceId), addressesAPI.list()])
      .then(([svcRes, addrRes]) => {
        const s = svcRes.data;
        setService({
          id: s.id,
          name: s.name,
          category: s.category_id,
          duration: s.duration,
          rating: s.rating,
          discountedPrice: s.discounted_price ?? s.base_price,
          originalPrice: s.base_price,
        });
        setApiAddresses(addrRes.data);
        const def = addrRes.data.find((a) => a.is_default) ?? addrRes.data[0] ?? null;
        setSelectedAddress(def);
      })
      .catch(() => router.back())
      .finally(() => setPageLoading(false));
  }, [serviceId]);

  if (pageLoading || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-[#e5849c] animate-spin" />
      </div>
    );
  }

  const handleApplyCoupon = () => {
    const valid: Record<string, number> = { WELCOME20: 200, AMARA10: 100, BEAUTY50: 50 };
    const discount = valid[coupon.toUpperCase()];
    if (discount) {
      setDiscountAmount(discount);
      setAppliedCoupon(true);
      setCouponError(false);
    } else {
      setCouponError(true);
    }
  };

  const subtotal = service.discountedPrice;
  const convFee  = 99;
  const total    = subtotal - discountAmount + convFee;
  const savings  = service.originalPrice - service.discountedPrice;

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !serviceId) return;
    const addressId = selectedAddress?.id ?? null;
    try {
      const { data } = await bookingsAPI.create({
        service_id: serviceId,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        address_id: addressId,
        address_text: !addressId ? (selectedAddress?.address ?? newAddress) : undefined,
        payment_method: selectedPayment,
        coupon_code: appliedCoupon ? coupon : undefined,
        total_amount: total,
      });
      const bookingData = {
        bookingId: data.id ?? data.booking_id ?? 'BK' + Date.now(),
        service: { name: service.name, image: '', category: service.category ?? '' },
        date: selectedDate,
        time: selectedTime,
        address: selectedAddress?.address ?? newAddress,
        total,
      };
      sessionStorage.setItem('currentBooking', JSON.stringify(bookingData));
      router.push('/client/bookings/status');
    } catch {
      router.push('/client/bookings/status');
    }
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      full: date.toISOString().split('T')[0],
      isToday: i === 0,
    };
  });

  const timeSlots = [
    { time: '09:00 AM', period: 'Morning'   },
    { time: '10:00 AM', period: 'Morning'   },
    { time: '11:00 AM', period: 'Morning'   },
    { time: '12:00 PM', period: 'Noon'      },
    { time: '02:00 PM', period: 'Afternoon' },
    { time: '03:00 PM', period: 'Afternoon' },
    { time: '04:00 PM', period: 'Afternoon' },
    { time: '05:00 PM', period: 'Evening'   },
    { time: '06:00 PM', period: 'Evening'   },
  ];

  const periods = ['Morning', 'Noon', 'Afternoon', 'Evening'];

  return (
    <div className="min-h-screen bg-[#fdf6f8]">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-[#111827]">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg text-white leading-tight">Book Service</h1>
            <p className="text-xs text-white/40 truncate max-w-[180px]">{service.name}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-white">{service.rating}</span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="max-w-2xl mx-auto px-6 pb-4">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-5 right-5 top-4 h-0.5 bg-white/15" />
            <div
              className="absolute left-5 top-4 h-0.5 bg-[#e5849c] transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((label, i) => {
              const s = i + 1;
              const done = currentStep > s;
              const active = currentStep === s;
              return (
                <div key={s} className="relative flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    done   ? 'bg-[#e5849c] text-white shadow-lg shadow-rose-100' :
                    active ? 'bg-white border-2 border-[#e5849c] text-[#e5849c] shadow-lg shadow-rose-50' :
                             'bg-white border-2 border-gray-200 text-gray-400'
                  }`}>
                    {done ? <CheckCircle size={16} /> : s}
                  </div>
                  <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-[#e5849c]' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Always-visible Service Pill ── */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="flex items-center gap-4 bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <div className="w-14 h-14 rounded-xl bg-[#111827] flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
            {service.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{service.name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Timer size={11} /> {service.duration}
              </span>
              <span className="text-xs font-bold text-[#e5849c]">₹{service.discountedPrice}</span>
              <span className="text-xs text-gray-400 line-through">₹{service.originalPrice}</span>
            </div>
          </div>
          {savings > 0 && (
            <div className="flex-shrink-0 bg-green-50 px-2.5 py-1 rounded-xl">
              <p className="text-xs font-bold text-green-600">Save ₹{savings}</p>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-5">

        {/* ════════════════════════════════
            STEP 1 — Date & Time
        ════════════════════════════════ */}
        {currentStep === 1 && (
          <>
            {/* Date Picker */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#fff5f7] flex items-center justify-center">
                  <Calendar size={16} className="text-[#e5849c]" />
                </div>
                <h2 className="font-bold text-gray-900">Choose a Date</h2>
              </div>
              <div className="flex gap-3 px-5 pb-5 overflow-x-auto">
                {dates.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(d.full)}
                    className={`flex-shrink-0 w-[72px] py-3.5 rounded-2xl text-center transition-all duration-200 ${
                      selectedDate === d.full
                        ? 'bg-[#111827] text-white shadow-lg scale-105'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    <div className={`text-[10px] font-semibold uppercase tracking-wide ${selectedDate === d.full ? 'text-white/50' : 'text-gray-400'}`}>
                      {d.isToday ? 'Today' : d.day}
                    </div>
                    <div className={`text-2xl font-black my-0.5 ${selectedDate === d.full ? 'text-white' : 'text-gray-800'}`}>
                      {d.date}
                    </div>
                    <div className={`text-[10px] font-medium ${selectedDate === d.full ? 'text-white/50' : 'text-gray-400'}`}>
                      {d.month}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Time Picker */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#fff5f7] flex items-center justify-center">
                  <Clock size={16} className="text-[#e5849c]" />
                </div>
                <h2 className="font-bold text-gray-900">Pick a Time</h2>
                {selectedTime && (
                  <span className="ml-auto text-xs font-semibold text-[#e5849c] bg-pink-50 px-2.5 py-1 rounded-full">
                    {selectedTime}
                  </span>
                )}
              </div>
              <div className="px-5 pb-5 space-y-4">
                {periods.map((period) => {
                  const slots = timeSlots.filter(s => s.period === period);
                  if (!slots.length) return null;
                  return (
                    <div key={period}>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">{period}</p>
                      <div className="flex flex-wrap gap-2.5">
                        {slots.map(({ time }) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                              selectedTime === time
                                ? 'bg-[#111827] text-white shadow-md'
                                : 'bg-gray-50 text-gray-600 hover:bg-[#fff5f7] hover:text-[#e5849c] border border-gray-100'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Trust Badges */}
            <div className="flex gap-3">
              {[
                { icon: '⚡', text: 'Instant Confirmation' },
                { icon: '🔒', text: 'Secure Booking'       },
                { icon: '↩️', text: 'Free Reschedule'      },
              ].map(b => (
                <div key={b.text} className="flex-1 bg-white rounded-2xl p-3 text-center border border-gray-100 shadow-sm">
                  <div className="text-lg">{b.icon}</div>
                  <p className="text-[10px] font-semibold text-gray-500 mt-1 leading-tight">{b.text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════════════════════════════════
            STEP 2 — Address
        ════════════════════════════════ */}
        {currentStep === 2 && (
          <>
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#fff5f7] flex items-center justify-center">
                  <MapPin size={16} className="text-[#e5849c]" />
                </div>
                <h2 className="font-bold text-gray-900">Saved Addresses</h2>
              </div>
              <div className="px-5 pb-5 space-y-3">
                {apiAddresses.length === 0 && (
                  <p className="text-sm text-gray-400 py-2">No saved addresses. Add one below.</p>
                )}
                {apiAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                      selectedAddress?.id === addr.id
                        ? 'border-[#e5849c] bg-[#fff5f7]'
                        : 'border-gray-100 bg-gray-50 hover:border-[#e5849c]/30'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      selectedAddress.id === addr.id ? 'bg-[#fff5f7]' : 'bg-white'
                    }`}>
                      {addr.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{addr.label}</p>
                        {selectedAddress?.id === addr.id && (
                          <span className="text-[10px] font-bold text-[#e5849c] bg-[#fff5f7] px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{addr.address}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      selectedAddress?.id === addr.id ? 'border-[#e5849c] bg-[#e5849c]' : 'border-gray-300'
                    }`}>
                      {selectedAddress?.id === addr.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#fff5f7] flex items-center justify-center">
                  <span className="text-base">📍</span>
                </div>
                <h2 className="font-bold text-gray-900">Add New Address</h2>
              </div>
              <Input
                placeholder="Start typing your address..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="bg-gray-50 border-gray-200 rounded-2xl py-5 text-sm"
              />
              {newAddress && (
                <button
                  className="mt-3 text-sm font-semibold text-[#e5849c] flex items-center gap-1"
                  onClick={() => {
                    setSelectedAddress({ id: 'custom', client_id: '', label: 'Other', address: newAddress, icon: '📍', is_default: false });
                    setNewAddress('');
                  }}
                >
                  Use this address <ChevronRight size={14} />
                </button>
              )}
            </section>

            {/* Appointment reminder */}
            <div className="bg-[#fff5f7] rounded-2xl p-4 border border-[#f9d0db]">
              <p className="text-xs text-gray-500 mb-1">Your appointment</p>
              <p className="text-sm font-bold text-gray-800">{selectedDate} · {selectedTime}</p>
              <p className="text-xs text-[#e5849c] font-medium mt-1">{service.name}</p>            </div>
          </>
        )}

        {/* ════════════════════════════════
            STEP 3 — Summary
        ════════════════════════════════ */}
        {currentStep === 3 && (
          <>
            {/* Hero Booking Card */}
            <section
              className="relative bg-[#111827] rounded-3xl overflow-hidden text-white p-5"
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }}
              />
              <div className="relative flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
                  {service.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    {service.category}
                  </span>
                  <p className="font-bold text-lg leading-tight mt-0.5">{service.name}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
                      <Calendar size={10} />
                      <span className="text-xs font-semibold">{selectedDate}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
                      <Clock size={10} />
                      <span className="text-xs font-semibold">{selectedTime}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
                <MapPin size={13} className="text-[#e5849c] flex-shrink-0" />
                <p className="text-xs text-white/70 font-medium">{selectedAddress?.address ?? newAddress}</p>
              </div>
            </section>

            {/* Coupon */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Tag size={15} className="text-amber-500" />
                </div>
                <h3 className="font-bold text-gray-900">Coupon Code</h3>
                {appliedCoupon && (
                  <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={11} /> Applied
                  </span>
                )}
              </div>
              {!appliedCoupon ? (
                <div className="flex gap-3">
                  <Input
                    placeholder="e.g. WELCOME20"
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value); setCouponError(false); }}
                    className={`flex-1 bg-gray-50 rounded-2xl py-5 text-sm border ${
                      couponError ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!coupon}
                    className="px-5 bg-[#111827] text-white rounded-2xl text-sm font-bold disabled:opacity-40"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 rounded-2xl px-4 py-3 border border-green-100">
                  <div>
                    <p className="text-sm font-bold text-green-700">🎉 {coupon.toUpperCase()} applied!</p>
                    <p className="text-xs text-green-600 mt-0.5">You saved ₹{discountAmount}</p>
                  </div>
                  <button
                    onClick={() => { setAppliedCoupon(false); setCoupon(''); setDiscountAmount(0); }}
                    className="text-xs text-gray-400 hover:text-red-400 font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-red-500 mt-2 font-medium">Invalid or expired coupon code.</p>
              )}
            </section>

            {/* Payment */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Shield size={15} className="text-purple-500" />
                </div>
                <h3 className="font-bold text-gray-900">Payment Method</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {paymentOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedPayment(opt.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                      selectedPayment === opt.id
                        ? 'border-[#e5849c] bg-[#fff5f7]'
                        : 'border-gray-100 hover:border-pink-200 bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800 leading-tight">{opt.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{opt.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Bill Summary */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Sparkles size={15} className="text-blue-500" />
                </div>
                <h3 className="font-bold text-gray-900">Bill Summary</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service charge</span>
                  <span className="font-semibold text-gray-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Convenience fee</span>
                  <span className="font-semibold text-gray-800">₹{convFee}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Service discount</span>
                    <span className="font-semibold text-green-600">–₹{savings}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Coupon ({coupon.toUpperCase()})</span>
                    <span className="font-semibold text-green-600">–₹{discountAmount}</span>
                  </div>
                )}
                <div className="h-px bg-gradient-to-r from-pink-100 to-transparent" />
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total Payable</span>
                  <span className="font-black text-xl text-[#e5849c]">₹{total}</span>
                </div>
                {(savings + discountAmount) > 0 && (
                  <div className="bg-green-50 rounded-2xl px-4 py-2.5 flex items-center gap-2 border border-green-100">
                    <span className="text-base">🎊</span>
                    <p className="text-xs font-bold text-green-700">
                      You're saving ₹{savings + discountAmount} on this booking!
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ── Floating Bottom CTA ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(s => s - 1)}
              className="w-14 h-14 flex items-center justify-center rounded-2xl border-2 border-[#e5849c]/30 text-[#e5849c] hover:bg-[#fff5f7] transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button
            disabled={currentStep === 1 && (!selectedDate || !selectedTime)}
            onClick={() => {
              if (currentStep < 3) setCurrentStep(s => s + 1);
              else handleConfirmBooking();
            }}
            className="flex-1 h-14 rounded-2xl bg-[#111827] hover:bg-[#1f2937] text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors active:scale-95"
          >
            {currentStep === 3 ? (
              <>
                <span>Confirm & Pay</span>
                <span className="bg-white/20 px-3 py-1 rounded-xl text-sm font-black">₹{total}</span>
              </>
            ) : (
              <>
                <span>{currentStep === 1 ? 'Continue to Address' : 'Review Booking'}</span>
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}