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
      }, 8000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!shown) return null;

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
        padding: "14px 20px",
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
      <style>{`
        @keyframes stehlenSlideDown {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
