import type { Metadata } from "next";
import { Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
  openGraph: {
    type: "website",
    siteName: "Stehlen Auto",
    title: "Stehlen Auto — Heavy-Duty Vehicle Accessories",
    description:
      "Heavy-duty truck, SUV, and Jeep accessories. Fitment guaranteed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stehlen Auto — Heavy-Duty Vehicle Accessories",
    description: "Fitment guaranteed for your vehicle.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
