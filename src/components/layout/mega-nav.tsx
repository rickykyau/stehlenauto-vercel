"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icons } from "@/components/ui/icons";
import { MEGA_SECTIONS, type MegaSection } from "./mega-menu-data";

/**
 * Cycle 14AB (Mike-O14AB F-5 + N-3): the previous CSS-only mega menu
 * (`.mega-trigger:focus-within > .mega-panel { display: block }`) kept
 * panels visible across page navigations because focus stayed on the
 * just-clicked link, AND the BlurOnNav workaround from 14AA didn't
 * reliably close it on Mike's Playwright run. Convert to a stateful
 * client component:
 *   - Open on hover (desktop) or click (touch)
 *   - Close on: pathname change, Escape, outside click, link click inside
 *   - Single source of truth: `openIndex` state. No CSS focus-within trap.
 */

function MegaPanel({
  section,
  onLinkClick,
}: {
  section: MegaSection;
  onLinkClick: () => void;
}) {
  const cols = section.columns;
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
        zIndex: 30,
        boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="container-x"
        style={{
          display: "grid",
          gridTemplateColumns: section.feature
            ? "repeat(3, 1fr) 320px"
            : "repeat(3, 1fr)",
          gap: 32,
          padding: "32px",
        }}
      >
        {cols.map((col) => (
          <div key={col.title}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              {col.title}
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {col.items.map((it) => (
                <li key={it.label}>
                  <Link
                    href={it.href}
                    style={{ fontSize: 13 }}
                    onClick={onLinkClick}
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {section.feature && (
          <div
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              padding: 20,
              borderRadius: "var(--radius-md)",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--color-primary)",
                letterSpacing: "0.16em",
                marginBottom: 8,
              }}
            >
              {section.feature.eyebrow}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              {section.feature.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-muted)",
                marginBottom: 14,
              }}
            >
              {section.feature.body}
            </div>
            <Link
              href={section.feature.cta.href}
              className="btn btn-sm btn-primary"
              onClick={onLinkClick}
            >
              {section.feature.cta.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function MegaNav() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  // Close whenever the URL changes — guarantees no leak across nav.
  useEffect(() => {
    setOpenIndex(null);
  }, [pathname]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close on click outside the nav.
  useEffect(() => {
    if (openIndex === null) return;
    const onPointer = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenIndex(null);
      }
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [openIndex]);

  const open = (i: number) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenIndex(i);
  };

  const queueClose = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setOpenIndex(null);
    }, 120);
  };

  return (
    <div
      ref={containerRef}
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      <div
        className="container-x"
        style={{ display: "flex", gap: 0, height: 44, alignItems: "stretch" }}
      >
        {MEGA_SECTIONS.map((section, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={section.label}
              style={{ position: "static" }}
              onMouseEnter={() => open(i)}
              onMouseLeave={queueClose}
            >
              <Link
                href={section.href}
                onClick={() => setOpenIndex(null)}
                onFocus={() => open(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 18px",
                  height: "100%",
                  borderBottom: isOpen
                    ? "2px solid var(--color-primary)"
                    : "2px solid transparent",
                  marginBottom: -1,
                }}
                aria-expanded={isOpen}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  {section.label}
                </span>
                <Icons.chevDown size={10} />
              </Link>
              {isOpen && (
                <MegaPanel
                  section={section}
                  onLinkClick={() => setOpenIndex(null)}
                />
              )}
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
      </div>
    </div>
  );
}
