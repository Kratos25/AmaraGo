import "./globals.css";
import { AuthProvider } from "@/config/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AmaraGo",
  description: "Premium beauty & wellness at your doorstep",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
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
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}