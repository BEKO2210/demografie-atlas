import type { Metadata } from "next";
import { CountryPreviewPage, previewMetadata } from "../components/country-preview-page";

export const metadata: Metadata = previewMetadata("italien");

export default function Page() {
  return <CountryPreviewPage slug="italien" />;
}
