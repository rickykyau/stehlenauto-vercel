"use client";

import { useEffect } from "react";

const LS_KEY = "stehlen:recently_viewed";
const MAX_ITEMS = 12;

export type RecentlyViewedEntry = {
  handle: string;
  title: string;
  image: string | null;
  price: number;
  ts: number;
};

/**
 * Cycle 14BF: silently records the PDP visit to localStorage. Renders
 * nothing. RecentlyViewedStrip reads the same key on home / collection /
 * empty cart / search pages.
 */
export function RecentlyViewedTracker(entry: Omit<RecentlyViewedEntry, "ts">) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      const list: RecentlyViewedEntry[] = raw ? JSON.parse(raw) : [];
      const filtered = list.filter((e) => e.handle !== entry.handle);
      filtered.unshift({ ...entry, ts: Date.now() });
      const trimmed = filtered.slice(0, MAX_ITEMS);
      window.localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
      window.dispatchEvent(new CustomEvent("stehlen:recently_viewed:changed"));
    } catch {
      // Quota / private mode — silently no-op.
    }
  }, [entry.handle, entry.title, entry.image, entry.price]);

  return null;
}
