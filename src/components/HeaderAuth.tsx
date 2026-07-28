"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth";
import UserDropdown, { SocialIcons } from "@/components/UserDropdown";
import GoogleLoginButton from "@/components/GoogleLoginButton";

function GuestDropdown() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setClosing(true);
        setTimeout(() => { setOpen(false); setClosing(false); }, 150);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setClosing(true);
        setTimeout(() => { setOpen(false); setClosing(false); }, 150);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const closeDropdown = () => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 150);
  };

  return (
    <div ref={ref} className="relative" style={{ overflow: "visible" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center hover:bg-white/30 transition-colors"
        aria-label="Menú de usuario"
      >
        <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.215-.584-7.499-1.632z" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-border py-1 tracking-normal normal-case ${closing ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"} transition-all duration-150`}
          style={{ zIndex: 9999 }}
        >
          {/* Suscribite + Social */}
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Suscribite a ¡QUE NOTICIA!</p>
            <p className="text-[10px] text-muted mt-0.5">Recibí las noticias más importantes</p>
            <SocialIcons className="mt-1.5" />
          </div>

          {/* Google login */}
          <GoogleLoginButton variant="compact" />

          {/* Login / Register links */}
          <div className="border-t border-border my-1" />
          <div className="flex items-center justify-center gap-4 px-3 py-2">
            <Link
              href="/login"
              onClick={closeDropdown}
              className="text-sm text-[#e63946] font-semibold hover:underline"
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              onClick={closeDropdown}
              className="text-sm text-muted font-semibold hover:text-foreground transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeaderAuth() {
  const user = useAuthStore((s) => s.user);

  if (user) {
    return <UserDropdown />;
  }

  return <GuestDropdown />;
}