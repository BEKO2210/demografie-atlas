import { sitePath } from "../data/site";

export type AtlasName = "population" | "development" | "generations" | "story-method";

/**
 * Ein Ausschnitt (Quadrant) eines 2×2-Bildatlas.
 *
 * Früher als CSS-Hintergrundbild gelöst; dadurch war weder `loading="lazy"` noch
 * `decoding="async"` möglich und alle vier Atlanten wurden früh geladen. Jetzt ein
 * echtes `<img>` im selben, per CSS ausgeschnittenen Rahmen — die Darstellung ist
 * identisch (`--art-size` entspricht dem alten `background-size`).
 */
export function AtlasArt({
  atlas,
  quadrant,
  className = "",
}: {
  atlas: AtlasName;
  quadrant: number;
  className?: string;
}) {
  const index = quadrant % 4;
  const offset = "calc(100% - var(--art-size))";
  return (
    <div className={`atlas-art ${className}`} aria-hidden="true">
      {/* Das span trägt weiterhin den Hover-Zoom, damit er sich exakt wie
          der frühere Hintergrund-Zoom um die Mitte des Ausschnitts bewegt. */}
      <span>
        <picture>
          <source type="image/avif" srcSet={sitePath(`/assets/${atlas}-atlas.avif`)} />
          {/* next/image bringt beim statischen Export mit unoptimized:true keinen
              Vorteil, würde aber Laufzeit-Code hinzufügen. */}
          <img
            src={sitePath(`/assets/${atlas}-atlas.webp`)}
            alt=""
            width={1000}
            height={1000}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            style={{
              left: index % 2 === 1 ? offset : 0,
              top: index >= 2 ? offset : 0,
            }}
          />
        </picture>
      </span>
    </div>
  );
}
