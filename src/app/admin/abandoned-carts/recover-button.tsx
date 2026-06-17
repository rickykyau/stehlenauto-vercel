"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PILL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.08em",
  padding: "3px 10px",
  borderRadius: "var(--radius-sm)",
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
};

function fmtSent(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "sent";
  }
}

export function CartRowActions({
  checkoutId,
  url,
  email,
  alreadyPurchased,
  purchasedOrderName,
  alreadySentAt,
}: {
  checkoutId: string;
  url: string | null;
  email: string | null;
  alreadyPurchased: boolean;
  purchasedOrderName: string | null;
  alreadySentAt: string | null;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [sentNow, setSentNow] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const onSend = async () => {
    setErr(null);
    setSending(true);
    try {
      const res = await fetch("/api/admin/abandoned-carts/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ checkoutId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Send failed");
      } else {
        setSentNow(true);
        router.refresh();
      }
    } catch {
      setErr("Network error");
    } finally {
      setSending(false);
    }
  };

  const onArchive = async () => {
    if (!window.confirm("Archive this cart? It will drop off the list. You can restore it later.")) {
      return;
    }
    setErr(null);
    setArchiving(true);
    try {
      const res = await fetch("/api/admin/abandoned-carts/archive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ checkoutId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Archive failed");
        setArchiving(false);
      } else {
        router.refresh();
      }
    } catch {
      setErr("Network error");
      setArchiving(false);
    }
  };

  const wasSent = sentNow || Boolean(alreadySentAt);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {alreadyPurchased && (
        <span
          className="mono"
          title={
            purchasedOrderName
              ? `Order ${purchasedOrderName} placed after this cart`
              : "Customer already placed an order"
          }
          style={{
            ...PILL,
            cursor: "default",
            background: "rgba(34,197,94,0.12)",
            color: "var(--color-success)",
            border: "1px solid rgba(34,197,94,0.4)",
            alignSelf: "flex-start",
          }}
        >
          ✓ ALREADY PURCHASED
        </span>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {url && (
          <button
            type="button"
            onClick={onCopy}
            className="mono"
            style={{
              ...PILL,
              background: copied ? "var(--color-success)" : "var(--color-primary)",
              color: copied ? "var(--color-foreground)" : "#0a0a0a",
            }}
          >
            {copied ? "✓ COPIED" : "COPY LINK"}
          </button>
        )}

        {wasSent ? (
          <span
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "var(--color-muted)",
            }}
          >
            ✓ SENT{alreadySentAt ? ` · ${fmtSent(alreadySentAt)}` : ""}
          </span>
        ) : (
          email &&
          !alreadyPurchased && (
            <button
              type="button"
              onClick={onSend}
              disabled={sending}
              className="mono"
              style={{
                ...PILL,
                background: "transparent",
                border: "1px solid var(--color-primary)",
                color: "var(--color-primary)",
                opacity: sending ? 0.5 : 1,
              }}
            >
              {sending ? "SENDING…" : "SEND FOLLOW-UP"}
            </button>
          )
        )}

        <button
          type="button"
          onClick={onArchive}
          disabled={archiving}
          className="mono"
          title="Ignore / archive this cart"
          style={{
            ...PILL,
            background: "transparent",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted)",
            opacity: archiving ? 0.5 : 1,
          }}
        >
          {archiving ? "…" : "ARCHIVE"}
        </button>
      </div>

      {err && (
        <span style={{ fontSize: 10, color: "var(--color-destructive)", maxWidth: 200 }}>
          {err}
        </span>
      )}
    </div>
  );
}
