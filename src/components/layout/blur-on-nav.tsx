"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Cycle 14AA (Mike-O14AA F-5 MAJOR): the mega menu is CSS-only — it uses
 * `.mega-trigger:focus-within > .mega-panel { display: block }` so keyboard
 * users can tab into it. After clicking a link inside the panel, Next.js
 * does a soft SPA nav, but the browser keeps focus on the just-clicked
 * `<a>` until something else takes it — meaning `:focus-within` stays true
 * and the mega panel stays visible across the next page render.
 *
 * Fix: when the URL changes, explicitly blur the active element. This kills
 * focus-within on the mega trigger, the panel hides, and we don't have to
 * rewrite the menu as a stateful client component.
 */
export function BlurOnNav() {
  const pathname = usePathname();
  useEffect(() => {
    const el = document.activeElement;
    if (el && el !== document.body && "blur" in el) {
      (el as HTMLElement).blur();
    }
  }, [pathname]);
  return null;
}
