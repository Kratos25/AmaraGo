// app/(provider)/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Auth guard: redirects unauthenticated users to login and non-providers to
// their correct home. Complements the middleware cookie check with a
// client-side Firestore role verification.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export default function ProviderRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const role = snap.data()?.role ?? "";
          if (role !== "service_provider" && role !== "pending_sp" && role !== "admin") {
            router.replace("/client/home");
          }
        } else {
          router.replace("/login");
        }
      } catch {
        // Firestore unavailable — allow through; middleware already validated cookie
      }
    });
    return () => unsubscribe();
  }, [router]);

  return <>{children}</>;
}