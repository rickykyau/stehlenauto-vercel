"use client";

import { useState, type ReactNode } from "react";

type Props = {
  rendered: ReactNode;
  plainTextLength: number;
  hasWarning: boolean;
};

const COLLAPSE_THRESHOLD_CHARS = 280;

export default function WarehouseNoteDisclosure({
  rendered,
  plainTextLength,
  hasWarning,
}: Props) {
  const longEnoughToCollapse = plainTextLength > COLLAPSE_THRESHOLD_CHARS;
  const [expanded, setExpanded] = useState(!longEnoughToCollapse);

  return (
    <>
      <div
        className="warehouse-note"
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--color-foreground)",
          maxHeight: expanded ? "none" : 104,
          overflow: "hidden",
          position: "relative",
          maskImage:
            !expanded && longEnoughToCollapse
              ? "linear-gradient(180deg, #000 65%, transparent 100%)"
              : undefined,
          WebkitMaskImage:
            !expanded && longEnoughToCollapse
              ? "linear-gradient(180deg, #000 65%, transparent 100%)"
              : undefined,
        }}
      >
        {rendered}
      </div>
      {longEnoughToCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mono"
          style={{
            marginTop: 8,
            padding: "6px 10px",
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            fontSize: 11,
            letterSpacing: "0.1em",
            fontWeight: 700,
            color: hasWarning
              ? "var(--color-primary)"
              : "var(--color-foreground)",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
          aria-expanded={expanded}
        >
          {expanded ? "− Show less" : "+ Read full note"}
        </button>
      )}
    </>
  );
}
