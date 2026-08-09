"use client";

import { useEffect } from "react";

/**
 * Schaltet die Reveal-Animationen frei und beobachtet alle `.reveal`-Elemente.
 * Als eigene Insel gehalten, damit der statische Seiteninhalt nicht wegen
 * dieser Logik zur Client Component wird.
 */
export function RevealObserver({ rootMargin = "0px 0px -36px" }: { rootMargin?: string }) {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.1, rootMargin },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [rootMargin]);

  return null;
}
