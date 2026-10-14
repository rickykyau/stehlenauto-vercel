"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icons } from "@/components/ui/icons";

/**
 * Full-screen product photo viewer (owner priority: photos must be clear on a
 * phone). Opened from the PDP gallery.
 *   Phone:   swipe between photos, pinch or double-tap to zoom, drag to pan.
 *   Desktop: click to zoom at the cursor, move to pan, click again to reset.
 *   Both:    ← / → keys, Esc or the × button closes.
 */
const MAX_SCALE = 4;
const TAP_ZOOM = 2.5;

export function ImageZoomViewer({
  images,
  alt,
  startIndex,
  onClose,
}: {
  images: string[];
  alt: string;
  startIndex: number;
  onClose: (lastIndex: number) => void;
}) {
  const total = images.length;
  const [idx, setIdx] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  // No easing while a finger is down, so pinch/pan track the finger.
  const [gesturing, setGesturing] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);
  const go = useCallback(
    (d: number) => {
      if (total < 2) return;
      setIdx((i) => (i + d + total) % total);
      reset();
    },
    [total, reset],
  );
  const close = useCallback(() => onClose(idx), [onClose, idx]);

  // Esc / arrows, body scroll lock, focus the close button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [close, go]);

  // Keep the zoomed image inside the stage so it can't be panned off-screen.
  const clamp = useCallback((x: number, y: number, s: number) => {
    const el = stageRef.current;
    if (!el || s <= 1) return { x: 0, y: 0 };
    const mx = ((s - 1) * el.clientWidth) / 2;
    const my = ((s - 1) * el.clientHeight) / 2;
    return { x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
  }, []);

  // Zoom so the point under (clientX, clientY) stays put.
  const zoomAt = useCallback(
    (clientX: number, clientY: number, s: number) => {
      const el = stageRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ox = clientX - (r.left + r.width / 2);
      const oy = clientY - (r.top + r.height / 2);
      setScale(s);
      setPos(clamp(-ox * (s - 1), -oy * (s - 1), s));
    },
    [clamp],
  );

  // ── Touch: swipe / pinch / pan / double-tap ─────────────────────────────
  const t = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    pinchDist: number;
    pinchScale: number;
    moved: boolean;
    lastTap: number;
  }>({ startX: 0, startY: 0, baseX: 0, baseY: 0, pinchDist: 0, pinchScale: 1, moved: false, lastTap: 0 });

  const dist = (a: React.Touch, b: React.Touch) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    const s = t.current;
    if (e.touches.length === 2) {
      s.pinchDist = dist(e.touches[0]!, e.touches[1]!);
      s.pinchScale = scale;
      s.moved = true;
      return;
    }
    const p = e.touches[0]!;
    s.startX = p.clientX;
    s.startY = p.clientY;
    s.baseX = pos.x;
    s.baseY = pos.y;
    s.moved = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = t.current;
    if (e.touches.length === 2 && s.pinchDist > 0) {
      const next = Math.max(1, Math.min(MAX_SCALE, (s.pinchScale * dist(e.touches[0]!, e.touches[1]!)) / s.pinchDist));
      setScale(next);
      setPos((p) => clamp(p.x, p.y, next));
      return;
    }
    const p = e.touches[0]!;
    const dx = p.clientX - s.startX;
    const dy = p.clientY - s.startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) s.moved = true;
    if (scale > 1) setPos(clamp(s.baseX + dx, s.baseY + dy, scale));
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = t.current;
    if (e.touches.length > 0) return; // still pinching
    if (s.pinchDist > 0) {
      s.pinchDist = 0;
      if (scale <= 1.05) reset();
      return;
    }
    const p = e.changedTouches[0]!;
    const dx = p.clientX - s.startX;
    if (scale === 1 && s.moved && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(p.clientY - s.startY)) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    if (!s.moved) {
      const now = Date.now();
      if (now - s.lastTap < 300) {
        if (scale > 1) reset();
        else zoomAt(p.clientX, p.clientY, TAP_ZOOM);
        s.lastTap = 0;
      } else {
        s.lastTap = now;
      }
    }
  };

  // ── Mouse: click to zoom, move to pan ───────────────────────────────────
  const touchActive = useRef(false);
  const onClick = (e: React.MouseEvent) => {
    if (touchActive.current) return; // touch handled above
    if (scale > 1) reset();
    else zoomAt(e.clientX, e.clientY, TAP_ZOOM);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (touchActive.current || scale <= 1) return;
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ox = e.clientX - (r.left + r.width / 2);
    const oy = e.clientY - (r.top + r.height / 2);
    setPos(clamp(-ox * (scale - 1), -oy * (scale - 1), scale));
  };

  // Portal to <body> so no transformed ancestor can trap position:fixed.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — photo ${idx + 1} of ${total}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        background: "#000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 8px 8px 16px",
          color: "#fff",
          flex: "0 0 auto",
        }}
      >
        <span className="mono" style={{ fontSize: 13, letterSpacing: "0.08em" }}>
          {idx + 1} / {total}
        </span>
        <span className="mono" style={{ fontSize: 12, color: "#bdbdbd", letterSpacing: "0.04em" }}>
          {scale > 1 ? "Drag to look around" : "Pinch or double-tap to zoom"}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close photo viewer"
          style={iconBtn}
        >
          <Icons.close size={22} />
        </button>
      </div>

      <div
        ref={stageRef}
        onTouchStart={(e) => {
          touchActive.current = true;
          setGesturing(true);
          onTouchStart(e);
        }}
        onTouchMove={onTouchMove}
        onTouchEnd={(e) => {
          if (e.touches.length === 0) setGesturing(false);
          onTouchEnd(e);
          // let the synthetic click that follows a tap be ignored
          window.setTimeout(() => (touchActive.current = false), 500);
        }}
        onClick={onClick}
        onMouseMove={onMouseMove}
        style={{
          position: "relative",
          flex: "1 1 auto",
          overflow: "hidden",
          touchAction: "none",
          cursor: scale > 1 ? "zoom-out" : "zoom-in",
          background: "#fff",
        }}
      >
        {/* Plain <img>: full-resolution source, transformed on the GPU. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[idx]}
          src={images[idx]}
          alt={`${alt} — photo ${idx + 1}`}
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: gesturing ? "none" : "transform 0.15s ease-out",
            userSelect: "none",
          }}
        />
      </div>

      {total > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            padding: "10px 0 calc(10px + env(safe-area-inset-bottom))",
            flex: "0 0 auto",
          }}
        >
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo" style={iconBtn}>
            <Icons.chevLeft size={22} />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next photo" style={iconBtn}>
            <Icons.chevRight size={22} />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

const iconBtn: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.25)",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
