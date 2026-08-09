import type { Metadata } from "next";
import { CountryPreviewPage, previewMetadata } from "../components/country-preview-page";

export const metadata: Metadata = previewMetadata("japan");

export default function Page() {
  return <CountryPreviewPage slug="japan" />;
}
