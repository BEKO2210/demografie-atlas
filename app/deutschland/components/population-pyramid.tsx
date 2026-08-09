"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Icon } from "../../components/ui-icon";
import { usePrefersReducedMotion } from "../../components/use-reduced-motion";
import {
  buildProjection,
  FIRST_YEAR,
  formatMillions,
  interpolatePopulation,
  LAST_YEAR,
  MINUS,
  NBSP,
  OFFICIAL_TOTAL_2025,
  type Population,
} from "./projection-model";

const WIDTH = 960;
const HEIGHT = 620;
const CENTER = 480;
const GAP = 19;
const TOP = 28;
const BOTTOM = 574;
const ROW = (BOTTOM - TOP) / 91;
const MAX_BAR = 405;
const AGES = Array.from({ length: 91 }, (_, age) => age);

const barY = (age: number) => BOTTOM - age * ROW - ROW * 0.72;
const BAR_HEIGHT = Math.max(3, ROW * 0.68);

const sum = (population: Population) =>
  population.men.reduce((total, value, age) => total + value + population.women[age], 0);

/**
 * Größter Einzelwert über alle Jahrgänge und alle Projektionsjahre.
 * Eine fest verdrahtete Obergrenze ließ die Balken ab 2043 aus dem Diagramm laufen —
 * die Skala wird deshalb aus den Daten selbst abgeleitet, mit etwas Luft nach oben.
 */
function scaleFor(projection: Record<number, Population>) {
  let max = 0;
  for (const population of Object.values(projection)) {
    for (const age of AGES) {
      if (population.men[age] > max) max = population.men[age];
      if (population.women[age] > max) max = population.women[age];
    }
  }
  return Math.ceil(max * 1.02 * 20) / 20;
}

const formatDelta = (total: number) => {
  const delta = ((total / OFFICIAL_TOTAL_2025) - 1) * 100;
  const rounded = Math.round(delta * 10) / 10;
  const sign = rounded === 0 ? "±" : rounded < 0 ? MINUS : "+";
  return `${sign}${Math.abs(rounded).toLocaleString("de-DE", { maximumFractionDigits: 1 })}${NBSP}%`;
};

const ageLabel = (age: number) => (age === 90 ? "90+" : String(age));

const setText = (node: Element | null, text: string) => {
  if (node) node.textContent = text;
};

type Hovered = { age: number; sex: "Männer" | "Frauen" } | null;

/**
 * Modellierte Größe: auf volle Tausend gerundet, damit sie nicht wie ein
 * amtlich ausgezählter Einzelwert aussieht.
 */
const peopleLabel = (values: Population, active: NonNullable<Hovered>) => {
  const value = active.sex === "Männer" ? values.men[active.age] : values.women[active.age];
  const thousands = Math.round(value * 1000) * 1000;
  return `rund ${thousands.toLocaleString("de-DE")}`;
};

export function PopulationPyramid() {
  const projection = useMemo(() => buildProjection(), []);
  const initial = projection[FIRST_YEAR];
  const scaleMax = useMemo(() => scaleFor(projection), [projection]);
  const barWidth = useCallback(
    (value: number) => Math.max(1.5, (value / scaleMax) * MAX_BAR),
    [scaleMax],
  );
  const reducedMotion = usePrefersReducedMotion();

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [hovered, setHovered] = useState<Hovered>(null);

  // Der Animationszustand liegt bewusst in Refs: die Balken werden pro Frame direkt
  // im DOM aktualisiert, damit die Komponente nicht 60-mal je Sekunde neu rendert.
  const targetYear = useRef<number>(FIRST_YEAR);
  const displayYear = useRef<number>(FIRST_YEAR);
  const playingRef = useRef(false);
  const speedRef = useRef(1);
  const reducedMotionRef = useRef(false);
  const isVisible = useRef(true);
  const frame = useRef<number | null>(null);
  const previousTime = useRef<number | null>(null);
  const population = useRef<Population>(initial);
  const hoveredRef = useRef<Hovered>(null);
  const announcedYear = useRef<number>(FIRST_YEAR);

  const menBars = useRef<(SVGRectElement | null)[]>([]);
  const womenBars = useRef<(SVGRectElement | null)[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const totalRef = useRef<HTMLSpanElement>(null);
  const deltaRef = useRef<HTMLElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const tooltipValueRef = useRef<HTMLElement>(null);
  const tooltipYearRef = useRef<HTMLElement>(null);

  useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);

  /** Schreibt den aktuellen Bevölkerungsstand direkt in die vorhandenen Knoten. */
  const paint = useCallback((year: number) => {
    const next = interpolatePopulation(projection, year);
    population.current = next;
    for (const age of AGES) {
      const men = menBars.current[age];
      const women = womenBars.current[age];
      const menWidth = barWidth(next.men[age]);
      if (men) {
        men.setAttribute("x", String(CENTER - GAP - menWidth));
        men.setAttribute("width", String(menWidth));
      }
      if (women) women.setAttribute("width", String(barWidth(next.women[age])));
    }

    // Die Ableselage ist eine Live-Region: sie darf nur bei echtem Jahreswechsel
    // neu geschrieben werden, sonst meldet der Screenreader jeden Frame.
    const rounded = Math.round(year);
    if (rounded !== announcedYear.current) {
      announcedYear.current = rounded;
      const total = sum(interpolatePopulation(projection, rounded));
      setText(yearRef.current, String(rounded));
      setText(totalRef.current, formatMillions(total));
      setText(deltaRef.current, formatDelta(total));
      svgRef.current?.setAttribute("aria-label", `Bevölkerungspyramide Deutschland im Jahr ${rounded}`);
    }

    const active = hoveredRef.current;
    if (active) {
      setText(tooltipValueRef.current, peopleLabel(next, active));
      setText(tooltipYearRef.current, `Menschen · modelliert · ${rounded}`);
    }
  }, [barWidth, projection]);

  // Die Schleife greift immer auf die neueste Fassung zu, ohne sich selbst zu referenzieren.
  const tickRef = useRef<(time: number) => void>(() => {});
  const loop = useCallback((time: number) => tickRef.current(time), []);

  /**
   * Läuft nur, solange sie etwas bewirkt: bei laufender Wiedergabe oder solange das
   * Anzeigejahr noch zum Zieljahr wandert — und nur bei sichtbarer Pyramide und aktivem Tab.
   */
  const tick = useCallback((time: number) => {
    frame.current = null;
    if (previousTime.current === null) previousTime.current = time;
    const delta = Math.min(0.06, (time - previousTime.current) / 1000);
    previousTime.current = time;

    if (playingRef.current) {
      const nextYear = Math.min(LAST_YEAR, targetYear.current + delta * 3.25 * speedRef.current);
      targetYear.current = nextYear;
      const slider = sliderRef.current;
      if (slider) slider.value = String(Math.round(nextYear));
      if (nextYear >= LAST_YEAR) {
        playingRef.current = false;
        setPlaying(false);
      }
    }

    const diff = targetYear.current - displayYear.current;
    displayYear.current = reducedMotionRef.current || Math.abs(diff) < 0.001
      ? targetYear.current
      : displayYear.current + diff * Math.min(1, delta * 9);
    paint(displayYear.current);

    const settled = Math.abs(targetYear.current - displayYear.current) < 0.001;
    if (playingRef.current || !settled) frame.current = requestAnimationFrame(loop);
    else previousTime.current = null;
  }, [loop, paint]);

  useEffect(() => { tickRef.current = tick; }, [tick]);

  const ensureFrame = useCallback(() => {
    if (frame.current !== null) return;
    if (!isVisible.current || document.hidden) return;
    previousTime.current = null;
    frame.current = requestAnimationFrame(loop);
  }, [loop]);

  const stopFrame = useCallback(() => {
    if (frame.current === null) return;
    cancelAnimationFrame(frame.current);
    frame.current = null;
    previousTime.current = null;
  }, []);

  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      isVisible.current = entries.some((entry) => entry.isIntersecting);
      if (isVisible.current) ensureFrame();
      else stopFrame();
    }, { rootMargin: "80px" });
    observer.observe(element);

    const onVisibilityChange = () => {
      if (document.hidden) stopFrame();
      else ensureFrame();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopFrame();
    };
  }, [ensureFrame, stopFrame]);

  // Der Tooltip-Knoten existiert erst, nachdem React die Hover-Auswahl gerendert hat.
  useEffect(() => {
    const active = hoveredRef.current;
    if (!active) return;
    setText(tooltipValueRef.current, peopleLabel(population.current, active));
    setText(tooltipYearRef.current, `Menschen · modelliert · ${Math.round(displayYear.current)}`);
  }, [hovered]);

  const togglePlayback = () => {
    if (!playingRef.current && targetYear.current >= LAST_YEAR - 0.05) {
      targetYear.current = FIRST_YEAR;
      displayYear.current = FIRST_YEAR;
      const slider = sliderRef.current;
      if (slider) slider.value = String(FIRST_YEAR);
      paint(FIRST_YEAR);
    }
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
    if (playingRef.current) ensureFrame();
  };

  const onScrub = (value: number) => {
    playingRef.current = false;
    setPlaying(false);
    targetYear.current = value;
    ensureFrame();
  };

  const onSpeed = () => {
    setSpeed((value) => {
      const next = value === 2 ? 0.5 : value * 2;
      speedRef.current = next;
      return next;
    });
  };

  // Ein Listener am Gruppenknoten statt 182 einzelner Handler.
  const onBarOver = (event: ReactPointerEvent<SVGGElement>) => {
    const target = event.target as SVGElement;
    const age = Number(target.dataset.age);
    const sex = target.dataset.sex as "Männer" | "Frauen" | undefined;
    if (!sex || Number.isNaN(age)) return;
    const next = { age, sex };
    if (hoveredRef.current?.age === age && hoveredRef.current.sex === sex) return;
    hoveredRef.current = next;
    setHovered(next);
  };

  const onBarOut = (event: ReactPointerEvent<SVGGElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    hoveredRef.current = null;
    setHovered(null);
  };

  return (
    <div className="pyramid-shell">
      <div className="pyramid-header">
        <div className="legend" role="group" aria-label="Legende">
          <span><i className="legend-dot male" /> Männer</span>
          <span><i className="legend-dot female" /> Frauen</span>
        </div>
        <div className="chart-readout" role="status" aria-live="polite" aria-atomic="true">
          <span className="chart-year" ref={yearRef}>{FIRST_YEAR}</span>
          <span className="chart-total"><span ref={totalRef}>{formatMillions(sum(initial))}</span><em ref={deltaRef}>{formatDelta(sum(initial))}</em></span>
        </div>
      </div>

      <div className="chart-stage">
        <svg
          ref={svgRef}
          className="pyramid"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Bevölkerungspyramide Deutschland im Jahr ${FIRST_YEAR}`}
        >
          <defs>
            <linearGradient id="maleGradient" x1="0" x2="1">
              <stop offset="0" stopColor="#315fae" stopOpacity=".55" />
              <stop offset="1" stopColor="#76a9ff" />
            </linearGradient>
            <linearGradient id="femaleGradient" x1="0" x2="1">
              <stop offset="0" stopColor="#ff8aae" />
              <stop offset="1" stopColor="#a93661" stopOpacity=".56" />
            </linearGradient>
            <filter id="barGlow" x="-10%" y="-20%" width="120%" height="140%">
              <feGaussianBlur stdDeviation="1.3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {Array.from({ length: 10 }, (_, index) => index * 10).map((age) => {
            const y = BOTTOM - age * ROW;
            return (
              <g key={`grid-${age}`}>
                <line x1="40" x2="920" y1={y} y2={y} className="chart-grid" />
                <text x={CENTER} y={y - 5} className="age-label">{ageLabel(age)}</text>
              </g>
            );
          })}
          <line x1={CENTER} x2={CENTER} y1="18" y2="588" className="center-line" />
          <g filter="url(#barGlow)" onPointerOver={onBarOver} onPointerOut={onBarOut}>
            {AGES.map((age) => {
              const width = barWidth(initial.men[age]);
              return (
                <rect
                  key={`m-${age}`}
                  ref={(node) => { menBars.current[age] = node; }}
                  className="population-bar"
                  data-age={age}
                  data-sex="Männer"
                  x={CENTER - GAP - width}
                  y={barY(age)}
                  width={width}
                  height={BAR_HEIGHT}
                  rx="2.4"
                  fill="url(#maleGradient)"
                />
              );
            })}
            {AGES.map((age) => (
              <rect
                key={`f-${age}`}
                ref={(node) => { womenBars.current[age] = node; }}
                className="population-bar"
                data-age={age}
                data-sex="Frauen"
                x={CENTER + GAP}
                y={barY(age)}
                width={barWidth(initial.women[age])}
                height={BAR_HEIGHT}
                rx="2.4"
                fill="url(#femaleGradient)"
              />
            ))}
          </g>
          <text x="266" y="610" className="sex-label male-label">MÄNNER</text>
          <text x="694" y="610" className="sex-label female-label">FRAUEN</text>
        </svg>
        <div className={`chart-tooltip ${hovered ? "visible" : ""}`} aria-live="polite">
          {hovered && (
            <>
              <span>{hovered.sex} · {ageLabel(hovered.age)} Jahre</span>
              <strong ref={tooltipValueRef} />
              <small ref={tooltipYearRef} />
            </>
          )}
        </div>
      </div>

      <div className="timeline-controls">
        <button className="play-button" onClick={togglePlayback} aria-pressed={playing}>
          <Icon name={playing ? "pause" : "play"} /> {playing ? "Pause" : "Abspielen"}
        </button>
        <div className="timeline-field">
          <input
            ref={sliderRef}
            type="range"
            min={FIRST_YEAR}
            max={LAST_YEAR}
            step="1"
            defaultValue={FIRST_YEAR}
            onChange={(event) => onScrub(Number(event.target.value))}
            aria-label="Projektionsjahr auswählen"
          />
          <div className="timeline-labels"><span>2025</span><span>2040</span><span>2055</span><span>2070</span></div>
        </div>
        <button
          className="speed-button"
          onClick={onSpeed}
          aria-label={`${speed.toLocaleString("de-DE")}× Geschwindigkeit — Tempo ändern`}
        >
          {speed.toLocaleString("de-DE")}×
        </button>
      </div>

      <p className="pyramid-note">
        <b>Amtlich:</b> Bevölkerungsstand und Geschlechterverteilung Ende 2025 sowie die
        Zielgröße 74,7{NBSP}Mio. für 2070. <b>Modelliert:</b> die Einzeljahrgänge, alle
        Zwischenjahre und jeder Wert im Tooltip — gerundet und ohne amtlichen Charakter.
      </p>
    </div>
  );
}
