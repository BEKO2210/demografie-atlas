"use client";

import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import type { ReactNode } from "react";

type Handler = (cca2: string) => void;

type Selection = {
  /** Ein Land auf dem Globus zeigen — aufgerufen aus dem Flaggen-Laufstreifen. */
  requestCountry: (cca2: string) => void;
  /** Der Globus meldet sich hier an und übernimmt die Anfragen. */
  registerHandler: (handler: Handler) => () => void;
};

const SelectionContext = createContext<Selection | null>(null);

/**
 * Verbindet den Flaggen-Laufstreifen mit dem Globus.
 *
 * Bewusst über eine angemeldete Rückrufmethode statt über gemeinsamen Zustand:
 * ein Klick ist ein Ereignis, kein Zustand. So löst er die Auswahl direkt aus,
 * ohne dass ein Effekt hinterherlaufen und Folge-Renderings anstoßen müsste.
 */
export function WorldSelectionProvider({ children }: { children: ReactNode }) {
  const handler = useRef<Handler | null>(null);

  const registerHandler = useCallback((next: Handler) => {
    handler.current = next;
    return () => {
      if (handler.current === next) handler.current = null;
    };
  }, []);

  const requestCountry = useCallback((cca2: string) => {
    handler.current?.(cca2.toUpperCase());
  }, []);

  const value = useMemo(() => ({ requestCountry, registerHandler }), [requestCountry, registerHandler]);
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useWorldSelection() {
  const context = useContext(SelectionContext);
  if (!context) throw new Error("useWorldSelection außerhalb von WorldSelectionProvider");
  return context;
}
