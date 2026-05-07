import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/admin/guard";
import { DISCOUNT_PRESETS } from "@/lib/admin/discounts";
import { NewDiscountForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewDiscountPage() {
  const owner = await requireOwner();
  if (!owner.allowed) {
    redirect(owner.reason === "unauthenticated" ? "/sign-in?redirect_url=/admin/discounts/new" : "/");
  }

  const presets = DISCOUNT_PRESETS.map((p) => ({
    id: p.id,
    label: p.label,
    blurb: p.blurb,
    defaults: p.defaults,
  }));

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
          maxWidth: 640,
        }}
      >
        Pick a preset to pre-fill the playbook defaults, or build a custom
        discount from scratch. Bulk-generate up to 1,000 single-use codes
        with a shared prefix for referral or Klaviyo blasts. Goes live on
        the Shopify checkout immediately.
      </p>
      <NewDiscountForm presets={presets} />
    </div>
  );
}
