// src/components/ui/toaster.tsx
"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";

interface ToastItem {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  [key: string]: any; // allows additional props like state, swipe etc.
}

export function Toaster() {
  const { toasts } = useToast() as { toasts: ToastItem[] };

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(({ id, title, description, action, ...props }) => (
        <div
          key={id}
          className={`
            group pointer-events-auto relative flex w-full items-center justify-between 
            space-x-4 overflow-hidden rounded-md border bg-background p-6 pr-8 shadow-lg 
            transition-all data-[swipe=cancel]:translate-x-0 
            data-[state=open]:animate-in data-[state=closed]:animate-out 
            data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full 
            data-[state=open]:sm:slide-in-from-bottom-full
          `}
          {...props}
        >
          <div className="grid gap-1">
            {title && <div className="text-sm font-semibold">{title}</div>}
            {description && (
              <div className="text-sm opacity-90">{description}</div>
            )}
          </div>

          {action}

          <button
            type="button"
            className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 hover:text-foreground"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}