"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshPhongMaterial,
  SRGBColorSpace,
  TextureLoader,
  TOUCH,
} from "three";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { countries } from "../../data/countries";
import { sitePath } from "../../data/site";
import type { CountryFeature } from "../../data/world-types";
import { CountryFlag } from "../country-flag";
import { CountryIndex } from "./hit-test";
import { displayName, featureId, type WorldRendererProps } from "./shared";


type Tip = { x: number; y: number; code: string; name: string; note: string };

const atlasCountryByCode = new Map(countries.map((country) => [country.code, country]));

/**
 * Auflösung des Renderers. Seit die Länder als Textur statt als tausende Meshes
 * gezeichnet werden, kostet ein zusätzliches Pixel kaum noch etwas — die frühere
 * Deckelung auf 1,25 ließ den Globus auf Telefonen mit dreifacher Pixeldichte
 * sichtbar weich wirken. 2,0 ist scharf und bleibt bezahlbar.
 */
function targetPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 2);
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
    return material;
  }, []);

  /**
   * Textur passend zur GPU laden: 8192 px, wo es geht, sonst 4096 px.
   * Anisotrope Filterung hält die Kanten auch dort scharf, wo die Kugel
   * flach zum Betrachter steht — ohne sie franst der Rand sichtbar aus.
   */
  const loadTexture = useCallback((renderer: { capabilities: { maxTextureSize: number; getMaxAnisotropy: () => number } }) => {
    const use8k = renderer.capabilities.maxTextureSize >= 8192;
    const file = use8k ? "/assets/globe-texture-8k.png" : "/assets/globe-texture.png";
    new TextureLoader().load(sitePath(file), (texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.minFilter = LinearMipmapLinearFilter;
      texture.magFilter = LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
      globeMaterial.emissiveMap = texture;
      globeMaterial.needsUpdate = true;
    });
  }, [globeMaterial]);

  /** Nur Auswahl und Zeigerposition bekommen echte Geometrie. */
  const highlighted = useMemo(() => {
    const ids = new Set([selectedId, hoveredId].filter(Boolean) as string[]);
    return world.features.filter((item) => ids.has(featureId(item)));
  }, [world, selectedId, hoveredId]);

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
      code: meta?.cca2 ?? "",
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

      /**
       * Kein Zoom über Rad oder Kneifen: das Rad wurde sonst abgefangen und die
       * Seite ließ sich über dem Globus nicht mehr scrollen. Gezoomt wird über
       * die Schaltflächen. Ein Finger gehört der Seite (touch-action: pan-y),
       * gedreht wird mit zwei Fingern oder mit der Maus.
       */
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_ROTATE };

      const renderer = globe.renderer();
      renderer.setPixelRatio(targetPixelRatio());
      renderer.domElement.style.touchAction = "pan-y";
      loadTexture(renderer);
    }
    syncAnimation();
    onReady();
  }, [loadTexture, onReady, reducedMotion, syncAnimation]);

  /**
   * Gleichwertige Bedienung ohne Zeigegerät: Drehen und Zoomen über echte
   * Schaltflächen. Das Canvas selbst ist für Screenreader nicht bedienbar —
   * die Textfassung daneben beschreibt, was es zeigt.
   */
  const moveCamera = useCallback((deltaLng: number, deltaLat: number, zoomFactor: number) => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    if (controls) controls.autoRotate = false;
    const view = globe.pointOfView();
    globe.pointOfView({
      lat: Math.max(-80, Math.min(80, view.lat + deltaLat)),
      lng: view.lng + deltaLng,
      altitude: Math.max(0.6, Math.min(3.2, view.altitude * zoomFactor)),
    }, 420);
    noteInteraction();
  }, [noteInteraction]);

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
      <div className="globe-scene" aria-hidden="true">
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
        onGlobeReady={handleReady}
      />
      </div>
      <div className="fallback-controls globe-controls" role="group" aria-label="Globus drehen und zoomen">
        <button type="button" aria-label="Welt nach Westen drehen" onClick={() => moveCamera(-35, 0, 1)}>←</button>
        <button type="button" aria-label="Welt nach Osten drehen" onClick={() => moveCamera(35, 0, 1)}>→</button>
        <span>3D / GLOBUS</span>
        <button type="button" aria-label="Herauszoomen" onClick={() => moveCamera(0, 0, 1.25)}>−</button>
        <button type="button" aria-label="Hineinzoomen" onClick={() => moveCamera(0, 0, 0.8)}>+</button>
      </div>
      {tip && (
        <div className="globe-tip globe-tip-floating" style={{ left: tip.x, top: tip.y }}>
          <span>{tip.code ? <CountryFlag code={tip.code} /> : "◌"}</span>
          <strong>{tip.name}</strong>
          <small>{tip.note}</small>
        </div>
      )}
    </div>
  );
}
