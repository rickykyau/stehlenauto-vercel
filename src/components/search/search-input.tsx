"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icons } from "@/components/ui/icons";

export function SearchInput({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
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
        onChange={(e) => setQ(e.target.value)}
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
          onClick={() => setQ("")}
          className="btn btn-sm"
          style={{
            position: "absolute",
            right: 8,
            top: 8,
            height: 40,
          }}
        >
          CLEAR
        </button>
      )}
    </form>
  );
}
