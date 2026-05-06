import { NextResponse } from "next/server";
import { z } from "zod";
import { saveSubModelAnswers } from "@/lib/garage/server";

export const runtime = "nodejs";

const Body = z.object({
  vehicleId: z.string().min(1),
  answers: z.array(
    z.object({
      group: z.enum(["bed_length", "cab_type", "trim", "doors"]),
      value: z.string().min(1),
    }),
  ),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { vehicleId, answers } = parsed.data;
  await saveSubModelAnswers(vehicleId, answers);
  return NextResponse.json({ ok: true });
}
