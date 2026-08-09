"use client";

import { useEffect, useRef } from "react";

/** Startposition wie bisher: Mitte oben-mittig, bevor der Zeiger bewegt wurde. */
const INITIAL_TRANSFORM = "translate3d(50vw, 36vh, 0)";

/**
 * Weicher Lichtfleck, der dem Zeiger folgt.
 * Bewegt sich über `transform` statt über `left`/`top`, aktualisiert höchstens
 * einmal je Frame und läuft nur auf Geräten mit echtem Zeiger — auf Touchgeräten
 * bleibt das Element sichtbar, aber ohne Pointer-Tracking.
 */
export function PointerSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame: number | null = null;
    let x = 0;
    let y = 0;

    const apply = () => {
      frame = null;
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    // clientX/clientY genügen: das Element ist fixed positioniert,
    // ein getBoundingClientRect() je Pointer-Event entfällt damit.
    const onPointerMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (frame === null) frame = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="atlas-spotlight"
      aria-hidden="true"
      style={{ transform: INITIAL_TRANSFORM }}
    />
  );
}
