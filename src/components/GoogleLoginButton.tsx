"use client";

import { createClient } from "@/lib/supabase/client";

interface GoogleLoginButtonProps {
  /** Path al que redirigir después del callback de OAuth. Default: "/" */
  next?: string;
  /** Estilo visual. "block" = botón full-width con borde (mobile menú). "compact" = botón compacto (dropdown). */
  variant?: "block" | "compact";
}

/**
 * Botón de login con Google vía Supabase OAuth.
 * Compartido entre GuestDropdown (desktop) y mobile menú del Navbar
 * para evitar divergencia visual/funcional.
 */
export default function GoogleLoginButton({ next = "/", variant = "block" }: GoogleLoginButtonProps) {
  const handleLogin = async () => {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const baseClass =
    variant === "block"
      ? "w-full flex items-center justify-center gap-2 py-2 border border-white/20 rounded text-white text-sm hover:bg-white/10 transition-colors"
      : "w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-[#f0efed] transition-colors";

  return (
    <button onClick={handleLogin} className={baseClass}>
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      <span>Iniciar sesión con Google</span>
    </button>
  );
}