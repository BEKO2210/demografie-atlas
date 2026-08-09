"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MeshPhongMaterial, TextureLoader, SRGBColorSpace } from "three";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { countries } from "../../data/countries";
import { sitePath } from "../../data/site";
import { DEFAULT_COUNTRY } from "../../data/world-constants";
import type { CountryFeature } from "../../data/world-types";
import { CountryIndex } from "./hit-test";
import { displayName, featureId, type WorldRendererProps } from "./shared";

type GlobePoint = {
  lat: number;
  lng: number;
  code: string;
  name: string;
  flag: string;
  status: "live" | "next" | "planned";
};

type Tip = { x: number; y: number; flag: string; name: string; note: string };

const atlasCountryByCode = new Map(countries.map((country) => [country.code, country]));

/** Oversampling begrenzen: auf schmalen Geräten kostet jedes zusätzliche Pixel spürbar GPU-Zeit. */
function targetPixelRatio() {
  const dpr = window.devicePixelRatio || 1;
  const isCompact = window.matchMedia("(max-width: 760px)").matches;
  return Math.min(dpr, isCompact ? 1.25 : 1.5);
}

export default function WebGlGlobe({
  size,
  world,
  selectedId,
  hoveredId,
  reducedMotion,
  onHover,
  onSelect,
  onReady,
}: WorldRendererProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const hostRef = useRef<HTMLDivElement>(null);
  const isReady = useRef(false);
  /** Rendert der Globus gerade? Spiegelt pauseAnimation/resumeAnimation. */
  const isRunning = useRef(false);
  const isVisible = useRef(false);
  const interactionUntil = useRef(0);
  const idleTimer = useRef<number | null>(null);
  const pointerFrame = useRef<number | null>(null);
  const pointerAt = useRef<{ x: number; y: number } | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const index = useMemo(() => new CountryIndex(world), [world]);

  /**
   * Die Länderflächen liegen als Textur auf der Kugel — ein Zeichenaufruf statt
   * eines Meshes je Polygonring. Angehoben wird nur noch, was hervorgehoben ist.
   */
  const globeMaterial = useMemo(() => {
    // Die Textur trägt bereits die fertigen Farben. Sie hängt deshalb an
    // emissiveMap statt an map — sonst dunkelt die Szenenbeleuchtung sie ab und
    // die Kontinente verschwinden fast im Ozean. Der Phong-Glanz bleibt erhalten.
    const material = new MeshPhongMaterial({
      color: "#000000",
      emissive: "#ffffff",
      emissiveIntensity: 1,
      shininess: 22,
      transparent: true,
      opacity: 0.97,
    });
    new TextureLoader().load(sitePath("/assets/globe-texture.png"), (texture) => {
      texture.colorSpace = SRGBColorSpace;
      material.emissiveMap = texture;
      material.needsUpdate = true;
    });
    return material;
  }, []);

  /** Nur Auswahl und Zeigerposition bekommen echte Geometrie. */
  const highlighted = useMemo(() => {
    const ids = new Set([selectedId, hoveredId].filter(Boolean) as string[]);
    return world.features.filter((item) => ids.has(featureId(item)));
  }, [world, selectedId, hoveredId]);

  const atlasPoints = useMemo<GlobePoint[]>(() => countries.flatMap((atlasCountry) => {
    const match = [...world.metaById.values()].find((entry) => entry.cca2 === atlasCountry.code);
    if (!match) return [];
    return [{
      lat: match.latlng[0],
      lng: match.latlng[1],
      code: match.cca2,
      name: atlasCountry.name,
      flag: atlasCountry.flag,
      status: atlasCountry.status,
    }];
  }), [world]);

  const atlasArcs = useMemo(() => atlasPoints
    .filter((point) => point.code !== "DE")
    .map((point, index_) => ({
      startLat: DEFAULT_COUNTRY.latlng[0],
      startLng: DEFAULT_COUNTRY.latlng[1],
      endLat: point.lat,
      endLng: point.lng,
      color: index_ % 2 ? ["rgba(118,235,255,.8)", "rgba(154,120,255,.22)"] : ["rgba(154,120,255,.7)", "rgba(118,235,255,.2)"],
    })), [atlasPoints]);

  /**
   * Zentrale Steuerung der Renderschleife. Ohne sie läuft der WebGL-Renderer auch
   * dann weiter, wenn der Globus außerhalb des Viewports liegt oder der Tab verborgen ist.
   */
  const syncAnimation = useCallback(() => {
    const globe = globeRef.current;
    if (!globe || !isReady.current) return;
    const interacting = Date.now() < interactionUntil.current;
    const shouldRun = isVisible.current && !document.hidden && (!reducedMotion || interacting);
    if (shouldRun === isRunning.current) return;
    isRunning.current = shouldRun;
    if (shouldRun) globe.resumeAnimation();
    else globe.pauseAnimation();
  }, [reducedMotion]);

  /** Bei Reduced Motion nur während echter Bedienung rendern. */
  const noteInteraction = useCallback(() => {
    interactionUntil.current = Date.now() + 1200;
    syncAnimation();
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      idleTimer.current = null;
      syncAnimation();
    }, 1300);
  }, [syncAnimation]);

  /** Zeigerposition → Kugelkoordinate → Land. Höchstens einmal je Frame. */
  const resolvePointer = useCallback(() => {
    pointerFrame.current = null;
    const globe = globeRef.current;
    const host = hostRef.current;
    const at = pointerAt.current;
    if (!globe || !host || !at) return;

    const rect = host.getBoundingClientRect();
    const coords = globe.toGlobeCoords(at.x - rect.left, at.y - rect.top);
    const item = coords ? index.find(coords.lat, coords.lng) : null;

    onHover(item ? featureId(item) : null);
    const controls = globe.controls();
    if (controls) controls.autoRotate = !item && !reducedMotion;

    if (!item) {
      setTip(null);
      return;
    }
    const meta = index.meta(item);
    setTip({
      x: at.x - rect.left,
      y: at.y - rect.top,
      flag: meta?.flag ?? "◌",
      name: displayName(meta),
      note: meta && atlasCountryByCode.has(meta.cca2) ? "Atlas vorgemerkt" : "Land auswählen",
    });
  }, [index, onHover, reducedMotion]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible.current = entries.some((entry) => entry.isIntersecting);
        syncAnimation();
      },
      { rootMargin: "120px" },
    );
    observer.observe(host);

    const onVisibilityChange = () => syncAnimation();
    document.addEventListener("visibilitychange", onVisibilityChange);

    const passive = { passive: true } as const;
    const onPointerMove = (event: PointerEvent) => {
      pointerAt.current = { x: event.clientX, y: event.clientY };
      if (pointerFrame.current === null) {
        pointerFrame.current = requestAnimationFrame(resolvePointer);
      }
    };
    const onPointerLeave = () => {
      pointerAt.current = null;
      setTip(null);
      onHover(null);
      const controls = globeRef.current?.controls();
      if (controls) controls.autoRotate = !reducedMotion;
    };
    const onClick = (event: MouseEvent) => {
      const globe = globeRef.current;
      if (!globe) return;
      const rect = host.getBoundingClientRect();
      const coords = globe.toGlobeCoords(event.clientX - rect.left, event.clientY - rect.top);
      const item = coords ? index.find(coords.lat, coords.lng) : null;
      const meta = item ? index.meta(item) : undefined;
      if (meta) onSelect(meta);
    };

    host.addEventListener("pointerdown", noteInteraction, passive);
    host.addEventListener("wheel", noteInteraction, passive);
    host.addEventListener("touchstart", noteInteraction, passive);
    host.addEventListener("pointermove", onPointerMove, passive);
    host.addEventListener("pointerleave", onPointerLeave, passive);
    host.addEventListener("click", onClick);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      host.removeEventListener("pointerdown", noteInteraction);
      host.removeEventListener("wheel", noteInteraction);
      host.removeEventListener("touchstart", noteInteraction);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      host.removeEventListener("click", onClick);
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
    };
  }, [index, noteInteraction, onHover, onSelect, reducedMotion, resolvePointer, syncAnimation]);

  useEffect(() => () => {
    globeMaterial.emissiveMap?.dispose();
    globeMaterial.dispose();
    const globe = globeRef.current;
    if (!globe) return;
    globe.pauseAnimation();
    const renderer = globe.renderer();
    renderer.dispose();
    renderer.forceContextLoss?.();
  }, [globeMaterial]);

  const handleReady = useCallback(() => {
    isReady.current = true;
    isRunning.current = true;
    const globe = globeRef.current;
    if (globe) {
      globe.pointOfView({ lat: 26, lng: 8, altitude: 2.25 }, 0);
      const controls = globe.controls();
      controls.autoRotate = !reducedMotion;
      controls.autoRotateSpeed = 0.32;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 145;
      controls.maxDistance = 420;
      globe.renderer().setPixelRatio(targetPixelRatio());
    }
    syncAnimation();
    onReady();
  }, [onReady, reducedMotion, syncAnimation]);

  // Kameraflug, sobald ein Land gewählt wurde. Ohne Auswahl bleibt die Startpose.
  useEffect(() => {
    const meta = selectedId ? world.metaById.get(selectedId) : undefined;
    if (!meta) return;
    globeRef.current?.pointOfView({
      lat: meta.latlng[0],
      lng: meta.latlng[1],
      altitude: meta.area < 100_000 ? 1.45 : 1.7,
    }, 900);
  }, [selectedId, world]);

  return (
    <div ref={hostRef} className="globe-host">
      <Globe
        ref={globeRef}
        width={size}
        height={size}
        backgroundColor="rgba(0,0,0,0)"
        globeMaterial={globeMaterial}
        showAtmosphere
        atmosphereColor="#8d7cff"
        atmosphereAltitude={0.16}
        showGraticules
        polygonsData={highlighted}
        polygonAltitude={(item) => (featureId(item as CountryFeature) === selectedId ? 0.045 : 0.022)}
        polygonCapColor={(item) => (featureId(item as CountryFeature) === selectedId
          ? "rgba(120, 236, 255, .92)"
          : "rgba(174, 151, 255, .82)")}
        polygonSideColor={() => "rgba(31, 45, 75, .34)"}
        polygonStrokeColor={() => "rgba(150, 187, 255, .18)"}
        polygonsTransitionDuration={240}
        pointsData={atlasPoints}
        pointLat="lat"
        pointLng="lng"
        pointRadius={(item) => (item as GlobePoint).status === "live" ? 0.52 : 0.34}
        pointAltitude={(item) => (item as GlobePoint).status === "live" ? 0.12 : 0.065}
        pointColor={(item) => (item as GlobePoint).status === "live" ? "#63ffc2" : "#8d7cff"}
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
        onGlobeReady={handleReady}
      />
      {tip && (
        <div className="globe-tip globe-tip-floating" style={{ left: tip.x, top: tip.y }}>
          <span>{tip.flag}</span>
          <strong>{tip.name}</strong>
          <small>{tip.note}</small>
        </div>
      )}
    </div>
  );
}
