import type { Metadata, Viewport } from "next";
import { ProductImageProxy } from "@/components/product-image-proxy";
import { V4ActivityToast } from "@/components/v4-activity-toast";
import "./aigora.css";

export const metadata: Metadata = {
  title: { default: "AIgora — AI που διαβάζει την αγορά πριν αγοράσεις", template: "%s · AIgora" },
  description: "AI demand intelligence και semantic shopping για πραγματικές ανάγκες, premium λύσεις 100€+ και verified προϊόντα από αποθήκες ΕΕ.",
  applicationName: "AIgora", category: "shopping", robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", colorScheme: "light", themeColor: "#ffffff" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="el"><body><ProductImageProxy />{children}<V4ActivityToast /></body></html>; }
