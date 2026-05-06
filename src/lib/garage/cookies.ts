import "server-only";
import { cookies } from "next/headers";
import type { SubModelAnswer, Vehicle } from "./types";

const VEHICLE_COOKIE = "stehlen_vehicle";
const SUBMODEL_COOKIE = "stehlen_submodel";
const ONE_YEAR = 60 * 60 * 24 * 365;

function vehicleId(year: string, make: string, model: string) {
  return `${year}-${make}-${model}`.toLowerCase().replace(/\s+/g, "-");
}

export async function readVehicleCookie(): Promise<Vehicle | null> {
  const store = await cookies();
  const raw = store.get(VEHICLE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Vehicle;
    if (parsed.year && parsed.make && parsed.model) return parsed;
  } catch {
    // ignore — corrupt cookie
  }
  return null;
}

export async function writeVehicleCookie(
  v: Omit<Vehicle, "id"> & { id?: string },
) {
  const store = await cookies();
  const value: Vehicle = {
    id: v.id ?? vehicleId(v.year, v.make, v.model),
    year: v.year,
    make: v.make,
    model: v.model,
  };
  store.set(VEHICLE_COOKIE, JSON.stringify(value), {
    httpOnly: false, // readable by client islands too
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return value;
}

export async function clearVehicleCookie() {
  const store = await cookies();
  store.delete(VEHICLE_COOKIE);
}

// Cycle 14R (owner): YMM modal RESET also needs to wipe the saved sub-model
// answers (bed length, cab type) — otherwise tapping RESET clears the chips
// in the modal but leaves "5.5 ft bed" stuck on the next product the
// customer visits.
export async function clearSubModelCookie() {
  const store = await cookies();
  store.delete(SUBMODEL_COOKIE);
}

export async function readSubModelCookie(): Promise<
  Record<string, SubModelAnswer[]>
> {
  const store = await cookies();
  const raw = store.get(SUBMODEL_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Merges incoming answers with whatever is already saved for this vehicle.
 * Replaces only the groups present in `answers` — leaves untouched groups intact.
 */
export async function writeSubModelCookie(
  vehicleId: string,
  answers: SubModelAnswer[],
) {
  const store = await cookies();
  const all = await readSubModelCookie();
  const existing = all[vehicleId] ?? [];
  const incomingGroups = new Set(answers.map((a) => a.group));
  const merged = [
    ...existing.filter((a) => !incomingGroups.has(a.group)),
    ...answers,
  ];
  all[vehicleId] = merged;
  store.set(SUBMODEL_COOKIE, JSON.stringify(all), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
}
