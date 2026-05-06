import { NextResponse } from "next/server";
import { getMakes, getModels, getYears } from "@/lib/ymm/tree";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const year = url.searchParams.get("year");
  const make = url.searchParams.get("make");

  if (!year) {
    return NextResponse.json({ years: await getYears() });
  }
  if (!make) {
    return NextResponse.json({ makes: await getMakes(year) });
  }
  return NextResponse.json({ models: await getModels(year, make) });
}
