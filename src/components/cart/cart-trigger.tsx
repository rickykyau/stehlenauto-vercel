"use client";

import type { ReactNode } from "react";
import { openCartDrawer } from "./cart-events";

export function CartTrigger({
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
      onClick={openCartDrawer}
      aria-label={ariaLabel}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
