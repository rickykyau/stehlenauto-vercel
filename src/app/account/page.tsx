import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { db, dbConfigured } from "@/lib/db/client";
import { vehicles } from "@/lib/db/schema";
import { listOrdersForEmail } from "@/lib/orders/server";
import type { GarageVehicle } from "@/components/account/account-dashboard";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const [garageRows, orders] = await Promise.all([
    dbConfigured
      ? db().select().from(vehicles).where(eq(vehicles.userId, userId))
      : Promise.resolve([]),
    listOrdersForEmail(email),
  ]);
  const garage: GarageVehicle[] = garageRows.map((v) => ({
    id: v.id,
    year: v.year,
    make: v.make,
    model: v.model,
    isPrimary: v.isPrimary,
  }));
  const { tab } = await searchParams;

  return (
    <AccountDashboard
      firstName={user?.firstName ?? null}
      email={email}
      memberSince={user?.createdAt ? new Date(user.createdAt).getFullYear() : null}
      garage={garage}
      orders={orders}
      initialTab={tab ?? "overview"}
    />
  );
}
