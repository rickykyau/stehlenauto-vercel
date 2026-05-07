import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/admin/guard";
import { NewDiscountForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewDiscountPage() {
  const owner = await requireOwner();
  if (!owner.allowed) {
    redirect(owner.reason === "unauthenticated" ? "/sign-in?redirect_url=/admin/discounts/new" : "/");
  }
  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        New discount
      </h2>
      <p
        style={{
          color: "var(--color-muted)",
          fontSize: 13,
          marginBottom: 24,
          maxWidth: 580,
        }}
      >
        Pick a kind, set the value, and Stehlen will apply it on the live
        Shopify checkout immediately. Schedule a window with the start/end
        dates if you want it to come on later or auto-expire.
      </p>
      <NewDiscountForm />
    </div>
  );
}
