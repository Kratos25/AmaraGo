"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Calendar, Clock, MapPin, CreditCard,
  Tag, Loader2, CheckCircle, Plus, Star, ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/config/context/CartContext";
import { useLocation } from "@/config/context/LocationContext";
import { bookingsAPI, addressesAPI, couponsAPI, paymentsAPI, getPublicConfig } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Suspense } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_CONVENIENCE_FEE = 99;

const TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
];

const PAYMENT_OPTIONS = [
  { id: "upi",    label: "UPI / GPay",     icon: "📱", subtitle: "Instant transfer"  },
  { id: "card",   label: "Card",           icon: "💳", subtitle: "Credit / Debit"    },
  { id: "wallet", label: "Wallet",         icon: "👛", subtitle: "Prepaid balance"    },
  { id: "cash",   label: "Pay on Service", icon: "💵", subtitle: "Cash on delivery"  },
];

const STEPS = ["Slot", "Address", "Payment", "Review"];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMinDate() {
  // Allow today
  return new Date().toISOString().split("T")[0];
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold transition-all ${
            i + 1 < current ? "bg-green-500 text-white" :
            i + 1 === current ? "bg-[#e5849c] text-white" :
            "bg-gray-200 text-gray-500"
          }`}>
            {i + 1 < current ? "✓" : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`flex-1 h-0.5 rounded transition-all ${i + 1 < current ? "bg-green-400" : "bg-gray-200"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { items, subtotal, clearCart } = useCart();
  const { lat, lng } = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  // Convenience fee from platform config
  const [convenienceFee, setConvenienceFee] = useState(DEFAULT_CONVENIENCE_FEE);
  const [originalConvFee, setOriginalConvFee] = useState(DEFAULT_CONVENIENCE_FEE);

  useEffect(() => {
    getPublicConfig()
      .then((res) => {
        setConvenienceFee(res.data.convenience_fee);
        setOriginalConvFee(res.data.original_convenience_fee);
      })
      .catch(() => { /* use default */ });
  }, []);

  // Step 1 — slot
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Step 2 — address
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [newAddressText, setNewAddressText] = useState("");
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [phone, setPhone] = useState("");
  const [addrsLoading, setAddrsLoading] = useState(true);

  // Step 3 — payment
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [couponCode, setCouponCode] = useState(searchParams.get("coupon") ?? "");
  const [discount, setDiscount] = useState(Number(searchParams.get("discount") ?? 0));
  const [appliedCoupon, setAppliedCoupon] = useState(searchParams.get("coupon") ?? "");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const total = Math.max(0, subtotal - discount + convenienceFee);

  // Watch auth
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // Preload Razorpay checkout.js
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Load addresses
  useEffect(() => {
    if (!user) return;
    addressesAPI.list()
      .then(({ data }) => {
        setSavedAddresses(data);
        const def = data.find((a: any) => a.is_default) ?? data[0];
        if (def) setSelectedAddressId(def.id);
      })
      .catch(() => {})
      .finally(() => setAddrsLoading(false));

    // pre-fill phone from auth
    if (user.phoneNumber) setPhone(user.phoneNumber);
  }, [user]);

  // Redirect if cart empty & not done
  useEffect(() => {
    if (!done && items.length === 0) router.replace("/client/cart");
  }, [items, done]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponMsg(null);
    try {
      const { data } = await couponsAPI.validate(couponCode, subtotal);
      if (data.valid) {
        setDiscount(data.discount_amount ?? 0);
        setAppliedCoupon(couponCode.toUpperCase());
        setCouponMsg({ text: data.message, ok: true });
      } else {
        setDiscount(0);
        setAppliedCoupon("");
        setCouponMsg({ text: data.message, ok: false });
      }
    } catch {
      setCouponMsg({ text: "Could not validate. Try again.", ok: false });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!user) { router.push("/login?redirect=/client/checkout"); return; }
    if (!selectedDate || !selectedTime) { toast({ title: "Select a date and time", variant: "destructive" }); return; }

    const hasAddress = selectedAddressId || newAddressText.trim();
    if (!hasAddress) {
      toast({ title: "Add a delivery address", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await user.getIdToken(); // refreshes token in cookie

      // If user typed a new address and opted to save it, persist it first
      let finalAddressId = selectedAddressId ?? undefined;
      let finalAddressText: string | undefined = !selectedAddressId ? newAddressText : undefined;

      if (!selectedAddressId && newAddressText.trim() && saveNewAddress) {
        try {
          const label = newAddressLabel.trim() || 'Address';
          const created = await addressesAPI.create({
            label,
            address: newAddressText.trim(),
            is_default: savedAddresses.length === 0,
          });
          finalAddressId = created.data.id;
          finalAddressText = undefined;
          setSavedAddresses((prev) => [...prev, created.data]);
          setSelectedAddressId(created.data.id);
        } catch {
          // If save fails, still proceed with address_text
        }
      }

      const { data } = await bookingsAPI.createMulti({
        items: items.map((item) => ({
          service_id: item.service_id ?? undefined,
          package_id: item.package_id ?? undefined,
          name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
        })),
        date: selectedDate,
        time: selectedTime,
        address_id: finalAddressId,
        address_text: finalAddressText,
        payment_method: paymentMethod as any,
        coupon_code: appliedCoupon || undefined,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
      });

      setBookingRef(data.booking_ref ?? null);

      // HIGH-06: For online payments, open Razorpay checkout before confirming
      if (paymentMethod !== "cash") {
        await new Promise<void>((resolve, reject) => {
          paymentsAPI.createOrder(data.id).then(({ data: order }) => {
            const options = {
              key: order.key_id,
              amount: order.amount_paise,
              currency: order.currency,
              name: "AmaraGo",
              description: `Booking ${data.booking_ref ?? data.id}`,
              order_id: order.razorpay_order_id,
              prefill: {
                name: user?.displayName ?? "",
                email: user?.email ?? "",
              },
              theme: { color: "#e5849c" },
              handler: (paymentResponse: {
                razorpay_payment_id: string;
                razorpay_order_id: string;
                razorpay_signature: string;
              }) => {
                paymentsAPI.verifyPayment({
                  booking_id: data.id,
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                }).then(() => resolve()).catch(reject);
              },
              modal: {
                ondismiss: () => reject(new Error("Payment cancelled. Booking is still held — try again.")),
              },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
          }).catch(reject);
        });
      }

      await clearCart();
      setDone(true);
    } catch (err: any) {
      toast({
        title: "Booking failed",
        description: err?.response?.data?.detail ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Booking Confirmed! 🎉</h2>

        {bookingRef && (
          <div className="my-4 px-6 py-4 bg-[#fdf0f3] border border-[#e5849c]/30 rounded-2xl w-full max-w-xs">
            <p className="text-xs text-gray-500 mb-1">Your Booking ID</p>
            <p className="text-3xl font-black tracking-wide text-[#e5849c]">{bookingRef}</p>
            <p className="text-[11px] text-gray-400 mt-1">Save this for reference</p>
          </div>
        )}

        <p className="text-gray-500 text-sm mb-2">
          Scheduled for{" "}
          <span className="font-semibold text-gray-700">{selectedDate}</span> at{" "}
          <span className="font-semibold text-gray-700">{selectedTime}</span>.
        </p>
        <p className="text-xs text-gray-400 mb-8">You'll earn loyalty points once your service is completed.</p>
        <div className="flex gap-3 w-full max-w-xs">
          <Button
            variant="outline"
            className="flex-1 py-5 rounded-2xl"
            onClick={() => router.push("/client/bookings")}
          >
            My Bookings
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white py-5 rounded-2xl font-semibold"
            onClick={() => router.push("/client/home")}
          >
            Home
          </Button>
        </div>
      </div>
    );
  }

  // ── Import addressesAPI — already imported at top ──────────────────────────

  const today = new Date().toISOString().split("T")[0];

  // Filter out past time slots when selecting today (with 1-hour buffer)
  const availableTimeSlots = selectedDate === today
    ? TIME_SLOTS.filter((slot) => {
        const [hm, period] = slot.split(' ');
        const [h, m] = hm.split(':').map(Number);
        const isPM = period === 'PM';
        const slotHour = isPM && h !== 12 ? h + 12 : (!isPM && h === 12 ? 0 : h);
        const now = new Date();
        return slotHour > now.getHours() + 1 ||
          (slotHour === now.getHours() + 1 && m > now.getMinutes());
      })
    : TIME_SLOTS;

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Calendar size={15} className="inline mr-1.5 text-[#e5849c]" />
          Select Date
        </label>
        <input
          type="date"
          min={getMinDate()}
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#e5849c]/40"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <Clock size={15} className="inline mr-1.5 text-[#e5849c]" />
          Select Time
        </label>
        {availableTimeSlots.length === 0 ? (
          <p className="text-sm text-red-500 py-2">No slots available today — please pick another date.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {availableTimeSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                aria-label={`Select time slot ${slot}`}
                aria-pressed={selectedTime === slot}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedTime === slot
                    ? "bg-[#e5849c] border-[#e5849c] text-white"
                    : "border-gray-200 text-gray-700 hover:border-[#e5849c]/40 hover:bg-[#fdf0f3]"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          <span className="inline-flex items-center gap-1"><CreditCard size={14} className="text-[#e5849c]" /> Phone Number</span>
        </label>
        <Input
          type="tel"
          placeholder="+91 98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-2xl"
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">
          <MapPin size={14} className="inline mr-1.5 text-[#e5849c]" />
          Delivery Address
        </p>
        {addrsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {savedAddresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => { setSelectedAddressId(addr.id); setNewAddressText(""); }}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                  selectedAddressId === addr.id
                    ? "border-[#e5849c] bg-[#fdf0f3]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-xl mt-0.5">{addr.icon ?? "📍"}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{addr.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{addr.address}</p>
                </div>
                {selectedAddressId === addr.id && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-[#e5849c] flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </div>
                )}
              </button>
            ))}

            {/* Add a new address */}
            <div className={`p-4 rounded-2xl border transition-all ${
              !selectedAddressId ? "border-[#e5849c] bg-[#fdf0f3]" : "border-gray-200"
            }`}>
              <button
                onClick={() => setSelectedAddressId(null)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
              >
                <Plus size={14} className="text-[#e5849c]" />
                {savedAddresses.length > 0 ? "Use a different address" : "Add address"}
              </button>
              {!selectedAddressId && (
                <div className="space-y-2">
                  <input
                    placeholder="Label (e.g. Home, Office, Hotel)"
                    value={newAddressLabel}
                    onChange={(e) => setNewAddressLabel(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e5849c]/40 bg-white"
                  />
                  <textarea
                    placeholder="Full address…"
                    value={newAddressText}
                    onChange={(e) => setNewAddressText(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e5849c]/40 resize-none bg-white"
                  />
                  {/* Save to profile toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setSaveNewAddress((v) => !v)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${saveNewAddress ? 'bg-[#e5849c]' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${saveNewAddress ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-xs text-gray-600">Save to my addresses</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      {/* Payment options */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Payment Method</p>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPaymentMethod(opt.id)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                paymentMethod === opt.id
                  ? "border-[#e5849c] bg-[#fdf0f3]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-xl">{opt.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-900">{opt.label}</p>
                <p className="text-[10px] text-gray-400">{opt.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Coupon */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">
          <Tag size={14} className="inline mr-1.5 text-[#e5849c]" /> Coupon Code
        </p>
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
            <div>
              <p className="font-bold text-green-700 text-sm">{appliedCoupon}</p>
              <p className="text-xs text-green-600">You save ₹{discount.toLocaleString("en-IN")}</p>
            </div>
            <button
              onClick={() => { setDiscount(0); setAppliedCoupon(""); setCouponCode(""); setCouponMsg(null); }}
              className="text-xs text-red-500 font-medium hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Enter code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              className="uppercase rounded-2xl"
            />
            <Button
              onClick={handleApplyCoupon}
              disabled={validatingCoupon || !couponCode.trim()}
              className="bg-[#e5849c] hover:brightness-90 text-white px-5 rounded-2xl shrink-0"
            >
              {validatingCoupon ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
            </Button>
          </div>
        )}
        {couponMsg && !appliedCoupon && (
          <p className={`text-xs mt-1.5 ${couponMsg.ok ? "text-green-600" : "text-red-500"}`}>
            {couponMsg.text}
          </p>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      {/* Services summary */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Services Booked</p>
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.name}</p>
              {item.duration && <p className="text-xs text-gray-400">{item.duration} · qty {item.quantity}</p>}
            </div>
            <p className="text-sm font-semibold text-gray-900">
              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>

      {/* Booking details */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Booking Details</p>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar size={14} className="text-[#e5849c]" />
          <span>{selectedDate} at {selectedTime}</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <MapPin size={14} className="text-[#e5849c] mt-0.5" />
          <span className="text-xs leading-snug">
            {selectedAddressId
              ? savedAddresses.find((a) => a.id === selectedAddressId)?.address ?? "Saved address"
              : newAddressText || "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CreditCard size={14} className="text-[#e5849c]" />
          <span>{PAYMENT_OPTIONS.find((p) => p.id === paymentMethod)?.label}</span>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Price Summary</p>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Coupon ({appliedCoupon})</span><span>−₹{discount.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Convenience Fee</span>
          {convenienceFee === 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 line-through text-xs">₹{originalConvFee}</span>
              <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md">FREE</span>
            </div>
          ) : (
            <span>₹{convenienceFee}</span>
          )}
        </div>
        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total</span><span>₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        🌟 You'll earn loyalty points once your booking is completed
      </p>
    </div>
  );

  const canProceed = () => {
    if (step === 1) return !!selectedDate && !!selectedTime;
    if (step === 2) return !!(selectedAddressId || newAddressText.trim());
    if (step === 3) return !!paymentMethod;
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-bold text-base text-gray-900">Checkout</h1>
          <p className="text-xs text-gray-400">{STEPS[step - 1]}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
          <ShoppingBag size={14} className="text-[#e5849c]" />
          {items.length} item{items.length !== 1 ? "s" : ""} · ₹{total.toLocaleString("en-IN")}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-36">
        <StepDots current={step} total={STEPS.length} />

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-5">{STEPS[step - 1]}</h2>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-100">
        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="w-full bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
          >
            Continue <ChevronRight size={18} />
          </Button>
        ) : (
          <Button
            onClick={handleConfirmBooking}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
          >
            {submitting
              ? <><Loader2 size={18} className="animate-spin" /> Confirming…</>
              : <>Confirm Booking · ₹{total.toLocaleString("en-IN")}</>}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function checkout() {
  return (
    <Suspense fallback={null}>
      <CheckoutPage />
    </Suspense>
  )
}