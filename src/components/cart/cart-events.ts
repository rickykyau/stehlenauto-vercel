"use client";

const OPEN_EVENT = "stehlen:cart:open";

export function openCartDrawer() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function onOpenCartDrawer(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}
