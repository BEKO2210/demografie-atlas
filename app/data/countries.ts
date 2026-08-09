export type CountryStatus = "live" | "next" | "planned";

export type Country = {
  slug: string;
  name: string;
  nativeName: string;
  flag: string;
  code: string;
  status: CountryStatus;
  horizon: string;
  signal: string;
  description: string;
  accent: string;
  accentSoft: string;
};

export const countries: Country[] = [
  {
    slug: "deutschland",
    name: "Deutschland",
    nativeName: "Deutschland",
    flag: "🇩🇪",
    code: "DE",
    status: "live",
    horizon: "2025–2070",
    signal: "83,47 Mio.",
    description: "Eine interaktive Zeitreise durch Alterung, Geburten und Wanderung.",
    accent: "#f0c878",
    accentSoft: "rgba(240, 200, 120, .18)",
  },
  {
    slug: "frankreich",
    name: "Frankreich",
    nativeName: "France",
    flag: "🇫🇷",
    code: "FR",
    status: "next",
    horizon: "Demnächst",
    signal: "Nächster Atlas",
    description: "Geburten, Migration und Metropolregionen im europäischen Vergleich.",
    accent: "#7fa8ff",
    accentSoft: "rgba(80, 125, 255, .17)",
  },
  {
    slug: "italien",
    name: "Italien",
    nativeName: "Italia",
    flag: "🇮🇹",
    code: "IT",
    status: "planned",
    horizon: "In Planung",
    signal: "Südeuropa",
    description: "Wie niedrige Geburtenraten Regionen und Generationen neu ordnen.",
    accent: "#7ce1aa",
    accentSoft: "rgba(90, 211, 152, .15)",
  },
  {
    slug: "japan",
    name: "Japan",
    nativeName: "日本",
    flag: "🇯🇵",
    code: "JP",
    status: "planned",
    horizon: "In Planung",
    signal: "Super-Aging",
    description: "Der globale Referenzfall für eine sehr alte Gesellschaft.",
    accent: "#ff8e9f",
    accentSoft: "rgba(255, 104, 130, .15)",
  },
  {
    slug: "suedkorea",
    name: "Südkorea",
    nativeName: "대한민국",
    flag: "🇰🇷",
    code: "KR",
    status: "planned",
    horizon: "In Planung",
    signal: "Tempo",
    description: "Ein außergewöhnlich schneller Wandel der Altersstruktur.",
    accent: "#74c9ff",
    accentSoft: "rgba(74, 174, 255, .15)",
  },
  {
    slug: "usa",
    name: "USA",
    nativeName: "United States",
    flag: "🇺🇸",
    code: "US",
    status: "planned",
    horizon: "In Planung",
    signal: "Migration",
    description: "Bevölkerungsdynamik zwischen Regionen, Zuzug und Generationen.",
    accent: "#a18cff",
    accentSoft: "rgba(145, 118, 255, .17)",
  },
];

export const liveCountries = countries.filter((country) => country.status === "live");
