"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { identify } from "@/lib/analytics/client";

export function IdentifyUser() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isSignedIn || !user) return;
    identify(user.id, {
      $email: user.primaryEmailAddress?.emailAddress,
      $first_name: user.firstName ?? undefined,
      $last_name: user.lastName ?? undefined,
    });
  }, [isSignedIn, user]);

  return null;
}
