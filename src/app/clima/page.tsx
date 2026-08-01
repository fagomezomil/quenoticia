import Header from "@/components/Header";
import NavbarWrapper from "@/components/NavbarWrapper";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import WeatherCurrent from "@/components/WeatherCurrent";
import WeatherForecast from "@/components/WeatherForecast";
import WeatherCities from "@/components/WeatherCities";
import AdRotator from "@/components/AdRotator";
import { fetchCurrentWeather, fetchAllCitiesWeather } from "@/lib/weather";
import { getActiveAds } from "@/lib/ads";
import { getCachedBreakingNews } from "@/lib/sync-news";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Metadata } from "next";
import type { Ad } from "@/lib/types";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Clima Tucumán y Argentina — Pronóstico del tiempo",
  description:
    "Pronóstico del tiempo en San Miguel de Tucumán y las principales ciudades de Argentina. Temperatura, humedad y pronóstico extendido actualizado.",
  alternates: { canonical: "/clima" },
  openGraph: {
    title: "Clima Tucumán y Argentina | " + SITE_NAME,
    description:
      "Pronóstico del tiempo en San Miguel de Tucumán y las principales ciudades de Argentina. Temperatura, humedad y pronóstico extendido actualizado.",
    url: SITE_URL + "/clima",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    title: "Clima Tucumán y Argentina | " + SITE_NAME,
    description:
      "Pronóstico del tiempo en San Miguel de Tucumán y las principales ciudades de Argentina.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function ClimaPage() {
  const [tucumanWeather, citiesWeather, breakingArticles, allAds] = await Promise.all([
    fetchCurrentWeather(),
    fetchAllCitiesWeather(),
    getCachedBreakingNews(),
    getActiveAds(),
  ]);

  // Sin section filter: trae solo ads globales (section IS NULL).
  // /clima no es una Section válida en el type system.
  const leaderboardAds = allAds.filter((a: Ad) => a.type === "leaderboard");
  const rectangleAds = allAds.filter((a: Ad) => a.type === "rectangle" || a.type === "sidebar");
  const leaderboardTop = leaderboardAds[0] ? [leaderboardAds[0]] : [];
  const leaderboardBottom = leaderboardAds.length > 1 ? [leaderboardAds[1]] : [];

  return (
    <>
      <Header />
      <NavbarWrapper />
      <BreakingNews articles={breakingArticles ?? []} />

      <main className="max-w-7xl mx-auto px-4 pt-6 pb-10">
        {/* Section header */}
        <div className="mb-6">
          <div className="border-l-4 pl-4 py-1 border-clima">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight font-[family-name:var(--font-heading)] text-clima">
              Clima
            </h1>
            <p className="mt-1 text-sm text-muted">
              Pronóstico del tiempo para San Miguel de Tucumán y Argentina
            </p>
          </div>
        </div>
        <div className="rule-thin mb-6" />

        {/* Leaderboard top */}
        {leaderboardTop.length > 0 && (
          <div className="mb-8">
            <AdRotator ads={leaderboardTop} size="leaderboard" />
          </div>
        )}

        {/* 4 cols en desktop: contenido apilado en 3 cols + 1 sidebar. 1 col en mobile. */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* col 1-3: contenido apilado vertical (como era antes) */}
          <div className="lg:col-span-3">
            {tucumanWeather && (
              <>
                <WeatherCurrent
                  current={tucumanWeather.current}
                  today={tucumanWeather.daily[0]}
                />
                <div className="rule-thin my-8" />
                <WeatherForecast daily={tucumanWeather.daily} />
              </>
            )}

            {citiesWeather.length > 0 && (
              <>
                <div className="rule-thin my-8" />
                <WeatherCities cities={citiesWeather} />
              </>
            )}
          </div>

          {/* col 4: Sidebar ads (sticky en desktop) */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 flex flex-col gap-4">
              {rectangleAds.length > 0 ? (
                rectangleAds.slice(0, 3).map((ad, i) => (
                  <AdRotator
                    key={ad.id + "-" + i}
                    ads={[ad]}
                    size={ad.type === "sidebar" ? "sidebar" : "rectangle"}
                  />
                ))
              ) : (
                <AdRotator ads={[]} size="rectangle" />
              )}
            </div>
          </aside>
        </div>

        {/* Leaderboard bottom */}
        {leaderboardBottom.length > 0 && (
          <div className="mt-8">
            <AdRotator ads={leaderboardBottom} size="leaderboard" />
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}