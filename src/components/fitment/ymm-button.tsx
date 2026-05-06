"use client";

import type { ReactNode } from "react";
import { openYmmModal } from "./ymm-events";

export function YmmButton({
  children,
  className,
  style,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={openYmmModal}
      aria-label={ariaLabel}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
