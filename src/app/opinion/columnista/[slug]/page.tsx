import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import NavbarWrapper from "@/components/NavbarWrapper";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import AdStickyFooter from "@/components/AdStickyFooter";
import ColumnistProfileLayout from "@/components/ColumnistProfileLayout";
import JsonLd from "@/components/JsonLd";
import { fetchBreakingNews } from "@/lib/api";
import { getArticlesByColumnist } from "@/lib/articles";
import { getColumnistBySlug } from "@/lib/columnists";
import { getActiveAds } from "@/lib/ads";
import { articles } from "@/lib/data";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { columnistBreadcrumbLd, columnistPersonLd } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const columnist = await getColumnistBySlug(slug);
  if (!columnist || !columnist.active) return { title: "Columnista no encontrado" };
  const canonicalPath = `/opinion/columnista/${slug}`;
  const title = `${columnist.name} — Columnista de Opinión`;
  const description = columnist.bio || `Columnas de ${columnist.name} en ¡QUE NOTICIA!.`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "profile",
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      ...(columnist.photoUrl ? { images: [{ url: columnist.photoUrl, alt: columnist.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      ...(columnist.photoUrl ? { images: [columnist.photoUrl] } : {}),
    },
  };
}

export const revalidate = 300;

export default async function ColumnistPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const columnist = await getColumnistBySlug(slug);
  if (!columnist || !columnist.active) notFound();

  const [columns, ads, breakingData] = await Promise.all([
    getArticlesByColumnist(columnist.id),
    getActiveAds(undefined, "opinion"),
    fetchBreakingNews(),
  ]);

  const breaking = breakingData ?? articles.filter((a) => a.breaking);
  const stickyFooterAd = ads.find((a) => a.type === "sticky_footer") || null;
  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const sidebarAds = ads.filter((a) => a.type === "sidebar");
  const leaderboardTop = leaderboardAds[0] || null;
  const leaderboardBottom = leaderboardAds.length > 1 ? leaderboardAds[1] : null;

  return (
    <>
      <JsonLd data={columnistPersonLd({
        name: columnist.name,
        slug: columnist.slug,
        bio: columnist.bio,
        photoUrl: columnist.photoUrl,
      })} />
      <JsonLd data={columnistBreadcrumbLd(columnist.name, columnist.slug)} />
      <Header />
      <NavbarWrapper />
      <BreakingNews articles={breaking} />
      <ColumnistProfileLayout
        columnist={columnist}
        articles={columns}
        leaderboardTop={leaderboardTop}
        leaderboardBottom={leaderboardBottom}
        sidebarAds={sidebarAds}
        page={page}
      />
      <Footer />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}