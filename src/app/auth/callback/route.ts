import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Maneja el redirect de Supabase tras login OAuth (Google).
// Intercambia el `code` por una sesión y redirige al destino pedido.
// Las cookies se setean en el NextResponse saliente (no en cookies() del request),
// porque en Next.js 16 Route Handlers, cookies().set() no se propaga al response.
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // keep raw
  }
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  return "/";
}

// Hosts permitidos para construir el origin del redirect OAuth.
// Caddy pasa X-Forwarded-Host desde el Host header del cliente — si un atacante
// manda Host: evil.com, sin este check el redirect iría a evil.com${next}.
// En prod NEXT_PUBLIC_SITE_URL define el host esperado; en dev permitimos localhost.
function buildAllowedHosts(): Set<string> {
  const hosts = new Set<string>(["localhost:3000", "localhost"]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      hosts.add(new URL(siteUrl).host);
    } catch {
      // siteUrl inválido — ignorar
    }
  }
  return hosts;
}

function resolveHost(request: NextRequest, requestUrl: URL): string | null {
  const allowed = buildAllowedHosts();
  const candidates = [
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
    requestUrl.host,
  ];
  for (const c of candidates) {
    if (c && allowed.has(c.toLowerCase())) return c;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));
  // Construir origin desde headers de proxy (Caddy pasa X-Forwarded-Host/Proto).
  // Next.js standalone no usa estos headers para request.url automáticamente,
  // así que sin esto el redirect se va a localhost:3000 (del socket de escucha).
  // Validamos el host contra un allowlist para evitar open-redirect via Host header.
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = resolveHost(request, requestUrl);
  if (!host) {
    return new NextResponse("Host no válido", { status: 400 });
  }
  const origin = `${proto}://${host}`;

  if (code) {
    const redirectResponse = NextResponse.redirect(`${origin}${next}`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectResponse;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}