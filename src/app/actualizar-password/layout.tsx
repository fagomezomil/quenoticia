import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Actualizar contraseña | ¡QUE NOTICIA!",
  description: "Actualizá tu contraseña de ¡QUE NOTICIA!.",
  robots: { index: false, follow: false },
};

export default function ActualizarPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}