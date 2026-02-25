import AuthProvider from "@/app/utils/AuthProvider";
import "./globals.css";

export const metadata = {
  title: "Amara Beauty Parlour",
  description: "Premium beauty & wellness at your doorstep",
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
      </body>
    </html>
  );
}