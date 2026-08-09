import { AtlasArt } from "../components/atlas-art";
import { CountryFlag } from "../components/country-flag";
import { Icon } from "../components/ui-icon";
import { Noise } from "../components/noise";
import { RevealObserver } from "../components/reveal-observer";
import { sitePath } from "../data/site";
import { FertilitySimulator } from "./components/fertility-simulator";
import { PopulationPyramid } from "./components/population-pyramid";
import { ProjectionChart } from "./components/projection-chart";
import { ScrollProgress } from "./components/scroll-progress";
import { MobileNav } from "../components/mobile-nav";

const metricCards = [
  { label: "Bevölkerung · 31.12.2025", value: "83,47 Mio.", note: "83.467.117 Menschen", tone: "gold" },
  { label: "Männer", value: "41,18 Mio.", note: "49,3 % der Bevölkerung", tone: "blue" },
  { label: "Frauen", value: "42,28 Mio.", note: "50,7 % der Bevölkerung", tone: "rose" },
  { label: "Geburtenziffer · 2025", value: "1,32", note: "Kinder je Frau", tone: "green" },
];

function BrandFlag() {
  return (
    <span className="brand-mark">
      <span className="brand-flag"><CountryFlag code="DE" name="Deutschland" round /></span>
    </span>
  );
}

export default function Home() {
  return (
    <main id="inhalt">
      <Noise />
      <div className="orb orb-one" aria-hidden="true" />
      <div className="orb orb-two" aria-hidden="true" />
      <RevealObserver rootMargin="0px 0px -45px" />

      <nav className="nav">
        <ScrollProgress />
        <div className="wrap nav-inner">
          <a className="brand" href={sitePath()} aria-label="Zur Länderübersicht">
            <BrandFlag />
            <span>DEMOGRAFIE <b>/ DE</b></span>
          </a>
          <div className="nav-links">
            <a href="#pyramide">Pyramide</a>
            <a href="#entwicklung">Entwicklung</a>
            <a href="#kinderzahl">Kinderzahl</a>
            <a href="#methodik">Methodik</a>
          </div>
          <span className="data-status"><i /> Datenstand 2025/26</span>
          <MobileNav
            links={[
              { href: "#pyramide", label: "Pyramide" },
              { href: "#entwicklung", label: "Entwicklung" },
              { href: "#kinderzahl", label: "Kinderzahl" },
              { href: "#kraefte", label: "Drei Kräfte" },
              { href: "#methodik", label: "Methodik" },
              { href: sitePath(), label: "Zur Länderübersicht" },
            ]}
          />
        </div>
      </nav>

      <header className="hero wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span>Interaktive Datenstory</span><b>2025–2070</b></div>
            <h1>Deutschland<br /><em>altert.</em><br />Es schrumpft langsamer als gedacht.</h1>
            <p className="hero-lead">
              Beobachte, wie 83 Millionen Menschen durch die Zeit wandern — und wie Geburten,
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
            <div className="hero-caption"><Icon name="spark" /> Mittlere Annahme des Statistischen Bundesamts</div>
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
              <span className="data-chip">Mittlere Annahme · Variante 2 von 27</span>
              <h3>
                <span className="future-number">74,7</span>
                <span>Millionen Menschen im Jahr 2070</span>
              </h3>
              <p>Die moderate Destatis-Variante liegt rund 8,8 Millionen unter dem Bevölkerungsstand von Ende 2025.</p>
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
            Ohne Wanderung gilt eine Geburtenziffer von etwa 2,1 Kindern je Frau als
            bestandserhaltendes Niveau. Deutschland lag 2025 bei 1,32.
          </p>
        </div>

        <div className="replacement-grid">
          <article className="replacement-card data-card reveal">
            <AtlasArt atlas="generations" quadrant={0} className="replacement-art" />
            <div className="replacement-copy">
              <span className="data-chip">Bestandserhaltender Richtwert</span>
              <h3>
                <span className="replacement-number">2,1</span>
                <span>Kinder je Frau</span>
              </h3>
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
            <span className="section-kicker">04 / Drei Kräfte</span>
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
            <span className="section-kicker">05 / Methodik</span>
            <h2>Exakt.<br />Und ehrlich modelliert.</h2>
          </div>
          <div className="method-copy">
            <div>
              <span>Amtlich übernommen</span>
              <p>Bevölkerung und Geschlechterverteilung Ende 2025, Geburten und Geburtenziffer 2025 sowie Ergebnisgrößen der 16. koordinierten Bevölkerungsvorausberechnung.</p>
            </div>
            <div>
              <span>Visualisierungsmodell</span>
              <p>Die Einzelaltersform ist realistisch kalibriert, auf die amtlichen Summen normiert und altert mit geschlechtsabhängigen Überlebensraten. Die Projektion folgt der moderaten Zielgröße von 74,7 Millionen.</p>
            </div>
            <div>
              <span>Was G2L2W2 bedeutet</span>
              <p>
                Die Kurzform benennt die drei Annahmen der Vorausberechnung: G2 steht für die
                mittlere Annahme zur Geburtenhäufigkeit, L2 für die mittlere Annahme zur
                Lebenserwartung, W2 für die mittlere Annahme zum Wanderungssaldo. Zusammen
                ergeben sie Variante 2 von insgesamt 27 gerechneten Varianten.
              </p>
            </div>
            <div>
              <span>Wichtig</span>
              <p>Die animierten Einzeljahre sind eine anschauliche Modellierung, keine amtliche Mikrosimulation. Für Forschung sind die vollständigen GENESIS-Tabellen maßgeblich.</p>
            </div>
          </div>
        </article>
      </section>

      {/* Eine Fußzeile — vorher standen zwei mit derselben Wortmarke untereinander. */}
      <footer className="footer">
        <div className="wrap footer-inner">
          <div>
            <a className="brand footer-brand" href={sitePath()}><BrandFlag /><span>DEMOGRAFIE <b>/ DE</b></span></a>
            <p>Eine interaktive Datenstory über Deutschlands Bevölkerung: Altersstruktur, Geburten und Wanderung von 2025 bis 2070.</p>
          </div>
          <div className="source-links">
            <span>Primärquellen</span>
            <a href="https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsstand/_inhalt.html" target="_blank" rel="noreferrer">Bevölkerungsstand ↗</a>
            <a href="https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Geburten/_inhalt.html" target="_blank" rel="noreferrer">Geburten 2025 ↗</a>
            <a href="https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsvorausberechnung/annahmen_ergebnisse_16te_kBv.html" target="_blank" rel="noreferrer">16. Vorausberechnung ↗</a>
          </div>
          <div className="source-links">
            <span>Atlas</span>
            <a href={sitePath()}>Länderübersicht</a>
            <a href={sitePath("/impressum")}>Impressum</a>
            <a href={sitePath("/datenschutz")}>Datenschutz</a>
            <small>© {new Date().getFullYear()}</small>
          </div>
          <a className="back-top" href="#inhalt" aria-label="Zurück nach oben">↑</a>
        </div>
      </footer>
    </main>
  );
}
