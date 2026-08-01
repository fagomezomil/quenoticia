/**
 * IndexNow — notificación push a Bing/Yandex/Cloudflare de URLs nuevas/modificadas.
 * Protocolo: https://indexnow.org
 *
 * Reemplaza la espera pasiva de crawl por notificación activa. Para un medio que
 * publica 20-30 notas/día, Bing indexa en horas en vez de días/semanas.
 *
 * Key file: public/{INDEXNOW_KEY}.txt — verifica ownership del dominio.
 * La key se lee de env INDEXNOW_KEY para no hardcodearla. Si no está, no-op.
 *
 * Best-effort: errores se loguean pero nunca frenan la acción del usuario.
 */

import { SITE_URL } from "@/lib/site";

const INDEXNOW_API = "https://api.indexnow.org/indexnow";

/**
 * Notifica una lista de URLs a IndexNow. Best-effort: errores se loguean pero
 * no propagan. Acepta hasta 10k URLs por request (protocolo).
 *
 * Las URLs pueden ser absolutas (https://www...) o paths (que se prefijan con SITE_URL).
 */
export async function notifyIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || urls.length === 0) return;

  const absoluteUrls = urls.map((u) =>
    u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`,
  );

  const keyLocation = `${SITE_URL}/${key}.txt`;

  const body = {
    host: new URL(SITE_URL).host,
    key,
    keyLocation,
    urlList: absoluteUrls,
  };

  try {
    const res = await fetch(INDEXNOW_API, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
      // fire-and-forget: no esperamos más de 10s
      signal: AbortSignal.timeout(10_000),
    });
    // 200 = OK, 202 = accepted (procesará async), 422 = key inválida
    if (res.status !== 200 && res.status !== 202) {
      console.warn(
        `[indexnow] ${res.status} para ${absoluteUrls.length} URLs — keyLocation ${keyLocation}`,
      );
    }
  } catch (err) {
    console.warn("[indexnow] error notificando URLs:", err);
  }
}

/**
 * Helper para notificar una nota + su sección + home.
 * Usa paths relativos — notifyIndexNow los convierte a absolutos.
 */
export function notifyArticleChange(section: string, articleId: string): Promise<void> {
  return notifyIndexNow([
    `/${section}/${articleId}`,
    `/${section}`,
    "/",
    "/sitemap.xml",
  ]);
}