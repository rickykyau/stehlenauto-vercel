"use client";

import { useEffect } from "react";

/**
 * Client island for the reactivation landing page. Three jobs, all fire once on
 * mount:
 *  1. Drop a non-httpOnly `stehlen_promo` cookie so the server cart auto-applies
 *     the code at checkout (see lib/cart/server.ts applyPromoCode) — the
 *     customer never has to copy/paste it.
 *  2. Seed the `stehlen_vehicle` garage cookie from the email's make/model/year
 *     params so every PDP the shopper opens already knows their truck and shows
 *     the green "✓ FITS YOUR <vehicle>" verdict — instead of the cold
 *     "VERIFY FITMENT" state they used to land on (P0-2). Format mirrors
 *     lib/garage/cookies.ts writeVehicleCookie ({id, year, make, model}) so the
 *     server reader picks it up. We never overwrite an existing garage vehicle —
 *     a returning shopper's own selection wins over the email default.
 *  3. Emit a GA4 event so we can measure email → LP → purchase per campaign.
 *
 * Renders nothing.
 */
const VEHICLE_COOKIE = "stehlen_vehicle";

function hasVehicleCookie(): boolean {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${VEHICLE_COOKIE}=`));
}

export function WelcomeBackInit({
  code,
  make,
  model,
  year,
  utm,
}: {
  code: string;
  make?: string;
  model?: string;
  /** Latest catalog year for make/model, computed server-side. */
  year?: number;
  utm?: string;
}) {
  useEffect(() => {
    if (code) {
      // 14-day life matches the WELCOME10 window; path=/ so it covers checkout.
      document.cookie = `stehlen_promo=${encodeURIComponent(
        code,
      )}; path=/; max-age=${60 * 60 * 24 * 14}; samesite=lax`;
    }

    // Seed the garage vehicle from the email params so PDPs resolve fitment.
    // Only when we have a full make+model+year AND the shopper hasn't already
    // set their own vehicle (don't clobber a real garage selection).
    if (make && model && year && !hasVehicleCookie()) {
      const id = `${year}-${make}-${model}`
        .toLowerCase()
        .replace(/\s+/g, "-");
      const value = JSON.stringify({ id, year: String(year), make, model });
      document.cookie = `${VEHICLE_COOKIE}=${encodeURIComponent(
        value,
      )}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
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
