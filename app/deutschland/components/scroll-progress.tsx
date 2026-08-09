"use client";

import { useEffect, useRef } from "react";

/**
 * Fortschrittsbalken der Navigation.
 *
 * Bewusst ohne React-State: der Scrollfortschritt lag früher im State der
 * Seitenkomponente, wodurch jedes Scroll-Event die gesamte Seite neu gerendert hat.
 * Jetzt wird pro Frame höchstens einmal `transform` auf genau diesem Element gesetzt.
 *
 * Eine CSS-Scroll-Timeline (`animation-timeline: scroll()`) wäre noch günstiger,
 * kollidiert hier aber mit dem globalen `animation-duration: .01ms !important`
 * aus der Reduced-Motion-Regel — deshalb der schlanke JS-Pfad.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame: number | null = null;

    const apply = () => {
      frame = null;
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const progress = available > 0 ? window.scrollY / available : 0;
      element.style.transform = `scaleX(${progress})`;
    };

    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="nav-progress" ref={ref} style={{ transform: "scaleX(0)" }} />;
}
