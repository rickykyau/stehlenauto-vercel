"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { MEGA_SECTIONS } from "./mega-menu-data";
import { openYmmModal } from "@/components/fitment/ymm-events";

/**
 * Cycle 14BA-fix5 (Mike + Jordan unanimous): the BY MAKE column inside
 * Shop by Vehicle now drills one more level — tap Ford → expand to the
 * top Ford models (sorted by SKU count from data/ymm_tree.json) → tap
 * model → land on /vehicle/{make}-{model} hub (categorized + fitment-
 * aware). The flat /collections/{make}-parts page is still reachable
 * via a "See all <Make> vehicles →" link inside the model list.
 *
 * Model lists are hand-curated from the live ymm_tree.json top-counts
 * to stay within Jordan's 6-8-per-make cap (alphabetical exhaustion
 * was the anti-pattern he flagged). Slug format matches the existing
 * /vehicle/[slug] parser (POPULAR_VEHICLES) so all destinations are
 * known-good routes.
 */
const MAKE_MODEL_DRILLDOWN: Record<
  string,
  { models: { label: string; slug: string }[]; allHref: string }
> = {
  Ford: {
    models: [
      { label: "F-150", slug: "ford-f-150" },
      { label: "F-250 Super Duty", slug: "ford-f-250-super-duty" },
      { label: "F-350 Super Duty", slug: "ford-f-350-super-duty" },
      { label: "Ranger", slug: "ford-ranger" },
      { label: "Expedition", slug: "ford-expedition" },
      { label: "Bronco", slug: "ford-bronco" },
    ],
    allHref: "/collections/ford-parts",
  },
  Chevrolet: {
    models: [
      { label: "Silverado 1500", slug: "chevrolet-silverado-1500" },
      { label: "Silverado 2500 HD", slug: "chevrolet-silverado-2500-hd" },
      { label: "Silverado 3500 HD", slug: "chevrolet-silverado-3500-hd" },
      { label: "Colorado", slug: "chevrolet-colorado" },
      { label: "Tahoe", slug: "chevrolet-tahoe" },
      { label: "Suburban", slug: "chevrolet-suburban" },
    ],
    allHref: "/collections/chevy-parts",
  },
  Ram: {
    models: [
      { label: "Ram 1500", slug: "ram-1500" },
      { label: "Ram 1500 Classic", slug: "ram-1500-classic" },
      { label: "Ram 2500", slug: "ram-2500" },
      { label: "Ram 3500", slug: "ram-3500" },
      { label: "Dakota", slug: "ram-dakota" },
    ],
    allHref: "/collections/dodge-parts",
  },
  Toyota: {
    models: [
      { label: "Tundra", slug: "toyota-tundra" },
      { label: "Tacoma", slug: "toyota-tacoma" },
      { label: "4Runner", slug: "toyota-4runner" },
      { label: "Sequoia", slug: "toyota-sequoia" },
      { label: "Highlander", slug: "toyota-highlander" },
    ],
    allHref: "/collections/toyota-parts",
  },
  Jeep: {
    models: [
      { label: "Wrangler", slug: "jeep-wrangler" },
      { label: "Gladiator", slug: "jeep-gladiator" },
      { label: "Grand Cherokee", slug: "jeep-grand-cherokee" },
      { label: "Cherokee", slug: "jeep-cherokee" },
      { label: "Compass", slug: "jeep-compass" },
    ],
    allHref: "/collections/jeep-parts",
  },
  GMC: {
    models: [
      { label: "Sierra 1500", slug: "gmc-sierra-1500" },
      { label: "Sierra 2500 HD", slug: "gmc-sierra-2500-hd" },
      { label: "Sierra 3500 HD", slug: "gmc-sierra-3500-hd" },
      { label: "Canyon", slug: "gmc-canyon" },
      { label: "Yukon", slug: "gmc-yukon" },
    ],
    allHref: "/collections/gmc-parts",
  },
  Nissan: {
    models: [
      { label: "Frontier", slug: "nissan-frontier" },
      { label: "Titan", slug: "nissan-titan" },
      { label: "Titan XD", slug: "nissan-titan-xd" },
      { label: "Xterra", slug: "nissan-xterra" },
      { label: "Armada", slug: "nissan-armada" },
    ],
    allHref: "/collections/nissan-parts",
  },
  Dodge: {
    models: [
      { label: "Ram 1500 (legacy)", slug: "dodge-ram-1500" },
      { label: "Ram 2500 (legacy)", slug: "dodge-ram-2500" },
      { label: "Ram 3500 (legacy)", slug: "dodge-ram-3500" },
      { label: "Dakota", slug: "dodge-dakota" },
      { label: "Durango", slug: "dodge-durango" },
    ],
    allHref: "/collections/dodge-parts",
  },
  Honda: {
    models: [
      { label: "Ridgeline", slug: "honda-ridgeline" },
      { label: "Pilot", slug: "honda-pilot" },
      { label: "Passport", slug: "honda-passport" },
      { label: "Odyssey", slug: "honda-odyssey" },
    ],
    allHref: "/collections/honda-parts",
  },
  Hyundai: {
    models: [
      { label: "Santa Cruz", slug: "hyundai-santa-cruz" },
      { label: "Tucson", slug: "hyundai-tucson" },
      { label: "Santa Fe", slug: "hyundai-santa-fe" },
      { label: "Palisade", slug: "hyundai-palisade" },
    ],
    allHref: "/collections/hyundai-parts",
  },
};

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  // Cycle 14BA-fix1 (owner iOS test): mobile drawer used to render each
  // top-level mega-section as a flat <Link href={section.href}>, which
  // sent EXTERIOR / CARGO & BED / LIGHTING / TOWING all to either
  // /collections (generic shop) or the FIRST sub-collection of the
  // group — confusing the customer who expected each tap to drill into
  // that category. Desktop has multi-column hover panels; mobile needs
  // an accordion. Single-open accordion: tap to expand sub-items, tap
  // again or tap another row to switch.
  const [expanded, setExpanded] = useState<string | null>(null);
  // Cycle 14BA-fix5: inner accordion state for make → model drill-down.
  // Reset whenever the outer accordion collapses or the drawer closes.
  const [makeExpanded, setMakeExpanded] = useState<string | null>(null);
  const makeButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Reset accordion state when the drawer closes so reopening starts collapsed.
  useEffect(() => {
    if (!open) {
      setExpanded(null);
      setMakeExpanded(null);
    }
  }, [open]);

  // Clear inner expansion when the outer section changes.
  useEffect(() => {
    setMakeExpanded(null);
  }, [expanded]);

  // Cycle 14BA-fix5 (Jordan P0): auto-scroll the expanded make-row into
  // view at the top of the drawer so the model list doesn't open below
  // the fold and feel like a dead end on 390px screens.
  useEffect(() => {
    if (!makeExpanded) return;
    const el = makeButtonRefs.current[makeExpanded];
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [makeExpanded]);

  const closeAll = () => {
    setExpanded(null);
    setMakeExpanded(null);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{
          background: "transparent",
          border: 0,
          color: "var(--color-foreground)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          margin: -8,
          padding: 0,
          cursor: "pointer",
        }}
      >
        <Icons.menu size={22} />
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.7)",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="anim-slide-right"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "88%",
              maxWidth: 380,
              background: "var(--color-background)",
              borderLeft: "1px solid var(--color-border)",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <Logo height={18} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--color-foreground)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  margin: -10,
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <Icons.close size={22} />
              </button>
            </div>
            {/* Cycle 14AR-fix8 (QA-found BUG-YMM-2 / Jordan F-11): mobile
                hamburger had no garage / vehicle entry. The header pill
                below the top bar IS the primary trigger, but first-time
                users who associate "garage" with "settings/account" look
                inside the hamburger drawer. Adding a YMM button at the
                top costs nothing and adds a discovery path. */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openYmmModal();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "18px 20px",
                background: "var(--color-surface-2)",
                border: 0,
                borderBottom: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
                cursor: "pointer",
              }}
            >
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
              >
                <Icons.truck size={16} />
                <span
                  className="mono"
                  style={{
                    fontSize: 13,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Select your vehicle
                </span>
              </span>
              <Icons.chevRight size={16} />
            </button>
            {MEGA_SECTIONS.map((section) => {
              const isOpen = expanded === section.label;
              return (
                <div
                  key={section.label}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) =>
                        prev === section.label ? null : section.label,
                      )
                    }
                    aria-expanded={isOpen}
                    aria-controls={`mobile-menu-section-${section.label.replace(/\s+/g, "-").toLowerCase()}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "18px 20px",
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      color: "var(--color-foreground)",
                      textAlign: "left",
                      minHeight: 44,
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: 13,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      {section.label}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        transition: "transform 160ms ease",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    >
                      <Icons.chevRight size={16} />
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      id={`mobile-menu-section-${section.label.replace(/\s+/g, "-").toLowerCase()}`}
                      style={{
                        background: "var(--color-surface)",
                        borderTop: "1px solid var(--color-border)",
                      }}
                    >
                      {section.columns.map((col) => {
                        const isMakeColumn =
                          section.label === "Shop by Vehicle" &&
                          col.title === "BY MAKE";
                        return (
                          <div key={col.title}>
                            <div
                              className="eyebrow"
                              style={{
                                padding: "14px 24px 6px",
                                fontSize: 10,
                                letterSpacing: "0.14em",
                                color: "var(--color-muted)",
                              }}
                            >
                              {col.title}
                            </div>
                            {col.items.map((item) => {
                              // Cycle 14BA-fix5: BY MAKE items inside Shop by
                              // Vehicle become a third-level accordion (make
                              // → models → vehicle hub). All other columns
                              // (POPULAR, BY BODY, and every non-vehicle
                              // section) stay as flat Links.
                              const drilldown = isMakeColumn
                                ? MAKE_MODEL_DRILLDOWN[item.label]
                                : null;
                              if (drilldown) {
                                const isMakeOpen = makeExpanded === item.label;
                                return (
                                  <div key={`${col.title}-${item.label}`}>
                                    <button
                                      ref={(el) => {
                                        makeButtonRefs.current[item.label] = el;
                                      }}
                                      type="button"
                                      onClick={() =>
                                        setMakeExpanded((prev) =>
                                          prev === item.label ? null : item.label,
                                        )
                                      }
                                      aria-expanded={isMakeOpen}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        padding: "12px 24px",
                                        minHeight: 44,
                                        background: "transparent",
                                        border: 0,
                                        cursor: "pointer",
                                        color: "var(--color-foreground)",
                                        textAlign: "left",
                                        fontSize: 14,
                                      }}
                                    >
                                      <span>{item.label}</span>
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          transition:
                                            "transform 160ms ease",
                                          transform: isMakeOpen
                                            ? "rotate(90deg)"
                                            : "rotate(0deg)",
                                        }}
                                      >
                                        <Icons.chevRight size={14} />
                                      </span>
                                    </button>
                                    {isMakeOpen && (
                                      <div
                                        style={{
                                          background: "var(--color-surface-2)",
                                          borderTop:
                                            "1px solid var(--color-border)",
                                          borderBottom:
                                            "1px solid var(--color-border)",
                                        }}
                                      >
                                        {drilldown.models.map((m) => (
                                          <Link
                                            key={m.slug}
                                            href={`/vehicle/${m.slug}`}
                                            onClick={closeAll}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              padding: "12px 32px",
                                              minHeight: 44,
                                              fontSize: 13,
                                              color: "var(--color-foreground)",
                                              textDecoration: "none",
                                            }}
                                          >
                                            {m.label}
                                          </Link>
                                        ))}
                                        <Link
                                          href={drilldown.allHref}
                                          onClick={closeAll}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "12px 32px",
                                            minHeight: 44,
                                            fontSize: 12,
                                            color: "var(--color-primary)",
                                            textDecoration: "none",
                                            letterSpacing: "0.06em",
                                          }}
                                        >
                                          See all {item.label} vehicles →
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <Link
                                  key={`${col.title}-${item.label}-${item.href}`}
                                  href={item.href}
                                  onClick={closeAll}
                                  style={{
                                    /* Cycle 14BA-fix4 (owner): leaf items
                                       showed a `>` chevron that implied a
                                       deeper accordion step. They're direct
                                       destinations — tap = navigate. */
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "12px 24px",
                                    minHeight: 44,
                                    fontSize: 14,
                                    color: "var(--color-foreground)",
                                    textDecoration: "none",
                                  }}
                                >
                                  {item.label}
                                </Link>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Cycle 14AR-fix7 (QA-found BUG-14AZ-3 P2): href was /account
                  which middleware bounces to /sign-in?redirect_url=/account
                  — after sign-in user landed on /account dashboard instead
                  of returning to the page they were browsing. Direct link
                  to /sign-in lets Clerk capture the actual referrer. */}
              <Link href="/sign-in" prefetch={false} className="btn btn-block" onClick={() => setOpen(false)}>
                Sign In
              </Link>
              <Link href="/help" className="btn btn-block" onClick={() => setOpen(false)}>
                Help Center
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
