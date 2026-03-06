// app/(admin)/layout.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebaseAdmin"; // your firebase admin config

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) redirect("/login");

  try {
    const decodedToken = await adminAuth.verifySessionCookie(token, true);
    
    if (decodedToken.role !== "admin") redirect("/login");
  } catch (error) {
    redirect("/login");
  }

  return <>{children}</>;
}