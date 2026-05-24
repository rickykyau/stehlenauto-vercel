"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";

const NUDGE_KEY = "stehlen:wishlist:nudge_dismissed";

/**
 * Cycle 14BF-fix2 (Mike R2 browser → 10/10): toast nudge fired the
 * first time an anonymous shopper saves to their wishlist. Sticks
 * bottom-right for 8 seconds with a Sign-in CTA + a dismiss. Once
 * dismissed it never shows again on this browser.
 *
 * Mounted globally via root layout so it can listen for the
 * `stehlen:wishlist:nudge` event dispatched from any WishlistHeart.
 */
export function WishlistNudge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Cycle 14BF-fix3 (Mike R3): track the timer outside the handler so
    // re-firing nudges don't leak intervals. Auto-dismiss removed —
    // toast stays until the user acts (Sign in / Don't show again /
    // Close). Mike's R3 finding: 8s auto-dismiss silently set
    // suppression after 2 ignored toasts, killing the re-engagement
    // loop for power browsers. Now: toast stays visible until acted
    // on; only explicit "Don't show again" sets the permanent
    // suppression flag.
    const onNudge = () => {
      if (typeof window === "undefined") return;
      if (window.localStorage.getItem(NUDGE_KEY) === "1") return;
      setVisible(true);
    };
    window.addEventListener("stehlen:wishlist:nudge", onNudge);
    return () => window.removeEventListener("stehlen:wishlist:nudge", onNudge);
  }, []);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NUDGE_KEY, "1");
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 90,
        maxWidth: 340,
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-primary)",
        borderRadius: "var(--radius-md)",
        padding: 14,
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          background: "rgba(245,168,35,0.18)",
          color: "var(--color-primary)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icons.heart size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: "var(--color-foreground)",
            marginBottom: 4,
          }}
        >
          Saved to your wishlist
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--color-muted)",
            lineHeight: 1.45,
            marginBottom: 10,
          }}
        >
          Sign in to keep your saves across all your devices.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/sign-in"
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--color-primary)",
              textDecoration: "none",
            }}
          >
            Sign in →
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-muted)",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Don&apos;t show again
          </button>
        </div>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={() => setVisible(false)}
        style={{
          width: 24,
          height: 24,
          minHeight: 24,
          minWidth: 24,
          background: "transparent",
          border: 0,
          color: "var(--color-muted)",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <Icons.close size={14} />
      </button>
    </div>
  );
}
