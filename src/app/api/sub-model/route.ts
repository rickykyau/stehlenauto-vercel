import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearSubModelAnswer,
  saveSubModelAnswers,
} from "@/lib/garage/server";

export const runtime = "nodejs";

const SUB_GROUPS = ["bed_length", "cab_type", "trim", "doors"] as const;

const SaveBody = z.object({
  vehicleId: z.string().min(1),
  answers: z.array(
    z.object({
      group: z.enum(SUB_GROUPS),
      value: z.string().min(1),
    }),
  ),
});

const ClearBody = z.object({
  vehicleId: z.string().min(1),
  // Cycle 14AO-fix2 (Sam audit): explicit clear-shape so authed users
  // can drop a single sub-model answer without re-saving the whole map.
  // Used by DimensionPicker "Change" link.
  clear: z.enum(SUB_GROUPS),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  // Try save shape first (most calls); fall through to clear shape.
  const save = SaveBody.safeParse(json);
  if (save.success) {
    await saveSubModelAnswers(save.data.vehicleId, save.data.answers);
    return NextResponse.json({ ok: true });
  }
  const clr = ClearBody.safeParse(json);
  if (clr.success) {
    await clearSubModelAnswer(clr.data.vehicleId, clr.data.clear);
    return NextResponse.json({ ok: true, cleared: clr.data.clear });
  }
  return NextResponse.json(
    {
      error: "Invalid body — expected {vehicleId, answers} or {vehicleId, clear}",
      issues: save.error.issues,
    },
    { status: 400 },
  );
}
