import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/app/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Base layout
      "peer relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-full",
      // Border & transition
      "border-2 border-transparent outline-none transition-all duration-300 ease-in-out",
      // Unchecked: muted gray
      "data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700",
      // Checked: emerald with soft glow ring
      "data-[state=checked]:bg-emerald-500",
      "data-[state=checked]:shadow-[0_0_0_3px_rgba(16,185,129,0.18)]",
      // Focus ring
      "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // Disabled
      "disabled:cursor-not-allowed disabled:opacity-40",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Size & shape
        "pointer-events-none block h-5 w-5 rounded-full",
        // White thumb with depth shadow
        "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.8)]",
        // Spring-like overshoot animation
        "transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        // Travel: 2px margin left when off, full travel when on
        "data-[state=unchecked]:translate-x-0.5",
        "data-[state=checked]:translate-x-[1.625rem]",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };