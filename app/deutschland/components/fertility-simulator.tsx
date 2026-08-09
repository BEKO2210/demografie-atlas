"use client";

import { useState } from "react";
import { AtlasArt } from "../../components/atlas-art";

const REPLACEMENT = 2.1;

const signed = (value: number, digits: number) =>
  `${value >= 0 ? "+" : "−"}${Math.abs(value).toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;

export function FertilitySimulator() {
  const [rate, setRate] = useState(1.32);
  const generationFactor = rate / REPLACEMENT;
  const generationChange = (generationFactor - 1) * 100;
  const annualChange = (Math.pow(generationFactor, 1 / 30) - 1) * 100;
  const barWidth = Math.min(100, generationFactor * 70);
  let status = "Schrumpfung";
  let statusClass = "warn";
  if (rate < 1.5) { status = "Starke Schrumpfung"; statusClass = "danger"; }
  else if (rate >= 2 && rate <= 2.2) { status = "Nahezu stabil"; statusClass = "good"; }
  else if (rate > 2.2) { status = "Wachstum"; statusClass = "info"; }

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
