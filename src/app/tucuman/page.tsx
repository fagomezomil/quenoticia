import type { Metadata } from "next";
import { SECTION_META, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/site";
import { renderStandardSectionPage, SECTION_SUBTITLES } from "@/lib/section-page";

export const revalidate = 300;

export const metadata: Metadata = {
  title: SECTION_META.tucuman.title,
  description: SECTION_META.tucuman.description,
  alternates: { canonical: "/tucuman" },
  openGraph: {
    title: `${SECTION_META.tucuman.title} | ${SITE_NAME}`,
    description: SECTION_META.tucuman.description,
    url: `${SITE_URL}/tucuman`,
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    title: `${SECTION_META.tucuman.title} | ${SITE_NAME}`,
    description: SECTION_META.tucuman.description,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function TucumanPage() {
  return renderStandardSectionPage("tucuman", 1, SECTION_SUBTITLES.tucuman);
}