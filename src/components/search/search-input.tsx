"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icons } from "@/components/ui/icons";

type Suggestion = {
  type: "product" | "collection" | "query";
  label: string;
  href: string;
  image?: string | null;
  price?: number;
};

export function SearchInput({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Cycle 14Z post-deploy (Mike-O8 F-3 NIT): /search page input had no live
  // typeahead — only static popular searches showed while typing. Header
  // already does this; mirror the same /api/search/suggest call here so the
  // dedicated search page is at least as good as the header.
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
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <form onSubmit={submit} style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 18,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-muted)",
            display: "flex",
            pointerEvents: "none",
          }}
        >
          <Icons.search size={18} />
        </span>
        <input
          type="search"
          name="q"
          autoComplete="off"
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="input"
          placeholder="Search by Year Make Model, product type, or part number…"
          style={{
            height: 56,
            paddingLeft: 50,
            paddingRight: 100,
            fontSize: 16,
            textTransform: "none",
            letterSpacing: 0,
          }}
          aria-label="Search products"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setSuggestions([]);
            }}
            className="btn btn-sm"
            style={{
              position: "absolute",
              right: 6,
              top: 6,
              height: 44,
              minWidth: 64,
            }}
          >
            CLEAR
          </button>
        )}
      </form>

      {open && q.trim().length >= 2 && suggestions.length > 0 && (
        <div
          role="listbox"
          aria-label="Search suggestions"
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
            maxHeight: 520,
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
                padding: "12px 14px",
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
                    width: 48,
                    height: 48,
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
                    sizes="48px"
                    style={{ objectFit: "contain", padding: 4 }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
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
                    <Icons.menu size={18} />
                  ) : (
                    <Icons.search size={18} />
                  )}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
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
                    fontSize: 10,
                    color: "var(--color-muted)",
                    letterSpacing: "0.12em",
                    marginTop: 3,
                  }}
                >
                  {s.type.toUpperCase()}
                </div>
              </div>
              {s.price !== undefined && (
                <span
                  className="mono"
                  style={{ fontSize: 14, fontWeight: 700 }}
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
              padding: 14,
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
