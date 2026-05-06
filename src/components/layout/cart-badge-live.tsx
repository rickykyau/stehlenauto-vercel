"use client";

import { useEffect, useState } from "react";

/**
 * Cycle 14Z (Mike-O3 N-7): live cart badge that listens for any cart
 * mutation event from anywhere in the app. The SSR layout still renders
 * the initial count from getCart() — this just patches it client-side
 * when the customer adds, removes, or empties without a navigation that
 * would re-execute the layout.
 *
 * Emit `stehlen:cart:updated` with `{ count: number }` from any cart
 * mutation to update the badge live.
 */
export function CartBadgeLive({
  initial,
  top,
  right,
}: {
  initial: number;
  top: number;
  right: number;
}) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const onUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as { count?: number } | undefined;
      if (detail && typeof detail.count === "number") {
        setCount(detail.count);
      }
    };
    window.addEventListener("stehlen:cart:updated", onUpdate);
    return () => window.removeEventListener("stehlen:cart:updated", onUpdate);
  }, []);

  if (count <= 0) return null;

  return (
    <span
      style={{
        position: "absolute",
        top,
        right,
        minWidth: 16,
        height: 16,
        padding: "0 4px",
        borderRadius: 8,
        background: "var(--color-primary)",
        color: "var(--color-background)",
        fontSize: 10,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {count}
    </span>
  );
}
