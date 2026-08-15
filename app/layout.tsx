import type { Metadata, Viewport } from "next";
import { ProductImageProxy } from "@/components/product-image-proxy";
import { AnalyticsProvider } from "@/components/analytics-provider";
import "./globals.css";
import "./v3.css";

export const metadata: Metadata = {
  title: {
    default: "EU Scout — Έξυπνος οδηγός αγορών",
    template: "%s · EU Scout",
  },
  description: "Βρες γρήγορα σχετικές επιλογές προϊόντων με semantic Smart Search, αυστηρό budget και ξεχωριστό AI σύμβουλο αγορών.",
  applicationName: "EU Scout",
  category: "shopping",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "#f5f1e7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="el">
      <body>
        <ProductImageProxy />
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
