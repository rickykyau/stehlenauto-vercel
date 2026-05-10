"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "stehlen_newsletter_subscribed_pending";

/**
 * Cycle 14AR-fix17 (Ren R4 P2): post-subscribe redirect to /?subscribed=1
 * triggers a hard navigation. The previous useEffect-only implementation
 * raced with the 8s auto-dismiss timer — if Playwright (or a real user)
 * checked the page right at the boundary, the toast was already gone.
 * Persist the flag to sessionStorage on read so a subsequent navigation
 * (or scroll) still surfaces the confirmation. The toast lives until
 * the user dismisses it (the X) OR the 12s timer expires.
 */
export function NewsletterSuccess() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let triggered = false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "1") {
      triggered = true;
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore — sessionStorage may be unavailable in some contexts
      }
      params.delete("subscribed");
      const q = params.toString();
      const url = window.location.pathname + (q ? `?${q}` : "");
      window.history.replaceState(null, "", url);
    }

    let pending = false;
    try {
      pending = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // ignore
    }

    if (triggered || pending) {
      setShown(true);
      const t = setTimeout(() => {
        setShown(false);
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }, 12000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!shown) return null;

  const dismiss = () => {
    setShown(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        maxWidth: "min(440px, calc(100vw - 32px))",
        padding: "14px 44px 14px 20px",
        background: "var(--color-foreground)",
        color: "var(--color-background)",
        border: "2px solid var(--color-primary)",
        borderRadius: "var(--radius-md)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
        fontSize: 14,
        fontWeight: 600,
        textAlign: "center",
        animation: "stehlenSlideDown 0.3s ease-out",
      }}
    >
      <span style={{ color: "var(--color-primary)", marginRight: 8 }}>✓</span>
      You&apos;re on the list. Check your inbox for the $25 off code.
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          background: "transparent",
          border: "none",
          color: "var(--color-background)",
          fontSize: 18,
          cursor: "pointer",
          opacity: 0.7,
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes stehlenSlideDown {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
