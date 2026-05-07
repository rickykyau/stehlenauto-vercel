"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { track } from "@/lib/analytics/client";

type Suggestion = {
  type: "product" | "collection" | "query";
  label: string;
  href: string;
  image?: string | null;
  price?: number;
};

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Cycle 14AA (Mike-O14AA F-9 MINOR): when the customer is on /search?q=…
  // the header input was empty — they couldn't see what they had searched
  // for, and re-typing felt like the site forgot. Hydrate from the URL on
  // every navigation so the header search matches the page content.
  const [q, setQ] = useState(() =>
    pathname === "/search" ? searchParams.get("q") ?? "" : "",
  );
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (pathname === "/search") {
      const urlQ = searchParams.get("q") ?? "";
      setQ(urlQ);
    }
    // Cycle 14AB (Mike-O14AB N-4): close the typeahead dropdown on every
    // route change. Without this, typing "tonneau" + Enter lands on
    // /search?q=tonneau but the dropdown stays mounted on top of the
    // results, intercepting clicks until the user blurs the input.
    setOpen(false);
  }, [pathname, searchParams]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Debounced fetch — driven by `q`. We schedule the fetch in an effect, but
  // setState inside the effect body is avoided per React 19 rules; the empty
  // result is set inside the timer callback instead.
  useEffect(() => {
    const trimmed = q.trim();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      if (trimmed.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(trimmed)}`,
        );
        const data = (await res.json()) as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions);
      } catch {
        setSuggestions([]);
      }
    }, 180);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  // Click-outside close.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    track("search", { search_term: trimmed });
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <form onSubmit={submit} style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-muted)",
            display: "flex",
            pointerEvents: "none",
          }}
        >
          <Icons.search size={16} />
        </span>
        <input
          type="search"
          name="q"
          autoComplete="off"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="input"
          placeholder="Search by Year Make Model, product type, or part number…"
          style={{
            paddingLeft: 40,
            paddingRight: 40,
            height: 44,
            fontSize: 13,
            textTransform: "none",
            letterSpacing: 0,
          }}
          aria-label="Search"
        />
        <span
          className="mono"
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 10,
            color: "var(--color-muted-2)",
            letterSpacing: "0.1em",
            border: "1px solid var(--color-border)",
            padding: "2px 6px",
            borderRadius: 3,
            pointerEvents: "none",
          }}
        >
          ⌘ K
        </span>
      </form>

      {open && q.trim().length >= 2 && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
            zIndex: 50,
            maxHeight: 480,
            overflowY: "auto",
          }}
        >
          {suggestions.map((s, i) => (
            <Link
              key={`${s.type}-${i}-${s.label}`}
              href={s.href}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderBottom:
                  i < suggestions.length - 1
                    ? "1px solid var(--color-border)"
                    : 0,
              }}
            >
              {s.image ? (
                <div
                  className="product-img-bg"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-sm)",
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={s.image}
                    alt=""
                    fill
                    sizes="40px"
                    style={{ objectFit: "contain", padding: 4 }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: "var(--color-surface-2)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-muted)",
                    flexShrink: 0,
                  }}
                >
                  {s.type === "collection" ? (
                    <Icons.menu size={16} />
                  ) : (
                    <Icons.search size={16} />
                  )}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Cycle 14c (Mike-3 F-6): used to be single-line ellipsis,
                    truncating titles to "2016-2…" on tablet/mobile. Allow 2
                    lines so the year + product type both fit. */}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {s.label}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: "var(--color-muted)",
                    letterSpacing: "0.12em",
                    marginTop: 2,
                  }}
                >
                  {s.type.toUpperCase()}
                </div>
              </div>
              {s.price !== undefined && (
                <span
                  className="mono"
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  ${s.price}
                </span>
              )}
            </Link>
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(q)}`}
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 12,
              background: "var(--color-surface-2)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 11, letterSpacing: "0.12em" }}
            >
              SEE ALL RESULTS FOR &ldquo;{q}&rdquo;
            </span>
            <Icons.arrowR size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}
