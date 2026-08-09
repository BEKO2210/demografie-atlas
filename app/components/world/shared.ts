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
  /**
   * Ziel für die Bedienleiste. Sie muss außerhalb der runden Globusmaske
   * hängen — dort schnitt `overflow: hidden` ihre Enden ab.
   */
  toolbar: HTMLElement | null;
};

/**
 * Einheitliche Kennung eines Gebiets.
 *
 * Die Topologie führt Länder mit führender Null ("012" für Algerien), die
 * Metadaten ohne ("12"). Ohne diese Angleichung schlug der Vergleich bei allen
 * 35 Gebieten mit Nummer unter 100 fehl — sie ließen sich auswählen, wurden auf
 * dem Globus aber nicht hervorgehoben.
 */
export function featureId(countryFeature: CountryFeature) {
  const raw = countryFeature.id ?? countryFeature.properties?.name ?? "unknown";
  const numeric = Number(raw);
  return Number.isFinite(numeric) && String(raw).trim() !== "" ? String(numeric) : String(raw);
}

export function metaForFeature(world: WorldData, countryFeature: CountryFeature) {
  return world.metaById.get(String(Number(countryFeature.id)));
}

export function displayName(meta?: WorldCountryMeta) {
  return meta?.name ?? "Unbekanntes Gebiet";
}
