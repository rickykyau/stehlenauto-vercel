"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { identify, track } from "@/lib/analytics/client";

const SESSION_KEY = "stehlen_logged_userid";
const SIGNUP_KEY = "stehlen_signup_fired";

export function IdentifyUser() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isSignedIn || !user) return;

    identify(user.id, {
      $email: user.primaryEmailAddress?.emailAddress,
      $first_name: user.firstName ?? undefined,
      $last_name: user.lastName ?? undefined,
    });

    // sign_up: fire once per user, on the first time we see a brand-new
    // Clerk user (created <60s ago) in this browser. localStorage flag
    // prevents re-firing across sessions.
    try {
      const created = user.createdAt
        ? new Date(user.createdAt).getTime()
        : null;
      const ageMs = created ? Date.now() - created : Infinity;
      const alreadyFired = localStorage.getItem(SIGNUP_KEY) === user.id;
      if (created && ageMs < 60_000 && !alreadyFired) {
        track("sign_up", { method: "clerk" });
        localStorage.setItem(SIGNUP_KEY, user.id);
      }
    } catch {
      /* localStorage blocked — skip */
    }

    // login: fire once per browser session per user (sessionStorage).
    try {
      const seen = sessionStorage.getItem(SESSION_KEY);
      if (seen !== user.id) {
        track("login", { method: "clerk" });
        sessionStorage.setItem(SESSION_KEY, user.id);
      }
    } catch {
      /* sessionStorage blocked — skip */
    }
  }, [isSignedIn, user]);

  return null;
}
