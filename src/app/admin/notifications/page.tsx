import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/admin/guard";
import { listRecipients } from "@/lib/admin/notifications";
import { dbConfigured } from "@/lib/db/client";
import { NotificationsManager } from "./notifications-manager";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const owner = await requireOwner();
  if (!owner.allowed) {
    if (owner.reason === "unauthenticated") {
      redirect("/sign-in?redirect_url=/admin/notifications");
    }
    redirect("/");
  }

  const recipients = dbConfigured ? await listRecipients() : [];
  const emailReady = Boolean(process.env.RESEND_API_KEY);
  const webhookReady = Boolean(process.env.SHOPIFY_WEBHOOK_SECRET);

  return (
    <div className="container-x" style={{ paddingTop: 24, paddingBottom: 64, maxWidth: 760 }}>
      <Link href="/admin" style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>
        ← Admin
      </Link>
      <h1 className="fluid-h2" style={{ margin: "8px 0 4px" }}>
        New-order alerts
      </h1>
      <p style={{ color: "var(--color-muted-foreground)", marginBottom: 20 }}>
        Staff who get an email the moment a new order comes in. Internal only —
        this is separate from the order confirmation Shopify sends the customer.
      </p>

      {(!emailReady || !webhookReady || !dbConfigured) && (
        <div
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-card)",
            borderRadius: "var(--radius-md)",
            padding: 14,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          <strong>Setup checklist</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            <li>{dbConfigured ? "✅" : "⬜️"} Database connected (DATABASE_URL)</li>
            <li>{emailReady ? "✅" : "⬜️"} Resend email (RESEND_API_KEY + ADMIN_FROM_EMAIL)</li>
            <li>
              {webhookReady ? "✅" : "⬜️"} Shopify webhook secret (SHOPIFY_WEBHOOK_SECRET) +
              register topic <code>orders/create</code> →{" "}
              <code>/api/webhooks/shopify</code>
            </li>
          </ul>
        </div>
      )}

      <NotificationsManager initial={recipients} />
    </div>
  );
}
