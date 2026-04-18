"use client";

/**
 * CartQtyButton
 *
 * Shows:
 *   • "Add" button  — when qty === 0
 *   • "− qty +"     — when qty > 0
 *
 * Usage:
 *   <CartQtyButton serviceId="abc123" name="Hair Cut" price={499} duration="30 min" />
 *   <CartQtyButton packageId="pkg456" name="Glow Package" price={999} />
 */

import React, { useState } from "react";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useCart } from "@/config/context/CartContext";

interface CartQtyButtonProps {
  serviceId?: string;
  packageId?: string;
  name: string;
  price: number;
  duration?: string;
  /** Extra classes applied to the outer wrapper */
  className?: string;
  /** Stop click events from bubbling (e.g. inside a clickable card) */
  stopPropagation?: boolean;
}

export function CartQtyButton({
  serviceId,
  packageId,
  name,
  price,
  duration,
  className = "",
  stopPropagation = true,
}: CartQtyButtonProps) {
  const { items, addItem, updateItem, removeItem } = useCart();
  const [loading, setLoading] = useState(false);

  // Find the matching cart item (service_id or package_id)
  const cartItem = items.find((i) =>
    serviceId ? i.service_id === serviceId : i.package_id === packageId
  );
  const qty = cartItem?.quantity ?? 0;

  const wrap =
    (fn: () => Promise<void>) =>
    async (e: React.MouseEvent) => {
      if (stopPropagation) e.stopPropagation();
      if (loading) return;
      setLoading(true);
      try {
        await fn();
      } finally {
        setLoading(false);
      }
    };

  const handleAdd = wrap(async () => {
    await addItem({
      service_id: serviceId,
      package_id: packageId,
      name,
      price,
      duration,
      quantity: 1,
    });
  });

  const handleIncrease = wrap(async () => {
    if (!cartItem) return;
    await updateItem(cartItem.id, qty + 1);
  });

  const handleDecrease = wrap(async () => {
    if (!cartItem) return;
    if (qty <= 1) {
      await removeItem(cartItem.id);
    } else {
      await updateItem(cartItem.id, qty - 1);
    }
  });

  if (qty === 0) {
    return (
      <button
        onClick={handleAdd}
        disabled={loading}
        className={[
          "flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all",
          "bg-[#e5849c] hover:bg-[#d4738b] text-white disabled:opacity-60",
          className,
        ].join(" ")}
      >
        {loading ? (
          <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
        ) : (
          <ShoppingCart size={12} />
        )}
        Add
      </button>
    );
  }

  return (
    <div
      className={[
        "flex items-center gap-0 rounded-xl overflow-hidden border border-[#e5849c]",
        className,
      ].join(" ")}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      <button
        onClick={handleDecrease}
        disabled={loading}
        className="w-8 h-8 flex items-center justify-center bg-[#e5849c] hover:bg-[#d4738b] text-white transition-colors disabled:opacity-60"
        aria-label="Remove one"
      >
        <Minus size={13} />
      </button>

      <span className="min-w-[26px] text-center text-sm font-bold text-[#e5849c] bg-white select-none">
        {qty}
      </span>

      <button
        onClick={handleIncrease}
        disabled={loading}
        className="w-8 h-8 flex items-center justify-center bg-[#e5849c] hover:bg-[#d4738b] text-white transition-colors disabled:opacity-60"
        aria-label="Add one more"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
