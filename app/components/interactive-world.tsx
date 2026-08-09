"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { countries } from "../data/countries";
import { sitePath } from "../data/site";
import { DEFAULT_COUNTRY, WORLD_TERRITORY_COUNT } from "../data/world-constants";
import type { WorldCountryMeta, WorldData } from "../data/world-types";
import type { WorldRendererProps } from "./world/shared";
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
  const [selected, setSelected] = useState<WorldCountryMeta>(DEFAULT_COUNTRY);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [world, setWorld] = useState<WorldData | null>(null);
  const [Renderer, setRenderer] = useState<Renderer | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const activated = useRef(false);

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
        setWorld(data);
        setRenderer(() => component);
      })
      .catch(() => {
        activated.current = false;
      });
  }, []);

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

  const selectedAtlasCountry = atlasCountryByCode.get(selected.cca2);
  const selectedStatus = selectedAtlasCountry?.status ?? "planned";
  const selectedName = selectedAtlasCountry?.name ?? selected.name;

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
            selectedId={selected.id}
            hoveredId={hoveredId}
            reducedMotion={reducedMotion}
            onHover={setHoveredId}
            onSelect={onSelect}
            onReady={onReady}
          />
        )}
      </div>

      <div className="globe-interface" aria-live="polite">
        <div className="globe-selection-top">
          <span className="globe-selected-flag" role="img" aria-label={`Flagge ${selectedName}`}>{selected.flag}</span>
          <span className={`country-status status-${selectedStatus}`}><i /> {selectedStatus === "live" ? "Live" : selectedStatus === "next" ? "Als Nächstes" : "Auswählbar"}</span>
        </div>
        <span className="globe-selection-code">{selected.cca2} / {selected.region}</span>
        <strong>{selectedName}</strong>
        <small>{selected.capital ? `Hauptstadt · ${selected.capital}` : "Interaktives Länderprofil"}</small>
        {selectedStatus === "live" ? (
          <a href={sitePath(`/${selectedAtlasCountry?.slug}`)}>Atlas öffnen <span>↗</span></a>
        ) : (
          <span className="globe-planned-label">Datenstory in Vorbereitung</span>
        )}
      </div>

      <div className="globe-instructions"><i /> Ziehen zum Drehen <b>·</b> Scrollen zum Zoomen <b>·</b> Land anklicken</div>
      <div className="globe-count"><strong>{WORLD_TERRITORY_COUNT}</strong><span>Gebiete<br />interaktiv</span></div>
    </div>
  );
}
