import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BlurOnNav } from "@/components/layout/blur-on-nav";
import { YmmModal } from "@/components/fitment/ymm-modal";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ChatAssistant } from "@/components/chat/chat-assistant";
import { AnalyticsScripts } from "@/components/analytics/scripts";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { IdentifyUser } from "@/components/analytics/identify-user";
import { getCurrentVehicle, getSubModelAnswers } from "@/lib/garage/server";
import { getCart } from "@/lib/cart/server";
import { jsonLdString, organizationJsonLd } from "@/lib/seo/jsonld";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Cycle 14AK PR1 (Diana visual audit): Geist Mono retired from display +
// prose duty. It was carrying display headlines, eyebrows, PDP body, spec
// tables, tabs, and buttons — that "robotic / DOS prompt" feel was the
// visual root of the owner's "font looks robotic" complaint. Archivo
// keeps the engineered/industrial bones but with humanist proportions —
// fits Stehlen's lowercase-tag voice ("morning.") without the terminal
// connotation. JetBrains Mono stays the dedicated mono for SKUs / prices
// / spec tables only.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com",
  ),
  title: {
    default: "Stehlen Auto — Heavy-Duty Vehicle Accessories",
    template: "%s | Stehlen Auto",
  },
  description:
    "Heavy-duty truck, SUV, and Jeep accessories engineered from cold-rolled steel. No drilling required. Fitment guaranteed for your vehicle.",
  keywords: [
    "truck accessories",
    "tonneau cover",
    "running boards",
    "bull bar",
    "grille guard",
    "headlights",
    "trailer hitch",
    "bed mat",
  ],
  // Cycle 14X+ (Priya F-6 follow-up): default og:image + twitter:image at
  // the layout root so any future route that doesn't define its own gets
  // a real social card — no more "added a route, forgot the OG image"
  // regressions. Per-route metadata.openGraph.images overrides this.
  openGraph: {
    type: "website",
    siteName: "Stehlen Auto",
    title: "Stehlen Auto — Heavy-Duty Vehicle Accessories",
    description:
      "Heavy-duty truck, SUV, and Jeep accessories. Fitment guaranteed.",
    images: [
      {
        url: "/images/hero-stehlen.jpg",
        width: 1280,
        height: 640,
        alt: "Stehlen Auto — Heavy-Duty Vehicle Accessories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stehlen Auto — Heavy-Duty Vehicle Accessories",
    description: "Fitment guaranteed for your vehicle.",
    images: ["/images/hero-stehlen.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  // Cycle 14Z (Priya O-1 CRITICAL): the previous "Self-canonical fallback"
  // was poisoning every page that didn't explicitly override — /about,
  // /help, /collections, /welcome-back all canonicalized to "/", telling
  // Google those pages were duplicates of home. Removed entirely; per-route
  // metadata.alternates.canonical is now mandatory for every indexable
  // route. Pages that don't set one will emit no canonical at all (Google
  // self-canonicalizes from the URL), which is the correct fallback.
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [vehicle, cart, user] = await Promise.all([
    getCurrentVehicle(),
    getCart(),
    // Cycle 14AP-fix16 (owner): pass auth state to Header so the
    // signed-in state is VISIBLE. Owner had no idea they were signed
    // in — the header showed no sign-in/sign-out cue at all, only a
    // GARAGE icon. The signed-in vs guest distinction matters for
    // YMM persistence (DB vs cookie) and customer needs to know which.
    currentUser().catch(() => null),
  ]);
  const signedInLabel = user
    ? user.primaryEmailAddress?.emailAddress ??
      user.username ??
      user.firstName ??
      "ACCOUNT"
    : null;
  // Cycle 14X+ post-sync (Mike-O14 follow-up): pass sub-model answers
  // into the drawer so per-line fitment matches the PDP gate.
  const subModelAnswers = vehicle
    ? await getSubModelAnswers(vehicle.id ?? "")
    : [];

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${archivo.variable} ${jetbrainsMono.variable} h-full`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          {/* Server-built Organization JSON-LD; `<` escaped to neutralize script-breakout. */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLdString(organizationJsonLd(SITE_URL)),
            }}
          />
          <Header
            vehicle={vehicle ?? undefined}
            cartCount={cart?.totalQuantity ?? 0}
            signedInLabel={signedInLabel}
          />
          <div className="flex-1">{children}</div>
          <Footer />
          <YmmModal />
          <CartDrawer
            initialCart={cart}
            vehicle={vehicle ?? undefined}
            subModelAnswers={subModelAnswers}
          />
          <ChatAssistant />
          <AnalyticsScripts />
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          <IdentifyUser />
          <Suspense fallback={null}>
            <BlurOnNav />
          </Suspense>
          <VercelAnalytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
