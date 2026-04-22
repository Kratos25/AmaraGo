export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Add your auth guard logic here, e.g. redirect if no session
  return <>{children}</>;
}