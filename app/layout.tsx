import "./globals.css";
import { AuthProvider } from "@/config/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "AmaraGo — Premium Beauty & Wellness at Your Doorstep",
    template: "%s | AmaraGo",
  },
  description:
    "Book professional beauty and wellness services at home. Hair, skincare, nail art, massage, bridal makeup and more — delivered by certified experts across India.",
  keywords: ["beauty at home", "salon at home", "home beauty services", "nail art", "facial", "massage", "bridal makeup", "AmaraGo"],
  metadataBase: new URL("https://amarago.in"),
  openGraph: {
    siteName: "AmaraGo",
    type: "website",
    locale: "en_IN",
    title: "AmaraGo — Premium Beauty & Wellness at Your Doorstep",
    description:
      "Book certified beauty experts for hair, skincare, nails, massage and more — right at home.",
    images: [{ url: "/assets/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AmaraGo — Premium Beauty & Wellness",
    description: "Book professional beauty services at home across India.",
    images: ["/assets/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {/* Skip-to-content link for keyboard/screen-reader accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#d4537e] focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>
        <AuthProvider>
          <main id="main-content">{children}</main>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}