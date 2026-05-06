"use client";

import type { AnalyticsPayload, EventName } from "./types";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    klaviyo?: {
      push: (args: unknown[]) => void;
      identify: (props: Record<string, unknown>) => void;
      track: (name: string, props?: Record<string, unknown>) => void;
    };
    clarity?: (...args: unknown[]) => void;
    _learnq?: unknown[];
  }
}

const DEBUG =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("debug_analytics");

function logDebug(name: EventName, payload: AnalyticsPayload | undefined) {
  if (DEBUG) console.info("[analytics]", name, payload);
}

function gaTrack(name: EventName, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, payload ?? {});
}

function klaviyoTrack(name: EventName, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  // Klaviyo onsite tracking via _learnq array (legacy) or new klaviyo.push.
  const k = window.klaviyo;
  if (k && typeof k.track === "function") {
    k.track(klaviyoEventName(name), (payload as Record<string, unknown>) ?? {});
    return;
  }
  if (Array.isArray(window._learnq)) {
    window._learnq.push(["track", klaviyoEventName(name), payload ?? {}]);
  }
}

function klaviyoEventName(name: EventName): string {
  switch (name) {
    case "view_item":
      return "Viewed Product";
    case "add_to_cart":
      return "Added to Cart";
    case "begin_checkout":
      return "Started Checkout";
    case "purchase":
      return "Placed Order";
    case "search":
      return "Searched Site";
    default:
      return name
        .split("_")
        .map((w) => w[0]?.toUpperCase() + w.slice(1))
        .join(" ");
  }
}

function clarityEvent(name: EventName, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  if (typeof window.clarity !== "function") return;
  window.clarity("event", name);
  if (payload?.value !== undefined) {
    window.clarity("set", "value", String(payload.value));
  }
  if (payload?.search_term) {
    window.clarity("set", "search_term", String(payload.search_term));
  }
}

export function track(name: EventName, payload?: AnalyticsPayload) {
  logDebug(name, payload);
  gaTrack(name, payload);
  klaviyoTrack(name, payload);
  clarityEvent(name, payload);
}

export function identify(
  userId: string,
  traits: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("set", "user_id", userId);
  }
  if (window.klaviyo && typeof window.klaviyo.identify === "function") {
    window.klaviyo.identify({ external_id: userId, ...traits });
  }
  if (typeof window.clarity === "function") {
    window.clarity("identify", userId);
  }
}
