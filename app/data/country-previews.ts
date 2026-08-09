/**
 * Inhalte der Länderseiten, solange deren Datenstory noch nicht steht.
 *
 * Bewusst ohne konkrete Zahlen: sie wären zum Zeitpunkt des Lesens womöglich
 * veraltet und es gibt hier noch keine geprüfte Datengrundlage. Stattdessen
 * beschreibt jede Seite, worum es in dem Land demografisch geht, was der Atlas
 * zeigen wird und aus welchen amtlichen Quellen die Daten kommen werden.
 */
export type CountryPreview = {
  slug: string;
  /** Ein Satz für Suchmaschinen und geteilte Links. */
  summary: string;
  /** Zwei Absätze Einordnung — was dieses Land demografisch besonders macht. */
  intro: string[];
  /** Was die fertige Datenstory zeigen wird. */
  chapters: { title: string; text: string }[];
  /** Amtliche Stellen, aus denen die Daten stammen werden. */
  sources: { label: string; href: string }[];
};

export const countryPreviews: CountryPreview[] = [
  {
    slug: "frankreich",
    summary:
      "Frankreich im Demografie Atlas: Geburtenentwicklung, Zuwanderung und Metropolregionen im Vergleich zu Deutschland. Die Datenstory ist in Vorbereitung.",
    intro: [
      "Frankreich gilt lange als Ausnahme in Europa: Über Jahrzehnte lag die Geburtenziffer deutlich über der vieler Nachbarländer, gestützt von einer breit angelegten Familienpolitik. In den letzten Jahren sinkt sie allerdings auch dort spürbar — und damit stellt sich dieselbe Frage wie überall: Wie verändert das die Altersstruktur?",
      "Interessant ist Frankreich vor allem im Vergleich. Weil Ausgangslage und Politik sich von Deutschland unterscheiden, lässt sich an diesem Land ablesen, wie viel eine höhere Geburtenziffer über Jahrzehnte tatsächlich bewirkt — und wo auch sie an Grenzen stößt.",
    ],
    chapters: [
      { title: "Altersstruktur in Bewegung", text: "Dieselbe interaktive Bevölkerungspyramide wie für Deutschland: Jahrgänge wandern sichtbar nach oben, die Basis verändert ihre Breite." },
      { title: "Projektion mit Spannweite", text: "Nicht eine Linie, sondern der Möglichkeitsraum aus unterschiedlichen Annahmen zu Geburten, Lebenserwartung und Wanderung." },
      { title: "Vergleich mit Deutschland", text: "Beide Länder nebeneinander — was eine über Jahrzehnte höhere Geburtenziffer an der Altersstruktur verändert und was nicht." },
    ],
    sources: [
      { label: "INSEE — Institut national de la statistique", href: "https://www.insee.fr/" },
      { label: "Eurostat — Bevölkerung und Demografie", href: "https://ec.europa.eu/eurostat/web/population-demography" },
    ],
  },
  {
    slug: "italien",
    summary:
      "Italien im Demografie Atlas: sehr niedrige Geburtenraten, starke Unterschiede zwischen Nord und Süd und Folgen für die Altersstruktur. Datenstory in Vorbereitung.",
    intro: [
      "Italien gehört seit Jahren zu den Ländern mit den niedrigsten Geburtenziffern Europas. Das Besondere ist dabei weniger der Landesdurchschnitt als die Spannweite im Land selbst: Zwischen Norden und Süden, zwischen Ballungsräumen und abwandernden Regionen liegen demografische Welten.",
      "Damit wird Italien zum Lehrstück dafür, dass eine nationale Zahl wenig erklärt. Erst die regionale Auflösung zeigt, wo Schulen schließen, wo Pflegebedarf zuerst steigt und wo Zuzug den Trend örtlich umkehrt.",
    ],
    chapters: [
      { title: "Altersstruktur in Bewegung", text: "Die interaktive Pyramide für Italien — mit einer Basis, die früher und stärker schmaler wird als in Deutschland." },
      { title: "Regionale Spannweite", text: "Wie weit Norden und Süden auseinanderliegen und was das für die Gesamtzahl bedeutet." },
      { title: "Wanderung als Ausgleich", text: "Welchen Anteil Zu- und Fortzüge an der Entwicklung haben — innerhalb des Landes und über die Grenzen." },
    ],
    sources: [
      { label: "ISTAT — Istituto Nazionale di Statistica", href: "https://www.istat.it/" },
      { label: "Eurostat — Bevölkerung und Demografie", href: "https://ec.europa.eu/eurostat/web/population-demography" },
    ],
  },
  {
    slug: "japan",
    summary:
      "Japan im Demografie Atlas: der internationale Referenzfall für eine bereits sehr alte und schrumpfende Gesellschaft. Die Datenstory ist in Vorbereitung.",
    intro: [
      "Japan ist der Fall, auf den alle schauen. Das Land hat eine der ältesten Bevölkerungen der Welt und schrumpft seit Jahren — nicht als Prognose, sondern als gemessene Gegenwart. Was anderswo als Zukunftsszenario diskutiert wird, ist dort Alltag.",
      "Deshalb lohnt der Blick dorthin doppelt: Er zeigt, wie eine Gesellschaft mit dieser Altersstruktur tatsächlich funktioniert — und er macht sichtbar, welche Anpassungen früh greifen und welche zu spät kommen.",
    ],
    chapters: [
      { title: "Altersstruktur in Bewegung", text: "Eine Pyramide, die keine mehr ist: die interaktive Darstellung einer bereits umgekehrten Altersstruktur." },
      { title: "Schrumpfung im Verlauf", text: "Der gemessene Rückgang der vergangenen Jahre und die amtliche Vorausberechnung für die kommenden Jahrzehnte." },
      { title: "Was Deutschland daraus liest", text: "Welche Entwicklungen sich übertragen lassen — und welche an japanischen Besonderheiten hängen." },
    ],
    sources: [
      { label: "Statistics Bureau of Japan", href: "https://www.stat.go.jp/english/" },
      { label: "National Institute of Population and Social Security Research", href: "https://www.ipss.go.jp/index-e.asp" },
    ],
  },
  {
    slug: "suedkorea",
    summary:
      "Südkorea im Demografie Atlas: die weltweit niedrigste Geburtenziffer und der schnellste Wandel einer Altersstruktur. Die Datenstory ist in Vorbereitung.",
    intro: [
      "Südkorea weist seit Jahren die weltweit niedrigste Geburtenziffer aus. Bemerkenswert ist dabei vor allem das Tempo: Das Land hat den Weg von einer jungen zu einer sehr alten Gesellschaft in wenigen Jahrzehnten zurückgelegt — eine Entwicklung, für die europäische Länder mehr als doppelt so lange gebraucht haben.",
      "Genau dieses Tempo macht Südkorea zum interessantesten Vergleichsfall. Es zeigt, was passiert, wenn eine Gesellschaft keine Generation Zeit hat, sich anzupassen.",
    ],
    chapters: [
      { title: "Altersstruktur in Bewegung", text: "Die interaktive Pyramide mit der schmalsten Basis aller Atlas-Länder." },
      { title: "Tempo im Vergleich", text: "Wie lange andere Länder für denselben Wandel gebraucht haben — nebeneinandergelegt." },
      { title: "Projektion", text: "Der Möglichkeitsraum der amtlichen Vorausberechnung, mit und ohne Zuwanderung." },
    ],
    sources: [
      { label: "Statistics Korea", href: "https://kostat.go.kr/" },
      { label: "UN World Population Prospects", href: "https://population.un.org/wpp/" },
    ],
  },
  {
    slug: "usa",
    summary:
      "Die USA im Demografie Atlas: Bevölkerungsdynamik zwischen Zuwanderung, Regionen und Generationen im wachsenden Industrieland. Datenstory in Vorbereitung.",
    intro: [
      "Die Vereinigten Staaten sind unter den großen Industrieländern lange die Ausnahme gewesen: Die Bevölkerung wuchs weiter, während sie anderswo stagnierte. Getragen wird dieses Wachstum inzwischen vor allem von Zuwanderung, denn die Geburtenziffer liegt auch dort unter dem bestandserhaltenden Niveau.",
      "Damit werden die USA zum Prüfstein für eine Frage, die auch in Deutschland gestellt wird: Wie viel kann Wanderung an einer Altersstruktur überhaupt ausrichten — und über welchen Zeitraum?",
    ],
    chapters: [
      { title: "Altersstruktur in Bewegung", text: "Die interaktive Pyramide für ein Land, dessen Form stärker von Wanderung geprägt ist als von Geburten." },
      { title: "Wanderung als Motor", text: "Wie sich die Gesamtzahl entwickelt, wenn man den Wanderungssaldo verändert." },
      { title: "Regionale Verschiebung", text: "Wohin die Bevölkerung innerhalb des Landes zieht und was das für einzelne Bundesstaaten bedeutet." },
    ],
    sources: [
      { label: "United States Census Bureau", href: "https://www.census.gov/" },
      { label: "UN World Population Prospects", href: "https://population.un.org/wpp/" },
    ],
  },
];

export const previewBySlug = new Map(countryPreviews.map((entry) => [entry.slug, entry]));
