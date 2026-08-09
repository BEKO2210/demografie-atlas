import type { Metadata } from "next";
import { CountryPreviewPage, previewMetadata } from "../components/country-preview-page";

export const metadata: Metadata = previewMetadata("frankreich");

export default function Page() {
  return <CountryPreviewPage slug="frankreich" />;
}
