"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

/**
 * Date-switched holiday promo laid over the announcement bar (same 32px box, so
 * no layout shift). Client-side on purpose: the bar is part of the cached layout,
 * and a server date check would freeze at build time. Windows match the Shopify
 * theme's snippets/stehlen-holiday.liquid and the JL-SQL "Holiday Sale START/END"
 * tasks that change prices (scripts/catalog/holiday-sale.py).
 */
const WINDOWS = [
  {
    // 2026-11-20 00:05 PT → 2026-12-02 00:05 PT
    from: Date.UTC(2026, 10, 20, 8, 5),
    to: Date.UTC(2026, 11, 2, 8, 5),
    href: "/collections/black-friday-deals",
    text: "BLACK FRIDAY · UP TO 15% OFF · SHOP DEALS",
  },
  {
    // 2026-12-02 00:05 PT → end of 2026-12-14 PT (ground transit is 2–6 business days)
    from: Date.UTC(2026, 11, 2, 8, 5),
    to: Date.UTC(2026, 11, 15, 8, 0),
    href: "/collections/gifts-for-truck-owners",
    text: "ORDER BY DEC 14 FOR CHRISTMAS · SHOP GIFTS",
  },
];

const noSubscribe = () => () => {};
// Index of the active window on the client; -1 on the server (and outside windows).
const activeIndex = () => {
  const now = Date.now();
  return WINDOWS.findIndex((w) => now >= w.from && now < w.to);
};

export function HolidayAnnouncement() {
  const i = useSyncExternalStore(noSubscribe, activeIndex, () => -1);
  const promo = i >= 0 ? WINDOWS[i] : null;
  if (!promo) return null;
  return (
    <Link
      href={promo.href}
      className="mono"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 12px",
        background: "var(--color-primary)",
        color: "#111",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textDecoration: "none",
      }}
    >
      {promo.text}
    </Link>
  );
}
