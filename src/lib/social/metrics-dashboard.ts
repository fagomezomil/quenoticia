/** Funciones server-side para armar datos del dashboard de métricas.
 *  Lee social_metrics + social_posts y agrega por período, canal, tipo. */

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type Period = "7d" | "30d" | "90d";

export const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export interface MetricsTotals {
  reach: number;
  impressions: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  engagementRate: number;
  postsCounted: number;
}

export interface TopPost {
  postId: string;
  service: string;
  kind: string;
  reach: number;
  impressions: number;
  engagementRate: number;
  publishedAt: string | null;
  caption: string;
}

export interface ByService {
  service: string;
  reach: number;
  impressions: number;
  engagementRate: number;
  posts: number;
}

export interface ByDay {
  date: string;
  reach: number;
  impressions: number;
}

export interface ByKind {
  kind: string;
  reach: number;
  posts: number;
}

export interface DashboardData {
  totals: MetricsTotals;
  topPosts: TopPost[];
  byService: ByService[];
  byDay: ByDay[];
  byKind: ByKind[];
  period: Period;
  hasData: boolean;
}

interface MetricRow {
  post_id: string;
  channel_id: string;
  service: string;
  metric_name: string;
  value: number;
  snapshot_at: string;
  snapshot_date: string;
}

interface SocialPostRow {
  id: string;
  buffer_update_ids: string[] | null;
  kind: string;
  published_at: string | null;
  caption: string;
}

/** Trae el último snapshot de cada (post_id, metric_name) en el período.
 *  Buffer refresca daily, así que tomo el valor más reciente por post+metric. */
async function fetchLatestMetrics(since: string): Promise<MetricRow[]> {
  const admin = await getSupabaseAdmin();
  const { data, error } = await admin
    .from("social_metrics")
    .select("post_id, channel_id, service, metric_name, value, snapshot_at, snapshot_date")
    .gte("snapshot_at", since)
    .order("snapshot_at", { ascending: false });

  if (error) throw new Error(`fetch metrics: ${error.message}`);
  return (data ?? []) as MetricRow[];
}

/** Trae social_posts con buffer_update_ids no vacíos en el período. */
async function fetchSocialPosts(since: string): Promise<Map<string, SocialPostRow>> {
  const admin = await getSupabaseAdmin();
  const { data, error } = await admin
    .from("social_posts")
    .select("id, buffer_update_ids, kind, published_at, caption")
    .not("buffer_update_ids", "is", null)
    .gte("published_at", since)
    .limit(500);

  if (error) throw new Error(`fetch social_posts: ${error.message}`);

  // Map: postId (Buffer update_id) -> social_post row
  const map = new Map<string, SocialPostRow>();
  for (const row of (data ?? []) as SocialPostRow[]) {
    for (const id of row.buffer_update_ids ?? []) {
      map.set(id, row);
    }
  }
  return map;
}

/** Agrega métricas por post_id (toma el snapshot más reciente por métrica). */
function aggregateByPost(rows: MetricRow[]): Map<string, Map<string, number>> {
  // post_id -> metric_name -> latest value
  const byPost = new Map<string, Map<string, number>>();
  const seen = new Set<string>(); // post_id|metric_name ya vistos (rows ordenados desc)
  for (const row of rows) {
    const key = `${row.post_id}|${row.metric_name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!byPost.has(row.post_id)) byPost.set(row.post_id, new Map());
    byPost.get(row.post_id)!.set(row.metric_name, row.value);
  }
  return byPost;
}

export async function getMetricsDashboard(period: Period): Promise<DashboardData> {
  const days = PERIOD_DAYS[period];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [metricRows, postsMap] = await Promise.all([
    fetchLatestMetrics(since),
    fetchSocialPosts(since),
  ]);

  if (metricRows.length === 0) {
    return {
      totals: { reach: 0, impressions: 0, reactions: 0, comments: 0, shares: 0, clicks: 0, saves: 0, engagementRate: 0, postsCounted: 0 },
      topPosts: [],
      byService: [],
      byDay: [],
      byKind: [],
      period,
      hasData: false,
    };
  }

  // Agregar por post_id (último snapshot por métrica)
  const byPost = aggregateByPost(metricRows);

  // Totales
  const totals: MetricsTotals = {
    reach: 0, impressions: 0, reactions: 0, comments: 0, shares: 0, clicks: 0, saves: 0,
    engagementRate: 0, postsCounted: 0,
  };
  let engagementSum = 0;
  let engagementCount = 0;
  const postIds = Array.from(byPost.keys());
  for (const postId of postIds) {
    const m = byPost.get(postId)!;
    totals.reach += m.get("reach") ?? 0;
    totals.impressions += m.get("impressions") ?? 0;
    totals.reactions += m.get("reactions") ?? 0;
    totals.comments += m.get("comments") ?? 0;
    totals.shares += m.get("shares") ?? 0;
    totals.clicks += m.get("clicks") ?? 0;
    totals.saves += m.get("saves") ?? 0;
    const er = m.get("engagementRate");
    if (er !== undefined) {
      engagementSum += er;
      engagementCount++;
    }
  }
  totals.postsCounted = postIds.length;
  totals.engagementRate = engagementCount > 0 ? engagementSum / engagementCount : 0;

  // Top 10 posts por reach
  const topPosts: TopPost[] = postIds
    .map((postId) => {
      const m = byPost.get(postId)!;
      const sp = postsMap.get(postId);
      return {
        postId,
        service: metricRows.find((r) => r.post_id === postId)?.service ?? "",
        kind: sp?.kind ?? "desconocido",
        reach: m.get("reach") ?? 0,
        impressions: m.get("impressions") ?? 0,
        engagementRate: m.get("engagementRate") ?? 0,
        publishedAt: sp?.published_at ?? null,
        caption: sp?.caption ?? "",
      };
    })
    .sort((a, b) => b.reach - a.reach)
    .slice(0, 10);

  // Por service
  const serviceMap = new Map<string, { reach: number; impressions: number; engagementSum: number; engagementCount: number; posts: number }>();
  for (const row of metricRows) {
    if (!byPost.get(row.post_id)?.has(row.metric_name)) continue; // solo latest
    if (row.service === "") continue;
    if (!serviceMap.has(row.service)) serviceMap.set(row.service, { reach: 0, impressions: 0, engagementSum: 0, engagementCount: 0, posts: 0 });
    const s = serviceMap.get(row.service)!;
    if (row.metric_name === "reach") {
      s.reach += row.value;
      s.posts += 1;
    } else if (row.metric_name === "impressions") {
      s.impressions += row.value;
    } else if (row.metric_name === "engagementRate") {
      s.engagementSum += row.value;
      s.engagementCount += 1;
    }
  }
  const byService: ByService[] = Array.from(serviceMap.entries()).map(([service, s]) => ({
    service,
    reach: s.reach,
    impressions: s.impressions,
    engagementRate: s.engagementCount > 0 ? s.engagementSum / s.engagementCount : 0,
    posts: s.posts,
  }));

  // Por día
  const dayMap = new Map<string, { reach: number; impressions: number }>();
  for (const row of metricRows) {
    if (!byPost.get(row.post_id)?.has(row.metric_name)) continue; // solo latest por post
    const date = row.snapshot_date;
    if (!dayMap.has(date)) dayMap.set(date, { reach: 0, impressions: 0 });
    if (row.metric_name === "reach") dayMap.get(date)!.reach += row.value;
    else if (row.metric_name === "impressions") dayMap.get(date)!.impressions += row.value;
  }
  const byDay: ByDay[] = Array.from(dayMap.entries())
    .map(([date, v]) => ({ date, reach: v.reach, impressions: v.impressions }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Por kind
  const kindMap = new Map<string, { reach: number; posts: number }>();
  for (const postId of postIds) {
    const m = byPost.get(postId)!;
    const sp = postsMap.get(postId);
    const kind = sp?.kind ?? "desconocido";
    if (!kindMap.has(kind)) kindMap.set(kind, { reach: 0, posts: 0 });
    kindMap.get(kind)!.reach += m.get("reach") ?? 0;
    kindMap.get(kind)!.posts += 1;
  }
  const byKind: ByKind[] = Array.from(kindMap.entries()).map(([kind, v]) => ({
    kind,
    reach: v.reach,
    posts: v.posts,
  }));

  return { totals, topPosts, byService, byDay, byKind, period, hasData: true };
}