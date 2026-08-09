"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { DEFAULT_COUNTRY } from "../../data/world-constants";
import { displayName, featureId, metaForFeature, type WorldRendererProps } from "./shared";

export default function SvgGlobe({
  size,
  world,
  selectedId,
  onSelect,
  onReady,
}: WorldRendererProps) {
  const [rotation, setRotation] = useState<[number, number]>(
    [-DEFAULT_COUNTRY.latlng[1], -DEFAULT_COUNTRY.latlng[0]],
  );
  const drag = useRef<{ x: number; y: number; rotation: [number, number]; moved: boolean } | null>(null);
  const didDrag = useRef(false);
  /** Nächste Rotation aus dem Ziehen; wird höchstens einmal je Frame übernommen. */
  const pendingRotation = useRef<[number, number] | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    onReady();
  }, [onReady]);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  const projection = useMemo(() => geoOrthographic()
    .translate([size / 2, size / 2])
    .scale(size * 0.405)
    .clipAngle(90)
    .precision(0.35)
    .rotate([rotation[0], rotation[1], 0]), [rotation, size]);

  const path = useMemo(() => geoPath(projection), [projection]);

  /**
   * Nur von Rotation und Größe abhängig — eine Auswahl ändert die Geometrie nicht
   * und löst daher keine Neuberechnung aller Pfade aus.
   */
  const shapes = useMemo(() => world.features.flatMap((countryFeature) => {
    const d = path(countryFeature);
    if (!d) return [];
    const meta = metaForFeature(world, countryFeature);
    return [{
      id: featureId(countryFeature),
      d,
      title: displayName(meta),
      meta,
    }];
  }), [path, world]);

  const spherePath = path({ type: "Sphere" }) ?? undefined;
  const gridPath = path(geoGraticule10()) ?? undefined;
  const selectedMeta = world.metaById.get(selectedId);
  const selectedPoint = selectedMeta
    ? projection([selectedMeta.latlng[1], selectedMeta.latlng[0]])
    : null;

  const applyRotation = useCallback((next: [number, number]) => {
    pendingRotation.current = next;
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (pendingRotation.current) setRotation(pendingRotation.current);
    });
  }, []);

  const startDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    drag.current = { x: event.clientX, y: event.clientY, rotation, moved: false };
    didDrag.current = false;
  };

  const moveDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (!drag.current.moved && Math.hypot(dx, dy) > 4) {
      drag.current.moved = true;
      didDrag.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!drag.current.moved) return;
    applyRotation([
      drag.current.rotation[0] + dx * 0.32,
      Math.max(-80, Math.min(80, drag.current.rotation[1] - dy * 0.25)),
    ]);
  };

  return (
    <div className="svg-world-fallback">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Interaktive Weltkarte"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <defs>
          <radialGradient id="fallbackOcean" cx="34%" cy="26%">
            <stop offset="0" stopColor="#173b68" />
            <stop offset=".58" stopColor="#091b34" />
            <stop offset="1" stopColor="#020817" />
          </radialGradient>
          <filter id="fallbackGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={spherePath} className="fallback-ocean" />
        <path d={gridPath} className="fallback-grid" />
        {shapes.map((shape) => (
          <path
            key={shape.id}
            d={shape.d}
            className={`fallback-country${shape.id === selectedId ? " selected" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              if (didDrag.current) return;
              if (shape.meta) {
                applyRotation([-shape.meta.latlng[1], -shape.meta.latlng[0]]);
                onSelect(shape.meta);
              }
            }}
          >
            <title>{shape.title}</title>
          </path>
        ))}
        {selectedPoint && (
          <g className="fallback-focus-marker" aria-hidden="true">
            <circle cx={selectedPoint[0]} cy={selectedPoint[1]} r={11} />
            <circle cx={selectedPoint[0]} cy={selectedPoint[1]} r={3.5} />
          </g>
        )}
      </svg>
      <div className="fallback-controls" role="group" aria-label="Weltkarte drehen">
        <button type="button" aria-label="Welt nach Westen drehen" onClick={() => applyRotation([rotation[0] - 35, rotation[1]])}>←</button>
        <span>SVG / 3D Fallback</span>
        <button type="button" aria-label="Welt nach Osten drehen" onClick={() => applyRotation([rotation[0] + 35, rotation[1]])}>→</button>
      </div>
    </div>
  );
}
