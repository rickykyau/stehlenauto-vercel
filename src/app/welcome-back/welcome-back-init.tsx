"use client";

import { useEffect } from "react";

/**
 * Client island for the reactivation landing page. Two jobs, both fire once on
 * mount:
 *  1. Drop a non-httpOnly `stehlen_promo` cookie so the server cart auto-applies
 *     the code at checkout (see lib/cart/server.ts applyPromoCode) — the
 *     customer never has to copy/paste it.
 *  2. Emit a GA4 event so we can measure email → LP → purchase per campaign.
 *
 * Renders nothing.
 */
export function WelcomeBackInit({
  code,
  make,
  model,
  utm,
}: {
  code: string;
  make?: string;
  model?: string;
  utm?: string;
}) {
  useEffect(() => {
    if (code) {
      // 14-day life matches the WELCOME10 window; path=/ so it covers checkout.
      document.cookie = `stehlen_promo=${encodeURIComponent(
        code,
      )}; path=/; max-age=${60 * 60 * 24 * 14}; samesite=lax`;
    }
    try {
      const w = window as unknown as {
        gtag?: (...a: unknown[]) => void;
      };
      w.gtag?.("event", "welcome_back_view", {
        promo_code: code || undefined,
        vehicle_make: make || undefined,
        vehicle_model: model || undefined,
        campaign: utm || undefined,
      });
    } catch {
      /* analytics is best-effort */
    }
  }, [code, make, model, utm]);

  return null;
}
