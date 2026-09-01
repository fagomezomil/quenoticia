/**
 * Script standalone: sincroniza métricas de Buffer Analytics API a social_metrics.
 *
 * Lee social_posts con buffer_update_ids publicados en los últimos 30 días,
 * para cada update_id pega a Buffer GraphQL `post(input: { id })` y upserta
 * reach/impressions/reactions/comments/shares/clicks/engagementRate/saves en
 * social_metrics.
 *
 * Reemplaza a un endpoint Next.js. Corre como proceso Node aparte con su
 * propio cgroup (systemd oneshot). Mucho más liviano que build-stories (sin
 * Satori/sharp, solo fetch JSON + upsert Supabase).
 *
 * Uso (VPS):
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/sync-metrics.ts
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/sync-metrics.ts --dry-run
 *
 * Env vars requeridas (cargadas por el wrapper bash del systemd service):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   BUFFER_API_KEY
 *
 * Cron del VPS dispara 1x/día a las 04:00 AR via cron-sync-metrics.sh.
 * Buffer refresca metrics ~24h lag, así que 04:00 AR captura el día anterior completo.
 * Log a stdout/stderr → /var/log/quenoticia/metrics.log (via systemd StandardOutput).
 */

import { getPostMetrics } from "@/lib/social/buffer-client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const dryRun = process.argv.includes("--dry-run");
const DAYS_BACK = 30;
const INTER_POST_DELAY_MS = 150; // rate limiting suave contra Buffer API

function log(obj: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...obj, timestamp: new Date().toISOString() }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface SocialPostRow {
  id: string;
  buffer_update_ids: string[] | null;
  channel_targets: { channelId: string; service: string; postId: string | null; error: string | null }[] | null;
  status: string;
  kind: string;
  published_at: string | null;
}

async function main(): Promise<number> {
  console.log("=== sync-metrics start ===");
  const bufferKey = process.env.BUFFER_API_KEY ?? "";
  if (!bufferKey) {
    log({ success: false, error: "BUFFER_API_KEY missing" });
    console.log("=== sync-metrics end ===");
    return 1;
  }

  try {
    const admin = await getSupabaseAdmin();

    // Posts publicados en los últimos 30 días con buffer_update_ids no vacíos
    const since = new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000).toISOString();
    const { data: posts, error } = await admin
      .from("social_posts")
      .select("id, buffer_update_ids, channel_targets, status, kind, published_at")
      .eq("status", "published")
      .not("buffer_update_ids", "is", null)
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(500);

    if (error) throw new Error(`query social_posts: ${error.message}`);

    const rows = (posts ?? []) as SocialPostRow[];
    log({ posts: rows.length, since, dryRun });

    if (rows.length === 0) {
      log({ success: true, status: "skipped", reason: "no published posts in range", dryRun });
      console.log("=== sync-metrics end ===");
      return 0;
    }

    // Mapear postId -> {channelId, service} desde channel_targets
    // (buffer_update_ids es plano, channel_targets tiene la metadata por canal)
    const postToChannel = new Map<string, { channelId: string; service: string }>();
    for (const row of rows) {
      if (!row.channel_targets) continue;
      for (const ct of row.channel_targets) {
        if (ct.postId && !ct.error) {
          postToChannel.set(ct.postId, { channelId: ct.channelId, service: ct.service });
        }
      }
    }

    // Set único de postIds para sincronizar (un post puede estar en N canales = N postIds)
    const postIds = new Set<string>();
    for (const ids of rows.map((r) => r.buffer_update_ids ?? [])) {
      for (const id of ids) postIds.add(id);
    }
    // Filtrar solo los que tenemos mapeo de canal
    const syncIds = Array.from(postIds).filter((id) => postToChannel.has(id));
    log({ uniquePostIds: postIds.size, withChannelMapping: syncIds.length });

    let synced = 0;
    let failed = 0;
    let totalMetrics = 0;

    for (const postId of syncIds) {
      const metrics = await getPostMetrics(bufferKey, postId);
      if (!metrics || !metrics.metrics || metrics.metrics.length === 0) {
        failed++;
        await sleep(INTER_POST_DELAY_MS);
        continue;
      }

      const meta = postToChannel.get(postId)!;
      const now = new Date();
      const today = now.toISOString();
      const todayDate = now.toISOString().slice(0, 10); // YYYY-MM-DD para snapshot_date

      // Upsert por (post_id, metric_name, snapshot_date) — actualiza si ya existe
      const rows = metrics.metrics.map((m) => ({
        post_id: postId,
        channel_id: meta.channelId,
        service: meta.service,
        metric_name: m.type,
        value: m.value,
        snapshot_at: today,
        snapshot_date: todayDate,
      }));

      if (dryRun) {
        log({ postId, service: meta.service, metrics: rows.map((r) => `${r.metric_name}=${r.value}`) });
        totalMetrics += rows.length;
        synced++;
      } else {
        // Upsert uno por uno (ON CONFLICT update). Batch upsert con conflict en
        // (post_id, metric_name, DATE(snapshot_at)) — Supabase soporta onConflict.
        const { error: upsertErr } = await admin
          .from("social_metrics")
          .upsert(rows, { onConflict: "post_id,metric_name,snapshot_date" });
        if (upsertErr) {
          console.error(`upsert social_metrics ${postId}:`, upsertErr);
          failed++;
        } else {
          synced++;
          totalMetrics += rows.length;
        }
      }

      await sleep(INTER_POST_DELAY_MS);
    }

    log({ success: true, synced, failed, totalMetrics, dryRun });
    console.log("=== sync-metrics end ===");
    return 0;
  } catch (error) {
    console.error("sync-metrics error:", error);
    log({ success: false, error: String(error), dryRun });
    console.log("=== sync-metrics end ===");
    return 1;
  }
}

main().then((code) => process.exit(code));