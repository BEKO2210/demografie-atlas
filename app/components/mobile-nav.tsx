"use client";

import { useEffect, useId, useRef, useState } from "react";

export type MobileNavLink = { href: string; label: string };


/**
 * Navigation für schmale Fenster.
 *
 * Unter 1000 px blendet das Layout die Navigationsleiste aus. Ohne Ersatz gab es
 * auf dem Telefon keinen Weg mehr zu den Abschnitten der Seite — dieser Knopf
 * klappt dieselben Ziele auf.
 */
export function MobileNav({ links }: { links: MobileNavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="mobile-nav" ref={rootRef}>
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`mobile-nav-bars${open ? " is-open" : ""}`} aria-hidden="true">
          <i /><i /><i />
        </span>
      </button>
      <div className="mobile-nav-panel" id={panelId} hidden={!open}>
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>
        ))}
      </div>
    </div>
  );
}
