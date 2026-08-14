import type { Metadata } from "next";
import "./globals.css";
import "./v3.css";

export const metadata: Metadata = {
  title: "EU Scout — Έξυπνος οδηγός αγορών",
  description: "Smart Search και ξεχωριστός AI σύμβουλος αγορών με live προϊόντα, semantic intent και αυστηρά φίλτρα.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="el"><body>{children}</body></html>;
}
