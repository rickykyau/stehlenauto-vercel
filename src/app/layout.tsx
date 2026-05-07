import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
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

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  const [vehicle, cart] = await Promise.all([getCurrentVehicle(), getCart()]);
  // Cycle 14X+ post-sync (Mike-O14 follow-up): pass sub-model answers
  // into the drawer so per-line fitment matches the PDP gate.
  const subModelAnswers = vehicle
    ? await getSubModelAnswers(vehicle.id ?? "")
    : [];

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${geistMono.variable} ${jetbrainsMono.variable} h-full`}
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
