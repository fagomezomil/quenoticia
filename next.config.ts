import type { NextConfig } from "next";

// X-Robots-Tag limita snippet size en search results para reducir valor de scraping.
// Los headers de seguridad (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
// Permissions-Policy, CSP) los manda Caddy en el edge — acá solo dejamos X-Robots-Tag.
const articleRobotsHeader = [
  { key: "X-Robots-Tag", value: "max-snippet:200, max-image-preview:small" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // @resvg/resvg-js y sharp usan bindings nativos — deben quedar fuera del bundler.
  serverExternalPackages: ["@resvg/resvg-js", "sharp"],
  async headers() {
    return [
      // Article pages: limited snippets to reduce scraping value
      { source: "/politica/:path*", headers: articleRobotsHeader },
      { source: "/deportes/:path*", headers: articleRobotsHeader },
      { source: "/economia/:path*", headers: articleRobotsHeader },
      { source: "/internacionales/:path*", headers: articleRobotsHeader },
      { source: "/tucuman/:path*", headers: articleRobotsHeader },
    ];
  },
};

export default nextConfig;