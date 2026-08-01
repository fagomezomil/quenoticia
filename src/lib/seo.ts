import { sectionConfig, type Section } from "@/lib/types";
import { SITE_URL } from "@/lib/site";

/** BreadcrumbList para una página de sección: Inicio > Sección. */
export function sectionBreadcrumbLd(section: Section) {
  const cfg = sectionConfig[section];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: cfg.label,
        item: `${SITE_URL}${cfg.path}`,
      },
    ],
  };
}

/** BreadcrumbList para la página de un columnista: Inicio > Opinión > Columnista. */
export function columnistBreadcrumbLd(columnistName: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Opinión",
        item: `${SITE_URL}/opinion`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: columnistName,
        item: `${SITE_URL}/opinion/columnista/${slug}`,
      },
    ],
  };
}

/** Person schema para un columnista. */
export function columnistPersonLd(opts: {
  name: string;
  slug: string;
  bio?: string;
  photoUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: opts.name,
    url: `${SITE_URL}/opinion/columnista/${opts.slug}`,
    ...(opts.bio ? { description: opts.bio } : {}),
    ...(opts.photoUrl ? { image: opts.photoUrl } : {}),
    jobTitle: "Columnista",
    worksFor: { "@id": `${SITE_URL}/#organization` },
  };
}