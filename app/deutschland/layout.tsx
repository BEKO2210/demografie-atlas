import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deutschland 2070 — Demografie Atlas",
  description: "Eine interaktive, datenbasierte Reise durch Deutschlands Altersstruktur von 2025 bis 2070.",
};

export default function DeutschlandLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
