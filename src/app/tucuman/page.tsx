import SectionPageLayout from "@/components/SectionPageLayout";
import { getActiveAds } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";
import { getActiveArticles } from "@/lib/articles";
import { getActiveSponsored } from "@/lib/sponsored";
import type { Article, SponsoredContent } from "@/lib/types";
import type { Metadata } from "next";
import { SECTION_META, SITE_URL, SITE_NAME } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { sectionBreadcrumbLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: SECTION_META.tucuman.title,
  description: SECTION_META.tucuman.description,
  alternates: { canonical: "/tucuman" },
  openGraph: {
    title: `${SECTION_META.tucuman.title} | ${SITE_NAME}`,
    description: SECTION_META.tucuman.description,
    url: `${SITE_URL}/tucuman`,
    type: "website",
  },
  twitter: {
    title: `${SECTION_META.tucuman.title} | ${SITE_NAME}`,
    description: SECTION_META.tucuman.description,
  },
};

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

export const revalidate = 300;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function TucumanPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [ads, customArticles, sponsoredContent] = await Promise.all([
    getActiveAds(undefined, "tucuman"),
    getActiveArticles("tucuman"),
    getActiveSponsored("tucuman"),
  ]);

  const sponsoredIds = new Set(sponsoredContent.map((s) => s.id));
  const sponsoredItems = sponsoredContent.map(sponsoredToArticle);
  // Scraper provides tucuman articles via the articles table — no FreeNewsApi needed
  const sectionArticles = [
    ...customArticles,
    ...getArticlesBySection("tucuman"),
  ];
  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const rectangleAds = ads.filter((a) => a.type === "rectangle");

  return (
    <>
      <JsonLd data={sectionBreadcrumbLd("tucuman")} />
      <SectionPageLayout
        section="tucuman"
      articles={sectionArticles}
      subtitle="Noticias de la provincia de Tucumán y la región del NOA."
      allArticles={[...customArticles, ...articles]}
      leaderboardAds={leaderboardAds}
      rectangleAds={rectangleAds}
      sponsoredIds={sponsoredIds}
      sponsoredItems={sponsoredItems}
      page={page}
    />
    </>
  );
}