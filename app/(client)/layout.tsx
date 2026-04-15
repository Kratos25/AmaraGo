import { ClientLayout } from "./client/_components/ClientLayout";
import { CartProvider } from "@/config/context/CartContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ClientLayout>{children}</ClientLayout>
    </CartProvider>
  );
}