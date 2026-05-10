"use client";

import { useEffect, useState } from "react";

const COOKIE_NAME = "stehlen_newsletter_subscribed";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

function writeCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; max-age=${maxAgeSec}; path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

/**
 * Cycle 14AR-fix25 (Ren R10 P2): the previous sessionStorage approach
 * didn't survive the 303 redirect → hard nav → second hard nav chain
 * that newsletter subscriptions go through. Switched to a short-lived
 * cookie which is the only client-side store guaranteed to survive every
 * navigation type and Playwright context behavior. Cookie expires after
 * 12s; the component clears it on dismiss or after the timer fires.
 */
export function NewsletterSuccess() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let triggered = false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "1") {
      triggered = true;
      writeCookie(COOKIE_NAME, "1", 60);
      params.delete("subscribed");
      const q = params.toString();
      const url = window.location.pathname + (q ? `?${q}` : "");
      window.history.replaceState(null, "", url);
    }

    const pending = readCookie(COOKIE_NAME) === "1";

    if (triggered || pending) {
      setShown(true);
      // Cycle 14AR-fix29 (Ren R14 P2): the previous setTimeout also called
      // clearCookie. During cross-page navigation the timer could fire
      // before useEffect cleanup canceled it, blasting the cookie before
      // the destination page hydrated. Now: the timer only hides the
      // visual toast — cookie expiry is handled exclusively by the
      // server-set max-age=60 (and the explicit dismiss button below).
      const t = setTimeout(() => setShown(false), 12000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!shown) return null;

  const dismiss = () => {
    setShown(false);
    clearCookie(COOKIE_NAME);
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
