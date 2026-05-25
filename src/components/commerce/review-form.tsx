"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/icons";

/**
 * Cycle 14BG (Mike new-customer ceiling): native review submission form
 * for PDPs without imported Amazon reviews. Submissions land in
 * pending state — admin moderates before they appear publicly.
 *
 * UX:
 * - 5-star picker (keyboard accessible — Tab through stars, Space/Enter
 *   to select)
 * - 100-char title with live counter
 * - 2000-char body with live counter
 * - Name + email (vehicle year/make/model auto-pulled from garage cookie
 *   server-side, no need to ask twice)
 * - Inline success / error states (no page reload)
 */
export function ReviewForm({
  productHandle,
  productTitle,
}: {
  productHandle: string;
  productTitle: string;
}) {
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [errMessage, setErrMessage] = useState("");

  // Cycle 14BG-fix1 (Mike gate-test BLOCKER): button was disabled until
  // every field passed. Mike's Playwright session showed it stuck even
  // with valid input — diagnosing that vs surfacing the specific issue
  // is friction. New pattern: button always clickable, submit handler
  // validates and writes a concrete error message inline. Better UX
  // anyway — users see "Pick a star rating" instead of mysteriously-
  // disabled state.
  const validate = (): string | null => {
    if (stars < 1) return "Pick a star rating from 1 to 5.";
    if (title.trim().length < 4) return "Title needs at least 4 characters.";
    if (reviewBody.trim().length < 20)
      return "Review needs at least 20 characters — tell us about fit, install, and quality.";
    if (authorName.trim().length < 2) return "Your name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail.trim()))
      return "Enter a valid email address.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const validationErr = validate();
    if (validationErr) {
      setStatus("err");
      setErrMessage(validationErr);
      return;
    }
    setBusy(true);
    setStatus("idle");
    setErrMessage("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productHandle,
          stars,
          title: title.trim(),
          body: reviewBody.trim(),
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `http_${res.status}`);
      }
      setStatus("ok");
      // Soft reset — keep name/email so a customer leaving multiple
      // reviews doesn't retype, but clear the review-specific fields.
      setStars(0);
      setTitle("");
      setReviewBody("");
    } catch (err) {
      setStatus("err");
      setErrMessage(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  };

  if (status === "ok") {
    return (
      <div
        role="status"
        style={{
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.4)",
          borderRadius: "var(--radius-md)",
          padding: 20,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: "var(--color-success)",
            marginBottom: 6,
          }}
        >
          ✓ Review submitted — thank you
        </div>
        <p style={{ fontSize: 14, color: "var(--color-muted)", margin: 0, lineHeight: 1.5 }}>
          Your review is pending a quick moderation check (we screen for spam,
          not for star count). You&apos;ll see it on this page within 1-2
          business days. Want to review another part?{" "}
          <button
            type="button"
            onClick={() => setStatus("idle")}
            style={{
              background: "transparent",
              border: 0,
              color: "var(--color-primary)",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
              font: "inherit",
            }}
          >
            Write another →
          </button>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 24,
      }}
    >
      <h3
        className="mono"
        style={{
          fontSize: 13,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          margin: 0,
          marginBottom: 6,
        }}
      >
        Be the first to review this part
      </h3>
      <p
        style={{
          fontSize: 13,
          color: "var(--color-muted)",
          marginBottom: 18,
          lineHeight: 1.5,
        }}
      >
        Help other {productTitle.split(" ").slice(0, 3).join(" ")} owners decide.
        Reviews are moderated for spam — every rating counts.
      </p>

      {/* Star picker */}
      <div style={{ marginBottom: 18 }}>
        <span
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-muted)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Your rating *
        </span>
        <div role="radiogroup" aria-label="Star rating" style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hoverStars || stars) >= n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={stars === n}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                onClick={() => setStars(n)}
                onMouseEnter={() => setHoverStars(n)}
                onMouseLeave={() => setHoverStars(0)}
                onFocus={() => setHoverStars(n)}
                onBlur={() => setHoverStars(0)}
                style={{
                  width: 44,
                  height: 44,
                  minHeight: 44,
                  minWidth: 44,
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: 28,
                  color: active ? "var(--color-primary)" : "var(--color-muted-2)",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <label style={{ display: "block", marginBottom: 14 }}>
        <span
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-muted)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Title * <span style={{ float: "right" }}>{title.length}/100</span>
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 100))}
          placeholder="Summed up in one line"
          required
          minLength={4}
          maxLength={100}
          style={{
            width: "100%",
            height: 44,
            padding: "0 12px",
            fontSize: 14,
            background: "var(--color-background)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-foreground)",
          }}
        />
      </label>

      {/* Body */}
      <label style={{ display: "block", marginBottom: 14 }}>
        <span
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-muted)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Your review * <span style={{ float: "right" }}>{reviewBody.length}/2000</span>
        </span>
        <textarea
          value={reviewBody}
          onChange={(e) => setReviewBody(e.target.value.slice(0, 2000))}
          placeholder="Fit on your truck, install time, what worked, what to watch for..."
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 14,
            background: "var(--color-background)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-foreground)",
            resize: "vertical",
            minHeight: 120,
            fontFamily: "inherit",
            lineHeight: 1.5,
          }}
        />
      </label>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <label style={{ display: "block" }}>
          <span
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-muted)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Name *
          </span>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            autoComplete="name"
            required
            minLength={2}
            maxLength={60}
            style={{
              width: "100%",
              height: 44,
              padding: "0 12px",
              fontSize: 14,
              background: "var(--color-background)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-foreground)",
            }}
          />
        </label>
        <label style={{ display: "block" }}>
          <span
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-muted)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Email * <span style={{ textTransform: "none", color: "var(--color-muted)" }}>(never shown)</span>
          </span>
          <input
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            autoComplete="email"
            required
            style={{
              width: "100%",
              height: 44,
              padding: "0 12px",
              fontSize: 14,
              background: "var(--color-background)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-foreground)",
            }}
          />
        </label>
      </div>

      {status === "err" && (
        <div
          role="alert"
          style={{
            marginBottom: 14,
            padding: 12,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            color: "var(--color-foreground)",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "var(--color-destructive)" }}>
            Couldn&apos;t submit —
          </strong>{" "}
          {errMessage || "please check your input and try again"}.
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn btn-primary btn-lg btn-block"
        style={{
          opacity: busy ? 0.5 : 1,
          cursor: busy ? "wait" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {busy ? (
          "Submitting…"
        ) : (
          <>
            Submit review <Icons.arrowR size={14} />
          </>
        )}
      </button>
      <p
        style={{
          fontSize: 11,
          color: "var(--color-muted)",
          marginTop: 10,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Reviews go live after a quick spam check (1-2 business days).
        Your email is never shown publicly.
      </p>
    </form>
  );
}
