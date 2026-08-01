import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Anonymous public client — no cookies, no user session.
 *  Use for public read-only queries (articles, ads, columnists, cached_articles).
 *  RLS applies — only rows visible to the anon role are returned.
 *  Does NOT call cookies() → does NOT opt the page into dynamic rendering.
 *  This is the key difference vs createClient(): pages using createPublicClient()
 *  stay statically renderable + cacheable (cache-control: public), fixing TTFB. */
export function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars");
  }
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from Server Component — cookies can't be set
        }
      },
    },
  });
}

/** Verifies the current user is authenticated and has admin role.
 *  Redirects to /admin/login if not authenticated, or to / if not admin. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/");

  return { supabase, user };
}

/** Verifies the current user is authenticated and has admin or editor role.
 *  Redirects to /admin/login if not authenticated, or to / if not authorized. */
export async function requireEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) redirect("/");

  return { supabase, user, profile };
}

/** Returns the current user's role, or null if not authenticated.
 *  Use in server actions where redirect() cannot be used. */
export async function getUserRole(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role ?? null;
}

/** Verifies the current user is admin. Throws if not.
 *  Use in server actions where redirect() cannot be used. */
export async function requireAdminAction() {
  const role = await getUserRole();
  if (role !== "admin") throw new Error("No autorizado");
}

/** Verifies the current user is admin or editor. Throws if not.
 *  Use in server actions where redirect() cannot be used. */
export async function requireEditorAction() {
  const role = await getUserRole();
  if (role !== "admin" && role !== "editor") throw new Error("No autorizado");
}