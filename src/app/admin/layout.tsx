import type { Metadata } from "next";
import { AdminSidebar } from "./admin-sidebar";
import { countNativeReviewsByStatus } from "@/lib/admin/reviews";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Dedicated admin shell (Lovable-style): left rail + content area, NO
// storefront chrome. The storefront header/footer/modals are suppressed for
// /admin routes in the root layout (keyed off the x-pathname middleware
// header), so this is the only frame on these pages.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const counts = await countNativeReviewsByStatus().catch(() => ({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  }));
  const badges: Record<string, number> =
    counts.pending > 0 ? { "/admin/reviews": counts.pending } : {};

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--color-background)" }}>
      <AdminSidebar badges={badges} />
      <main style={{ flex: 1, minWidth: 0, padding: "28px 32px 64px", overflowX: "auto" }}>
        {children}
      </main>
    </div>
  );
}
