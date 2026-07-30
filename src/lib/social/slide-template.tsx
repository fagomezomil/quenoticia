import React from "react";
import { sectionConfig, type Section } from "@/lib/types";

/** Colores para categorías de agenda (no están en sectionConfig). */
export const AGENDA_COLORS: Record<string, string> = {
  cultural: "#8b5cf6",
  turistico: "#14b8a6",
  deportivo: "#ef4444",
};

export const AGENDA_LABELS: Record<string, string> = {
  cultural: "Cultural",
  turistico: "Turístico",
  deportivo: "Deportivo",
};

export interface SlideData {
  title: string;
  section: Section;
  /** data URL (base64) o URL pública de la portada */
  imageDataUrl: string;
  /** data URL (base64) del logo del diario (logodesktop.png).
   *  Lo carga generate-slide.ts; si no viene, el template usa fallback de texto. */
  logoDataUrl?: string;
  /** excerpt de la nota — se truncará a 350 chars para mostrar como bajada */
  excerpt?: string;
  /** Fecha de la nota formateada para mostrar (ej: "20/07/2026"). */
  dateLabel?: string;
  /** Fuente de la nota (ej: "TN", "TyC Sports.com"). Se muestra arriba de la fecha. */
  sourceLabel?: string;
  /** Chip custom (para eventos de agenda: label + color propios).
   *  Si viene, reemplaza el chip de sectionConfig. */
  chip?: { label: string; color: string };
  /** Nombre del lugar/venue (para eventos de agenda). Se muestra como "Lugar: X" */
  venue?: string;
}

const WIDTH = 1080;
const HEIGHT = 1350;

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const HALFTONE_BG =
  "radial-gradient(circle, rgba(10,10,10,0.18) 1px, transparent 1.5px)";
const HALFTONE_BG_LIGHT =
  "radial-gradient(circle, rgba(10,10,10,0.10) 1px, transparent 1.5px)";

/** Trunca el título a ~110 chars en 3 líneas máx sin cortar palabras raras. */
function fitTitle(title: string): string {
  const clean = title.replace(/\s+/g, " ").trim();
  if (clean.length <= 110) return clean;
  const cut = clean.slice(0, 107);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 80 ? lastSpace : 107) + "…";
}

/** Trunca el título para story (9:16) — máx 90 chars (~3-4 líneas con Oswald 76px
 *  en ancho 960px). Área de texto es 720px, hay que dejar espacio para el footer. */
function fitTitleStory(title: string): string {
  const clean = title.replace(/\s+/g, " ").trim();
  if (clean.length <= 90) return clean;
  const cut = clean.slice(0, 87);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 60 ? lastSpace : 87) + "…";
}

/** Bajada de hasta 350 chars a partir del excerpt. */
function fitExcerpt(excerpt: string | undefined): string | null {
  if (!excerpt) return null;
  const clean = excerpt.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (clean.length <= 350) return clean;
  const cut = clean.slice(0, 347);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 280 ? lastSpace : 347) + "…";
}

/** Template JSX del slide Comic Noir 1080×1350 para Satori.
 *  Satori soporta un subset de CSS: display:flex por defecto, no box-shadow,
 *  no line-clamp. La hard shadow se simula con un div negro offset. */
export function SlideTemplate({
  title,
  section,
  imageDataUrl,
  logoDataUrl,
  excerpt,
  dateLabel,
  sourceLabel,
  chip,
  venue,
}: SlideData) {
  const cfg = sectionConfig[section];
  const chipLabel = (chip?.label ?? cfg.label).toUpperCase();
  const chipColor = chip?.color ?? cfg.color;
  const fit = fitTitle(title);
  const bajada = fitExcerpt(excerpt);
  const venueClean = venue?.replace(/\s+/g, " ").trim();

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: "#ffffff",
        fontFamily: "Inter",
        padding: 70,
        position: "relative",
      },
    },
    // Halftone sutil top-right
    React.createElement("div", {
      style: {
        position: "absolute",
        top: 0,
        right: 0,
        width: 360,
        height: 200,
        backgroundImage: HALFTONE_BG_LIGHT,
        backgroundSize: "8px 8px",
      },
    }),
    // Portada con hard shadow (div negro offset detrás)
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          position: "relative",
          width: "100%",
          height: 500,
          marginBottom: 32,
        },
      },
      // Hard shadow offset
      React.createElement("div", {
        style: {
          position: "absolute",
          left: 8,
          top: 8,
          width: "100%",
          height: "100%",
          backgroundColor: "#0a0a0a",
        },
      }),
      // Imagen
      React.createElement("img", {
        src: imageDataUrl,
        style: {
          position: "relative",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          border: "3px solid #0a0a0a",
        },
      }),
    ),
    // Chip de sección (más chico)
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignSelf: "flex-start",
          backgroundColor: chipColor,
          color: "#ffffff",
          fontFamily: "Oswald",
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 2,
          padding: "7px 16px",
          marginBottom: 20,
          textTransform: "uppercase",
        },
      },
      chipLabel,
    ),
    // Título (4px menos: 64 → 60)
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          fontFamily: "Oswald",
          fontWeight: 700,
          fontSize: 60,
          lineHeight: 1.15,
          color: "#0a0a0a",
          marginBottom: 24,
        },
      },
      fit,
    ),
    // Lugar/venue (sólo si viene — eventos de agenda)
    venueClean &&
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: 22,
          lineHeight: 1.3,
          color: "#0a0a0a",
          marginBottom: 12,
        },
      },
      `📍 ${venueClean}`,
    ),
    // Bajada (excerpt truncado a 350 chars, texto más chico)
    bajada &&
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          fontFamily: "Inter",
          fontWeight: 400,
          fontSize: 24,
          lineHeight: 1.4,
          color: "#6b5d4f",
        },
      },
      bajada,
    ),
    // Espaciador flexible
    React.createElement("div", { style: { flex: 1 } }),
    // Halftone divider
    React.createElement("div", {
      style: {
        width: "100%",
        height: 12,
        backgroundImage: HALFTONE_BG,
        backgroundSize: "6px 6px",
        marginBottom: 22,
      },
    }),
    // Footer: logo (imagen) + URL + turno
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
          },
        },
        // Logo del diario (reemplaza el texto "¡QUE NOTICIA!") — fallback a texto si no hay logo
        logoDataUrl
          ? React.createElement("img", {
            src: logoDataUrl,
            style: {
              display: "flex",
              height: 160,
              width: "auto",
              objectFit: "contain",
            },
          })
          : React.createElement(
            "div",
            {
              style: {
                fontFamily: "Oswald",
                fontWeight: 700,
                fontSize: 32,
                color: "#0a0a0a",
                letterSpacing: 1,
              },
            },
            "¡QUE NOTICIA!",
          ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              fontFamily: "Oswald",
              fontWeight: 600,
              fontSize: 20,
              marginTop: 4,
              letterSpacing: 0.5,
            },
          },
          // "que" en brand naranja + "noticia.com.ar" en negro (mismo pattern que la navbar)
          React.createElement(
            "span",
            { style: { color: "#f97316" } },
            "que",
          ),
          React.createElement(
            "span",
            { style: { color: "#0a0a0a" } },
            "noticia.com.ar",
          ),
        ),
      ),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          },
        },
        sourceLabel &&
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 14,
              color: "#6b5d4f",
              letterSpacing: 1,
              marginBottom: 4,
            },
          },
          sourceLabel,
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 20,
              color: "#6b5d4f",
              letterSpacing: 1,
            },
          },
          dateLabel ?? "",
        ),
      ),
    ),
  );
}

/** Template JSX del slide Story 1080×1920 (9:16) para IG/FB stories.
 *  Layout vertical: imagen full-bleed arriba (1080×1200), chip overlay,
 *  título Oswald grande (sin bajada), footer con logo + web + fuente + fecha
 *  (mismo footer que el carrusel del feed). */
export function SlideTemplateStory({
  title,
  section,
  imageDataUrl,
  logoDataUrl,
  dateLabel,
  sourceLabel,
}: SlideData) {
  const cfg = sectionConfig[section];
  const chipLabel = cfg.label.toUpperCase();
  const chipColor = cfg.color;
  const fit = fitTitleStory(title);

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        backgroundColor: "#ffffff",
        fontFamily: "Inter",
        position: "relative",
      },
    },
    // Imagen full-bleed arriba (1080×1200) con chip overlay
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          position: "relative",
          width: "100%",
          height: 1200,
        },
      },
      React.createElement("img", {
        src: imageDataUrl,
        style: {
          position: "relative",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        },
      }),
      // Overlay degradado abajo para que el chip resalte
      React.createElement("div", {
        style: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 220,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))",
        },
      }),
      // Chip de sección sobre la imagen, bottom-left
      React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            bottom: 50,
            left: 60,
            display: "flex",
            backgroundColor: chipColor,
            color: "#ffffff",
            fontFamily: "Oswald",
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 2,
            padding: "9px 22px",
            textTransform: "uppercase",
          },
        },
        chipLabel,
      ),
    ),
    // Área de texto (720px de alto: 1920 - 1200)
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          padding: "40px 60px 44px",
          flex: 1,
        },
      },
      // Título grande Oswald 76px (sin bajada)
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            fontFamily: "Oswald",
            fontWeight: 700,
            fontSize: 76,
            lineHeight: 1.1,
            color: "#0a0a0a",
            marginBottom: 32,
          },
        },
        fit,
      ),
      // Espaciador
      React.createElement("div", { style: { flex: 1 } }),
      // Halftone divider
      React.createElement("div", {
        style: {
          width: "100%",
          height: 10,
          backgroundImage: HALFTONE_BG,
          backgroundSize: "6px 6px",
          marginBottom: 18,
        },
      }),
      // Footer: logo + web (izquierda) + fuente + fecha (derecha) — igual que el feed
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
            },
          },
          logoDataUrl
            ? React.createElement("img", {
              src: logoDataUrl,
              style: {
                display: "flex",
                height: 100,
                width: "auto",
                objectFit: "contain",
              },
            })
            : React.createElement(
              "div",
              {
                style: {
                  fontFamily: "Oswald",
                  fontWeight: 700,
                  fontSize: 34,
                  color: "#0a0a0a",
                  letterSpacing: 1,
                },
              },
              "¡QUE NOTICIA!",
            ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                fontFamily: "Oswald",
                fontWeight: 600,
                fontSize: 22,
                marginTop: 4,
                letterSpacing: 0.5,
              },
            },
            React.createElement(
              "span",
              { style: { color: "#f97316" } },
              "que",
            ),
            React.createElement(
              "span",
              { style: { color: "#0a0a0a" } },
              "noticia.com.ar",
            ),
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            },
          },
          sourceLabel &&
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 20,
                color: "#6b5d4f",
                letterSpacing: 1,
                marginBottom: 4,
              },
            },
            sourceLabel,
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 22,
                color: "#6b5d4f",
                letterSpacing: 1,
              },
            },
            dateLabel ?? "",
          ),
        ),
      ),
    ),
  );
}