"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icons } from "@/components/ui/icons";

const NUDGE_KEY = "stehlen:wishlist:nudge_dismissed";

/**
 * Cycle 14BG (Mike R3 — Browser → 10/10): toast nudge fired the first
 * time an anonymous shopper saves to their wishlist. AutoZone pattern.
 *
 * Accessibility hardening over the prior version:
 * - `role="dialog"` + `aria-modal="false"` so screen readers announce
 *   the buttons (not just the text — `role="status"` filters out
 *   interactive children in Voice/NVDA/JAWS).
 * - Portal-mounted to document.body to escape any overflow ancestor.
 * - Focus moves to the Sign In CTA on render so keyboard users land
 *   inside the dialog and can Tab to Don't Show Again / Close.
 * - Tab is trapped within the dialog while open (cycling between the
 *   three interactive buttons).
 * - z-index: 1000 (well above sticky ATC, chat FAB).
 * - No auto-dismiss — stays until the user acts (Mike R3 finding:
 *   auto-dismiss silently suppressed re-engagement after 2 ignored
 *   toasts; now suppression only fires on explicit Don't Show Again).
 */
export function WishlistNudge() {
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onNudge = () => {
      if (typeof window === "undefined") return;
      if (window.localStorage.getItem(NUDGE_KEY) === "1") return;
      setVisible(true);
    };
    window.addEventListener("stehlen:wishlist:nudge", onNudge);
    return () => window.removeEventListener("stehlen:wishlist:nudge", onNudge);
  }, []);

  // Cycle 14BG-fix2 (Mike R2 MINOR): focus the FIRST focusable in the
  // dialog (Sign In) on open. Previously used a ref attached to
  // Next.js <Link>, which doesn't reliably forward refs to its
  // underlying anchor — focus call was silently no-op'ing and the
  // dialog opened with default browser focus elsewhere. querySelector
  // against the dialog ref is bulletproof since it targets actual
  // rendered DOM. Also Tab trap inside dialog so keyboard users
  // don't fall out into the background page.
  useEffect(() => {
    if (!visible) return;
    const first = dialogRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    first?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setVisible(false);
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible]);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NUDGE_KEY, "1");
    }
    setVisible(false);
  };

  if (!visible) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="stehlen-wishlist-nudge-title"
      aria-describedby="stehlen-wishlist-nudge-body"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 1000,
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
          id="stehlen-wishlist-nudge-title"
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
          id="stehlen-wishlist-nudge-body"
          style={{
            fontSize: 12,
            color: "var(--color-muted)",
            lineHeight: 1.45,
            marginBottom: 10,
          }}
        >
          Sign in to keep your saves across all your devices.
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a
            href="/sign-in"
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--color-primary)",
              textDecoration: "none",
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Sign in →
          </a>
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
              minHeight: 44,
            }}
          >
            Don&apos;t show again
          </button>
        </div>
      </div>
      <button
        type="button"
        aria-label="Close wishlist sign-in nudge"
        onClick={() => setVisible(false)}
        style={{
          width: 32,
          height: 32,
          minHeight: 32,
          minWidth: 32,
          background: "transparent",
          border: 0,
          color: "var(--color-muted)",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icons.close size={16} />
      </button>
    </div>,
    document.body,
  );
}
