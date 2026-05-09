import "server-only";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db, dbConfigured } from "@/lib/db/client";
import { subModelAnswers, vehicles } from "@/lib/db/schema";
import {
  clearSubModelCookie,
  clearVehicleCookie,
  readSubModelCookie,
  readVehicleCookie,
  writeSubModelCookie,
  writeVehicleCookie,
} from "./cookies";
import type { SubModelAnswer, Vehicle } from "./types";

function vehicleId(year: string, make: string, model: string) {
  return `${year}-${make}-${model}`.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Returns the customer's primary vehicle.
 * - Authed: pulls from Neon (primary, or most recent).
 * - Guest: reads cookie.
 */
export async function getCurrentVehicle(): Promise<Vehicle | null> {
  const { userId } = await auth();
  if (userId && dbConfigured) {
    try {
      const rows = await db()
        .select()
        .from(vehicles)
        .where(eq(vehicles.userId, userId))
        .orderBy(vehicles.isPrimary, vehicles.createdAt);
      const primary = rows.find((r) => r.isPrimary) ?? rows[0];
      if (primary) {
        return {
          id: primary.id,
          year: primary.year,
          make: primary.make,
          model: primary.model,
        };
      }
    } catch (err) {
      console.error("[garage] getCurrentVehicle DB error:", err);
    }
  }
  return await readVehicleCookie();
}

/**
 * Saves a vehicle.
 * - Always writes the cookie (so unauthed → authed handoff is seamless).
 * - If signed in, also upserts to Neon.
 */
export async function saveVehicle(v: {
  year: string;
  make: string;
  model: string;
}): Promise<Vehicle> {
  const id = vehicleId(v.year, v.make, v.model);
  const written = await writeVehicleCookie({ ...v, id });

  const { userId } = await auth();
  if (userId && dbConfigured) {
    try {
      // Cycle 14AP-fix15 (owner-found, prod, signed-in path):
      // when an authed customer saved a SECOND vehicle (e.g., F-150
      // first, then Tacoma), both DB rows ended up with
      // `isPrimary = true`. getCurrentVehicle's `orderBy(isPrimary,
      // createdAt)` defaults to ASC, so within the matching set
      // the OLDEST primary row was returned first — the user kept
      // seeing the F-150 because it was inserted first. The cookie
      // path was correct (Tacoma) but DB took precedence for authed
      // users. Mike's incognito Playwright test passed because
      // guests never hit the DB branch — the bug was invisible
      // until owner reported it as a signed-in user.
      //
      // Fix: demote ALL existing vehicles for this user to
      // isPrimary=false BEFORE inserting/updating the new pick as
      // primary. Single source of truth — exactly one primary row.
      await db()
        .update(vehicles)
        .set({ isPrimary: false })
        .where(eq(vehicles.userId, userId));
      await db()
        .insert(vehicles)
        .values({
          id,
          userId,
          year: v.year,
          make: v.make,
          model: v.model,
          isPrimary: true,
        })
        .onConflictDoUpdate({
          target: [vehicles.userId, vehicles.year, vehicles.make, vehicles.model],
          set: { isPrimary: true },
        });
    } catch (err) {
      console.error("[garage] saveVehicle DB error:", err);
    }
  }

  return written;
}

/**
 * Cycle 14R (owner): YMM modal RESET button used to wipe local state only —
 * the saved cookie+DB row stayed, so closing the modal left the garage chip
 * intact. Now deletes both the vehicle and the sub-model answers everywhere
 * so RESET truly clears the customer's vehicle context.
 */
export async function resetGarage(): Promise<void> {
  await clearVehicleCookie();
  await clearSubModelCookie();
  const { userId } = await auth();
  if (userId && dbConfigured) {
    try {
      await db().delete(vehicles).where(eq(vehicles.userId, userId));
      await db()
        .delete(subModelAnswers)
        .where(eq(subModelAnswers.userId, userId));
    } catch (err) {
      console.error("[garage] resetGarage DB error:", err);
    }
  }
}

export async function getSubModelAnswers(
  vid: string,
): Promise<SubModelAnswer[]> {
  const { userId } = await auth();
  if (userId && dbConfigured) {
    try {
      const rows = await db()
        .select()
        .from(subModelAnswers)
        .where(
          and(
            eq(subModelAnswers.userId, userId),
            eq(subModelAnswers.vehicleId, vid),
          ),
        );
      if (rows.length > 0) {
        return rows.map((r) => ({
          group: r.group as SubModelAnswer["group"],
          value: r.value,
        }));
      }
    } catch (err) {
      console.error("[garage] getSubModelAnswers DB error:", err);
    }
  }
  const all = await readSubModelCookie();
  return all[vid] ?? [];
}

/**
 * Cycle 14AO-fix2 (Sam audit): clear a single sub-model group answer for
 * a vehicle. Used by the DimensionPicker "Change" link so authed users
 * who answer 5.5' BED then click Change actually drop the cookie/DB
 * row instead of having it snap back on next render. Mirrors the cookie
 * + DB shape of saveSubModelAnswers but for a single group key.
 */
export async function clearSubModelAnswer(
  vid: string,
  group: SubModelAnswer["group"],
): Promise<void> {
  // Cookie: read existing, drop the matching group, write back.
  const all = await readSubModelCookie();
  const current = all[vid] ?? [];
  const filtered = current.filter((a) => a.group !== group);
  // Re-write only the answers we kept; writeSubModelCookie merges by group.
  // Special case: if `filtered` is empty, the cookie write helper still
  // updates the per-vehicle slot to [] cleanly.
  await writeSubModelCookie(vid, filtered);

  const { userId } = await auth();
  if (userId && dbConfigured) {
    try {
      await db()
        .delete(subModelAnswers)
        .where(
          and(
            eq(subModelAnswers.userId, userId),
            eq(subModelAnswers.vehicleId, vid),
            eq(subModelAnswers.group, group),
          ),
        );
    } catch (err) {
      console.error("[garage] clearSubModelAnswer DB error:", err);
    }
  }
}

export async function saveSubModelAnswers(
  vid: string,
  answers: SubModelAnswer[],
): Promise<void> {
  await writeSubModelCookie(vid, answers);

  const { userId } = await auth();
  if (userId && dbConfigured && answers.length > 0) {
    try {
      for (const a of answers) {
        await db()
          .insert(subModelAnswers)
          .values({
            userId,
            vehicleId: vid,
            group: a.group,
            value: a.value,
          })
          .onConflictDoUpdate({
            target: [
              subModelAnswers.userId,
              subModelAnswers.vehicleId,
              subModelAnswers.group,
            ],
            set: { value: a.value },
          });
      }
    } catch (err) {
      console.error("[garage] saveSubModelAnswers DB error:", err);
    }
  }
}
