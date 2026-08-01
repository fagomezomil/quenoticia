import type { Metadata } from "next";
import { SECTION_META, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/site";
import { renderStandardSectionPage, SECTION_SUBTITLES } from "@/lib/section-page";

export const revalidate = 300;

export const metadata: Metadata = {
  title: SECTION_META.politica.title,
  description: SECTION_META.politica.description,
  alternates: { canonical: "/politica" },
  openGraph: {
    title: `${SECTION_META.politica.title} | ${SITE_NAME}`,
    description: SECTION_META.politica.description,
    url: `${SITE_URL}/politica`,
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    title: `${SECTION_META.politica.title} | ${SITE_NAME}`,
    description: SECTION_META.politica.description,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function PoliticaPage() {
  return renderStandardSectionPage("politica", 1, SECTION_SUBTITLES.politica);
}