import Navbar from "@/components/Navbar";
import { hasOpinionNotes } from "@/lib/articles";

/**
 * Server Component wrapper que consulta si hay notas de Opinión activas
 * y le pasa el flag al Navbar (Client Component) para que decida si
 * mostrar la pestaña Opinión en el menú.
 *
 * Si el Navbar se usara directamente sin este wrapper, la pestaña Opinión
 * aparecería siempre (incluso cuando no hay notas).
 */
export default async function NavbarWrapper() {
  const hasOpinion = await hasOpinionNotes();
  return <Navbar hasOpinionNotes={hasOpinion} />;
}