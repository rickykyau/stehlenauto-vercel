"use client";

import { useState } from "react";

const SUBJECT = encodeURIComponent("Your Stehlen cart is waiting");
const BODY = (url: string) =>
  encodeURIComponent(
    `Hi —\n\nNoticed you started checkout on Stehlen but didn't get to finish. Your cart is still saved here:\n\n${url}\n\nIf you ran into a fitment question or anything else, just reply to this email and I'll help.\n\n— The Stehlen team`,
  );

export function CopyRecoveryButton({
  url,
  email,
}: {
  url: string;
  email: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={onCopy}
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          padding: "3px 10px",
          background: copied ? "var(--color-success)" : "var(--color-primary)",
          color: copied ? "var(--color-foreground)" : "#0a0a0a",
          border: "none",
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        {copied ? "✓ COPIED" : "COPY LINK"}
      </button>
      {email && (
        <a
          href={`mailto:${email}?subject=${SUBJECT}&body=${BODY(url)}`}
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            padding: "3px 10px",
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-foreground)",
            textDecoration: "none",
          }}
        >
          EMAIL
        </a>
      )}
    </div>
  );
}
