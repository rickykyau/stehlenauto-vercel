"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Recipient = {
  id: string;
  email: string;
  label: string | null;
  active: boolean;
};

export function NotificationsManager({ initial }: { initial: Recipient[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Recipient[]>(initial);
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/notifications");
    if (res.ok) {
      const data = (await res.json()) as { recipients: Recipient[] };
      setRows(data.recipients);
    }
    router.refresh();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, label }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error || "Failed to add");
      } else {
        setEmail("");
        setLabel("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    await refresh();
  }

  async function remove(id: string) {
    await fetch("/api/admin/notifications", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refresh();
  }

  return (
    <div>
      <form
        onSubmit={add}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}
      >
        <input
          type="email"
          required
          placeholder="staff@stehlenauto.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{ ...inputStyle, maxWidth: 180 }}
        />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Adding…" : "Add recipient"}
        </button>
      </form>
      {err && <p style={{ color: "#c0392b", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}

      {rows.length === 0 ? (
        <p style={{ color: "var(--color-muted-foreground)", fontSize: 14 }}>
          No recipients yet. Add one above. (Until then, alerts fall back to
          ADMIN_OWNER_EMAILS.)
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--color-muted-foreground)" }}>
              <th style={th}>Email</th>
              <th style={th}>Label</th>
              <th style={th}>Active</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                <td style={td}>{r.email}</td>
                <td style={td}>{r.label || "—"}</td>
                <td style={td}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={r.active}
                      onChange={(e) => toggle(r.id, e.target.checked)}
                    />
                    {r.active ? "On" : "Off"}
                  </label>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button
                    onClick={() => remove(r.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#c0392b",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 200,
  padding: "10px 12px",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-background)",
  color: "var(--color-foreground)",
  fontSize: 14,
};
const th: React.CSSProperties = { padding: "8px 6px", fontWeight: 600, fontSize: 12 };
const td: React.CSSProperties = { padding: "10px 6px" };
