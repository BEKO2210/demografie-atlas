"use client";

import { useState } from "react";
import { AtlasArt } from "../../components/atlas-art";
import { MINUS, NBSP } from "./projection-model";

const REPLACEMENT = 2.1;
const MIN_RATE = 0.8;
const MAX_RATE = 3;

const signed = (value: number, digits: number) => {
  const rounded = Number(value.toFixed(digits));
  const sign = rounded === 0 ? "±" : rounded < 0 ? MINUS : "+";
  return `${sign}${Math.abs(rounded).toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits })}${NBSP}%`;
};

/** Position eines Werts auf dem Regler in Prozent — für die Beschriftung darunter. */
const scalePosition = (value: number) => ((value - MIN_RATE) / (MAX_RATE - MIN_RATE)) * 100;

const SCALE_MARKS: { value: number; label: string }[] = [
  { value: 0.8, label: "0,8" },
  { value: 1.32, label: "1,32 heute" },
  { value: 2.1, label: "2,1 stabil" },
  { value: 3, label: "3,0" },
];

export function FertilitySimulator() {
  const [rate, setRate] = useState(1.32);
  const generationFactor = rate / REPLACEMENT;
  /**
   * Wort und Zahl müssen zusammenpassen: beide leiten sich aus derselben
   * gerundeten Größe ab. Vorher trennten harte Raten-Grenzen 1,99 und 2,00 in
   * „Schrumpfung" und „Nahezu stabil", obwohl beide 95 % und −5 % anzeigten.
   */
  const shownPercent = Math.round(generationFactor * 100);
  const shownChange = shownPercent - 100;
  const annualChange = (Math.pow(generationFactor, 1 / 30) - 1) * 100;
  const barWidth = Math.min(100, generationFactor * 70);
  let status = "Nahezu stabil";
  let statusClass = "good";
  if (shownChange <= -25) { status = "Starke Schrumpfung"; statusClass = "danger"; }
  else if (shownChange < -5) { status = "Schrumpfung"; statusClass = "warn"; }
  else if (shownChange > 5) { status = "Wachstum"; statusClass = "info"; }

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
          min={MIN_RATE}
          max={MAX_RATE}
          step="0.01"
          value={rate}
          onChange={(event) => setRate(Number(event.target.value))}
          aria-label="Kinderzahl je Frau einstellen"
        />
        {/* Die Marken sitzen an ihrer echten Reglerposition, nicht gleichmäßig verteilt. */}
        <div className="fertility-scale is-positioned" aria-hidden="true">
          {SCALE_MARKS.map((mark, index) => {
            const position = scalePosition(mark.value);
            const shift = index === 0 ? "0" : index === SCALE_MARKS.length - 1 ? "-100%" : "-50%";
            return (
              <span key={mark.label} style={{ left: `${position}%`, transform: `translateX(${shift})` }}>
                {mark.label}
              </span>
            );
          })}
        </div>
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
            <strong>100{NBSP}%</strong>
          </div>
          <div className="generation-row child-row">
            <span>Kinder-Generation</span>
            <i><b style={{ width: `${barWidth}%` }} /></i>
            <strong>{shownPercent}{NBSP}%</strong>
          </div>
        </div>

        <div className="sim-stats">
          <div><span>Je Generation · rund 30 Jahre</span><strong>{signed(shownChange, 0)}</strong></div>
          <div><span>Langfristig pro Jahr</span><strong>{signed(annualChange, 1)}</strong></div>
          <div><span>Ohne Zuwanderung</span><strong className={`scenario-status ${statusClass}`}>{status}</strong></div>
        </div>
        <p className="model-note">Vereinfachtes Rechenmodell: Verhältnis zur Ersatzrate 2,1 über einen Generationenabstand von 30 Jahren. Keine Bevölkerungsprognose.</p>
      </div>
    </article>
  );
}
