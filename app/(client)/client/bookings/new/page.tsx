"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Clock, MapPin, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Service {
  id: number;
  name: string;
  category: string;
  duration: number;
  rating: number;
  discountedPrice: number;
  originalPrice: number;
  image: string;
}

interface Address {
  id: number;
  label: string;
  address: string;
}

interface PaymentOption {
  id: string;
  label: string;
  icon: string;
}

const allServices: Service[] = [
  { id: 1,  name: 'Classic Haircut + Blow Dry',   category: 'Hair Care',     duration: 60,  rating: 4.8, discountedPrice: 899,  originalPrice: 1200,  image: 'https://picsum.photos/id/1015/600/400' },
  { id: 2,  name: 'Luxury Hair Spa & Mask',        category: 'Hair Care',     duration: 90,  rating: 4.7, discountedPrice: 1499, originalPrice: 1999,  image: 'https://picsum.photos/id/1027/600/400' },
  { id: 3,  name: 'Keratin Smoothening Treatment', category: 'Hair Care',     duration: 180, rating: 4.9, discountedPrice: 4999, originalPrice: 6500,  image: 'https://picsum.photos/id/133/600/400'  },
  { id: 4,  name: 'HydraFacial Signature',         category: 'Skin Care',     duration: 75,  rating: 4.9, discountedPrice: 3299, originalPrice: 4500,  image: 'https://picsum.photos/id/201/600/400'  },
  { id: 5,  name: 'Deep Cleansing Glow Facial',    category: 'Skin Care',     duration: 60,  rating: 4.6, discountedPrice: 1299, originalPrice: 1800,  image: 'https://picsum.photos/id/251/600/400'  },
  { id: 6,  name: 'Anti-Ageing Chemical Peel',     category: 'Skin Care',     duration: 45,  rating: 4.8, discountedPrice: 2499, originalPrice: 3200,  image: 'https://picsum.photos/id/274/600/400'  },
  { id: 7,  name: 'Party Makeup Look',             category: 'Makeup',        duration: 60,  rating: 4.7, discountedPrice: 2499, originalPrice: 3500,  image: 'https://picsum.photos/id/1005/600/400' },
  { id: 8,  name: 'Full Bridal Makeup + Trial',    category: 'Makeup',        duration: 150, rating: 4.9, discountedPrice: 8999, originalPrice: 12000, image: 'https://picsum.photos/id/1011/600/400' },
  { id: 10, name: 'Gel Nail Extension Full Set',   category: 'Nail Art',      duration: 120, rating: 4.7, discountedPrice: 2099, originalPrice: 2800,  image: 'https://picsum.photos/id/133/600/400'  },
  { id: 13, name: 'Swedish Full Body Massage',     category: 'Spa & Massage', duration: 90,  rating: 4.6, discountedPrice: 2499, originalPrice: 3500,  image: 'https://picsum.photos/id/251/600/400'  },
];

const savedAddresses: Address[] = [
  { id: 1, label: 'Home',   address: 'Bandra West, Mumbai - 400050' },
  { id: 2, label: 'Office', address: 'Lower Parel, Mumbai - 400013' },
];

const paymentOptions: PaymentOption[] = [
  { id: 'upi',    label: 'UPI / Google Pay',   icon: '📱' },
  { id: 'card',   label: 'Credit / Debit Card', icon: '💳' },
  { id: 'wallet', label: 'Blush Wallet',        icon: '👛' },
  { id: 'cash',   label: 'Cash on Service',     icon: '💵' },
];

export default function Booking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId');

  const service = allServices.find((s) => s.id === parseInt(serviceId ?? '1')) ?? allServices[0];

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<Address>(savedAddresses[0]);
  const [newAddress, setNewAddress] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('upi');
  const [coupon, setCoupon] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<boolean>(false);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: date.getDate(),
      full: date.toISOString().split('T')[0],
    };
  });

  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

  const subtotal = service.discountedPrice;
  const discountAmount = appliedCoupon ? Math.round(subtotal * 0.15) : 0;
  const total = subtotal - discountAmount + 99;

  const handleConfirmBooking = () => {
    const bookingData = {
      service,
      date: selectedDate,
      time: selectedTime,
      address: selectedAddress.address,
      total,
      payment: selectedPayment,
      bookingId: 'AMARA-' + Date.now().toString().slice(-6),
    };
    // Store in sessionStorage (better than localStorage for temporary data)
    sessionStorage.setItem('currentBooking', JSON.stringify(bookingData));
    router.push('/client/bookings/status');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header + Stepper */}
      <header className="fixed top-0 inset-x-0 bg-white shadow-sm z-50">
        <div className="flex items-center px-4 py-4 max-w-7xl mx-auto">
          <button onClick={() => router.back()} className="mr-4">
            <ArrowLeft size={28} />
          </button>
          <h1 className="flex-1 text-center font-semibold text-xl">Book Service</h1>
        </div>

        <div className="flex justify-center gap-8 pb-4 border-b">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex flex-col items-center ${currentStep >= s ? 'text-[#e5849c]' : 'text-gray-400'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                currentStep === s ? 'border-[#e5849c] bg-white'
                : currentStep > s ? 'border-[#e5849c] bg-[#e5849c] text-white'
                : 'border-gray-300'
              }`}>
                {currentStep > s ? <CheckCircle size={20} /> : s}
              </div>
              <span className="text-xs mt-1 font-medium">
                {s === 1 ? 'Date & Time' : s === 2 ? 'Address' : 'Summary'}
              </span>
            </div>
          ))}
        </div>
      </header>

      <main className="pt-32 px-4 max-w-2xl mx-auto">

        {/* STEP 1 — Date & Time */}
        {currentStep === 1 && (
          <div className="space-y-10">
            <div>
              <h2 className="font-semibold text-2xl mb-6 flex items-center gap-3">
                <Calendar className="text-[#e5849c]" /> Select Date
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {dates.map((d, i) => (
                  <button key={i} onClick={() => setSelectedDate(d.full)}
                    className={`flex-shrink-0 w-20 py-4 rounded-3xl text-center transition-all ${
                      selectedDate === d.full ? 'bg-[#e5849c] text-white shadow-lg' : 'bg-white border'
                    }`}>
                    <div className="text-xs opacity-75">{d.day}</div>
                    <div className="text-3xl font-bold">{d.date}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-2xl mb-6 flex items-center gap-3">
                <Clock className="text-[#e5849c]" /> Select Time
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.map((t) => (
                  <button key={t} onClick={() => setSelectedTime(t)}
                    className={`py-4 rounded-2xl font-medium border transition-all ${
                      selectedTime === t ? 'bg-[#e5849c] text-white' : 'bg-white hover:border-[#e5849c]'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Button disabled={!selectedDate || !selectedTime} onClick={() => setCurrentStep(2)}
              className="w-full py-8 text-xl bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white">
              Continue to Address
            </Button>
          </div>
        )}

        {/* STEP 2 — Address */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <h2 className="font-semibold text-2xl flex items-center gap-3">
              <MapPin className="text-[#e5849c]" /> Select Address
            </h2>

            <div className="space-y-4">
              {savedAddresses.map((addr) => (
                <button key={addr.id} onClick={() => setSelectedAddress(addr)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                    selectedAddress.id === addr.id ? 'border-[#e5849c] bg-pink-50' : 'border-gray-200 bg-white'
                  }`}>
                  <div className="font-semibold text-lg">{addr.label}</div>
                  <div className="text-gray-600 mt-1">{addr.address}</div>
                </button>
              ))}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Or enter a new address</p>
              <Input
                placeholder="Enter your full address..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="py-6 rounded-2xl"
              />
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}
                className="flex-1 py-7 text-lg border-[#e5849c] text-[#e5849c]">
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)}
                className="flex-1 py-7 text-lg bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Summary */}
        {currentStep === 3 && (
          <div className="space-y-8">
            {/* Service recap */}
            <div className="bg-white rounded-3xl p-6 shadow">
              <h3 className="font-semibold text-lg mb-4">Service</h3>
              <div className="flex gap-4">
                <img src={service.image} alt={service.name} className="w-24 h-24 rounded-2xl object-cover" />
                <div>
                  <p className="font-semibold text-lg">{service.name}</p>
                  <p className="text-gray-500 text-sm mt-1">{selectedDate} • {selectedTime}</p>
                  <p className="text-gray-500 text-sm">{selectedAddress.address}</p>
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-3xl p-6 shadow">
              <h3 className="font-semibold text-lg mb-4">Coupon Code</h3>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="flex-1 py-6 rounded-2xl"
                />
                <Button
                  onClick={() => { if (coupon === 'WELCOME20') setAppliedCoupon(true); }}
                  className="px-6 bg-[#e5849c] text-white rounded-2xl"
                >
                  Apply
                </Button>
              </div>
              {appliedCoupon && <p className="text-green-600 mt-2 text-sm font-medium">✓ 15% discount applied!</p>}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-3xl p-6 shadow">
              <h3 className="font-semibold text-lg mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {paymentOptions.map((opt) => (
                  <button key={opt.id} onClick={() => setSelectedPayment(opt.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                      selectedPayment === opt.id ? 'border-[#e5849c] bg-pink-50' : 'border-gray-200'
                    }`}>
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bill */}
            <div className="bg-white rounded-3xl p-6 shadow">
              <h3 className="font-semibold text-lg mb-4">Bill Summary</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between"><span>Service charge</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between"><span>Convenience fee</span><span>₹99</span></div>
                {appliedCoupon && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discountAmount}</span></div>}
                <div className="border-t pt-3 flex justify-between font-bold text-xl">
                  <span>Total</span><span className="text-[#e5849c]">₹{total}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}
                className="flex-1 py-7 text-lg border-[#e5849c] text-[#e5849c]">
                Back
              </Button>
              <Button onClick={handleConfirmBooking}
                className="flex-1 py-7 text-xl font-semibold bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white shadow-2xl">
                Confirm • ₹{total}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
