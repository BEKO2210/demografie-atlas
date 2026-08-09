import type { Metadata } from "next";
import { CountryPreviewPage, previewMetadata } from "../components/country-preview-page";

export const metadata: Metadata = previewMetadata("usa");

export default function Page() {
  return <CountryPreviewPage slug="usa" />;
}
