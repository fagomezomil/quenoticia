/**
 * Script standalone: genera un carrusel de 5 noticias (1 por sección) y lo
 * publica al FEED de IG/FB via Buffer.
 *
 * Reemplaza a /api/social-publish. Corre como proceso Node aparte con su
 * propio cgroup (systemd oneshot service) para no estresar el proceso web
 * Next.js con el render Satori+Resvg+sharp.
 *
 * Uso:
 *   node node_modules/.bin/tsx scripts/build-carousel.ts
 *   node node_modules/.bin/tsx scripts/build-carousel.ts --dry-run
 *
 * Env vars requeridas (cargadas por el wrapper bash del systemd service):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   BUFFER_API_KEY, BUFFER_CHANNEL_IDS
 *
 * Cron del VPS dispara 2x/día a las 10:00 y 21:00 AR via cron-social.sh.
 * Log a stdout/stderr → /var/log/quenoticia/social.log (via systemd StandardOutput).
 */

import type { ChannelTarget } from "@/lib/social/daily-limits";

// Polyfill WebSocket ANTES de cualquier value-import que toque supabase-js.
// Node 20 no tiene native WebSocket; supabase-js lo requiere en el constructor
// del RealtimeClient aunque no se use realtime. Next.js polyfill nativo en el
// endpoint HTTP, pero scripts standalone necesitan este polyfill manual.
const { WebSocket } = await import("ws");
(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const { buildCarousel } = await import("@/lib/social/carousel-builder");
const { bufferPublish } = await import("@/lib/social/buffer-client");
const { getSupabaseAdmin } = await import("@/lib/supabase/admin");

const dryRun = process.argv.includes("--dry-run");

function log(obj: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...obj, timestamp: new Date().toISOString() }));
}

async function saveSocialPost(input: {
  status: "published" | "failed" | "pending" | "skipped";
  kind: "carrusel";
  articleIds: (string | null)[];
  sections: string[];
  slideImageUrls: string[];
  caption: string;
  channelTargets: ChannelTarget[];
  errorMessage: string | null;
}): Promise<void> {
  const admin = await getSupabaseAdmin();
  const bufferUpdateIds = input.channelTargets
    .map((t) => t.postId)
    .filter((id): id is string => id !== null);

  const { error } = await admin.from("social_posts").insert({
    status: input.status,
    kind: input.kind,
    article_ids: input.articleIds,
    sections: input.sections,
    slide_image_urls: input.slideImageUrls,
    caption: input.caption,
    channel_targets: input.channelTargets,
    buffer_update_ids: bufferUpdateIds.length > 0 ? bufferUpdateIds : null,
    error_message: input.errorMessage,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  });
  if (error) console.error("saveSocialPost carrusel error:", error);
}

async function main(): Promise<number> {
  console.log("=== build-carousel start ===");
  const bufferKey = process.env.BUFFER_API_KEY ?? "";
  const channelIds = (process.env.BUFFER_CHANNEL_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const carousel = await buildCarousel();

    if (carousel.slideImageUrls.length === 0) {
      await saveSocialPost({
        status: "skipped",
        kind: "carrusel",
        articleIds: carousel.articleIds,
        sections: carousel.sections,
        slideImageUrls: [],
        caption: carousel.caption,
        channelTargets: [],
        errorMessage: "Sin notas nuevas ni fallback disponibles",
      });
      log({ success: true, status: "skipped", reason: "no slides generated", dryRun });
      console.log("=== build-carousel end ===");
      return 0;
    }

    let bufferResult;
    if (dryRun || !bufferKey) {
      bufferResult = {
        success: false,
        channelTargets: [] as ChannelTarget[],
        skippedByLimit: [],
        error: dryRun ? "dry_run mode" : "BUFFER_API_KEY missing",
      };
    } else {
      bufferResult = await bufferPublish(
        bufferKey,
        channelIds,
        carousel.caption,
        carousel.slideImageUrls,
      );
    }

    const status: "published" | "failed" | "pending" =
      dryRun || !bufferKey
        ? "pending"
        : bufferResult.success
          ? "published"
          : "failed";

    await saveSocialPost({
      status,
      kind: "carrusel",
      articleIds: carousel.articleIds,
      sections: carousel.sections,
      slideImageUrls: carousel.slideImageUrls,
      caption: carousel.caption,
      channelTargets: bufferResult.channelTargets ?? [],
      errorMessage: bufferResult.success ? null : bufferResult.error ?? null,
    });

    log({
      success: bufferResult.success || dryRun || !bufferKey,
      status,
      slides: carousel.slideImageUrls.length,
      sections: carousel.sections,
      dryRun,
      skippedByLimit: bufferResult.skippedByLimit ?? [],
      bufferError: bufferResult.success ? null : bufferResult.error,
    });
    console.log("=== build-carousel end ===");
    return 0;
  } catch (error) {
    console.error("build-carousel error:", error);
    log({ success: false, status: "failed", error: String(error), dryRun });
    console.log("=== build-carousel end ===");
    return 1;
  }
}

main().then((code) => process.exit(code));