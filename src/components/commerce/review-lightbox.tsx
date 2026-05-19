"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icons } from "@/components/ui/icons";

export type LightboxPhoto = {
  src: string;
  reviewerName: string;
  stars: number;
  title: string;
};

/**
 * Cycle 14BD (Jordan spec section 2): focus-trapped lightbox for
 * customer review photos. Mounts via portal so it can escape any
 * `overflow: hidden` ancestors. Keyboard: ESC closes, ←/→ navigate.
 * Mobile: horizontal swipe navigates, vertical swipe-down dismisses.
 */
export function ReviewLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
}: {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const current = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  // Focus trap: move focus to close on mount; restore on unmount handled
  // by the caller via opening from a button (browser default).
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        e.preventDefault();
        onIndexChange(index - 1);
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        onIndexChange(index + 1);
      } else if (e.key === "Tab") {
        // Simple focus trap — keep focus inside the dialog.
        const focusables =
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled])',
          ) ?? [];
        if (focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [index, hasPrev, hasNext, onClose, onIndexChange]);

  if (typeof document === "undefined" || !current) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dy) > 80 && Math.abs(dy) > Math.abs(dx)) {
      // Vertical swipe down → dismiss
      if (dy > 0) onClose();
      return;
    }
    if (Math.abs(dx) > 50) {
      if (dx < 0 && hasNext) onIndexChange(index + 1);
      else if (dx > 0 && hasPrev) onIndexChange(index - 1);
    }
  };

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Customer photo viewer"
      style={{ position: "fixed", inset: 0, zIndex: 100 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        aria-label="Close photo viewer"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.96)",
          border: 0,
          cursor: "pointer",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          pointerEvents: "none",
        }}
      >
        <button
          ref={closeBtnRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: 22,
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.4)",
            color: "#fff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
            zIndex: 2,
          }}
        >
          <Icons.close size={20} />
        </button>

        {hasPrev && (
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => onIndexChange(index - 1)}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "auto",
              zIndex: 2,
            }}
          >
            <Icons.chevLeft size={20} />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => onIndexChange(index + 1)}
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "auto",
              zIndex: 2,
            }}
          >
            <Icons.chevRight size={20} />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element -- we don't know the natural dims of customer photos */}
        <img
          src={current.src}
          alt={`Customer photo by ${current.reviewerName}`}
          style={{
            maxWidth: "min(90vw, 800px)",
            maxHeight: "min(75vh, 700px)",
            objectFit: "contain",
            pointerEvents: "auto",
          }}
        />

        <div
          style={{
            marginTop: 12,
            color: "rgba(255,255,255,0.8)",
            fontSize: 13,
            textAlign: "center",
            maxWidth: 600,
            lineHeight: 1.5,
            pointerEvents: "auto",
          }}
        >
          <span style={{ color: "var(--color-primary)", letterSpacing: "0.04em" }}>
            {"★".repeat(current.stars)}
          </span>{" "}
          <strong style={{ color: "#fff" }}>{current.title || "Verified review"}</strong>
          <br />
          <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
            {current.reviewerName} · ✓ verified purchase · sourced from amazon
          </span>
          <br />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
            {index + 1} / {photos.length}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
