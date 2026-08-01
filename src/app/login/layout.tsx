import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión | ¡QUE NOTICIA!",
  description: "Iniciá sesión en tu cuenta de ¡QUE NOTICIA!.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}