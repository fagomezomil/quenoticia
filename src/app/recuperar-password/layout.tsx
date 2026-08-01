import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar contraseña | ¡QUE NOTICIA!",
  description: "Restablecé tu contraseña de ¡QUE NOTICIA!.",
  robots: { index: false, follow: false },
};

export default function RecuperarPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}