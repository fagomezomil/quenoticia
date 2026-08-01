import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import NavbarWrapper from "@/components/NavbarWrapper";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import AdStickyFooter from "@/components/AdStickyFooter";
import OpinionArchiveLayout from "@/components/OpinionArchiveLayout";
import { fetchBreakingNews } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
import { getActiveArticles } from "@/lib/articles";
import { getActiveColumnists } from "@/lib/columnists";
import { getActiveSponsored } from "@/lib/sponsored";
import { articles } from "@/lib/data";
import type { Article, SponsoredContent } from "@/lib/types";
import { SECTION_META, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { sectionBreadcrumbLd } from "@/lib/seo";

export const revalidate = 300;

function sponsoredToArticle(s: SponsoredContent): Article {
  return {
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    section: s.section,
    author: s.author ?? undefined,
    publisher: s.publisher,
    date: s.date,
    imageUrl: s.imageUrl ?? undefined,
    imageAlt: s.imageAlt,
    excerpt: s.excerpt,
    body: s.body ?? undefined,
    originalUrl: s.originalUrl ?? undefined,
  };
}

interface PageProps {
  params: Promise<{ page: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page: rawPage } = await params;
  const pageNum = Math.max(1, parseInt(rawPage, 10) || 1);
  const canonical = `/opinion/pagina/${pageNum}`;
  return {
    title: `${SECTION_META.opinion.title} — Página ${pageNum}`,
    description: SECTION_META.opinion.description,
    robots: { index: false, follow: true },
    alternates: { canonical },
    openGraph: {
      title: `${SECTION_META.opinion.title} — Página ${pageNum} | ${SITE_NAME}`,
      description: SECTION_META.opinion.description,
      url: `${SITE_URL}${canonical}`,
      type: "website",
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      title: `${SECTION_META.opinion.title} — Página ${pageNum} | ${SITE_NAME}`,
      description: SECTION_META.opinion.description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export async function generateStaticParams() {
  return [{ page: "2" }];
}

export default async function OpinionPaginationPage({ params }: PageProps) {
  const { page: rawPage } = await params;
  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  if (page < 2) notFound();

  const [ads, customArticles, sponsoredContent, columnists, breakingData] = await Promise.all([
    getActiveAds(undefined, "opinion"),
    getActiveArticles("opinion"),
    getActiveSponsored("opinion"),
    getActiveColumnists(),
    fetchBreakingNews(),
  ]);

  const sponsoredAsArticles = sponsoredContent.map(sponsoredToArticle);
  const allItems = [...customArticles, ...sponsoredAsArticles];
  const breaking = breakingData ?? articles.filter((a) => a.breaking);
  const stickyFooterAd = ads.find((a) => a.type === "sticky_footer") || null;
  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const sidebarAds = ads.filter((a) => a.type === "sidebar");
  const leaderboardTop = leaderboardAds[0] || null;
  const leaderboardBottom = leaderboardAds.length > 1 ? leaderboardAds[1] : null;

  return (
    <>
      <JsonLd data={sectionBreadcrumbLd("opinion")} />
      <Header />
      <NavbarWrapper />
      <BreakingNews articles={breaking} />
      <OpinionArchiveLayout
        articles={allItems}
        columnists={columnists}
        page={page}
        leaderboardTop={leaderboardTop}
        leaderboardBottom={leaderboardBottom}
        sidebarAds={sidebarAds}
      />
      <Footer />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}