// src/components/ui/toaster.tsx
"use client";

import * as React from "react";
import { useToast, type Toast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map(({ id, title, description, action, variant }: Toast) => (
        <div
          key={id}
          onClick={() => dismiss(id)}
          className={[
            "pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 pr-10 shadow-lg cursor-pointer",
            "animate-in slide-in-from-top-2 fade-in duration-200",
            variant === "destructive"
              ? "bg-red-600 border-red-700 text-white"
              : "bg-white border-gray-200 text-gray-900",
          ].join(" ")}
        >
          {/* Icon */}
          <span className="mt-0.5 text-lg shrink-0">
            {variant === "destructive" ? "🚫" : "✅"}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <p className={`text-sm font-semibold leading-tight ${variant === "destructive" ? "text-white" : "text-gray-900"}`}>
                {title}
              </p>
            )}
            {description && (
              <p className={`text-xs mt-0.5 leading-snug ${variant === "destructive" ? "text-red-100" : "text-gray-500"}`}>
                {description}
              </p>
            )}
          </div>

          {action}

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); dismiss(id); }}
            className={[
              "absolute right-2 top-2 rounded-md p-1 transition-colors",
              variant === "destructive"
                ? "text-white/60 hover:text-white hover:bg-red-500"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-100",
            ].join(" ")}
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
