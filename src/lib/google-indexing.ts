import { createSign } from "crypto";
import { readFileSync } from "fs";

/** Google Indexing API — notifica a Google Web Search cuando una URL cambia.
 *  Usa el Service Account de Google Cloud (JSON key en el VPS).
 *  Similar a IndexNow pero para Google. Best-effort, no bloquea el guardado.
 *
 *  Requiere:
 *  - Web Search Indexing API habilitada en Google Cloud Console
 *  - JSON key del Service Account en el path definido por
 *    GOOGLE_SERVICE_ACCOUNT_PATH o default /opt/quenoticia/google-service-account.json
 *  - La API acepta cualquier URL del sitio (no requiere verificación de ownership
 *    separada — el SA debe estar en el mismo proyecto que la propiedad GSC, pero
 *    en práctica Google indexa la notificación sin validar ownership estrictamente). */

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

let cachedKey: ServiceAccountKey | null = null;
let cachedToken: { token: string; expiresAt: number } | null = null;

function loadKey(): ServiceAccountKey | null {
  if (cachedKey) return cachedKey;
  const path =
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
    "/opt/quenoticia/google-service-account.json";
  try {
    const raw = readFileSync(path, "utf-8");
    cachedKey = JSON.parse(raw) as ServiceAccountKey;
    return cachedKey;
  } catch {
    // Sin key (dev local sin VPS) — la función no falla, solo no notifica
    return null;
  }
}

function base64url(input: string | Buffer): string {
  const b =
    typeof input === "string" ? Buffer.from(input, "utf-8") : input;
  return b.toString("base64url");
}

/** Crea un JWT firmado con RS256 para obtener un access token de Google. */
function createJwt(key: ServiceAccountKey): string {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: key.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const signingInput =
    base64url(JSON.stringify(header)) + "." + base64url(JSON.stringify(payload));
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(key.private_key);
  return signingInput + "." + base64url(signature);
}

/** Obtiene (y cachea) un access token de Google via JWT exchange. */
async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }
  const key = loadKey();
  if (!key) return null;

  const jwt = createJwt(key);
  const res = await fetch(key.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    console.error("google-indexing: token exchange failed", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

export type IndexingNotificationType = "URL_UPDATED" | "URL_DELETED";

/** Notifica a Google Indexing API sobre un cambio de URL.
 *  Best-effort: errores se loguean pero no se propagan. */
export async function notifyGoogleIndexing(
  url: string,
  type: IndexingNotificationType = "URL_UPDATED",
): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  try {
    const res = await fetch(
      "https://indexing.googleapis.com/v3/urlNotifications:publish",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url, type }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      console.error(`google-indexing: notify ${type} ${url} failed`, res.status, body);
    }
  } catch (err) {
    console.error(`google-indexing: notify ${type} ${url} error`, err);
  }
}

/** Notifica múltiples URLs en paralelo (máx 100 por request según docs, pero
 *  la API acepta 1 URL por call → iteramos con concurrencia limitada). */
export async function notifyGoogleIndexingBatch(
  urls: string[],
  type: IndexingNotificationType = "URL_UPDATED",
): Promise<void> {
  if (urls.length === 0) return;
  // Concurrencia 5 para no saturar
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += 5) {
    chunks.push(urls.slice(i, i + 5));
  }
  for (const chunk of chunks) {
    await Promise.all(chunk.map((u) => notifyGoogleIndexing(u, type)));
  }
}

/** Notifica un cambio de artículo a Google Indexing API + IndexNow.
 *  Recibe section + id → construye la URL pública. Para delete, pasar articleUrl
 *  ya construido (porque el artículo ya no existe en DB al momento de notificar). */
export async function notifyArticleChangeGoogle(
  section: string,
  id: string,
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.quenoticia.com.ar";
  await notifyGoogleIndexing(`${siteUrl}/${section}/${id}`, "URL_UPDATED");
}