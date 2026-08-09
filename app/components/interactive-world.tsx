"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Feature, Geometry } from "geojson";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { MeshPhongMaterial } from "three";
import type { GlobeMethods } from "react-globe.gl";
import worldTopologyJson from "world-atlas/countries-50m.json";
import worldCountries, { type Country as WorldCountry } from "world-countries";
import { countries } from "../data/countries";
import { sitePath } from "../data/site";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => <div className="globe-loading"><i /><span>Weltmodell wird geladen</span></div>,
});

type AtlasProperties = { name?: string };
type CountryFeature = Feature<Geometry, AtlasProperties>;

const worldTopology = worldTopologyJson as unknown as Topology<{
  countries: GeometryCollection<AtlasProperties>;
}>;

const countryFeatures = feature<AtlasProperties>(
  worldTopology,
  worldTopology.objects.countries,
).features as CountryFeature[];

const worldCountryById = new Map(
  worldCountries
    .filter((country) => country.ccn3)
    .map((country) => [String(Number(country.ccn3)), country]),
);

const atlasCountryByCode = new Map(countries.map((country) => [country.code, country]));

function countryForFeature(countryFeature: CountryFeature) {
  return worldCountryById.get(String(Number(countryFeature.id)));
}

function germanName(country?: WorldCountry) {
  return country?.translations.deu?.common ?? country?.name.common ?? "Unbekanntes Gebiet";
}

function featureId(countryFeature: CountryFeature) {
  return String(countryFeature.id ?? countryFeature.properties?.name ?? "unknown");
}

const germany = worldCountries.find((country) => country.cca2 === "DE")!;

type GlobePoint = {
  lat: number;
  lng: number;
  code: string;
  name: string;
  flag: string;
  status: "live" | "next" | "planned";
};

function SvgWorldFallback({
  size,
  selected,
  selectedFeatureId,
  hoveredFeatureId,
  onHover,
  onSelect,
}: {
  size: number;
  selected: WorldCountry;
  selectedFeatureId: string;
  hoveredFeatureId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (country: WorldCountry) => void;
}) {
  const [rotation, setRotation] = useState<[number, number]>([-germany.latlng[1], -germany.latlng[0]]);
  const drag = useRef<{ x: number; y: number; rotation: [number, number]; moved: boolean } | null>(null);
  const didDrag = useRef(false);

  const projection = useMemo(() => geoOrthographic()
    .translate([size / 2, size / 2])
    .scale(size * 0.405)
    .clipAngle(90)
    .precision(0.35)
    .rotate([rotation[0], rotation[1], 0]), [rotation, size]);

  const path = useMemo(() => geoPath(projection), [projection]);
  const spherePath = path({ type: "Sphere" }) ?? undefined;
  const gridPath = path(geoGraticule10()) ?? undefined;
  const selectedPoint = projection([selected.latlng[1], selected.latlng[0]]);

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
    setRotation([
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
        {countryFeatures.map((countryFeature) => {
          const d = path(countryFeature);
          if (!d) return null;
          const id = featureId(countryFeature);
          const country = countryForFeature(countryFeature);
          const isSelected = id === selectedFeatureId;
          const isHovered = id === hoveredFeatureId;
          return (
            <path
              key={id}
              d={d}
              className={`fallback-country${isSelected ? " selected" : ""}${isHovered ? " hovered" : ""}`}
              onPointerEnter={() => onHover(id)}
              onPointerLeave={() => onHover(null)}
              onClick={(event) => {
                event.stopPropagation();
                if (didDrag.current) return;
                if (country) {
                  setRotation([-country.latlng[1], -country.latlng[0]]);
                  onSelect(country);
                }
              }}
            >
              <title>{country?.flag ?? ""} {germanName(country)}</title>
            </path>
          );
        })}
        {selectedPoint && (
          <g className="fallback-focus-marker" aria-hidden="true">
            <circle cx={selectedPoint[0]} cy={selectedPoint[1]} r={11} />
            <circle cx={selectedPoint[0]} cy={selectedPoint[1]} r={3.5} />
          </g>
        )}
      </svg>
      <div className="fallback-controls" aria-label="Weltkarte drehen">
        <button type="button" aria-label="Welt nach Westen drehen" onClick={() => setRotation(([lng, lat]) => [lng - 35, lat])}>←</button>
        <span>SVG / 3D Fallback</span>
        <button type="button" aria-label="Welt nach Osten drehen" onClick={() => setRotation(([lng, lat]) => [lng + 35, lat])}>→</button>
      </div>
    </div>
  );
}

export function InteractiveWorld() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 620, height: 620 });
  const [selected, setSelected] = useState<WorldCountry>(germany);
  const [selectedFeatureId, setSelectedFeatureId] = useState("276");
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [webGlAvailable, setWebGlAvailable] = useState<boolean | null>(null);

  const globeMaterial = useMemo(
    () => new MeshPhongMaterial({
      color: "#07101f",
      emissive: "#030815",
      emissiveIntensity: 0.72,
      shininess: 22,
      transparent: true,
      opacity: 0.97,
    }),
    [],
  );

  const atlasPoints = useMemo<GlobePoint[]>(() => countries.flatMap((atlasCountry) => {
    const match = worldCountries.find((country) => country.cca2 === atlasCountry.code);
    if (!match) return [];
    return [{
      lat: match.latlng[0],
      lng: match.latlng[1],
      code: match.cca2,
      name: atlasCountry.name,
      flag: atlasCountry.flag,
      status: atlasCountry.status,
    }];
  }), []);

  const atlasArcs = useMemo(() => atlasPoints
    .filter((point) => point.code !== "DE")
    .map((point, index) => ({
      startLat: germany.latlng[0],
      startLng: germany.latlng[1],
      endLat: point.lat,
      endLng: point.lng,
      color: index % 2 ? ["rgba(118,235,255,.8)", "rgba(154,120,255,.22)"] : ["rgba(154,120,255,.7)", "rgba(118,235,255,.2)"],
    })), [atlasPoints]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      const next = Math.max(320, Math.min(rect.width, 720));
      setSize({ width: next, height: next });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    } catch {
      context = null;
    }
    const available = Boolean(context);
    const frame = requestAnimationFrame(() => {
      setWebGlAvailable(available);
      if (!available) setReady(true);
    });
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => () => globeMaterial.dispose(), [globeMaterial]);

  const focusCountry = useCallback((country: WorldCountry, transition = 900) => {
    setSelected(country);
    setSelectedFeatureId(String(Number(country.ccn3)));
    globeRef.current?.pointOfView({
      lat: country.latlng[0],
      lng: country.latlng[1],
      altitude: country.area < 100_000 ? 1.45 : 1.7,
    }, transition);
  }, []);

  const onReady = useCallback(() => {
    setReady(true);
    const globe = globeRef.current;
    if (!globe) return;
    globe.pointOfView({ lat: 26, lng: 8, altitude: 2.25 }, 0);
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.32;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 145;
    controls.maxDistance = 420;
    globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  }, []);

  const selectedAtlasCountry = atlasCountryByCode.get(selected.cca2);
  const selectedStatus = selectedAtlasCountry?.status ?? "planned";
  const selectedName = selectedAtlasCountry?.name ?? germanName(selected);

  return (
    <div className="interactive-world" ref={stageRef}>
      <div className={`globe-canvas${ready ? " is-ready" : ""}`}>
        {webGlAvailable === null && <div className="globe-loading"><i /><span>Weltmodell wird geladen</span></div>}
        {webGlAvailable === false && (
          <SvgWorldFallback
            size={size.width}
            selected={selected}
            selectedFeatureId={selectedFeatureId}
            hoveredFeatureId={hoveredFeatureId}
            onHover={setHoveredFeatureId}
            onSelect={focusCountry}
          />
        )}
        {webGlAvailable === true && <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={globeMaterial}
          showAtmosphere
          atmosphereColor="#8d7cff"
          atmosphereAltitude={0.16}
          showGraticules
          polygonsData={countryFeatures}
          polygonAltitude={(item) => {
            const id = featureId(item as CountryFeature);
            if (id === selectedFeatureId) return 0.045;
            if (id === hoveredFeatureId) return 0.022;
            return 0.008;
          }}
          polygonCapColor={(item) => {
            const countryFeature = item as CountryFeature;
            const id = featureId(countryFeature);
            const country = countryForFeature(countryFeature);
            if (id === selectedFeatureId) return "rgba(120, 236, 255, .92)";
            if (id === hoveredFeatureId) return "rgba(174, 151, 255, .82)";
            if (country?.cca2 === "DE") return "rgba(94, 255, 194, .72)";
            if (country && atlasCountryByCode.has(country.cca2)) return "rgba(116, 157, 255, .42)";
            return "rgba(74, 91, 130, .28)";
          }}
          polygonSideColor={() => "rgba(31, 45, 75, .34)"}
          polygonStrokeColor={() => "rgba(150, 187, 255, .18)"}
          polygonsTransitionDuration={240}
          polygonLabel={(item) => {
            const country = countryForFeature(item as CountryFeature);
            const name = germanName(country);
            const flag = country?.flag ?? "◌";
            const status = country && atlasCountryByCode.has(country.cca2) ? "Atlas vorgemerkt" : "Land auswählen";
            return `<div class="globe-tip"><span>${flag}</span><strong>${name}</strong><small>${status}</small></div>`;
          }}
          onPolygonHover={(item) => {
            const countryFeature = item as CountryFeature | null;
            setHoveredFeatureId(countryFeature ? featureId(countryFeature) : null);
            const controls = globeRef.current?.controls();
            if (controls) controls.autoRotate = !countryFeature;
          }}
          onPolygonClick={(item) => {
            const country = countryForFeature(item as CountryFeature);
            if (country) focusCountry(country);
          }}
          pointsData={atlasPoints}
          pointLat="lat"
          pointLng="lng"
          pointRadius={(item) => (item as GlobePoint).status === "live" ? 0.52 : 0.34}
          pointAltitude={(item) => (item as GlobePoint).status === "live" ? 0.12 : 0.065}
          pointColor={(item) => (item as GlobePoint).status === "live" ? "#63ffc2" : "#8d7cff"}
          pointLabel={(item) => {
            const point = item as GlobePoint;
            return `<div class="globe-tip"><span>${point.flag}</span><strong>${point.name}</strong><small>${point.status === "live" ? "Atlas live" : "In Vorbereitung"}</small></div>`;
          }}
          onPointClick={(item) => {
            const point = item as GlobePoint;
            const country = worldCountries.find((candidate) => candidate.cca2 === point.code);
            if (country) focusCountry(country);
          }}
          arcsData={atlasArcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcAltitudeAutoScale={0.26}
          arcStroke={0.32}
          arcDashLength={0.32}
          arcDashGap={0.82}
          arcDashAnimateTime={5200}
          onGlobeReady={onReady}
        />}
      </div>

      <div className="globe-interface" aria-live="polite">
        <div className="globe-selection-top">
          <span className="globe-selected-flag" role="img" aria-label={`Flagge ${selectedName}`}>{selected.flag}</span>
          <span className={`country-status status-${selectedStatus}`}><i /> {selectedStatus === "live" ? "Live" : selectedStatus === "next" ? "Als Nächstes" : "Auswählbar"}</span>
        </div>
        <span className="globe-selection-code">{selected.cca2} / {selected.region}</span>
        <strong>{selectedName}</strong>
        <small>{selected.capital[0] ? `Hauptstadt · ${selected.capital[0]}` : "Interaktives Länderprofil"}</small>
        {selectedStatus === "live" ? (
          <a href={sitePath(`/${selectedAtlasCountry?.slug}`)}>Atlas öffnen <span>↗</span></a>
        ) : (
          <span className="globe-planned-label">Datenstory in Vorbereitung</span>
        )}
      </div>

      <div className="globe-instructions"><i /> Ziehen zum Drehen <b>·</b> Scrollen zum Zoomen <b>·</b> Land anklicken</div>
      <div className="globe-count"><strong>{countryFeatures.length}</strong><span>Gebiete<br />interaktiv</span></div>
    </div>
  );
}
