export const dynamic = "force-dynamic";

import { ClientLayout } from "./client/_components/ClientLayout";
import { CartProvider } from "@/config/context/CartContext";
import { SearchVisibilityProvider } from "@/config/context/SearchVisibilityContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <SearchVisibilityProvider>
        <ClientLayout>{children}</ClientLayout>
      </SearchVisibilityProvider>
    </CartProvider>
  );
}