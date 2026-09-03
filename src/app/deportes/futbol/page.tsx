import type { Metadata } from "next";
import { getSportsMatchesBySport, getStandings } from "@/lib/sports";
import FixturePage from "@/components/FixturePage";
import Header from "@/components/Header";
import NavbarWrapper from "@/components/NavbarWrapper";
import Footer from "@/components/Footer";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Fixture Liga Profesional 2026 | ¡QUE NOTICIA!",
  description: "Fixture completo de la Liga Profesional Argentina 2026. Resultados, próximos partidos y horarios, fecha por fecha.",
  alternates: { canonical: "/deportes/futbol" },
  robots: { index: true, follow: true },
};

export default async function DeportesFutbolPage() {
  const [matches, standingsA, standingsB] = await Promise.all([
    getSportsMatchesBySport("futbol"),
    getStandings("futbol", "A"),
    getStandings("futbol", "B"),
  ]);
  return (
    <>
      <Header />
      <NavbarWrapper />
      <main>
        <FixturePage
          matches={matches}
          sport="futbol"
          standingsA={standingsA}
          standingsB={standingsB}
        />
      </main>
      <Footer />
    </>
  );
}