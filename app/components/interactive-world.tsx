"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { countries } from "../data/countries";
import { sitePath } from "../data/site";
import { CountryFlag } from "./country-flag";
import { WORLD_TERRITORY_COUNT } from "../data/world-constants";
import type { WorldCountryMeta, WorldData } from "../data/world-types";
import type { WorldRendererProps } from "./world/shared";
import { useWorldSelection } from "./world/selection-context";
import { usePrefersReducedMotion } from "./use-reduced-motion";

const atlasCountryByCode = new Map(countries.map((country) => [country.code, country]));

type Renderer = ComponentType<WorldRendererProps>;

function hasWebGl() {
  const canvas = document.createElement("canvas");
  let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  try {
    context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
  } catch {
    context = null;
  }
  const available = Boolean(context);
  context?.getExtension("WEBGL_lose_context")?.loseContext();
  return available;
}

/** requestIdleCallback ist nicht überall verfügbar; das Timeout begrenzt die Wartezeit. */
function whenIdle(callback: () => void, timeout: number) {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, Math.min(timeout, 400));
  return () => window.clearTimeout(handle);
}

/**
 * Rahmen der Weltkarte: rendert sofort statisches Markup und lädt die schwere
 * Darstellung erst, wenn der Globus sichtbar ist oder bedient wird. Three.js und
 * die Weltgeometrie stecken ausschließlich in den nachgeladenen Modulen.
 */
export function InteractiveWorld() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(620);
  const [toolbar, setToolbar] = useState<HTMLDivElement | null>(null);
  // Kein Land vorausgewählt: die Statuskarte erscheint erst nach einem Klick.
  const [selected, setSelected] = useState<WorldCountryMeta | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [world, setWorld] = useState<WorldData | null>(null);
  const [Renderer, setRenderer] = useState<Renderer | null>(null);
  const [mode, setMode] = useState<"webgl" | "svg" | null>(null);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const activated = useRef(false);

  // Der Hinweistext muss zum Gerät passen: auf Touch wird gewischt, nicht gezogen.
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      setSize(Math.max(320, Math.min(rect.width, 720)));
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  /**
   * Anfragen aus dem Flaggen-Laufstreifen. Kommt eine, bevor die Weltdaten da
   * sind, stößt sie das Laden an und wird nachgeholt, sobald sie vorliegen.
   */
  const { registerHandler } = useWorldSelection();
  const pendingCode = useRef<string | null>(null);
  const worldRef = useRef<WorldData | null>(null);

  const applyCode = useCallback((cca2: string, data: WorldData) => {
    const match = [...data.metaById.values()].find((entry) => entry.cca2 === cca2);
    if (match) setSelected(match);
  }, []);

  const activate = useCallback(() => {
    if (activated.current) return;
    activated.current = true;

    const webGl = hasWebGl();
    Promise.all([
      import("./world/load-world-data").then((module) => module.loadWorldData()),
      webGl
        ? import("./world/webgl-globe").then((module) => module.default as Renderer)
        : import("./world/svg-globe").then((module) => module.default as Renderer),
    ])
      .then(([data, component]) => {
        worldRef.current = data;
        setWorld(data);
        setRenderer(() => component);
        setMode(webGl ? "webgl" : "svg");
        const pending = pendingCode.current;
        pendingCode.current = null;
        if (pending) applyCode(pending, data);
      })
      .catch(() => {
        activated.current = false;
      });
  }, [applyCode]);

  useEffect(() => registerHandler((cca2) => {
    const data = worldRef.current;
    if (data) {
      applyCode(cca2, data);
      return;
    }
    pendingCode.current = cca2;
    activate();
  }), [registerHandler, applyCode, activate]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let cancelIdle: (() => void) | null = null;
    const startWhenIdle = () => {
      if (cancelIdle) return;
      cancelIdle = whenIdle(activate, 2000);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          startWhenIdle();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(stage);

    // Bedienung geht vor: dann sofort laden statt auf Leerlauf zu warten.
    const activateNow = () => activate();
    const options = { passive: true } as const;
    stage.addEventListener("pointerdown", activateNow, options);
    stage.addEventListener("touchstart", activateNow, options);
    stage.addEventListener("keydown", activateNow);

    return () => {
      observer.disconnect();
      cancelIdle?.();
      stage.removeEventListener("pointerdown", activateNow);
      stage.removeEventListener("touchstart", activateNow);
      stage.removeEventListener("keydown", activateNow);
    };
  }, [activate]);

  const onReady = useCallback(() => setReady(true), []);
  const onSelect = useCallback((meta: WorldCountryMeta) => setSelected(meta), []);

  /** Zoom gibt es nur im WebGL-Globus; das SVG-Modell kennt keine Zoomstufe. */
  const drag = coarsePointer ? "Wischen zum Drehen" : "Ziehen zum Drehen";
  const instructions = mode === "svg"
    ? `${drag} · Pfeiltasten am Globus · Land antippen`
    : `${drag} · Plus und Minus zum Zoomen · Land ${coarsePointer ? "antippen" : "anklicken"}`;

  const selectedAtlasCountry = selected ? atlasCountryByCode.get(selected.cca2) : undefined;
  const selectedStatus = selectedAtlasCountry?.status ?? "planned";
  const selectedName = selectedAtlasCountry?.name ?? selected?.name ?? "";
  /**
   * Dieselbe Sprache wie im Ländergitter. „Auswählbar“ war irreführend: das Land
   * ist im Moment der Anzeige bereits ausgewählt.
   */
  const statusLabel = !selectedAtlasCountry
    ? "Kein Atlas"
    : selectedStatus === "live" ? "Live"
      : selectedStatus === "next" ? "Als Nächstes" : "Geplant";

  return (
    <div className="interactive-world" ref={stageRef}>
      <div className={`globe-canvas${ready ? " is-ready" : ""}`}>
        {(!Renderer || !world) && (
          <div className="globe-loading"><i /><span>Weltmodell wird geladen</span></div>
        )}
        {Renderer && world && (
          <Renderer
            size={size}
            world={world}
            selectedId={selected?.id ?? ""}
            hoveredId={hoveredId}
            reducedMotion={reducedMotion}
            onHover={setHoveredId}
            onSelect={onSelect}
            onReady={onReady}
            toolbar={toolbar}
          />
        )}
      </div>

      <div className="globe-toolbar" ref={setToolbar} />

      {selected && (
        <div className="globe-interface" aria-live="polite">
          <div className="globe-selection-top">
            <span className="globe-selected-flag"><CountryFlag code={selected.cca2} name={selectedName} /></span>
            <span className={`country-status status-${selectedStatus}`}><i /> {statusLabel}</span>
          </div>
          <span className="globe-selection-code">{selected.cca2} / {selected.region}</span>
          <strong>{selectedName}</strong>
          <small>{selected.capital ? `Hauptstadt · ${selected.capital}` : "Interaktives Länderprofil"}</small>
          {selectedAtlasCountry ? (
            <a href={sitePath(`/${selectedAtlasCountry.slug}`)}>
              {selectedStatus === "live" ? "Atlas öffnen" : "Vorschau ansehen"} <span>↗</span>
            </a>
          ) : (
            <span className="globe-planned-label">Datenstory in Vorbereitung</span>
          )}
        </div>
      )}

      {/*
        Textfassung des Globus: das Canvas selbst lässt sich weder vorlesen noch
        mit der Tastatur bedienen. Gedreht und gezoomt wird über die
        Schaltflächen auf dem Globus, ausgewählt über die Länderliste darunter.
      */}
      <p className="globe-text-alt">
        Interaktiver Globus: {WORLD_TERRITORY_COUNT} Länder und Gebiete lassen sich mit
        dem Zeigegerät auswählen. Hervorgehoben sind die Länder, für die ein Atlas
        vorliegt oder geplant ist. Mit den Schaltflächen auf dem Globus lässt er sich
        drehen{mode === "svg" ? "" : " und zoomen"}. Dieselben Länder stehen als
        bedienbare Liste im <a href="#laender">Abschnitt „Länder“</a>.
      </p>

      <div className="globe-instructions">
        <i /> {instructions}
      </div>
      <div className="globe-count"><strong>{WORLD_TERRITORY_COUNT}</strong><span>Gebiete<br />interaktiv</span></div>
    </div>
  );
}
