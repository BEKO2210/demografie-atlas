import type { Feature, Geometry } from "geojson";

/** Kompakte Ländermetadaten aus public/data/world.json. */
export type WorldCountryMeta = {
  id: string;
  cca2: string;
  name: string;
  flag: string;
  capital: string;
  region: string;
  latlng: number[];
  area: number;
};

export type CountryFeature = Feature<Geometry, { name?: string }>;

/** Geladene Weltdaten: Polygone plus Metadaten je Gebiet. */
export type WorldData = {
  features: CountryFeature[];
  metaById: Map<string, WorldCountryMeta>;
};
