import type { Metadata } from "next";
import { pageMetadata } from "../data/seo";

export const metadata: Metadata = pageMetadata({
  title: "Deutschland 2070 — Bevölkerungspyramide im Demografie Atlas",
  description:
    "Interaktive Datenstory zu Deutschlands Altersstruktur von 2025 bis 2070: Bevölkerungspyramide, Projektionskorridor und Kinderzahl-Rechner zum Ausprobieren.",
  path: "/deutschland/",
});

export default function DeutschlandLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
