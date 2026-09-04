import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 client (S3-compatible) para upload de imágenes.
 *
 * Migración desde Supabase Storage (2026-09-04) — resuelve Fair Use egress excedido:
 * R2 cobra storage pero egress es gratis e ilimitado.
 *
 * Estructura: bucket único "quenoticia" con subcarpetas que mapean a los buckets
 * viejos de Supabase (`articles/`, `media/`, `avatars/`). Misma convención de paths
 * internos → el UPDATE masivo de DB solo cambia el prefix de URL.
 *
 * avatars queda en Supabase (no migrado) — egress mínimo y upload desde client.
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET || "quenoticia";
const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

let _client: S3Client | null = null;

function client(): S3Client {
  if (!_client) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
      throw new Error("R2 creds incompletas en .env");
    }
    _client = new S3Client({
      endpoint: R2_ENDPOINT,
      region: "auto",
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

type Bucket = "articles" | "media" | "avatars";

/**
 * Sube un archivo a R2. Devuelve la URL pública o null si falla.
 *
 * @param bucket bucket lógico ("articles" | "media" | "avatars")
 * @param key path interno (ej: "articles/123.webp", "social/123.png", "ads/abc.jpg")
 * @param body bytes del archivo
 * @param contentType MIME type
 */
export async function r2Upload(
  bucket: Bucket,
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string | null> {
  try {
    const fullKey = `${bucket}/${key}`;
    await client().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: fullKey,
        Body: body,
        ContentType: contentType,
      })
    );
    return r2PublicUrl(bucket, key);
  } catch (err) {
    console.error("R2 upload failed", { bucket, key, err });
    return null;
  }
}

/**
 * Construye la URL pública de un objeto en R2.
 * No valida que exista — solo arma la URL.
 */
export function r2PublicUrl(bucket: Bucket, key: string): string {
  return `${R2_PUBLIC_URL}/${bucket}/${key}`;
}