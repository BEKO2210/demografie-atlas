"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AtlasFooter } from "../components/atlas-footer";
import { sitePath } from "../data/site";

type Population = { men: number[]; women: number[] };

const FIRST_YEAR = 2025;
const LAST_YEAR = 2070;
const OFFICIAL_MEN_2025 = 41.184322;
const OFFICIAL_WOMEN_2025 = 42.282795;
const OFFICIAL_TOTAL_2025 = 83.467117;
const TARGET_2070 = 74.7;

const COHORT_SHAPE = [
  0.654, 0.682, 0.715, 0.735, 0.755, 0.775, 0.79, 0.805, 0.815, 0.825,
  0.835, 0.845, 0.855, 0.865, 0.875, 0.885, 0.895, 0.905, 0.915, 0.925,
  0.94, 0.955, 0.97, 0.985, 1.0, 1.015, 1.03, 1.045, 1.06, 1.075,
  1.09, 1.105, 1.12, 1.135, 1.15, 1.165, 1.18, 1.19, 1.195, 1.2,
  1.205, 1.21, 1.215, 1.22, 1.225, 1.235, 1.25, 1.27, 1.29, 1.31,
  1.335, 1.36, 1.39, 1.42, 1.45, 1.475, 1.495, 1.505, 1.51, 1.5,
  1.48, 1.455, 1.43, 1.405, 1.375, 1.335, 1.29, 1.245, 1.195, 1.145,
  1.09, 1.035, 0.98, 0.925, 0.87, 0.815, 0.76, 0.705, 0.65, 0.595,
  0.54, 0.485, 0.43, 0.375, 0.325, 0.275, 0.23, 0.19, 0.155, 0.125,
  0.105,
];

function maleShare(age: number) {
  let share = 0.512;
  if (age > 50) share -= Math.min(0.19, (age - 50) * 0.00475);
  return share;
}

function makeBase(): Population {
  const men: number[] = [];
  const women: number[] = [];
  let sumMen = 0;
  let sumWomen = 0;
  COHORT_SHAPE.forEach((total, age) => {
    const share = maleShare(age);
    men.push(total * share);
    women.push(total * (1 - share));
    sumMen += total * share;
    sumWomen += total * (1 - share);
  });
  return {
    men: men.map((value) => (value * OFFICIAL_MEN_2025) / sumMen),
    women: women.map((value) => (value * OFFICIAL_WOMEN_2025) / sumWomen),
  };
}

function survival(age: number, sex: "m" | "f") {
  if (age < 45) return 0.9988;
  if (age < 60) return sex === "m" ? 0.9955 : 0.997;
  if (age < 70) return sex === "m" ? 0.988 : 0.992;
  if (age < 80) return sex === "m" ? 0.962 : 0.976;
  if (age < 90) return sex === "m" ? 0.89 : 0.925;
  return sex === "m" ? 0.74 : 0.8;
}

function targetTotal(year: number) {
  const t = (year - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR);
  const smooth = t * t * (3 - 2 * t);
  return OFFICIAL_TOTAL_2025 + (TARGET_2070 - OFFICIAL_TOTAL_2025) * smooth;
}

function buildProjection() {
  const years: Record<number, Population> = { [FIRST_YEAR]: makeBase() };
  for (let year = FIRST_YEAR + 1; year <= LAST_YEAR; year += 1) {
    const prev = years[year - 1];
    const men = Array(91).fill(0) as number[];
    const women = Array(91).fill(0) as number[];

    for (let age = 1; age < 90; age += 1) {
      men[age] = prev.men[age - 1] * survival(age - 1, "m");
      women[age] = prev.women[age - 1] * survival(age - 1, "f");
    }
    men[90] = prev.men[89] * survival(89, "m") + prev.men[90] * survival(90, "m");
    women[90] = prev.women[89] * survival(89, "f") + prev.women[90] * survival(90, "f");

    const births = 0.654241 * (1 + 0.05 * ((year - FIRST_YEAR) / 45));
    men[0] = births * 0.512;
    women[0] = births * 0.488;

    const raw = [...men, ...women].reduce((sum, value) => sum + value, 0);
    const residual = targetTotal(year) - raw;
    const weights = Array.from({ length: 33 }, (_, index) => {
      const age = index + 17;
      return { age, weight: Math.exp(-Math.pow((age - 30) / 11.5, 2)) };
    });
    const weightSum = weights.reduce((sum, item) => sum + item.weight, 0);
    weights.forEach(({ age, weight }) => {
      const addition = residual * (weight / weightSum);
      men[age] = Math.max(0, men[age] + addition * 0.53);
      women[age] = Math.max(0, women[age] + addition * 0.47);
    });

    const corrected = [...men, ...women].reduce((sum, value) => sum + value, 0);
    const correction = targetTotal(year) / corrected;
    years[year] = {
      men: men.map((value) => value * correction),
      women: women.map((value) => value * correction),
    };
  }
  return years;
}

function interpolatePopulation(years: Record<number, Population>, year: number) {
  const low = Math.floor(year);
  const high = Math.min(LAST_YEAR, low + 1);
  const fraction = year - low;
  if (low === high || fraction === 0) return years[low];
  return {
    men: years[low].men.map(
      (value, age) => value + (years[high].men[age] - value) * fraction,
    ),
    women: years[low].women.map(
      (value, age) => value + (years[high].women[age] - value) * fraction,
    ),
  };
}

function formatMillions(value: number, digits = 1) {
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} Mio.`;
}

const metricCards = [
  { label: "Bevölkerung · 31.12.2025", value: "83,47 Mio.", note: "83.467.117 Menschen", tone: "gold" },
  { label: "Männer", value: "41,18 Mio.", note: "49,3 % der Bevölkerung", tone: "blue" },
  { label: "Frauen", value: "42,28 Mio.", note: "50,7 % der Bevölkerung", tone: "rose" },
  { label: "Geburtenziffer · 2025", value: "1,32", note: "Kinder je Frau", tone: "green" },
];

type AtlasName = "population" | "development" | "generations" | "story-method";

const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function AtlasArt({
  atlas,
  quadrant,
  className = "",
}: {
  atlas: AtlasName;
  quadrant: number;
  className?: string;
}) {
  const positions = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"];
  return (
    <div className={`atlas-art ${className}`} aria-hidden="true">
      <span
        style={{
          backgroundImage: `url('${ASSET_BASE}/assets/${atlas}-atlas.webp')`,
          backgroundPosition: positions[quadrant % 4],
        }}
      />
    </div>
  );
}

function Icon({ name }: { name: "arrow" | "play" | "pause" | "spark" }) {
  if (name === "play") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" /></svg>;
  if (name === "pause") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>;
  if (name === "spark") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" /></svg>;
}

function PopulationPyramid() {
  const projection = useMemo(() => buildProjection(), []);
  const [targetYear, setTargetYear] = useState(FIRST_YEAR);
  const [displayYear, setDisplayYear] = useState(FIRST_YEAR);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [hovered, setHovered] = useState<{ age: number; sex: "Männer" | "Frauen"; value: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const previousTime = useRef<number | null>(null);
  const targetRef = useRef(targetYear);
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);

  useEffect(() => { targetRef.current = targetYear; }, [targetYear]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    const tick = (time: number) => {
      if (previousTime.current === null) previousTime.current = time;
      const delta = Math.min(0.06, (time - previousTime.current) / 1000);
      previousTime.current = time;
      if (playingRef.current) {
        const next = Math.min(LAST_YEAR, targetRef.current + delta * 3.25 * speedRef.current);
        targetRef.current = next;
        setTargetYear(next);
        if (next >= LAST_YEAR) {
          playingRef.current = false;
          setPlaying(false);
        }
      }
      setDisplayYear((current) => {
        const diff = targetRef.current - current;
        if (Math.abs(diff) < 0.001) return targetRef.current;
        return current + diff * Math.min(1, delta * 9);
      });
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -45px" },
    );
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const population = interpolatePopulation(projection, displayYear);
  const total = [...population.men, ...population.women].reduce((sum, value) => sum + value, 0);
  const delta = ((total / OFFICIAL_TOTAL_2025) - 1) * 100;
  const roundedYear = Math.round(displayYear);

  const width = 960;
  const height = 620;
  const center = 480;
  const gap = 19;
  const top = 28;
  const bottom = 574;
  const row = (bottom - top) / 91;
  const maxBar = 405;
  const fixedMax = 0.86;

  const togglePlayback = () => {
    if (!playing && targetRef.current >= LAST_YEAR - 0.05) {
      targetRef.current = FIRST_YEAR;
      setTargetYear(FIRST_YEAR);
      setDisplayYear(FIRST_YEAR);
    }
    setPlaying((value) => !value);
  };

  return (
    <div className="pyramid-shell">
      <div className="pyramid-header">
        <div className="legend" aria-label="Legende">
          <span><i className="legend-dot male" /> Männer</span>
          <span><i className="legend-dot female" /> Frauen</span>
        </div>
        <div className="chart-readout">
          <span className="chart-year">{roundedYear}</span>
          <span className="chart-total">{formatMillions(total)} <em>{delta <= 0 ? "" : "+"}{delta.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</em></span>
        </div>
      </div>

      <div className="chart-stage">
        <svg className="pyramid" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Bevölkerungspyramide Deutschland im Jahr ${roundedYear}`}>
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
            const y = bottom - age * row;
            return (
              <g key={`grid-${age}`}>
                <line x1="40" x2="920" y1={y} y2={y} className="chart-grid" />
                <text x={center} y={y - 5} className="age-label">{age === 90 ? "90+" : age}</text>
              </g>
            );
          })}
          <line x1={center} x2={center} y1="18" y2="588" className="center-line" />
          <g filter="url(#barGlow)">
            {population.men.map((value, age) => {
              const barWidth = Math.max(1.5, (value / fixedMax) * maxBar);
              const y = bottom - age * row - row * 0.72;
              return (
                <rect
                  key={`m-${age}`}
                  className="population-bar"
                  x={center - gap - barWidth}
                  y={y}
                  width={barWidth}
                  height={Math.max(3, row * 0.68)}
                  rx="2.4"
                  fill="url(#maleGradient)"
                  onPointerEnter={() => setHovered({ age, sex: "Männer", value })}
                  onPointerMove={() => setHovered({ age, sex: "Männer", value })}
                  onPointerLeave={() => setHovered(null)}
                />
              );
            })}
            {population.women.map((value, age) => {
              const barWidth = Math.max(1.5, (value / fixedMax) * maxBar);
              const y = bottom - age * row - row * 0.72;
              return (
                <rect
                  key={`f-${age}`}
                  className="population-bar"
                  x={center + gap}
                  y={y}
                  width={barWidth}
                  height={Math.max(3, row * 0.68)}
                  rx="2.4"
                  fill="url(#femaleGradient)"
                  onPointerEnter={() => setHovered({ age, sex: "Frauen", value })}
                  onPointerMove={() => setHovered({ age, sex: "Frauen", value })}
                  onPointerLeave={() => setHovered(null)}
                />
              );
            })}
          </g>
          <text x="266" y="610" className="sex-label male-label">MÄNNER</text>
          <text x="694" y="610" className="sex-label female-label">FRAUEN</text>
        </svg>
        <div className={`chart-tooltip ${hovered ? "visible" : ""}`} aria-live="polite">
          {hovered && (
            <>
              <span>{hovered.sex} · {hovered.age === 90 ? "90+" : hovered.age} Jahre</span>
              <strong>{Math.round(hovered.value * 1_000_000).toLocaleString("de-DE")}</strong>
              <small>Menschen · {roundedYear}</small>
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
            type="range"
            min={FIRST_YEAR}
            max={LAST_YEAR}
            step="1"
            value={Math.round(targetYear)}
            onChange={(event) => {
              const value = Number(event.target.value);
              setPlaying(false);
              targetRef.current = value;
              setTargetYear(value);
            }}
            aria-label="Projektionsjahr auswählen"
          />
          <div className="timeline-labels"><span>2025</span><span>2040</span><span>2055</span><span>2070</span></div>
        </div>
        <button className="speed-button" onClick={() => setSpeed((value) => value === 2 ? 0.5 : value * 2)} aria-label="Animationsgeschwindigkeit ändern">
          {speed.toLocaleString("de-DE")}×
        </button>
      </div>
    </div>
  );
}

function ProjectionChart() {
  const moderate = [83.5, 83.2, 82.4, 81.2, 79.8, 78.1, 76.4, 75.3, 74.7];
  const upper = [83.5, 83.7, 84.0, 84.5, 85.1, 85.6, 86.0, 86.3, 86.5];
  const lower = [83.5, 82.1, 79.8, 76.9, 73.5, 69.9, 67.0, 65.1, 63.9];
  const x = (index: number) => 38 + (index / (moderate.length - 1)) * 604;
  const y = (value: number) => 235 - ((value - 60) / 30) * 190;
  const line = (values: number[]) => values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(value)}`).join(" ");
  const band = [
    ...upper.map((value, index) => `${x(index)},${y(value)}`),
    ...lower.map((value, index) => `${x(lower.length - 1 - index)},${y(lower[lower.length - 1 - index])}`),
  ].join(" ");

  return (
    <div className="projection-chart" aria-label="Projektionsspanne der Bevölkerung bis 2070">
      <svg viewBox="0 0 680 270" role="img">
        <defs>
          <linearGradient id="rangeGradient" x1="0" x2="1">
            <stop offset="0" stopColor="#f0c878" stopOpacity=".16" />
            <stop offset="1" stopColor="#76a9ff" stopOpacity=".06" />
          </linearGradient>
          <linearGradient id="moderateLine" x1="0" x2="1">
            <stop offset="0" stopColor="#f3f0e8" />
            <stop offset="1" stopColor="#f0c878" />
          </linearGradient>
        </defs>
        {[60, 70, 80, 90].map((tick) => (
          <g key={tick}>
            <line x1="38" x2="642" y1={y(tick)} y2={y(tick)} className="projection-grid" />
            <text x="28" y={y(tick) + 4} className="projection-axis">{tick}</text>
          </g>
        ))}
        <polygon points={band} fill="url(#rangeGradient)" />
        <path d={line(upper)} className="range-line" />
        <path d={line(lower)} className="range-line" />
        <path d={line(moderate)} className="moderate-line" />
        <circle cx={x(8)} cy={y(74.7)} r="5" className="projection-dot" />
        <text x={x(8) - 9} y={y(74.7) - 13} className="projection-value">74,7</text>
        {[2025, 2040, 2055, 2070].map((year, index) => (
          <text key={year} x={38 + (index / 3) * 604} y="260" className="projection-year">{year}</text>
        ))}
      </svg>
      <div className="projection-legend">
        <span><i className="line-moderate" /> Moderate Variante</span>
        <span><i className="area-range" /> Spannweite aller Varianten</span>
      </div>
    </div>
  );
}

function FertilitySimulator() {
  const replacement = 2.1;
  const [rate, setRate] = useState(1.32);
  const generationFactor = rate / replacement;
  const generationChange = (generationFactor - 1) * 100;
  const annualChange = (Math.pow(generationFactor, 1 / 30) - 1) * 100;
  const barWidth = Math.min(100, generationFactor * 70);
  let status = "Schrumpfung";
  let statusClass = "warn";
  if (rate < 1.5) { status = "Starke Schrumpfung"; statusClass = "danger"; }
  else if (rate >= 2 && rate <= 2.2) { status = "Nahezu stabil"; statusClass = "good"; }
  else if (rate > 2.2) { status = "Wachstum"; statusClass = "info"; }

  const signed = (value: number, digits: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;

  return (
    <article className="simulator-card data-card reveal">
      <div className="simulator-visual" aria-hidden="true">
        <AtlasArt atlas="generations" quadrant={0} className="simulator-art" />
        <div className="simulator-visual-shade" />
        <div className="simulator-visual-caption">
          <span>Generation A</span>
          <i />
          <span>Generation B</span>
        </div>
      </div>
      <div className="simulator-content">
        <div className="card-topline">
          <span className="card-label">Was-wäre-wenn</span>
          <span className="live-indicator"><i /> live berechnet</span>
        </div>
        <div className="sim-value">
          <strong>{rate.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          <span>Kinder je Frau</span>
        </div>
        <input
          className="fertility-slider"
          type="range"
          min="0.8"
          max="3"
          step="0.01"
          value={rate}
          onChange={(event) => setRate(Number(event.target.value))}
          aria-label="Kinderzahl je Frau einstellen"
        />
        <div className="fertility-scale"><span>0,8</span><span>1,32 heute</span><span>2,1 stabil</span><span>3,0</span></div>
        <div className="preset-row">
          {[
            ["Sehr niedrig", 1.0], ["Deutschland", 1.32], ["Bestandserhalt", 2.1], ["Wachstum", 2.5],
          ].map(([label, value]) => (
            <button
              type="button"
              key={String(label)}
              className={Math.abs(rate - Number(value)) < 0.01 ? "active" : ""}
              onClick={() => setRate(Number(value))}
            >{label}</button>
          ))}
        </div>

        <div className="generation-bars">
          <div className="generation-row">
            <span>Eltern-Generation</span>
            <i><b style={{ width: "70%" }} /></i>
            <strong>100 %</strong>
          </div>
          <div className="generation-row child-row">
            <span>Kinder-Generation</span>
            <i><b style={{ width: `${barWidth}%` }} /></i>
            <strong>{Math.round(generationFactor * 100)} %</strong>
          </div>
        </div>

        <div className="sim-stats">
          <div><span>Je Generation · ca. 30 J.</span><strong>{signed(generationChange, 0)}</strong></div>
          <div><span>Langfristig pro Jahr</span><strong>{signed(annualChange, 1)}</strong></div>
          <div><span>Ohne Zuwanderung</span><strong className={`scenario-status ${statusClass}`}>{status}</strong></div>
        </div>
        <p className="model-note">Vereinfachtes Rechenmodell: Verhältnis zur Ersatzrate 2,1 über einen Generationenabstand von 30 Jahren. Keine Bevölkerungsprognose.</p>
      </div>
    </article>
  );
}

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(available > 0 ? window.scrollY / available : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <main id="top">
      <div className="noise" aria-hidden="true" />
      <div className="orb orb-one" aria-hidden="true" />
      <div className="orb orb-two" aria-hidden="true" />

      <nav className="nav">
        <div className="nav-progress" style={{ transform: `scaleX(${scrollProgress})` }} />
        <div className="wrap nav-inner">
          <a className="brand" href={sitePath()} aria-label="Zur Länderübersicht">
            <span className="brand-mark"><span>D</span></span>
            <span>DEMOGRAFIE <b>/ DE</b></span>
          </a>
          <div className="nav-links">
            <a href="#pyramide">Pyramide</a>
            <a href="#entwicklung">Entwicklung</a>
            <a href="#kinderzahl">Kinderzahl</a>
            <a href="#methodik">Methodik</a>
          </div>
          <span className="data-status"><i /> Datenstand 2025/26</span>
        </div>
      </nav>

      <header className="hero wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span>Interaktive Datenstory</span><b>2025 → 2070</b></div>
            <h1>Deutschland<br /><em>wird älter.</em><br />Nicht kleiner gedacht.</h1>
            <p className="hero-lead">
              Beobachte, wie 83 Millionen Menschen durch die Zeit wandern — und wie Geburten,
              längeres Leben und Zuwanderung die Form eines Landes verändern.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#pyramide">Zeitreise starten <Icon name="arrow" /></a>
              <span className="source-note">Quelle · Statistisches Bundesamt</span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="year-orbit orbit-one"><span>2025</span></div>
            <div className="year-orbit orbit-two"><span>2040</span></div>
            <div className="year-orbit orbit-three"><span>2070</span></div>
            <div className="hero-core"><strong>74,7</strong><span>Millionen<br />im Jahr 2070</span></div>
            <div className="hero-caption"><Icon name="spark" /> Moderate Destatis-Variante G2L2W2</div>
          </div>
        </div>

        <div className="metric-grid">
          {metricCards.map((card, index) => (
            <article className={`metric-card tone-${card.tone} reveal`} key={card.label}>
              <div className="metric-index">0{index + 1}</div>
              <AtlasArt atlas="population" quadrant={index} className="metric-art" />
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.note}</small>
            </article>
          ))}
        </div>
      </header>

      <section className="section wrap" id="pyramide">
        <div className="section-heading reveal">
          <div>
            <span className="section-kicker">01 / Altersstruktur</span>
            <h2>Die Pyramide<br />atmet.</h2>
          </div>
          <p>
            Links Männer, rechts Frauen. Ziehe durch die Jahre oder starte die Animation:
            starke Jahrgänge bewegen sich sichtbar nach oben, während die Basis schmaler wird.
          </p>
        </div>
        <PopulationPyramid />
      </section>

      <section className="section wrap" id="entwicklung">
        <div className="section-heading reveal">
          <div>
            <span className="section-kicker">02 / Entwicklung</span>
            <h2>Kein Ende.<br />Ein Umbau.</h2>
          </div>
          <p>
            Deutschland erreicht nicht plötzlich null Einwohner. Die belastbare Frage lautet:
            Wie verändern Geburten, Sterblichkeit und Wanderung die Größe und Altersstruktur?
          </p>
        </div>

        <div className="future-grid">
          <article className="future-card data-card reveal">
            <AtlasArt atlas="development" quadrant={0} className="future-art" />
            <div className="future-overlay">
              <span className="data-chip">Variante 2 · G2L2W2</span>
              <div className="future-number">74,7</div>
              <h3>Millionen Menschen im Jahr 2070</h3>
              <p>Die moderate Destatis-Variante liegt rund 8,8 Millionen unter dem Bevölkerungsstand von Ende 2025.</p>
            </div>
          </article>

          <div className="fact-stack">
            <article className="fact-card data-card reveal">
              <AtlasArt atlas="development" quadrant={1} className="fact-art" />
              <span className="card-label">Lebendgeborene · 2025</span>
              <strong>654.241</strong>
              <p>Niedrigster Stand seit 1946</p>
            </article>
            <article className="fact-card data-card reveal">
              <AtlasArt atlas="development" quadrant={2} className="fact-art" />
              <span className="card-label">Geburtendefizit · 2025</span>
              <strong>≈ 352.000</strong>
              <p>Mehr Sterbefälle als Geburten</p>
            </article>
            <article className="fact-card data-card reveal">
              <AtlasArt atlas="development" quadrant={3} className="fact-art" />
              <span className="card-label">Spannweite · 2070</span>
              <strong>63,9–86,5</strong>
              <p>Millionen · je nach Annahmen</p>
            </article>
          </div>
        </div>

        <article className="projection-panel data-card reveal">
          <div className="projection-copy">
            <span className="card-label">27 Varianten · ein Möglichkeitsraum</span>
            <h3>Migration macht aus einer Linie einen Korridor.</h3>
            <p>
              Die breite Fläche ist kein Fehlerbalken. Sie zeigt unterschiedliche Kombinationen aus
              Geburtenrate, Lebenserwartung und Nettozuwanderung der 16. koordinierten Vorausberechnung.
            </p>
            <AtlasArt atlas="generations" quadrant={3} className="projection-art" />
          </div>
          <ProjectionChart />
        </article>
      </section>

      <section className="section wrap" id="kinderzahl">
        <div className="section-heading reveal">
          <div>
            <span className="section-kicker">03 / Kinderzahl</span>
            <h2>Was heißt<br />eigentlich 2,1?</h2>
          </div>
          <p>
            Ohne Wanderung gilt eine Geburtenziffer von etwa 2,1 Kindern je Frau als
            bestandserhaltendes Niveau. Deutschland lag 2025 bei 1,32.
          </p>
        </div>

        <div className="replacement-grid">
          <article className="replacement-card data-card reveal">
            <AtlasArt atlas="generations" quadrant={0} className="replacement-art" />
            <div className="replacement-copy">
              <span className="data-chip">Bestandserhaltender Richtwert</span>
              <strong>2,1</strong>
              <h3>Kinder je Frau</h3>
              <p>
                Zwei Kinder ersetzen rechnerisch die Eltern. Das zusätzliche Zehntel gleicht unter anderem
                Geschlechterverhältnis und frühe Sterblichkeit aus. Es ist ein langfristiger Richtwert, kein politisches Soll.
              </p>
            </div>
          </article>

          <article className="threshold-card data-card reveal">
            <AtlasArt atlas="generations" quadrant={1} className="threshold-art" />
            <div className="threshold-content">
              <span className="card-label">Aktuelles Niveau / Ersatzniveau</span>
              <div className="threshold-values"><strong>1,32</strong><b>−0,78</b><strong>2,10</strong></div>
              <div className="threshold-track">
                <i className="threshold-fill" />
                <i className="threshold-gap" />
                <span className="marker-now" style={{ left: "44%" }} />
                <span className="marker-target" style={{ left: "70%" }} />
              </div>
              <div className="threshold-labels"><span>2025</span><span>Differenz</span><span>Richtwert</span></div>
              <p>Die Lücke wirkt über Jahrzehnte und Generationen — nicht von einem Jahr auf das nächste.</p>
            </div>
          </article>
        </div>

        <FertilitySimulator />
      </section>

      <section className="section wrap" id="kraefte">
        <div className="section-heading compact-heading reveal">
          <div>
            <span className="section-kicker">Drei Kräfte</span>
            <h2>Die Form<br />hinter der Zahl.</h2>
          </div>
          <p>Eine Gesamtzahl allein erklärt wenig. Erst die Bewegung der Altersgruppen macht den demografischen Wandel sichtbar.</p>
        </div>

        <div className="story-grid">
          <article className="story-card data-card reveal">
            <AtlasArt atlas="story-method" quadrant={0} className="story-art" />
            <div className="story-index">01</div>
            <h3>Die Basis verengt sich</h3>
            <p>Weniger Geburten erzeugen schmalere junge Jahrgänge. Die Veränderung beginnt unten und wandert über Jahrzehnte nach oben.</p>
          </article>
          <article className="story-card data-card reveal">
            <AtlasArt atlas="story-method" quadrant={1} className="story-art" />
            <div className="story-index">02</div>
            <h3>Die Mitte steigt auf</h3>
            <p>Starke Babyboomer-Jahrgänge verschwinden nicht. Sie wechseln sichtbar von Erwerbsalter in Ruhestand und hohe Altersgruppen.</p>
          </article>
          <article className="story-card data-card reveal">
            <AtlasArt atlas="story-method" quadrant={2} className="story-art" />
            <div className="story-index">03</div>
            <h3>Wanderung formt neu</h3>
            <p>Zu- und Fortzüge wirken besonders in jungen und mittleren Altersgruppen — und verändern dadurch auch spätere Generationen.</p>
          </article>
        </div>
      </section>

      <section className="section wrap" id="methodik">
        <article className="method-card data-card reveal">
          <AtlasArt atlas="story-method" quadrant={3} className="method-art" />
          <div className="method-title">
            <span className="section-kicker">04 / Methodik</span>
            <h2>Exakt.<br />Und ehrlich modelliert.</h2>
          </div>
          <div className="method-copy">
            <div>
              <span>Amtlich übernommen</span>
              <p>Bevölkerung und Geschlechterverteilung Ende 2025, Geburten und Geburtenziffer 2025 sowie Ergebnisgrößen der 16. koordinierten Bevölkerungsvorausberechnung.</p>
            </div>
            <div>
              <span>Visualisierungsmodell</span>
              <p>Die Einzelaltersform ist realistisch kalibriert, auf die amtlichen Summen normiert und altert mit geschlechtsabhängigen Überlebensraten. Die Projektion folgt der moderaten Zielgröße von 74,7 Millionen.</p>
            </div>
            <div>
              <span>Wichtig</span>
              <p>Die animierten Einzeljahre sind eine anschauliche Modellierung, keine amtliche Mikrosimulation. Für Forschung sind die vollständigen GENESIS-Tabellen maßgeblich.</p>
            </div>
          </div>
        </article>
      </section>

      <footer className="footer">
        <div className="wrap footer-inner">
          <div>
            <a className="brand footer-brand" href={sitePath()}><span className="brand-mark"><span>D</span></span><span>DEMOGRAFIE <b>/ DE</b></span></a>
            <p>Eine interaktive Datenstory über Deutschlands Wandel — ohne fixes „Aussterbedatum“.</p>
          </div>
          <div className="source-links">
            <span>Primärquellen</span>
            <a href="https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsstand/_inhalt.html" target="_blank" rel="noreferrer">Bevölkerungsstand ↗</a>
            <a href="https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Geburten/_inhalt.html" target="_blank" rel="noreferrer">Geburten 2025 ↗</a>
            <a href="https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsvorausberechnung/annahmen_ergebnisse_16te_kBv.html" target="_blank" rel="noreferrer">16. Vorausberechnung ↗</a>
          </div>
          <a className="back-top" href="#top" aria-label="Zurück nach oben">↑</a>
        </div>
      </footer>
      <AtlasFooter compact countryCode="DE" />
    </main>
  );
}
