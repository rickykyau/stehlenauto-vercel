"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // navigator.clipboard can fail in iframes / insecure contexts —
      // fall back to a hidden textarea + execCommand.
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="mono"
      title={copied ? "Copied" : "Copy code"}
      style={{
        fontSize: 10,
        letterSpacing: "0.08em",
        padding: "2px 8px",
        background: "transparent",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        color: copied ? "var(--color-success)" : "var(--color-muted)",
      }}
    >
      {copied ? "✓ COPIED" : "COPY"}
    </button>
  );
}

export function DeleteButton({
  id,
  kind,
  title,
}: {
  id: string;
  kind: "code" | "automatic";
  title: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    if (
      !confirm(
        `Delete "${title}"? This cannot be undone. Customers won't be able to redeem this anymore.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/discount?id=${encodeURIComponent(id)}&kind=${kind}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Delete failed (HTTP ${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="mono"
        title={`Delete ${title}`}
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          padding: "2px 8px",
          background: "transparent",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          cursor: deleting ? "wait" : "pointer",
          color: "var(--color-destructive)",
        }}
      >
        {deleting ? "DELETING…" : "DELETE"}
      </button>
      {error && (
        <span
          style={{
            fontSize: 10,
            color: "var(--color-destructive)",
            maxWidth: 180,
            textAlign: "right",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
