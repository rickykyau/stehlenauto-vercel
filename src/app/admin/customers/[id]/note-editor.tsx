"use client";

import { useState } from "react";

export function NoteEditor({
  customerGid,
  initial,
}: {
  customerGid: string;
  initial: string | null;
}) {
  const [note, setNote] = useState(initial ?? "");
  const [original, setOriginal] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const dirty = note !== original;

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/customer/note", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customerGid, note }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Save failed (HTTP ${res.status})`);
      }
      setOriginal(note);
      setSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder="Add a private note about this customer (visible to staff only)..."
        className="input"
        style={{
          width: "100%",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          lineHeight: 1.5,
          resize: "vertical",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 8,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
          {error ? (
            <span style={{ color: "var(--color-destructive)" }}>{error}</span>
          ) : savedAt ? (
            `Saved ${savedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
          ) : dirty ? (
            "Unsaved changes"
          ) : (
            "Notes are saved on Shopify customer profile."
          )}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !dirty}
          className="btn btn-sm btn-primary"
        >
          {saving ? "SAVING…" : "SAVE NOTE"}
        </button>
      </div>
    </div>
  );
}
