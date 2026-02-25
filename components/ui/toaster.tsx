// src/components/ui/toaster.jsx
import { useToast } from '@/hooks/use-toast';

export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function toastItem({ id, title, description, action, ...props }) {
        return (
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
              {description && <div className="text-sm opacity-90">{description}</div>}
            </div>
            {action}
            {/* Simple close button - you can style it better */}
            <button
              onClick={() => {/* You can add dismiss logic here if needed */}}
              className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 hover:text-foreground"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}