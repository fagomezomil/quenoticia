"use server";

import { createClient } from "@/lib/supabase/server";

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === "production";

  // En producción SIN secret → rechazar todo (fail-closed). El dev-mode está
  // prohibido en prod porque cualquier bot podría mandarlo y bypassar Turnstile.
  if (!secret) {
    if (isProduction) {
      console.error("TURNSTILE_SECRET_KEY missing en producción — registro bloqueado");
      return false;
    }
    // Dev sin secret: aceptar dev-mode del widget para no romper el flujo local
    if (token === "dev-mode") return true;
    console.error("TURNSTILE_SECRET_KEY missing (dev)");
    return false;
  }
  if (!token || token === "dev-mode") return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return Boolean(data?.success);
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return false;
  }
}

export interface RegisterResult {
  ok: boolean;
  error?: string;
}

/** Server action de registro con verificación anti-bot (Cloudflare Turnstile). */
export async function registerUser(
  fullName: string,
  email: string,
  password: string,
  turnstileToken: string,
): Promise<RegisterResult> {
  if (!fullName.trim()) return { ok: false, error: "Falta el nombre" };
  if (!email.trim()) return { ok: false, error: "Falta el email" };
  if (!password) return { ok: false, error: "Falta la contraseña" };
  if (password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres" };
  }
  if (!turnstileToken) {
    return { ok: false, error: "Verificación anti-bot pendiente. Esperá que cargue el widget." };
  }

  const verified = await verifyTurnstileToken(turnstileToken);
  if (!verified) {
    return { ok: false, error: "Verificación anti-bot falló. Recargá la página e intentá de nuevo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim() } },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export interface LoginResult {
  ok: boolean;
  error?: string;
  suspended?: boolean;
}

/** Server action de login con verificación anti-bot (Cloudflare Turnstile).
 *  Usa server client para que las cookies de sesión se seteen desde el server. */
export async function loginUser(
  email: string,
  password: string,
  turnstileToken: string,
): Promise<LoginResult> {
  if (!email.trim()) return { ok: false, error: "Falta el email" };
  if (!password) return { ok: false, error: "Falta la contraseña" };
  if (!turnstileToken) {
    return { ok: false, error: "Verificación anti-bot pendiente. Esperá que cargue el widget." };
  }

  const verified = await verifyTurnstileToken(turnstileToken);
  if (!verified) {
    return { ok: false, error: "Verificación anti-bot falló. Recargá la página e intentá de nuevo." };
  }

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (authError) {
    return { ok: false, error: "Email o contraseña incorrectos" };
  }

  // Check if user is suspended
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "suspended") {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: "Tu cuenta está suspendida. Contactá al administrador.",
        suspended: true,
      };
    }
  }

  return { ok: true };
}

export interface RequestPasswordResetResult {
  ok: boolean;
  error?: string;
}

/** Server action de recuperar password con verificación anti-bot.
 *  Mitiga email bombing (un atacante no puede disparar reset emails sin
 *  pasar Turnstile). */
export async function requestPasswordReset(
  email: string,
  turnstileToken: string,
): Promise<RequestPasswordResetResult> {
  if (!email.trim()) return { ok: false, error: "Falta el email" };
  if (!turnstileToken) {
    return { ok: false, error: "Verificación anti-bot pendiente. Esperá que cargue el widget." };
  }

  const verified = await verifyTurnstileToken(turnstileToken);
  if (!verified) {
    return { ok: false, error: "Verificación anti-bot falló. Recargá la página e intentá de nuevo." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const supabase = await createClient();
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${siteUrl}/actualizar-password`,
  });

  if (resetError) {
    return { ok: false, error: resetError.message };
  }

  return { ok: true };
}