import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page-client";
import { getCart } from "@/lib/cart/server";
import { getCurrentVehicle } from "@/lib/garage/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const [cart, vehicle] = await Promise.all([getCart(), getCurrentVehicle()]);
  return (
    <CartPageClient initialCart={cart} vehicle={vehicle ?? undefined} />
  );
}
