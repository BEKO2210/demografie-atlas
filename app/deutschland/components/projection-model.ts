export type Population = { men: number[]; women: number[] };

export const FIRST_YEAR = 2025;
export const LAST_YEAR = 2070;
export const OFFICIAL_MEN_2025 = 41.184322;
export const OFFICIAL_WOMEN_2025 = 42.282795;
export const OFFICIAL_TOTAL_2025 = 83.467117;
/** Amtlich: 654.241 Lebendgeborene im Jahr 2025. */
export const OFFICIAL_BIRTHS_2025 = 0.654241;
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

/**
 * Basisverteilung für 2025.
 *
 * Der jüngste Jahrgang wird auf die amtlich gemeldeten 654.241 Lebendgeborenen
 * gesetzt, nicht auf den Wert, den die Normierung der Formkurve zufällig ergibt.
 * Das hat zwei Gründe: die Zahl steht als amtlicher Wert auf derselben Seite,
 * und die Projektion schreibt ab 2025 mit genau diesem Wert fort — stimmen beide
 * nicht überein, entsteht am Übergang ein sichtbarer Sprung im Diagramm.
 * Die Differenz wird auf die übrigen Jahrgänge verteilt, damit die amtlichen
 * Summen je Geschlecht exakt erhalten bleiben.
 */
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

  const scaled = {
    men: men.map((value) => (value * OFFICIAL_MEN_2025) / sumMen),
    women: women.map((value) => (value * OFFICIAL_WOMEN_2025) / sumWomen),
  };

  const shareAtBirth = maleShare(0);
  const anchor = (values: number[], total: number, newborns: number) => {
    const rest = total - newborns;
    const restBefore = total - values[0];
    return values.map((value, age) => (age === 0 ? newborns : (value * rest) / restBefore));
  };

  return {
    men: anchor(scaled.men, OFFICIAL_MEN_2025, OFFICIAL_BIRTHS_2025 * shareAtBirth),
    women: anchor(scaled.women, OFFICIAL_WOMEN_2025, OFFICIAL_BIRTHS_2025 * (1 - shareAtBirth)),
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

/**
 * Geburtenzahl der Projektionsjahre.
 *
 * Sie bleibt auf dem amtlichen Wert von 2025. Das ist bewusst eine schlichte
 * Annahme und keine Prognose: eine eigene Geburtenkurve zu erfinden hieße, eine
 * Zahl zu behaupten, für die es hier keine geprüfte Grundlage gibt. Weil der
 * jüngste Jahrgang der Basisverteilung auf denselben Wert gesetzt ist, geht die
 * Kurve am Übergang stetig ineinander über — der frühere Knick am Jahrgang 2025
 * entstand allein aus der Abweichung zwischen beiden Werten.
 */
function birthsPerYear() {
  return OFFICIAL_BIRTHS_2025;
}

export function buildProjection() {
  const base = makeBase();

  const years: Record<number, Population> = { [FIRST_YEAR]: base };
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

    const newborns = birthsPerYear();
    men[0] = newborns * 0.512;
    women[0] = newborns * 0.488;

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

export function interpolatePopulation(years: Record<number, Population>, year: number) {
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

/** Geschütztes Leerzeichen zwischen Zahl und Einheit — Zahl und Maß gehören zusammen. */
export const NBSP = " ";

/** Typografisches Minus (U+2212); im ganzen Projekt einheitlich. */
export const MINUS = "−";

/**
 * Millionenangabe in einer einzigen Rundung. Vorher stand dieselbe Zahl als
 * „83,47 Mio." auf der Kachel und als „83,5 Mio." über der Pyramide.
 */
export function formatMillions(value: number) {
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })}${NBSP}Mio.`;
}
