import { geoBounds, geoContains } from "d3-geo";
import type { CountryFeature, WorldData } from "../../data/world-types";

type Entry = {
  item: CountryFeature;
  west: number;
  east: number;
  south: number;
  north: number;
  /** Gebiet überschreitet die Datumsgrenze — dann ist west > east. */
  wraps: boolean;
};

/**
 * Findet zu einer Kugelposition das Land darunter.
 *
 * Nötig, weil die Länder nicht mehr als einzelne Meshes auf dem Globus liegen
 * (das kostete über 8000 Zeichenaufrufe je Bild), sondern als Textur. Die
 * Auswahl läuft deshalb geometrisch: erst grob über Bounding-Boxen, dann exakt.
 */
export class CountryIndex {
  private readonly entries: Entry[];

  constructor(private readonly world: WorldData) {
    this.entries = world.features.map((item) => {
      const [[west, south], [east, north]] = geoBounds(item);
      return { item, west, east, south, north, wraps: west > east };
    });
  }

  find(lat: number, lng: number) {
    for (const entry of this.entries) {
      if (lat < entry.south || lat > entry.north) continue;
      const insideLng = entry.wraps
        ? lng >= entry.west || lng <= entry.east
        : lng >= entry.west && lng <= entry.east;
      if (!insideLng) continue;
      if (geoContains(entry.item, [lng, lat])) return entry.item;
    }
    return null;
  }

  meta(item: CountryFeature) {
    return this.world.metaById.get(String(Number(item.id)));
  }
}
