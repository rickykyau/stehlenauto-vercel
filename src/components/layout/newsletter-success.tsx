"use client";

import { useEffect, useState } from "react";

export function NewsletterSuccess() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "1") {
      setShown(true);
      const t = setTimeout(() => {
        setShown(false);
        params.delete("subscribed");
        const q = params.toString();
        const url = window.location.pathname + (q ? `?${q}` : "");
        window.history.replaceState(null, "", url);
      }, 6000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!shown) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        marginTop: 12,
        padding: "10px 14px",
        background: "rgba(245, 168, 35, 0.12)",
        border: "1px solid var(--color-primary)",
        borderRadius: "var(--radius-sm)",
        color: "var(--color-foreground)",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      ✓ You&apos;re on the list. Check your inbox for the $25 off code.
    </div>
  );
}
