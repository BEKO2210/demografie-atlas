/** Statisches Diagramm — bewusst Server Component, es hat keinerlei Interaktion. */
export function ProjectionChart() {
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
