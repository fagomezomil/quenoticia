/**
 * Script standalone: genera 10 stories 9:16 (2 por sección) y las publica a Buffer.
 *
 * Reemplaza a /api/social-publish-stories. Corre como proceso Node aparte con
 * su propio cgroup (systemd oneshot service) para no estresar el proceso web
 * Next.js con el render Satori+Resvg+sharp (~2GB working set).
 *
 * Uso:
 *   node node_modules/.bin/tsx scripts/build-stories.ts
 *   node node_modules/.bin/tsx scripts/build-stories.ts --dry-run
 *
 * Env vars requeridas (cargadas por el wrapper bash del systemd service):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   BUFFER_API_KEY, BUFFER_CHANNEL_IDS
 *
 * Cron del VPS dispara 2x/día a las 15:00 y 21:30 AR via cron-stories.sh.
 * Log a stdout/stderr → /var/log/quenoticia/stories.log (via systemd StandardOutput).
 */

import { buildStories } from "@/lib/social/carousel-builder";
import { bufferPublishStories } from "@/lib/social/buffer-client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { ChannelTarget } from "@/lib/social/daily-limits";

const dryRun = process.argv.includes("--dry-run");

function log(obj: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...obj, timestamp: new Date().toISOString() }));
}

async function saveSocialPost(input: {
  status: "published" | "failed" | "pending" | "skipped";
  kind: "stories";
  articleIds: (string | null)[];
  sections: string[];
  slideImageUrls: string[];
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
    caption: "Stories automáticas 9:16 (10 slides, 2 por sección)",
    channel_targets: input.channelTargets,
    buffer_update_ids: bufferUpdateIds.length > 0 ? bufferUpdateIds : null,
    error_message: input.errorMessage,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  });
  if (error) console.error("saveSocialPost stories error:", error);
}

/** Caption corto para stories: branding + hashtag rotado por slide. */
function buildStoryCaption(index: number): string {
  const hashtags = ["#Politica", "#Deportes", "#Tucuman", "#Economia", "#Internacionales"];
  const tag = hashtags[index % hashtags.length];
  return `¡QUE NOTICIA! ${tag}\n\nLas noticias más importantes de Tucumán y el mundo. Lee más en quenoticia.com.ar`;
}

async function main(): Promise<number> {
  console.log("=== build-stories start ===");
  const bufferKey = process.env.BUFFER_API_KEY ?? "";
  const channelIds = (process.env.BUFFER_CHANNEL_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const stories = await buildStories();

    if (stories.slideImageUrls.length === 0) {
      await saveSocialPost({
        status: "skipped",
        kind: "stories",
        articleIds: stories.articleIds,
        sections: stories.sections,
        slideImageUrls: [],
        channelTargets: [],
        errorMessage: "Sin notas nuevas ni fallback disponibles para stories",
      });
      log({ success: true, status: "skipped", reason: "no slides generated", dryRun });
      console.log("=== build-stories end ===");
      return 0;
    }

    const slideEntries = stories.slideImageUrls.map((url, i) => ({
      url,
      caption: buildStoryCaption(i),
    }));

    let bufferResult;
    if (dryRun || !bufferKey) {
      bufferResult = {
        success: false,
        channelTargets: [] as ChannelTarget[],
        skippedByLimit: [],
        error: dryRun ? "dry_run mode" : "BUFFER_API_KEY missing",
      };
    } else {
      bufferResult = await bufferPublishStories(bufferKey, channelIds, slideEntries);
    }

    const status: "published" | "failed" | "pending" =
      dryRun || !bufferKey
        ? "pending"
        : bufferResult.success
          ? "published"
          : "failed";

    await saveSocialPost({
      status,
      kind: "stories",
      articleIds: stories.articleIds,
      sections: stories.sections,
      slideImageUrls: stories.slideImageUrls,
      channelTargets: bufferResult.channelTargets ?? [],
      errorMessage: bufferResult.success ? null : bufferResult.error ?? null,
    });

    log({
      success: bufferResult.success || dryRun || !bufferKey,
      status,
      slides: stories.slideImageUrls.length,
      sections: stories.sections,
      dryRun,
      skippedByLimit: bufferResult.skippedByLimit ?? [],
      bufferError: bufferResult.success ? null : bufferResult.error,
    });
    console.log("=== build-stories end ===");
    return 0;
  } catch (error) {
    console.error("build-stories error:", error);
    log({ success: false, status: "failed", error: String(error), dryRun });
    console.log("=== build-stories end ===");
    return 1;
  }
}

main().then((code) => process.exit(code));