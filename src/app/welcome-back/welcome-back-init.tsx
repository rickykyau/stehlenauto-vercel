"use client";

import { useEffect } from "react";

/**
 * Client island for the reactivation landing page. Three jobs, all fire once on
 * mount:
 *  1. Drop a non-httpOnly `stehlen_promo` cookie so the server cart auto-applies
 *     the code at checkout (see lib/cart/server.ts applyPromoCode) — the
 *     customer never has to copy/paste it.
 *  2. Seed the `stehlen_vehicle` garage cookie — ONLY when the link carries an
 *     exact year (emails send make+model only; a guessed year showed every
 *     reader "2004 Ford F-150") — so every PDP already knows their truck and shows
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
  staleGuessYear,
  utm,
}: {
  code: string;
  make?: string;
  model?: string;
  /** Exact year from the link's `year=` param — never a guessed year. */
  year?: number;
  /** The coverage-probe year older builds saved as the shopper's vehicle; a
   *  cookie that exactly matches it (same make/model) is cleared. */
  staleGuessYear?: number;
  utm?: string;
}) {
  useEffect(() => {
    if (code) {
      // 14-day life ≈ a campaign code's window; path=/ so it covers checkout.
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

    // Undo the old guessed-year seed (e.g. "2004 Ford F-150" for every F-150
    // reader). Only an exact make/model/guess-year match is cleared.
    if (!year && staleGuessYear && make && model) {
      const raw = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${VEHICLE_COOKIE}=`));
      try {
        const v = raw
          ? (JSON.parse(decodeURIComponent(raw.slice(VEHICLE_COOKIE.length + 1))) as {
              year?: string;
              make?: string;
              model?: string;
            })
          : null;
        if (
          v &&
          String(v.year) === String(staleGuessYear) &&
          v.make?.toLowerCase() === make.toLowerCase() &&
          v.model?.toLowerCase() === model.toLowerCase()
        ) {
          document.cookie = `${VEHICLE_COOKIE}=; path=/; max-age=0; samesite=lax`;
        }
      } catch {
        /* unreadable cookie — leave it */
      }
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
  }, [code, make, model, year, staleGuessYear, utm]);

  return null;
}
