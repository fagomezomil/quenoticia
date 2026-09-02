import Header from "@/components/Header";
import NavbarWrapper from "@/components/NavbarWrapper";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import ArticleCard from "@/components/ArticleCard";
import AdRotator from "@/components/AdRotator";
import SponsoredRotator from "@/components/SponsoredRotator";
import { Article, Ad, Section, sectionConfig } from "@/lib/types";
import { cardByline } from "@/lib/format";

interface SectionPageLayoutProps {
  section: Section;
  articles: Article[];
  subtitle: string;
  allArticles: Article[];
  leaderboardAds?: Ad[];
  rectangleAds?: Ad[];
  sponsoredIds?: Set<string>;
  /** Contenidos patrocinados convertidos al tipo Article. Se rotan en el feed cada 7 notas. */
  sponsoredItems?: Article[];
  page?: number;
  perPage?: number;
}

const PER_PAGE = 11;

export default function SectionPageLayout({
  section,
  articles,
  subtitle,
  allArticles,
  leaderboardAds = [],
  rectangleAds = [],
  sponsoredIds = new Set(),
  sponsoredItems = [],
  page = 1,
  perPage = PER_PAGE,
}: SectionPageLayoutProps) {
  const cfg = sectionConfig[section];

  // Sort: urgente first, then destacada, then normal
  const sorted = [...articles].sort((a, b) => {
    const order: Record<string, number> = { urgente: 0, destacada: 1, normal: 2 };
    return (order[a.layout || "normal"] ?? 2) - (order[b.layout || "normal"] ?? 2);
  });

  // Urgente articles — full-width above grid, only on page 1
  const urgentArticles = sorted.filter((a) => a.layout === "urgente");
  const gridArticles = sorted.filter((a) => a.layout !== "urgente");

  // Page 1 keeps the editorial layout (featured + sidebar + grid).
  // Featured+sidebar consumen 5 items, grid muestra `gridPerPage` items más.
  // Page 2+ muestra `gridPerPage` items planos.
  // Con sponsored: 8 articles + 1 SponsoredRotator + 3 = 12 slots (3×4 lleno).
  // Sin sponsored: 9 articles + 3 = 12 slots (3×4 lleno, sin huecos).
  const PAGE1_OFFSET = 5; // featured(1) + sidebar(4)
  const hasSponsored = sponsoredItems.length > 0;
  const gridPerPage = hasSponsored ? perPage : perPage + 1;
  const totalPages = Math.max(1, Math.ceil((gridArticles.length - PAGE1_OFFSET) / gridPerPage) + 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const isFirstPage = currentPage === 1;

  let featured: Article | undefined;
  let sidebarItems: Article[] = [];
  let gridItems: Article[] = [];

  if (isFirstPage) {
    featured = gridArticles[0];
    sidebarItems = gridArticles.slice(1, PAGE1_OFFSET);
    gridItems = gridArticles.slice(PAGE1_OFFSET, PAGE1_OFFSET + gridPerPage);
  } else {
    const start = PAGE1_OFFSET + (currentPage - 2) * gridPerPage;
    gridItems = gridArticles.slice(start, start + gridPerPage);
  }

  return (
    <>
      <Header />
      <NavbarWrapper />
      <BreakingNews articles={allArticles} />

      <main className="max-w-7xl mx-auto px-4 pt-6 pb-10">
        {/* Section header — bold typographic anchor */}
        <div className="mb-6">
          <div
            className="border-l-4 pl-4 py-1"
            style={{ borderLeftColor: cfg.color }}
          >
            <h1
              className="text-3xl md:text-4xl font-black tracking-tight font-[family-name:var(--font-heading)] uppercase"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
        </div>

        <div className="rule-thin mb-6" />

        {/* Leaderboard ad */}
        <div className="mb-8">
          <AdRotator ads={leaderboardAds} size="leaderboard" />
        </div>

        {/* Urgente articles — full width alerts, only on page 1 */}
        {isFirstPage &&
          urgentArticles.map((a) => (
            <div key={a.id} className="mb-6">
              <ArticleCard article={a} variant="urgente" />
            </div>
          ))}

        {/* Page 1 — editorial featured + sidebar layout */}
        {isFirstPage && featured && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Featured story — 2/3 width, comic panel hero */}
            <div className="lg:col-span-2 flex">
              <Link
                href={sponsoredIds.has(featured.id) ? `/patrocinado/${featured.id}` : `/${featured.section}/${featured.id}`}
                prefetch={false}
                className="group relative overflow-hidden bg-ink min-h-[260px] md:min-h-[440px] lg:h-full block border-ink-3 shadow-hard w-full"
              >
                {featured.imageUrl ? (
                  <Image
                    src={featured.imageUrl}
                    alt={featured.imageAlt || featured.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center halftone"
                    style={{
                      background: `linear-gradient(135deg, ${cfg.color}30, #0a0a0a 80%)`,
                    }}
                  >
                    <span className="text-8xl font-[family-name:var(--font-heading)] opacity-30 text-white uppercase">LV</span>
                  </div>
                )}
                {/* Halftone + charcoal overlay — comic noir ink */}
                <div className="absolute inset-0 halftone-light opacity-60" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.45) 45%, rgba(10,10,10,0.1) 100%)" }} />
                {/* Naranja edge tint */}
                <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ background: "radial-gradient(ellipse at bottom right, var(--color-brand), transparent 55%)" }} />
                {/* Text overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                  <span
                    className="stamp text-[11px] md:text-xs"
                    style={{ color: cfg.color, borderColor: cfg.color }}
                  >
                    {cfg.label}
                    {sponsoredIds.has(featured.id) && (
                      <span className="ml-1.5 text-[#16a34a]">Patrocinado</span>
                    )}
                  </span>
                  <h2 className="display text-2xl md:text-4xl lg:text-5xl text-white leading-[1.05] line-clamp-2 md:line-clamp-3 mt-3">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="mt-3 text-sm md:text-base text-white/75 line-clamp-2 hidden md:block font-[family-name:var(--font-body)] font-medium">
                      {featured.excerpt}
                    </p>
                  )}
                  {(() => {
                    const { dateLine, source } = cardByline(featured);
                    if (!dateLine && !source) return null;
                    return (
                      <div className="mt-3 font-[family-name:var(--font-heading)]">
                        {dateLine && (
                          <p className="text-xs text-white/60 tracking-wide uppercase" suppressHydrationWarning>
                            {dateLine}
                          </p>
                        )}
                        {source && (
                          <p className="text-xs text-white/50 truncate">{source}</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </Link>
            </div>

            {/* Sidebar stack — 1/3 width — se reparte el alto de la featured */}
            <div className="flex flex-col gap-5 h-full">
              {sidebarItems.map((a) => {
                const aCfg = sectionConfig[a.section];
                const isSponsored = sponsoredIds.has(a.id);
                const href = isSponsored ? `/patrocinado/${a.id}` : `/${a.section}/${a.id}`;
                return (
                  <Link
                    key={a.id}
                    href={href}
                    prefetch={false}
                    className="group flex gap-3 py-3 border-b-2 border-ink last:border-0 hover:bg-brand/10 transition-colors -mx-1 px-1 flex-1 min-h-0 items-center"
                  >
                    {a.imageUrl ? (
                      <div className="relative w-24 h-20 shrink-0 overflow-hidden border-2 border-ink">
                        <Image
                          src={a.imageUrl}
                          alt={a.imageAlt || a.title}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-24 h-20 shrink-0 flex items-center justify-center border-2 border-ink"
                        style={{ background: `linear-gradient(135deg, ${aCfg.color}15, ${aCfg.color}05)` }}
                      >
                        <span className="text-xl font-[family-name:var(--font-heading)] opacity-30" style={{ color: aCfg.color }}>
                          LV
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[11px] font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]"
                        style={{ color: aCfg.color }}
                      >
                        {aCfg.label}
                        {isSponsored && (
                          <span className="ml-1.5 text-[#16a34a]">Patrocinado</span>
                        )}
                      </span>
                      <h3 className="display text-[15px] leading-snug line-clamp-2 mt-0.5 group-hover:text-brand transition-colors">
                        {a.title}
                      </h3>
                      {(() => {
                        const { dateLine, source } = cardByline(a);
                        if (!dateLine && !source) return null;
                        return (
                          <div className="mt-1 font-[family-name:var(--font-heading)]">
                            {dateLine && (
                              <p className="text-xs text-muted uppercase tracking-wide" suppressHydrationWarning>
                                {dateLine}
                              </p>
                            )}
                            {source && (
                              <p className="text-xs text-foreground/70 truncate">{source}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Page 1 — remaining grid items after featured+sidebar */}
        {isFirstPage && gridItems.length > 0 && (
          <>
            <div
              className="border-t-2 pt-2 mb-6 flex items-center justify-between"
              style={{ borderTopColor: cfg.color }}
            >
              <h2
                className="display text-sm tracking-widest uppercase"
                style={{ color: cfg.color }}
              >
                Más en {cfg.label}
              </h2>
              <span className="text-xs text-muted uppercase tracking-wide font-[family-name:var(--font-heading)]">
                {gridItems.length} artículos
              </span>
            </div>

            {renderGridWithAds(gridItems, rectangleAds, sponsoredIds, sponsoredItems)}
          </>
        )}

        {/* Pages 2+ — flat grid of standard cards */}
        {!isFirstPage && gridItems.length > 0 && (
          renderGridWithAds(gridItems, rectangleAds, sponsoredIds, sponsoredItems)
        )}

        {/* Pagination — comic noir */}
        {totalPages > 1 && (
          <Pagination
            section={section}
            currentPage={currentPage}
            totalPages={totalPages}
            sectionPath={cfg.path}
          />
        )}
      </main>

      {/* Leaderboard ad before footer — mismo formato que el del inicio */}
      {leaderboardAds.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <AdRotator ads={leaderboardAds} size="leaderboard" />
        </div>
      )}

      <Footer />
    </>
  );
}

/** Render the "Más en {sección}" grid splitting items into chunks.
 *  Con sponsored: chunks de 8 articles + 1 SponsoredRotator = 9 slots (3×3 lleno).
 *  Sin sponsored: chunks de 9 articles = 9 slots (3×3 lleno, sin huecos).
 *  Después de cada chunk intermedio viene una fila de 3 rectangle ads. */
function renderGridWithAds(
  items: Article[],
  rectangleAds: Ad[],
  sponsoredIds: Set<string>,
  sponsoredItems: Article[]
): React.ReactNode {
  if (items.length === 0) return null;

  const hasSponsored = sponsoredItems.length > 0;
  const chunkSize = hasSponsored ? 8 : 9;
  const chunks: Article[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  return (
    <div className="space-y-8">
      {chunks.map((chunk, idx) => (
        <div key={idx}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chunk.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                variant="standard"
                sponsored={sponsoredIds.has(a.id)}
              />
            ))}
            {/* SponsoredRotator como 9º item inline — rota todos los patrocinados cada 15s,
                independiente de otros contenedores. Sólo entre chunks, no al final. */}
            {idx < chunks.length - 1 && sponsoredItems.length > 0 && (
              <SponsoredRotator sponsored={sponsoredItems} />
            )}
          </div>
          {/* Rectangle ad row después del chunk+rotator (excepto último chunk).
              Siempre 3 slots aunque haya menos rectangles activos — AdRotator rota
              entre los disponibles y rellena los slots vacíos. */}
          {idx < chunks.length - 1 && rectangleAds.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`rect-${idx}-${i}`}>
                  <AdRotator ads={rectangleAds} size="rectangle" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Pagination({
  section,
  currentPage,
  totalPages,
  sectionPath,
}: {
  section: Section;
  currentPage: number;
  totalPages: number;
  sectionPath: string;
}) {
  const pages: number[] = [];
  const range = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= range) {
      pages.push(i);
    }
  }
  // Insert gaps
  const withGaps: (number | "...")[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && pages[i] - pages[i - 1] > 1) withGaps.push("...");
    withGaps.push(pages[i]);
  }

  const pageHref = (p: number) =>
    p === 1 ? sectionPath : `${sectionPath}/pagina/${p}`;

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-2 flex-wrap"
      aria-label="Paginación"
    >
      {/* Prev */}
      {currentPage > 1 ? (
        <Link
          href={pageHref(currentPage - 1)}
          className="inline-flex items-center gap-1 px-3 py-2 bg-paper border-ink-2 shadow-hard-sm hover:bg-brand hover:text-white font-[family-name:var(--font-heading)] uppercase tracking-wider text-xs font-bold transition-colors"
        >
          <span>←</span> Anterior
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-2 bg-paper border-ink-2 opacity-40 font-[family-name:var(--font-heading)] uppercase tracking-wider text-xs font-bold">
          <span>←</span> Anterior
        </span>
      )}

      {withGaps.map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-2 text-muted font-[family-name:var(--font-heading)]">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p)}
            className={`w-9 h-9 flex items-center justify-center border-ink-2 shadow-hard-sm font-[family-name:var(--font-heading)] uppercase tracking-wider text-xs font-bold transition-colors ${
              p === currentPage
                ? "bg-brand text-white"
                : "bg-paper hover:bg-brand/20"
            }`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={pageHref(currentPage + 1)}
          className="inline-flex items-center gap-1 px-3 py-2 bg-paper border-ink-2 shadow-hard-sm hover:bg-brand hover:text-white font-[family-name:var(--font-heading)] uppercase tracking-wider text-xs font-bold transition-colors"
        >
          Siguiente <span>→</span>
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-2 bg-paper border-ink-2 opacity-40 font-[family-name:var(--font-heading)] uppercase tracking-wider text-xs font-bold">
          Siguiente <span>→</span>
        </span>
      )}
    </nav>
  );
}