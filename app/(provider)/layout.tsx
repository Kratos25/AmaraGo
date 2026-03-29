// app/(provider)/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Auth guard only. Redirects unauthenticated users.
// ProviderLayout (sidebar/nav) is NOT here — it's applied per-page so each
// page can pass its own title, subtitle, and topBarRight slot.
// ─────────────────────────────────────────────────────────────────────────────

export default function ProviderRootLayout({ children }: { children: React.ReactNode }) {
  // Add your auth guard logic here, e.g. redirect if no session
  return <>{children}</>;
}