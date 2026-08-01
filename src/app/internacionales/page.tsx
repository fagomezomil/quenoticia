import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
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
  title: SECTION_META.internacionales.title,
  description: SECTION_META.internacionales.description,
  alternates: { canonical: "/internacionales" },
  openGraph: {
    title: `${SECTION_META.internacionales.title} | ${SITE_NAME}`,
    description: SECTION_META.internacionales.description,
    url: `${SITE_URL}/internacionales`,
    type: "website",
  },
  twitter: {
    title: `${SECTION_META.internacionales.title} | ${SITE_NAME}`,
    description: SECTION_META.internacionales.description,
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

export default async function InternacionalesPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [apiArticles, ads, customArticles, sponsoredContent] = await Promise.all([
    fetchSectionArticles("internacionales"),
    getActiveAds(undefined, "internacionales"),
    getActiveArticles("internacionales"),
    getActiveSponsored("internacionales"),
  ]);

  const sponsoredIds = new Set(sponsoredContent.map((s) => s.id));
  const sponsoredItems = sponsoredContent.map(sponsoredToArticle);
  const sectionArticles = [
    ...customArticles,
    ...(apiArticles ?? getArticlesBySection("internacionales")),
  ];
  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const rectangleAds = ads.filter((a) => a.type === "rectangle");

  return (
    <>
      <JsonLd data={sectionBreadcrumbLd("internacionales")} />
      <SectionPageLayout
        section="internacionales"
      articles={sectionArticles}
      subtitle="Noticias del mundo, relaciones internacionales y eventos globales."
      allArticles={apiArticles ? [...customArticles, ...articles, ...apiArticles] : [...customArticles, ...articles]}
      leaderboardAds={leaderboardAds}
      rectangleAds={rectangleAds}
      sponsoredIds={sponsoredIds}
      sponsoredItems={sponsoredItems}
      page={page}
    />
    </>
  );
}