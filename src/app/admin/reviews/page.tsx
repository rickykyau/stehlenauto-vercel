import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/admin/guard";
import {
  countNativeReviewsByStatus,
  listNativeReviews,
  listImportedBundles,
  type ReviewStatus,
} from "@/lib/admin/reviews";
import { ReviewActions } from "./review-actions";

export const dynamic = "force-dynamic";

const TABS: { key: ReviewStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: "var(--color-primary)", letterSpacing: 1 }} aria-label={`${n} stars`}>
      {"★".repeat(n)}
      <span style={{ color: "var(--color-border-2)" }}>{"★".repeat(5 - n)}</span>
    </span>
  );
}

function Card({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        padding: "16px 18px",
        background: "var(--color-surface)",
        minWidth: 140,
      }}
    >
      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-muted)" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: accent ? "var(--color-primary)" : "var(--color-foreground)" }}>
        {value}
      </div>
    </div>
  );
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string }>;
}) {
  const owner = await requireOwner();
  if (!owner.allowed) {
    redirect(
      owner.reason === "unauthenticated"
        ? "/sign-in?redirect_url=/admin/reviews"
        : "/",
    );
  }
  const sp = await searchParams;
  const view = sp.view === "imported" ? "imported" : "native";
  const status = (
    ["pending", "approved", "rejected", "all"].includes(sp.status ?? "")
      ? sp.status
      : "pending"
  ) as ReviewStatus | "all";

  const counts = await countNativeReviewsByStatus();

  return (
    <div>
      <div className="eyebrow" style={{ color: "var(--color-primary)", marginBottom: 4 }}>
        OWNER ADMIN
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: 4 }}>
        Reviews
      </h1>
      <p style={{ color: "var(--color-muted)", fontSize: 13, marginBottom: 20 }}>
        Moderate customer-submitted reviews. Approved reviews publish to the
        product page; pending and rejected never show. Imported Amazon reviews
        are managed by the ingest pipeline.
      </p>

      {/* Source toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[
          { key: "native", label: "Customer submissions" },
          { key: "imported", label: "Imported (Amazon)" },
        ].map((v) => (
          <Link
            key={v.key}
            href={`/admin/reviews?view=${v.key}`}
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: view === v.key ? "var(--color-surface-3)" : "transparent",
              color: view === v.key ? "var(--color-foreground)" : "var(--color-muted)",
            }}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {view === "native" ? (
        <NativeView status={status} counts={counts} />
      ) : (
        <ImportedView />
      )}
    </div>
  );
}

async function NativeView({
  status,
  counts,
}: {
  status: ReviewStatus | "all";
  counts: Awaited<ReturnType<typeof countNativeReviewsByStatus>>;
}) {
  const reviews = await listNativeReviews({ status, limit: 200 });

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <Card label="Pending" value={counts.pending} accent={counts.pending > 0} />
        <Card label="Approved" value={counts.approved} />
        <Card label="Rejected" value={counts.rejected} />
        <Card label="Total" value={counts.total} />
      </div>

      {/* Status tabs */}
      <nav style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--color-border)", marginBottom: 16 }}>
        {TABS.map((t) => {
          const active = status === t.key;
          const n = t.key === "all" ? counts.total : counts[t.key];
          return (
            <Link
              key={t.key}
              href={`/admin/reviews?view=native&status=${t.key}`}
              className="mono"
              style={{
                padding: "10px 16px",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: active ? "var(--color-primary)" : "var(--color-muted)",
                borderBottom: active ? "2px solid var(--color-primary)" : "2px solid transparent",
              }}
            >
              {t.label} ({n})
            </Link>
          );
        })}
      </nav>

      {reviews.length === 0 ? (
        <p style={{ color: "var(--color-muted)", padding: "40px 0", textAlign: "center" }}>
          No {status === "all" ? "" : status} reviews.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                padding: 16,
                background: "var(--color-surface)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <Stars n={r.stars} />
                    <strong style={{ fontSize: 14 }}>{r.title}</strong>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--color-muted)", lineHeight: 1.5, margin: "6px 0" }}>
                    {r.body}
                  </p>
                  <div className="mono" style={{ fontSize: 11, color: "var(--color-muted-2)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>{r.authorName}</span>
                    <span>{r.authorEmail}</span>
                    {r.vehicleMake && (
                      <span>
                        {r.vehicleYear} {r.vehicleMake} {r.vehicleModel}
                      </span>
                    )}
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    <Link href={`/products/${r.productHandle}`} style={{ color: "var(--color-primary)" }} target="_blank">
                      {r.productHandle} ↗
                    </Link>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: 4,
                      color:
                        r.status === "approved"
                          ? "#34d399"
                          : r.status === "rejected"
                            ? "#f87171"
                            : "var(--color-primary)",
                      border: "1px solid var(--color-border-2)",
                    }}
                  >
                    {r.status}
                  </span>
                  <ReviewActions id={r.id} status={r.status as ReviewStatus} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ImportedView() {
  const { generatedAt, source, rows, totalReviews } = listImportedBundles();
  return (
    <>
      <p style={{ color: "var(--color-muted)", fontSize: 12, marginBottom: 16 }}>
        {rows.length} products · {totalReviews} reviews · generated {generatedAt}
        <br />
        <span style={{ color: "var(--color-muted-2)" }}>{source}</span>
        <br />
        Read-only — managed via the ingest pipeline (scripts/ingest-amazon-reviews).
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="mono" style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--color-muted)", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: "8px 10px" }}>PRODUCT</th>
              <th style={{ padding: "8px 10px" }}>ASIN</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>AVG</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>COUNT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.handle} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "8px 10px" }}>
                  <Link href={`/products/${b.handle}`} target="_blank" style={{ color: "var(--color-foreground)" }}>
                    {b.handle}
                  </Link>
                </td>
                <td style={{ padding: "8px 10px", color: "var(--color-muted)" }}>{b.asin}</td>
                <td style={{ padding: "8px 10px", textAlign: "right" }}>{b.avg.toFixed(1)}</td>
                <td style={{ padding: "8px 10px", textAlign: "right" }}>{b.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
