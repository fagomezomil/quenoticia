import { NextResponse } from "next/server";
import { buildStories } from "@/lib/social/carousel-builder";
import { bufferPublishStories } from "@/lib/social/buffer-client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import type { ChannelTarget } from "@/lib/social/daily-limits";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Endpoint cron: genera 10 stories (9:16, 2 por sección) y los publica via Buffer.
 *
 *  Header:
 *    - X-Cron-Secret: CRON_SECRET (obligatorio)
 *
 *  Query params:
 *    - dry_run: "true" → genera y guarda en social_posts sin publicar a Buffer
 *
 *  Cron del VPS dispara 2x/día a las 15:00 y 21:00 AR (vía scripts/cron-stories.sh).
 *  - 5 stories "del feed" = las 5 notas más recientes (1 por sección).
 *  - 5 stories "extra" = las siguientes 5 en prioridad (1 por sección, la #2).
 *  - Total: 10 stories por turno × 2 canales (IG+FB) = 20 createPost por turno.
 *  Respeta DAILY_LIMITS_STORIES por servicio. Skip TikTok (no soporta stories). */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") === "true";
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
        articleIds: stories.articleIds,
        sections: stories.sections,
        slideImageUrls: [],
        channelTargets: [],
        errorMessage: "Sin notas nuevas ni fallback disponibles para stories",
      });
      return NextResponse.json({
        success: true,
        status: "skipped",
        reason: "no slides generated",
        timestamp: new Date().toISOString(),
      });
    }

    // Caption individual por story: reusar el caption del carrusel como caption genérico,
    // pero cada story es 1 slide → caption corto (solo branding + hashtags).
    // Buffer limita captions de stories a 2200 chars en IG. Usamos uno corto por slide.
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
      articleIds: stories.articleIds,
      sections: stories.sections,
      slideImageUrls: stories.slideImageUrls,
      channelTargets: bufferResult.channelTargets ?? [],
      errorMessage: bufferResult.success ? null : bufferResult.error ?? null,
    });

    return NextResponse.json({
      success: bufferResult.success || dryRun || !bufferKey,
      status,
      slides: stories.slideImageUrls.length,
      sections: stories.sections,
      dryRun,
      skippedByLimit: bufferResult.skippedByLimit ?? [],
      bufferError: bufferResult.success ? null : bufferResult.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("social-publish-stories error:", error);
    return NextResponse.json(
      { error: "publish failed", details: String(error) },
      { status: 500 },
    );
  }
}

/** Caption corto para stories: branding + hashtag de la sección. */
function buildStoryCaption(index: number): string {
  // Rotación de hashtags por sección
  const hashtags = ["#Politica", "#Deportes", "#Tucuman", "#Economia", "#Internacionales"];
  const tag = hashtags[index % hashtags.length];
  return `¡QUE NOTICIA! ${tag}\n\nLas noticias más importantes de Tucumán y el mundo. Lee más en quenoticia.com.ar`;
}

interface SaveSocialPostInput {
  status: "published" | "failed" | "pending" | "skipped";
  articleIds: (string | null)[];
  sections: string[];
  slideImageUrls: string[];
  channelTargets: ChannelTarget[];
  errorMessage: string | null;
}

async function saveSocialPost(input: SaveSocialPostInput): Promise<void> {
  const admin = await getSupabaseAdmin();
  const bufferUpdateIds = input.channelTargets
    .map((t) => t.postId)
    .filter((id): id is string => id !== null);

  const { error } = await admin.from("social_posts").insert({
    status: input.status,
    kind: "stories",
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