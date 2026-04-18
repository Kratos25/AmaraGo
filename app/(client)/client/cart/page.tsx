"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ArrowRight, Tag, Loader2, PackageOpen } from "lucide-react";
import { useCart } from "@/config/context/CartContext";
import { useAuth } from "@/config/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { couponsAPI, servicesAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const CONVENIENCE_FEE = 99;

function CartSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getServiceEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('hair')) return '💇';
  if (n.includes('nail') || n.includes('mani') || n.includes('pedi')) return '💅';
  if (n.includes('facial') || n.includes('skin') || n.includes('cleanup')) return '✨';
  if (n.includes('massage') || n.includes('spa')) return '🧖';
  if (n.includes('makeup') || n.includes('bridal')) return '💄';
  if (n.includes('wax')) return '🪒';
  return '🌸';
}

export default function CartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  // Fix: include addItem in destructure so recommended section can use it
  const { items, subtotal, itemCount, loading, addItem, updateItem, removeItem } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [recommended, setRecommended] = useState<any[]>([]);

  useEffect(() => {
    servicesAPI.list({ active: true, popular: true })
      .then(({ data }) => setRecommended(data.slice(0, 4)))
      .catch(() => {});
  }, []);

  const total = Math.max(0, subtotal - discount + (items.length > 0 ? CONVENIENCE_FEE : 0));

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
        setAppliedCoupon(null);
        setCouponMsg({ text: data.message, ok: false });
      }
    } catch {
      setCouponMsg({ text: "Could not validate coupon. Try again.", ok: false });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMsg(null);
  };

  const handleCheckout = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    const params = new URLSearchParams({
      coupon: appliedCoupon ?? "",
      discount: discount.toString(),
    });
    router.push(`/client/checkout?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-32">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Your Cart</h1>
        <CartSkeleton />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 pb-32 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-[#fdf0f3] rounded-full flex items-center justify-center mb-6">
          <PackageOpen size={40} className="text-[#e5849c]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-8">Browse our services and packages and add them here.</p>
        <Link href="/client/services">
          <Button className="bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white px-8 py-5 rounded-2xl font-semibold">
            Browse Services
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-36">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        Your Cart{" "}
        <span className="text-gray-400 font-normal text-base ml-1">
          ({itemCount} item{itemCount !== 1 ? "s" : ""})
        </span>
      </h1>

      {/* ── Items ── */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-[#fdf0f3] to-[#fff5f7] rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{getServiceEmoji(item.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
              {item.duration && <p className="text-xs text-gray-400 mt-0.5">{item.duration}</p>}
              <p className="text-[#e5849c] font-bold mt-1">₹{item.price.toLocaleString("en-IN")}</p>
            </div>
            <div className="flex flex-col items-end justify-between gap-2">
              <button
                onClick={() => removeItem(item.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-1 py-1">
                <button
                  onClick={() =>
                    item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)
                  }
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateItem(item.id, item.quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Coupon ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag size={16} className="text-[#e5849c]" />
          <span className="text-sm font-semibold text-gray-800">Apply Coupon</span>
        </div>
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <div>
              <span className="text-sm font-bold text-green-700">{appliedCoupon}</span>
              <p className="text-xs text-green-600 mt-0.5">You save ₹{discount.toLocaleString("en-IN")}</p>
            </div>
            <button onClick={handleRemoveCoupon} className="text-xs text-red-500 font-medium hover:underline">
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              className="uppercase text-sm"
            />
            <Button
              onClick={handleApplyCoupon}
              disabled={validatingCoupon || !couponCode.trim()}
              className="bg-[#e5849c] hover:brightness-90 text-white px-5 shrink-0"
            >
              {validatingCoupon ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
            </Button>
          </div>
        )}
        {couponMsg && !appliedCoupon && (
          <p className={`text-xs mt-2 ${couponMsg.ok ? "text-green-600" : "text-red-500"}`}>
            {couponMsg.text}
          </p>
        )}
      </div>

      {/* ── Price breakdown ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Price Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Coupon Discount</span>
              <span>−₹{discount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Convenience Fee</span>
            <span>₹{CONVENIENCE_FEE}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* ── Recommended Services ── */}
      {recommended.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-sm text-gray-900 mb-3">You might also like</h3>
          <div className="space-y-2">
            {recommended
              .filter((r) => !items.some((i) => i.service_id === r.id))
              .slice(0, 3)
              .map((svc) => (
                <div key={svc.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100">
                  <div className="w-11 h-11 rounded-xl bg-[#fdf0f3] flex items-center justify-center text-lg flex-shrink-0">
                    {getServiceEmoji(svc.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{svc.name}</p>
                    <p className="text-xs text-[#e5849c] font-bold">
                      ₹{(svc.discounted_price ?? svc.base_price).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      addItem({
                        service_id: svc.id,
                        name: svc.name,
                        price: svc.discounted_price ?? svc.base_price,
                        quantity: 1,
                      })
                    }
                    className="text-xs font-semibold text-[#e5849c] border border-[#e5849c]/30 px-3 py-1.5 rounded-xl hover:bg-[#fdf0f3] transition-colors"
                  >
                    + Add
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Checkout CTA ── */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-100 md:relative md:bg-transparent md:border-0 md:p-0 md:backdrop-blur-none">
        <Button
          onClick={handleCheckout}
          className="w-full bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
        >
          Proceed to Checkout
          <ArrowRight size={18} />
        </Button>
      </div>

      {/* ── Login prompt modal ── */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-[#111827] px-6 py-6 text-center">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-white font-bold text-lg">Login Required</h2>
              <p className="text-white/50 text-sm mt-1">Sign in to proceed with your booking</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-500 text-center">
                Your cart is saved. Log in and we&apos;ll take you straight to checkout.
              </p>

              <Button
                onClick={() => {
                  setShowLoginPrompt(false);
                  router.push('/login?redirect=/client/cart');
                }}
                className="w-full bg-[#e5849c] hover:bg-[#d4738b] text-white font-semibold py-5 rounded-2xl text-sm"
              >
                Log In
              </Button>

              <button
                onClick={() => setShowLoginPrompt(false)}
                className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}