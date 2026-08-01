import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrarse | ¡QUE NOTICIA!",
  description: "Creá tu cuenta en ¡QUE NOTICIA!.",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}