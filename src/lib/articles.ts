import { createClient } from "@/lib/supabase/server";
import type { Section, ArticleLayout, CustomArticle, Comment } from "@/lib/types";

function mapRowToArticle(row: Record<string, unknown>): CustomArticle {
  return {
    id: row.id as string,
    title: row.title as string,
    subtitle: (row.subtitle as string) || undefined,
    section: row.section as Section,
    author: (row.author as string) || undefined,
    publisher: row.publisher as string,
    date: row.date as string,
    imageUrl: (row.image_url as string) || undefined,
    imageAlt: (row.image_alt as string) || (row.title as string) || "",
    excerpt: (row.excerpt as string) || "",
    body: (row.body as string) || undefined,
    originalUrl: (row.original_url as string) || undefined,
    featured: (row.featured as boolean) ?? false,
    breaking: (row.breaking as boolean) ?? false,
    layout: (row.layout as ArticleLayout) || "normal",
    active: row.active as boolean,
    created_by: (row.created_by as string) || null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    comments_enabled: (row.comments_enabled as boolean) ?? true,
    volanta: (row.volanta as string) || undefined,
    columnistId: (row.columnist_id as string) || undefined,
  };
}

/** Devuelve true si existe al menos 1 nota de opinión activa.
 *  Query mínima (limit 1) — usada por NavbarWrapper para decidir si mostrar la pestaña Opinión. */
export async function hasOpinionNotes(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select("id")
      .eq("active", true)
      .eq("section", "opinion")
      .limit(1);
    if (error || !data) return false;
    return data.length > 0;
  } catch {
    return false;
  }
}

export async function getActiveArticles(section?: Section): Promise<CustomArticle[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("articles")
      .select("*")
      .eq("active", true)
      .order("sort_date", { ascending: false });

    if (section) {
      query = query.eq("section", section);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapRowToArticle);
  } catch {
    return [];
  }
}

/** Articles by columnist, newest first. */
export async function getArticlesByColumnist(columnistId: string): Promise<CustomArticle[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("active", true)
      .eq("columnist_id", columnistId)
      .order("sort_date", { ascending: false });

    if (error || !data) return [];
    return data.map(mapRowToArticle);
  } catch {
    return [];
  }
}
export async function getFeaturedArticles(limit = 6): Promise<CustomArticle[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("active", true)
      .eq("featured", true)
      .order("sort_date", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(mapRowToArticle);
  } catch {
    return [];
  }
}

export async function getAllArticles(): Promise<CustomArticle[]> {
  // Supabase REST API trae por default hasta 1000 filas por query sin paginar.
  // Si hay más de 1000 notas, getAllArticles() simple las trunca y el admin
  // no ve las más viejas. Paginar en chunks de 1000 hasta agotar.
  try {
    const supabase = await createClient();
    const all: CustomArticle[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("sort_date", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      all.push(...data.map(mapRowToArticle));
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return all;
  } catch {
    return [];
  }
}

export async function getArticleById(id: string): Promise<CustomArticle | null> {
  try {
    const supabase = await createClient();
    // Try fetching without active filter first (admin can see all articles)
    // If RLS only allows active, this will still work for public articles
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapRowToArticle(data);
  } catch {
    return null;
  }
}

export async function getComments(articleId: string): Promise<Comment[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("comments")
      .select("id, article_id, user_id, content, created_at, author_name, author_avatar_url")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      article_id: row.article_id as string,
      user_id: (row.user_id as string) || null,
      user_name: (row.author_name as string) || "Anónimo",
      user_avatar_url: (row.author_avatar_url as string) || null,
      content: row.content as string,
      created_at: row.created_at as string,
    }));
  } catch {
    return [];
  }
}

export async function getCommentCounts(articleIds: string[]): Promise<Record<string, number>> {
  if (articleIds.length === 0) return {};
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("comments")
      .select("article_id")
      .in("article_id", articleIds);

    if (error || !data) return {};

    const counts: Record<string, number> = {};
    for (const row of data) {
      const id = row.article_id as string;
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}