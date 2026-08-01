import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**robots.txt — generado via Next.js Metadata API.
 *  Disallow: rutas privadas y de auth (no indexables). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/login",
          "/register",
          "/recuperar-password",
          "/perfil",
          "/mis-propuestas",
          "/agenda/submit",
          "/actualizar-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}