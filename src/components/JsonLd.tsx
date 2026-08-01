/** Helper para inyectar JSON-LD structured data en server components.
 *  Next.js renderiza <script type="application/ld+json"> en el HTML crudo,
 *  accesible para crawlers de Google/Bing sin necesidad de ejecutar JS. */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}