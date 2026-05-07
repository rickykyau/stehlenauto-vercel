"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TagEditor({
  orderGid,
  initial,
  presets,
}: {
  orderGid: string;
  initial: string[];
  presets: string[];
}) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const has = (t: string) =>
    tags.some((x) => x.toLowerCase() === t.toLowerCase());

  const apply = async (
    op: "add" | "remove",
    value: string,
  ): Promise<void> => {
    const v = value.trim();
    if (!v) return;
    setPending(v);
    setError(null);
    try {
      const res = await fetch("/api/admin/order/tags", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderGid,
          [op]: [v],
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      if (op === "add") {
        setTags((prev) => [...prev.filter((x) => x.toLowerCase() !== v.toLowerCase()), v]);
      } else {
        setTags((prev) => prev.filter((x) => x.toLowerCase() !== v.toLowerCase()));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(null);
    }
  };

  const onAddDraft = () => {
    if (!draft.trim()) return;
    void apply("add", draft);
    setDraft("");
  };

  return (
    <div>
      {/* Current tags */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 10,
          minHeight: 28,
        }}
      >
        {tags.length === 0 ? (
          <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
            No tags yet.
          </span>
        ) : (
          tags.map((t) => {
            const busy = pending === t;
            return (
              <span
                key={t}
                className="mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  letterSpacing: "0.04em",
                  padding: "3px 4px 3px 10px",
                  background: "rgba(245,168,35,0.12)",
                  border: "1px solid rgba(245,168,35,0.4)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-foreground)",
                  opacity: busy ? 0.5 : 1,
                }}
              >
                {t}
                <button
                  type="button"
                  onClick={() => void apply("remove", t)}
                  disabled={busy}
                  aria-label={`Remove ${t}`}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "var(--color-muted)",
                    cursor: busy ? "wait" : "pointer",
                    fontSize: 14,
                    lineHeight: 1,
                    padding: "0 4px",
                  }}
                >
                  ×
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* Add input */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddDraft();
            }
          }}
          placeholder="Add custom tag…"
          className="input"
          style={{ flex: 1, fontSize: 13 }}
          maxLength={40}
        />
        <button
          type="button"
          onClick={onAddDraft}
          disabled={!draft.trim() || pending !== null}
          className="btn btn-sm"
        >
          ADD
        </button>
      </div>

      {/* Preset chips */}
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--color-muted)",
          marginBottom: 6,
        }}
      >
        QUICK PRESETS
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {presets.map((p) => {
          const active = has(p);
          const busy = pending === p;
          return (
            <button
              key={p}
              type="button"
              disabled={busy}
              onClick={() => void apply(active ? "remove" : "add", p)}
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.06em",
                padding: "4px 10px",
                background: active ? "var(--color-primary)" : "transparent",
                color: active ? "#0a0a0a" : "var(--color-foreground)",
                border: active
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                cursor: busy ? "wait" : "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              {active ? "✓ " : "+ "}
              {p.toUpperCase()}
            </button>
          );
        })}
      </div>

      {error && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "var(--color-destructive)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
