import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Maneja el redirect de Supabase tras login OAuth (Google).
// Intercambia el `code` por una sesión y redirige al destino pedido.
function safeNext(raw: string | null, origin: string): string {
  // Solo paths internos: deben empezar con "/" y no "//" (protocol-relative).
  if (!raw) return "/";
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  return "/";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si falla el intercambio o no hay code, volver al login con error
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}