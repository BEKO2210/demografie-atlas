import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { sitePath } from "../../data/site";
import type { CountryFeature, WorldCountryMeta, WorldData } from "../../data/world-types";

type WorldFile = {
  topology: Topology<{ countries: GeometryCollection<{ name?: string }> }>;
  meta: WorldCountryMeta[];
};

let pending: Promise<WorldData> | null = null;

/**
 * Lädt Topologie und Ländermetadaten als statisches Asset.
 * Die Datei wird bewusst per fetch geholt statt importiert: so muss der Browser
 * rund 240 kB Geometrie nicht als JavaScript-Quelltext parsen, und sie landet
 * in keinem Bundle der Startseite.
 */
export function loadWorldData(): Promise<WorldData> {
  if (!pending) {
    pending = fetch(sitePath("/data/world.json"))
      .then((response) => {
        if (!response.ok) throw new Error(`world.json: HTTP ${response.status}`);
        return response.json() as Promise<WorldFile>;
      })
      .then((file) => ({
        features: feature(file.topology, file.topology.objects.countries)
          .features as CountryFeature[],
        metaById: new Map(file.meta.map((entry) => [entry.id, entry])),
      }))
      .catch((error) => {
        pending = null;
        throw error;
      });
  }
  return pending;
}
