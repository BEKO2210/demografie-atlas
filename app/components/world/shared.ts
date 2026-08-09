import type { CountryFeature, WorldCountryMeta, WorldData } from "../../data/world-types";

export type WorldRendererProps = {
  size: number;
  world: WorldData;
  selectedId: string;
  hoveredId: string | null;
  reducedMotion: boolean;
  onHover: (id: string | null) => void;
  onSelect: (meta: WorldCountryMeta) => void;
  onReady: () => void;
};

export function featureId(countryFeature: CountryFeature) {
  return String(countryFeature.id ?? countryFeature.properties?.name ?? "unknown");
}

export function metaForFeature(world: WorldData, countryFeature: CountryFeature) {
  return world.metaById.get(String(Number(countryFeature.id)));
}

export function displayName(meta?: WorldCountryMeta) {
  return meta?.name ?? "Unbekanntes Gebiet";
}
