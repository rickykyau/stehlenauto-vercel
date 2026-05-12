"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Icons } from "@/components/ui/icons";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [idx, setIdx] = useState(0);
  const safeImages = images.length > 0 ? images : [];
  const total = safeImages.length;
  const current = safeImages[idx];

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  // Cycle 14AZ-fix1 (Ren BUG-AZ-R1-001): mobile gallery had 36px nav buttons
  // and no swipe gesture — primary image navigation forced small-target taps.
  // Bump to 44px AND wire a horizontal touch-swipe handler so iOS/Android
  // customers can swipe the way every product gallery they've ever used works.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || total < 2) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const dx = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next();
    else prev();
  };

  if (total === 0) {
    return (
      <div
        className="product-img-bg"
        style={{
          aspectRatio: "1",
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
        }}
      >
        <span className="mono" style={{ letterSpacing: "0.12em" }}>
          STEHLEN
        </span>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[64px_1fr]"
      style={{ gap: 12 }}
    >
      {/* Thumbnails */}
      <div
        className="hidden md:flex"
        style={{ flexDirection: "column", gap: 8 }}
      >
        {safeImages.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`View image ${i + 1}`}
            aria-pressed={i === idx}
            className="product-img-bg"
            style={{
              width: 64,
              height: 64,
              padding: 4,
              borderRadius: "var(--radius-sm)",
              border:
                i === idx
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
              cursor: "pointer",
              overflow: "hidden",
              background: "transparent",
            }}
          >
            <Image
              src={src}
              alt=""
              width={120}
              height={120}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </button>
        ))}
      </div>

      {/* Main */}
      <div
        className="product-img-bg"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          borderRadius: "var(--radius-md)",
          position: "relative",
          aspectRatio: "1",
          overflow: "hidden",
          touchAction: "pan-y",
        }}
      >
        <Image
          key={current}
          src={current}
          alt={alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
          style={{ objectFit: "contain" }}
        />
        <div
          className="mono"
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            fontSize: 11,
            color: "#666",
            background: "rgba(255,255,255,0.9)",
            padding: "4px 8px",
            borderRadius: 2,
            letterSpacing: "0.08em",
          }}
        >
          {idx + 1} / {total}
        </div>
        {total > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              display: "flex",
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              style={navBtn}
            >
              <Icons.chevLeft size={18} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              style={navBtn}
            >
              <Icons.chevRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  background: "rgba(0,0,0,0.6)",
  border: 0,
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
