import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page-client";
import { getCart } from "@/lib/cart/server";
import { getCurrentVehicle, getSubModelAnswers } from "@/lib/garage/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const [cart, vehicle] = await Promise.all([getCart(), getCurrentVehicle()]);
  // Cycle 14X+ post-sync (Sam re-review M-6): cart fitment check used to
  // pass no sub-model answers, so a 5.5'-bed customer with a 6.5' tonneau
  // in cart would get a soft "fits" verdict (the title-based gate is
  // permissive without answers). Pass the saved sub-model answers so the
  // cart fitment status matches the PDP gate.
  const subModelAnswers = vehicle
    ? await getSubModelAnswers(vehicle.id ?? "")
    : [];
  return (
    <CartPageClient
      initialCart={cart}
      vehicle={vehicle ?? undefined}
      subModelAnswers={subModelAnswers}
    />
  );
}
