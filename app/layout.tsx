import AuthProvider from "@/utils/AuthProvider";
import type { Metadata } from "next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html>
        <body>{children}</body>
      </html>
    </AuthProvider>
  );
}
