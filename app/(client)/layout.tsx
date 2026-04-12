import { ClientLayout } from "./client/_components/ClientLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
