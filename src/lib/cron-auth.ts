import { timingSafeEqual } from "node:crypto";

/**
 * Verifica que el request tenga el header `X-Cron-Secret` con el valor de
 * `process.env.CRON_SECRET`. Comparación constant-time (timingSafeEqual) para
 * mitigar timing attacks.
 *
 * Fall-closed: si CRON_SECRET no está configurado, devuelve false.
 *
 * Uso en API routes disparados por cron:
 *
 *   export async function GET(request: Request) {
 *     if (!verifyCronSecret(request)) {
 *       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *     }
 *     // ...
 *   }
 */
export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const token = request.headers.get("x-cron-secret");
  if (!token) return false;

  // timingSafeEqual requiere Buffers de misma longitud. Si difieren, devolver
  // false sin comparar (no revela longitud del secret).
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;

  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}