"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { MEGA_SECTIONS } from "./mega-menu-data";
import { openYmmModal } from "@/components/fitment/ymm-events";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

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
                  display: "flex",
                  cursor: "pointer",
                }}
              >
                <Icons.close size={20} />
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
            {MEGA_SECTIONS.map((section) => (
              <Link
                key={section.label}
                href={section.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px",
                  borderBottom: "1px solid var(--color-border)",
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
                <Icons.chevRight size={16} />
              </Link>
            ))}
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
