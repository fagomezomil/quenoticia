import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import NavbarWrapper from "@/components/NavbarWrapper";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import AdStickyFooter from "@/components/AdStickyFooter";
import OpinionArticleDetail from "@/components/OpinionArticleDetail";
import JsonLd from "@/components/JsonLd";
import { fetchBreakingNews } from "@/lib/api";
import { getArticleById, getActiveArticles } from "@/lib/articles";
import { getColumnistById } from "@/lib/columnists";
import { getActiveAds } from "@/lib/ads";
import { articles } from "@/lib/data";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Columnist } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article || article.section !== "opinion") return { title: "Artículo no encontrado" };

  const canonical = `/opinion/${article.id}`;
  const dateModified =
    "updated_at" in article && typeof article.updated_at === "string"
      ? article.updated_at
      : article.date;
  const datePublished = article.date || dateModified;

  return {
    title: `${article.title} - ¡QUE NOTICIA!`,
    description: article.excerpt || article.subtitle || article.title,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt || article.subtitle || article.title,
      url: `${SITE_URL}${canonical}`,
      ...(article.imageUrl ? {
        images: [{ url: article.imageUrl, alt: article.imageAlt || article.title }],
      } : { images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "¡QUE NOTICIA!" }] }),
      ...(article.author ? { authors: [article.author] } : {}),
      publishedTime: datePublished || undefined,
      modifiedTime: dateModified || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || article.subtitle || article.title,
      ...(article.imageUrl ? { images: [article.imageUrl] } : {}),
    },
  };
}

export default async function OpinionArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article || article.section !== "opinion") notFound();

  const columnist = article.columnistId
    ? await getColumnistById(article.columnistId)
    : undefined;

  const [breakingData, ads, allOpinion] = await Promise.all([
    fetchBreakingNews(),
    getActiveAds(undefined, "opinion"),
    getActiveArticles("opinion"),
  ]);

  const breaking = breakingData ?? articles.filter((a) => a.breaking);
  const stickyFooterAd = ads.find((a) => a.type === "sticky_footer") || null;
  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const sidebarAds = ads.filter((a) => a.type === "sidebar");
  const leaderboardTop = leaderboardAds[0] || null;
  const leaderboardBottom = leaderboardAds.length > 1 ? leaderboardAds[1] : null;
  // Más opiniones: excluir la nota actual, hasta 6
  const moreOpinion = allOpinion.filter((a) => a.id !== article.id).slice(0, 6);

  const articleUrl = `${SITE_URL}/opinion/${article.id}`;
  const dateModified =
    "updated_at" in article && typeof article.updated_at === "string"
      ? article.updated_at
      : article.date;
  const datePublished = article.date || dateModified;

  // NewsArticle JSON-LD — author enlazado al columnista (Person @id) si existe,
  // así Google vincula la nota con el knowledge panel del columnista.
  const authorLd = columnist
    ? { "@id": `${SITE_URL}/opinion/columnista/${columnist.slug}` }
    : article.author
      ? { "@type": "Person", name: article.author }
      : { "@id": `${SITE_URL}/#organization` };

  const newsArticleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || article.subtitle || article.title,
    datePublished,
    dateModified,
    url: articleUrl,
    ...(article.imageUrl ? { image: [article.imageUrl] } : {}),
    author: authorLd,
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    articleSection: "Opinión",
    inLanguage: "es-AR",
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Opinión", item: `${SITE_URL}/opinion` },
      { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
    ],
  };

  // Person schema del columnista (para que Google asocie la nota con el autor
  // en el knowledge graph). Sólo si hay columnista definido.
  const columnistPersonLd = columnist ? {
    "@context": "https://schema.org",
    "@type": "Person",
    name: columnist.name,
    url: `${SITE_URL}/opinion/columnista/${columnist.slug}`,
    ...(columnist.bio ? { description: columnist.bio } : {}),
    ...(columnist.photoUrl ? { image: columnist.photoUrl } : {}),
    jobTitle: "Columnista",
    worksFor: { "@id": `${SITE_URL}/#organization` },
  } : null;

  return (
    <>
      <JsonLd data={newsArticleLd} />
      <JsonLd data={breadcrumbLd} />
      {columnistPersonLd && <JsonLd data={columnistPersonLd} />}
      <Header />
      <NavbarWrapper />
      <BreakingNews articles={breaking} />
      <OpinionArticleDetail
        article={article}
        columnist={columnist ?? undefined}
        isCustom
        leaderboardTop={leaderboardTop}
        leaderboardBottom={leaderboardBottom}
        sidebarAds={sidebarAds}
        moreOpinion={moreOpinion}
      />
      <Footer />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}