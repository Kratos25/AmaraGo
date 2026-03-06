import { Suspense } from "react";
import NewBooking from "./NewBooking"

export default function ServicesPage() {
  return (
    <Suspense fallback={<div>Loading services...</div>}>
      <NewBooking />
    </Suspense>
  );
}