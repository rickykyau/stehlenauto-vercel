"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics/client";

export function PageViewTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const url = search.toString() ? `${pathname}?${search.toString()}` : pathname;
    track("page_view", { page_path: url });
  }, [pathname, search]);

  return null;
}
