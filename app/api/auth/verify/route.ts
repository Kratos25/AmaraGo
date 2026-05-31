import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(token);

    // Look up the user's role from Firestore
    let role = "client";
    try {
      const app = getAdminApp();
      const db = getFirestore(app);
      const userDoc = await db.collection("users").doc(decoded.uid).get();
      if (userDoc.exists) {
        role = userDoc.data()?.role ?? "client";
      }
    } catch {
      // Fallback — non-fatal; session still set
    }

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "strict" as const,
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set("session", token, cookieOpts);
    // Store role in a separate non-httpOnly cookie so middleware can read it
    response.cookies.set("session_role", role, {
      ...cookieOpts,
      httpOnly: false, // readable by middleware (Edge runtime — no firebase-admin available)
    });

    return response;

  } catch (error: any) {
    console.error("🔴 VERIFY ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}