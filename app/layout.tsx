import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Λύσεις ΕΕ — AI sourcing από αποθήκες Ευρώπης",
  description: "Έξυπνη αναζήτηση λύσεων και ευκαιριών από αξιόπιστους εμπόρους με αποθήκες στην ΕΕ."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  );
}
