"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";

const LS_KEY = "stehlen:wishlist:anon";

function readAnon(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((h): h is string => typeof h === "string") : [];
  } catch {
    return [];
  }
}

function writeAnon(handles: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(handles));
    window.dispatchEvent(new CustomEvent("stehlen:wishlist:anon:changed"));
  } catch {
    // Quota / private mode — silently no-op.
  }
}

/**
 * Cycle 14BF (Jordan F-8): small wishlist heart for collection / search /
 * cross-sell cards. Works WITHOUT login via localStorage; merges to the
 * Drizzle wishlist on next /api/wishlist POST when the user signs in
 * (handled server-side via a /api/wishlist/merge endpoint — see
 * todo in api/wishlist/route.ts). Anonymous-first removes the sign-in
 * friction Mike flagged on browse-mode shoppers.
 */
export function WishlistHeart({ handle }: { handle: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSaved(readAnon().includes(handle));
    const onChange = () => setSaved(readAnon().includes(handle));
    window.addEventListener("stehlen:wishlist:anon:changed", onChange);
    return () =>
      window.removeEventListener("stehlen:wishlist:anon:changed", onChange);
  }, [handle]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const current = readAnon();
      const next = saved
        ? current.filter((h) => h !== handle)
        : Array.from(new Set([...current, handle]));
      writeAnon(next);
      setSaved(!saved);
      // Best-effort persist to authenticated wishlist; ignore 401.
      try {
        if (saved) {
          await fetch("/api/wishlist", {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ handle }),
          });
        } else {
          await fetch("/api/wishlist", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ handle }),
          });
        }
      } catch {
        // Network down — localStorage is the source of truth until next visit.
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? "Remove from saved" : "Save for later"}
      aria-pressed={saved}
      title={saved ? "Saved — tap to remove" : "Save for later"}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        width: 36,
        height: 36,
        minHeight: 36,
        minWidth: 36,
        borderRadius: 18,
        background: saved
          ? "rgba(245,168,35,0.95)"
          : "rgba(10,10,10,0.6)",
        border: saved
          ? "1px solid var(--color-primary)"
          : "1px solid rgba(255,255,255,0.2)",
        color: saved ? "#0a0a0a" : "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: busy ? "wait" : "pointer",
        zIndex: 2,
        backdropFilter: "blur(4px)",
      }}
    >
      <Icons.heart size={16} />
    </button>
  );
}
