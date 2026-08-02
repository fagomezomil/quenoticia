import Script from "next/script";

const GA_MEASUREMENT_ID = "G-RKET4BGSWE";

/** Google Analytics 4 — gtag.js tag.
 *  Measurement ID es público (va en el HTML del sitio), no requiere env var ni secret.
 *  strategy="afterInteractive" para no bloquear el LCP. */
export default function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}