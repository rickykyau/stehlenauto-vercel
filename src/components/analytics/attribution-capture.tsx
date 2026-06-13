"use client";

import { useEffect } from "react";

const UTM_COOKIE = "stehlen_utm";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Captures utm_* params on landing into a first-party cookie so the cart/order
 * pipeline can attribute the eventual purchase (the params are gone by the time
 * the buyer reaches Shopify hosted checkout). Writes only when utm params are
 * present; first-touch wins for the session (doesn't overwrite an existing
 * cookie within the window). Pairs with the `_ga` cookie (client_id) read
 * server-side in lib/cart/server.ts. Renders nothing.
 */
export function AttributionCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      for (const k of UTM_KEYS) {
        const v = params.get(k);
        if (v) utm[k] = v.slice(0, 255);
      }
      if (Object.keys(utm).length === 0) return; // no campaign params on this URL
      // First-touch: don't clobber an existing capture.
      if (document.cookie.split("; ").some((c) => c.startsWith(`${UTM_COOKIE}=`))) return;
      const value = encodeURIComponent(JSON.stringify(utm));
      document.cookie = `${UTM_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
    } catch {
      /* never let analytics capture break the page */
    }
  }, []);
  return null;
}
