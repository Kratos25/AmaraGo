export const dynamic = "force-dynamic";

import { ClientLayout } from "./client/_components/ClientLayout";
import { CartProvider } from "@/config/context/CartContext";
import { SearchVisibilityProvider } from "@/config/context/SearchVisibilityContext";
import { LocationProvider } from "@/config/context/LocationContext";
import { LocationGateModal } from "./client/_components/LocationGateModal";
import { WishlistProvider } from "@/config/context/WishlistContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <WishlistProvider>
        <CartProvider>
          <SearchVisibilityProvider>
            <LocationGateModal />
            <ClientLayout>{children}</ClientLayout>
          </SearchVisibilityProvider>
        </CartProvider>
      </WishlistProvider>
    </LocationProvider>
  );
}