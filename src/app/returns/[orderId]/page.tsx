import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { ReturnsFlow } from "@/components/returns/returns-flow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Start a Return",
  robots: { index: false, follow: false },
};

export default async function StartReturnPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  // Cycle 6 (Mike): the ad-hoc redirect("/sign-in") here dropped the
  // redirect_url, so post-sign-in dumped the user on /account instead of
  // back at the return form. Middleware now matches /returns(.*) and handles
  // the redirect with redirect_url preserved (#84). Keep the auth check as a
  // belt-and-suspenders guard but defer the redirect to Clerk's helper.
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
  const { orderId } = await params;

  return <ReturnsFlow orderId={orderId} />;
}
