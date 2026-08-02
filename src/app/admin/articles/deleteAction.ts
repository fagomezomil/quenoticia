"use server";

import { createClient, requireEditorAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyArticleChange } from "@/lib/indexnow";
import { notifyGoogleIndexing } from "@/lib/google-indexing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.quenoticia.com.ar";

export async function deleteArticle(id: string) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  // Fetch section antes de borrar para armar URL de IndexNow
  const { data: existing } = await supabase
    .from("articles")
    .select("section")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/opinion");
  revalidatePath("/");

  // IndexNow: notificar URL eliminada (Bing la saca del índice)
  // Google Indexing API: URL_DELETED (Google la saca del índice)
  if (existing?.section) {
    void notifyArticleChange(existing.section, id);
    void notifyGoogleIndexing(`${SITE_URL}/${existing.section}/${id}`, "URL_DELETED");
  }
  return { error: null };
}

export async function toggleArticleActive(id: string, active: boolean) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({ active: !active })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/opinion");
  revalidatePath("/");

  // IndexNow + Google Indexing: notificar cambio de visibilidad
  const { data: article } = await supabase
    .from("articles")
    .select("section")
    .eq("id", id)
    .maybeSingle();
  if (article?.section) {
    void notifyArticleChange(article.section, id);
    void notifyGoogleIndexing(`${SITE_URL}/${article.section}/${id}`, "URL_UPDATED");
  }
  return { error: null };
}