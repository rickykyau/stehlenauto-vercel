"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { RecentlyViewedEntry } from "./recently-viewed-tracker";

const LS_KEY = "stehlen:recently_viewed";

/**
 * Cycle 14BF: surfaces recently-viewed products on Home, Collection,
 * and Cart pages. Sticky for browsers ("I was looking at this") and
 * returning customers ("pick up where I left off"). Hidden when no
 * history exists. Excludes the currently-displayed PDP via `excludeHandle`.
 */
export function RecentlyViewedStrip({
  excludeHandle,
  limit = 6,
  title = "Recently viewed",
}: {
  excludeHandle?: string;
  limit?: number;
  title?: string;
}) {
  const [items, setItems] = useState<RecentlyViewedEntry[]>([]);

  useEffect(() => {
    const read = (): RecentlyViewedEntry[] => {
      try {
        const raw = window.localStorage.getItem(LS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };
    setItems(read());
    const onChange = () => setItems(read());
    window.addEventListener("stehlen:recently_viewed:changed", onChange);
    return () =>
      window.removeEventListener(
        "stehlen:recently_viewed:changed",
        onChange,
      );
  }, []);

  const filtered = items
    .filter((e) => e.handle !== excludeHandle)
    .slice(0, limit);

  if (filtered.length === 0) return null;

  return (
    <section
      className="container-x"
      style={{ paddingTop: 40, paddingBottom: 40 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2
          className="mono"
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-muted)",
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      {/* Cycle 14BF-fix2 (Mike F-3 MINOR): force min 4 columns so a
          2-item strip doesn't look sparse on a 1440px screen.
          Empty trailing slots become flat tiles linking to /collections
          so the row still reads as intentional. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(Math.min(filtered.length, limit), 4)}, minmax(0, 1fr))`,
          gap: 12,
        }}
      >
        {filtered.map((e) => (
          <Link
            key={e.handle}
            href={`/products/${e.handle}`}
            prefetch={false}
            data-recent-card
            style={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              background: "var(--color-surface)",
            }}
          >
            <div
              style={{
                aspectRatio: "1",
                position: "relative",
                background: "var(--color-surface-2)",
              }}
            >
              {e.image ? (
                <Image
                  src={e.image}
                  alt={e.title}
                  fill
                  sizes="(max-width: 768px) 33vw, 16vw"
                  style={{ objectFit: "contain", padding: 6 }}
                />
              ) : null}
            </div>
            <div style={{ padding: 8 }}>
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.35,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  marginBottom: 4,
                }}
              >
                {e.title}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  fontWeight: 700,
                }}
              >
                ${e.price.toFixed(2)}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length < 4 &&
          Array.from({ length: 4 - filtered.length }).map((_, i) => (
            <Link
              key={`pad-${i}`}
              href="/collections"
              prefetch={false}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                textDecoration: "none",
                color: "var(--color-muted)",
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: "transparent",
                aspectRatio: "1",
                padding: 12,
                fontSize: 11,
                lineHeight: 1.4,
                letterSpacing: "0.04em",
                transition: "color 140ms ease, border-color 140ms ease",
              }}
            >
              <span style={{ fontSize: 20, opacity: 0.5 }}>+</span>
              <span className="mono" style={{ marginTop: 6, textTransform: "uppercase" }}>
                Discover more
              </span>
            </Link>
          ))}
      </div>
    </section>
  );
}
