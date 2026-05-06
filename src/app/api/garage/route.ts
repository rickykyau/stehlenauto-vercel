import { NextResponse } from "next/server";
import { z } from "zod";
import { resetGarage, saveVehicle } from "@/lib/garage/server";
import { vehicleExists } from "@/lib/ymm/tree";

export const runtime = "nodejs";

const Body = z.object({
  year: z.string().min(4).max(4),
  make: z.string().min(1),
  model: z.string().min(1),
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
  const { year, make, model } = parsed.data;
  const ok = await vehicleExists(year, make, model);
  if (!ok) {
    return NextResponse.json(
      { error: `Unknown vehicle ${year} ${make} ${model}` },
      { status: 422 },
    );
  }
  const vehicle = await saveVehicle({ year, make, model });
  return NextResponse.json({ vehicle });
}

// Cycle 14R (owner): YMM modal RESET button needs a server-side endpoint to
// truly clear the saved vehicle (cookie + Neon row + sub-model answers) so
// the garage chip in the header doesn't survive the reset.
export async function DELETE() {
  await resetGarage();
  return NextResponse.json({ ok: true });
}
