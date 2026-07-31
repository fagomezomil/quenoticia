import Header from "@/components/Header";
import NavbarWrapper from "@/components/NavbarWrapper";
import Footer from "@/components/Footer";
import { sectionConfig } from "@/lib/data";

const WHATSAPP_URL =
  "https://wa.me/5493815627057?text=Hola%2C%20quiero%20pedir%20presupuesto%20de%20publicidad";

type Formato = {
  nombre: string;
  ratio: string;
  desktop: string;
  mobile: string;
  ubicaciones: string;
  aspect: "8/1" | "8/5" | "free";
};

const formatos: Formato[] = [
  {
    nombre: "Leaderboard",
    ratio: "8:1",
    desktop: "1280×160",
    mobile: "320×40",
    ubicaciones:
      "Header de homepage, secciones, artículo, agenda y opinión. También abajo de portada.",
    aspect: "8/1",
  },
  {
    nombre: "Rectangle",
    ratio: "8:5",
    desktop: "400×250",
    mobile: "320×200",
    ubicaciones: "Homepage y sidebar de secciones.",
    aspect: "8/5",
  },
  {
    nombre: "Sidebar",
    ratio: "8:5",
    desktop: "400×250",
    mobile: "320×200",
    ubicaciones:
      "Sidebar de artículo, columna de opinion, perfil de columnista y agenda.",
    aspect: "8/5",
  },
  {
    nombre: "Infeed",
    ratio: "8:5",
    desktop: "400×250",
    mobile: "320×200",
    ubicaciones:
      "Feed de artículos en homepage y secciones, etiquetado 'Aviso publicitario'.",
    aspect: "8/5",
  },
  {
    nombre: "Sticky footer",
    ratio: "8:1",
    desktop: "—",
    mobile: "320×40",
    ubicaciones: "Banner fijo abajo en mobile, con botón cerrar.",
    aspect: "8/1",
  },
  {
    nombre: "Modal",
    ratio: "libre",
    desktop: "900×600 aprox",
    mobile: "95vw × 80vh",
    ubicaciones: "Popup con frequency capping (máx 3/día + 1/sesión).",
    aspect: "free",
  },
];

type Paso = { n: string; titulo: string; texto: string };

const pasos: Paso[] = [
  {
    n: "1",
    titulo: "Escribinos",
    texto:
      "Mandanos un WhatsApp con el formato que querés y la sección objetivo.",
  },
  {
    n: "2",
    titulo: "Te pasamos presupuesto",
    texto: "Según formato, sección y vigencia. Sin sorpresas.",
  },
  {
    n: "3",
    titulo: "Envías el material",
    texto:
      "Banner en PNG o JPG con las medidas del formato elegido. Lo subimos al sistema.",
  },
  {
    n: "4",
    titulo: "Aprobación y programación",
    texto:
      "Te confirmamos fechas y horarios. La rotación arranca en la fecha pactada.",
  },
  {
    n: "5",
    titulo: "Seguimiento",
    texto:
      "Te decimos cómo rindió. Si contratás varios avisos, rotan automáticamente para no repetir.",
  },
];

type Spec = { label: string; valor: string };

const specs: Spec[] = [
  { label: "Formatos de imagen", valor: "PNG o JPG" },
  { label: "Peso máximo", valor: "500 KB" },
  {
    label: "Relación de aspecto",
    valor:
      "8:1 (leader / sticky) · 8:5 (rectangle / sidebar / infeed) · libre (modal)",
  },
  { label: "Plazo de entrega", valor: "48 h antes de la fecha de inicio" },
  { label: "URL de destino", valor: "Link a donde dirige el click. Opcional." },
];

const porQue = [
  {
    titulo: "Audiencia local",
    texto:
      "Lectores de Tucumán y NOA que consumen información política, deportiva, económica, internacional, tucumana y de opinión todos los días.",
  },
  {
    titulo: "Cobertura actualizada",
    texto:
      "Mantenemos actualizadas varias veces al día la portada y sus secciones con artículos regionales y nacionales. Tu aviso convive con noticias frescas todo el día.",
  },
  {
    titulo: "Formatos para todos los presupuestos",
    texto:
      "Desde un banner hasta una nota patrocinada con diseño editorial. Elegís el formato que mejor encaja con tu marca.",
  },
];

export default function ContrataAquiPage() {
  return (
    <>
      <Header />
      <NavbarWrapper />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* HERO */}
        <section className="relative bg-ink text-white overflow-hidden shadow-hard-lg">
          <div className="absolute inset-0 halftone opacity-25 pointer-events-none" />
          <div className="relative px-6 py-14 md:px-12 md:py-20">
            <p className="font-[family-name:var(--font-heading)] uppercase tracking-[0.35em] text-xs text-brand mb-4">
              Publicidad en ¡QUE NOTICIA!
            </p>
            <h1 className="font-[family-name:var(--font-heading)] font-bold uppercase text-4xl md:text-6xl leading-[0.95] tracking-tight">
              Contratá tu <span className="text-brand">espacio</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-white/80 font-[family-name:var(--font-body)]">
              Llegá a los tucumanos que consumen noticias todos los días. Banner
              fijo, contenido patrocinado o presencia en una sección específica —
              vos elegís dónde aparecer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand text-ink font-[family-name:var(--font-heading)] uppercase tracking-wide font-bold px-6 py-3 shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-sm transition-all"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                  aria-hidden
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Pedir presupuesto
              </a>
              <a
                href="#formatos"
                className="inline-flex items-center bg-transparent border-2 border-white text-white font-[family-name:var(--font-heading)] uppercase tracking-wide font-bold px-6 py-3 hover:bg-white hover:text-ink transition-colors"
              >
                Ver formatos y medidas
              </a>
            </div>
          </div>
        </section>

        {/* POR QUÉ ANUNCIARTE */}
        <section className="mt-16">
          <h2 className="font-[family-name:var(--font-heading)] uppercase text-3xl md:text-4xl font-bold tracking-tight">
            Por qué anunciarte en{" "}
            <span className="text-brand">
              <span className="text-ink">¡</span>QUE
              <span className="text-ink">NOTICIA!</span>
            </span>
          </h2>
          <div className="mt-6 h-[3px] w-24 bg-ink" />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {porQue.map((item) => (
              <div
                key={item.titulo}
                className="bg-paper border-2 border-ink p-6 shadow-hard"
              >
                <h3 className="font-[family-name:var(--font-heading)] uppercase text-xl font-bold tracking-wide text-brand">
                  {item.titulo}
                </h3>
                <p className="mt-3 text-sm leading-relaxed font-[family-name:var(--font-body)]">
                  {item.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* BENTO DE FORMATOS */}
        <section id="formatos" className="mt-16 scroll-mt-4">
          <h2 className="font-[family-name:var(--font-heading)] uppercase text-3xl md:text-4xl font-bold tracking-tight">
            Formatos banner y ubicaciones
          </h2>
          <div className="mt-6 h-[3px] w-24 bg-ink" />
          <p className="mt-4 max-w-3xl text-base leading-relaxed font-[family-name:var(--font-body)]">
            Elegí dónde y cómo querés aparecer. Todos los formatos aceptan
            segmentación por sección y rotación temporal con transición suave.
            Las medidas son relaciones de aspecto estándar — la imagen se
            ajusta proporcionalmente, nunca se recorta.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formatos.map((f) => (
              <article
                key={f.nombre}
                className="bg-paper border-2 border-ink shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-sm transition-all flex flex-col"
              >
                {/* Miniatura proporcional */}
                <div className="bg-cream border-b-2 border-ink p-4 flex items-center justify-center min-h-[120px]">
                  {f.aspect === "free" ? (
                    <div className="w-3/4 aspect-[3/2] bg-ink/10 border-2 border-ink/40 flex items-center justify-center">
                      <span className="font-[family-name:var(--font-heading)] uppercase text-xs tracking-widest text-ink/50">
                        libre
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`bg-brand/20 border-2 border-ink ${
                        f.aspect === "8/1"
                          ? "w-full aspect-[8/1]"
                          : "w-2/3 aspect-[8/5]"
                      }`}
                    />
                  )}
                </div>

                {/* Datos */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-[family-name:var(--font-heading)] uppercase text-xl font-bold tracking-wide">
                      {f.nombre}
                    </h3>
                    <span className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-widest text-brand font-bold">
                      {f.ratio}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-1 text-xs font-[family-name:var(--font-body)]">
                    <div className="flex gap-2">
                      <dt className="text-ink/60 uppercase tracking-wide font-[family-name:var(--font-heading)] w-16 shrink-0">
                        Desktop
                      </dt>
                      <dd className="text-ink">{f.desktop}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-ink/60 uppercase tracking-wide font-[family-name:var(--font-heading)] w-16 shrink-0">
                        Mobile
                      </dt>
                      <dd className="text-ink">{f.mobile}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs leading-relaxed font-[family-name:var(--font-body)] text-ink/80">
                    {f.ubicaciones}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-6 text-xs text-ink/60 italic font-[family-name:var(--font-body)]">
            * Las imágenes se ajustan con <code>object-contain</code> sobre fondo
            papel. Si la imagen no respeta la relación exacta, se ve entera con
            letterbox — nunca se corta.
          </p>
        </section>

        {/* CONTENIDO PATROCINADO + SECCIONES */}
        <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patrocinado */}
          <div className="bg-paper border-2 border-ink shadow-hard p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block bg-brand text-ink font-[family-name:var(--font-heading)] uppercase tracking-widest text-[10px] font-bold px-2 py-1">
                Patrocinado
              </span>
              <h2 className="font-[family-name:var(--font-heading)] uppercase text-2xl md:text-3xl font-bold tracking-tight">
                Contenido patrocinado
              </h2>
            </div>
            <div className="h-[3px] w-16 bg-ink mb-4" />
            <p className="text-sm leading-relaxed font-[family-name:var(--font-body)]">
              Más que un banner: una nota con formato editorial, escrita y
              diseñada para tu marca, publicada en una sección específica o en
              todas.
            </p>
            <ul className="mt-4 space-y-3 text-sm font-[family-name:var(--font-body)]">
              <li className="flex gap-2">
                <span className="text-brand font-bold shrink-0" aria-hidden>
                  ▸
                </span>
                <span>
                  <strong className="font-[family-name:var(--font-heading)] uppercase tracking-wide text-xs">
                    Nota con formato editorial:
                  </strong>{" "}
                  título, volanta, bajada, cuerpo y portada. Diseño idéntico al
                  de una nota del medio.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand font-bold shrink-0" aria-hidden>
                  ▸
                </span>
                <span>
                  <strong className="font-[family-name:var(--font-heading)] uppercase tracking-wide text-xs">
                    Ubicación flexible:
                  </strong>{" "}
                  aparece en portada, en la sección elegida y en el sidebar como
                  tarjeta.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand font-bold shrink-0" aria-hidden>
                  ▸
                </span>
                <span>
                  <strong className="font-[family-name:var(--font-heading)] uppercase tracking-wide text-xs">
                    Vigencia definida:
                  </strong>{" "}
                  configurás fecha de inicio y de fin. Cuando vence, se
                  despublica solo.
                </span>
              </li>
            </ul>
            <div className="mt-5 p-3 border-l-4 border-brand bg-cream">
              <p className="text-xs font-[family-name:var(--font-body)]">
                <strong className="font-[family-name:var(--font-heading)] uppercase tracking-wide">
                  Etiqueta obligatoria:
                </strong>{" "}
                todo contenido patrocinado lleva el sello "Patrocinado" visible —
                sin excepciones. Tu marca gana credibilidad, el lector no se
                confunde.
              </p>
            </div>
          </div>

          {/* Secciones */}
          <div className="bg-paper border-2 border-ink shadow-hard p-6">
            <h2 className="font-[family-name:var(--font-heading)] uppercase text-2xl md:text-3xl font-bold tracking-tight">
              Elegí dónde aparecer
            </h2>
            <div className="h-[3px] w-16 bg-ink mt-4 mb-4" />
            <p className="text-sm leading-relaxed font-[family-name:var(--font-body)]">
              Tu aviso puede estar en todas las secciones o sólo en la que mejor
              encaja con tu público.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(sectionConfig).map(([key, cfg]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 border-2 border-ink bg-cream px-3 py-1.5 shadow-hard-sm font-[family-name:var(--font-heading)] uppercase text-xs tracking-wide font-bold"
                  style={{ color: cfg.color }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                    aria-hidden
                  />
                  {cfg.label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 border-2 border-ink bg-ink text-white px-3 py-1.5 shadow-hard-sm font-[family-name:var(--font-heading)] uppercase text-xs tracking-wide font-bold">
                <span
                  className="w-2.5 h-2.5 rounded-full bg-brand"
                  aria-hidden
                />
                Todas
              </span>
            </div>
            <div className="mt-6 space-y-3 text-sm font-[family-name:var(--font-body)]">
              <div className="flex gap-2">
                <span className="text-brand font-bold shrink-0" aria-hidden>
                  ▸
                </span>
                <span>
                  <strong className="font-[family-name:var(--font-heading)] uppercase tracking-wide text-xs">
                    Aviso global:
                  </strong>{" "}
                  sin segmentación. Aparece en todas las secciones. Ideal para
                  marcas que buscan alcance masivo.
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-brand font-bold shrink-0" aria-hidden>
                  ▸
                </span>
                <span>
                  <strong className="font-[family-name:var(--font-heading)] uppercase tracking-wide text-xs">
                    Aviso por sección:
                  </strong>{" "}
                  aparece sólo en la sección elegida. Mejor performance, menor
                  costo.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CÓMO CONTRATÁS + SPECS */}
        <section className="mt-16">
          <h2 className="font-[family-name:var(--font-heading)] uppercase text-3xl md:text-4xl font-bold tracking-tight">
            Cómo contratás tu espacio
          </h2>
          <div className="mt-6 h-[3px] w-24 bg-ink" />

          <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            {pasos.map((p) => (
              <div
                key={p.n}
                className="bg-paper border-2 border-ink p-4 shadow-hard-sm flex flex-col"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-ink text-brand font-[family-name:var(--font-heading)] font-bold text-2xl w-10 h-10 flex items-center justify-center shrink-0">
                    {p.n}
                  </span>
                  <h3 className="font-[family-name:var(--font-heading)] uppercase text-sm font-bold tracking-wide leading-tight">
                    {p.titulo}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed font-[family-name:var(--font-body)] text-ink/80">
                  {p.texto}
                </p>
              </div>
            ))}
          </div>

          {/* Specs */}
          <div className="mt-10 bg-paper border-2 border-ink shadow-hard">
            <div className="bg-ink text-white px-5 py-3">
              <h3 className="font-[family-name:var(--font-heading)] uppercase text-lg font-bold tracking-wide">
                Especificaciones técnicas
              </h3>
            </div>
            <dl className="divide-y-2 divide-ink/10">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="grid grid-cols-1 md:grid-cols-4 gap-2 px-5 py-3"
                >
                  <dt className="font-[family-name:var(--font-heading)] uppercase text-xs tracking-wide font-bold text-ink/70">
                    {s.label}
                  </dt>
                  <dd className="md:col-span-3 text-sm font-[family-name:var(--font-body)]">
                    {s.valor}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="px-5 py-3 border-t-2 border-ink/10 bg-cream">
              <p className="text-xs italic text-ink/70 font-[family-name:var(--font-body)]">
                Si necesitás que diseñemos el banner, lo hacemos con costo
                adicional. Consultá.
              </p>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mt-16">
          <div className="relative bg-ink text-white overflow-hidden shadow-hard-lg">
            <div className="absolute inset-0 halftone opacity-25 pointer-events-none" />
            <div className="relative px-6 py-12 md:px-12 md:py-16 text-center">
              <h2 className="font-[family-name:var(--font-heading)] uppercase text-3xl md:text-5xl font-bold tracking-tight">
                Listo para publicar tu aviso?
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-white/80 font-[family-name:var(--font-body)]">
                Escribinos por WhatsApp y armamos una propuesta a la medida de tu
                marca.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 bg-brand text-ink font-[family-name:var(--font-heading)] uppercase tracking-wide font-bold px-8 py-4 shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-sm transition-all"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                  aria-hidden
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp +54 9 381 5627057
              </a>
              <p className="mt-4 text-xs uppercase tracking-widest text-white/50 font-[family-name:var(--font-heading)]">
                Lunes a viernes · 9 a 18 h
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}