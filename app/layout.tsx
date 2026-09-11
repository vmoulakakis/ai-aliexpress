import type { Metadata } from "next";
import "./globals.css";
import "./photo-design.css";
import SolutionFirstRecovery from "./SolutionFirstRecovery";

export const metadata: Metadata = {
  title: "Λύσεις ΕΕ — AI sourcing από αποθήκες Ευρώπης",
  description: "Έξυπνη αναζήτηση λύσεων και ευκαιριών από αξιόπιστους εμπόρους με αποθήκες στην ΕΕ."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="el">
      <body>{children}<SolutionFirstRecovery /></body>
    </html>
  );
}
