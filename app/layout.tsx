import type { Metadata, Viewport } from "next";
import { ProductImageProxy } from "@/components/product-image-proxy";
import "./globals.css";
import "./v4.css";
import "./v4-stage2.css";
import "./v4-stage4.css";
import "./v4-overrides.css";

export const metadata: Metadata = {
  title: { default: "ΒρεςΜου — AI αγορές με νόημα", template: "%s · ΒρεςΜου" },
  description: "AI demand intelligence και semantic shopping για πραγματικές ανάγκες, premium λύσεις και προϊόντα με επαληθευμένο EU warehouse proof.",
  applicationName: "ΒρεςΜου", category: "shopping", robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", colorScheme: "light", themeColor: "#ffffff" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="el"><body><ProductImageProxy />{children}</body></html>; }
