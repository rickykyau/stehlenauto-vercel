"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SubModelAnswer, Vehicle } from "@/lib/garage/types";

/**
 * Cycle 14AO-fix3 (Mike NB-4): the empty-state CLEAR FILTERS link used to
 * be a plain <Link href="/collections/{handle}"> — that drops sidebar ?f=
 * params from the URL but leaves the dimension answer in cookie/DB or in
 * URL ?dim= form. Result: customer sees "no matches with these filters,"
 * clicks CLEAR FILTERS, lands on the same empty page because the dim
 * cookie is still applied. This wraps the link with explicit clear-all
 * behaviour: posts a clear request to /api/sub-model for every saved
 * dimension answer (when authenticated) and navigates to the bare
 * collection URL with no ?dim= and no ?f=.
 */
export function ClearFiltersLink({
  collectionHandle,
  vehicle,
  answeredGroups,
  children,
  style,
}: {
  collectionHandle: string;
  vehicle?: Vehicle;
  answeredGroups: SubModelAnswer["group"][];
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      // Best-effort: clear each saved dimension answer for the active
      // vehicle. Errors are non-fatal — we still navigate.
      if (vehicle?.id && answeredGroups.length > 0) {
        await Promise.all(
          answeredGroups.map((group) =>
            fetch("/api/sub-model", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ vehicleId: vehicle.id, clear: group }),
            }).catch(() => undefined),
          ),
        );
      }
      startTransition(() => {
        router.push(`/collections/${collectionHandle}`);
      });
    },
    [vehicle?.id, answeredGroups, collectionHandle, router],
  );

  return (
    <a
      href={`/collections/${collectionHandle}`}
      onClick={onClick}
      style={{
        ...style,
        opacity: pending ? 0.6 : 1,
        cursor: pending ? "wait" : "pointer",
      }}
    >
      {children}
    </a>
  );
}
