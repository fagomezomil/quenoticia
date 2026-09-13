import React from "react";
import { sectionConfig, type Section } from "@/lib/types";

/** 5 layouts variados para romper la monotonía del mosaico IG/FB.
 *  Round-robin: fullbleed → titular → cita → dato → cta → repite.
 *  Logo sin chip: white en fondos oscuros, dark en fondos claros. */

export type SlideLayout = "fullbleed" | "titular" | "cita" | "dato" | "cta";

export const LAYOUT_ORDER: SlideLayout[] = ["fullbleed", "titular", "cita", "dato", "cta"];

export interface SlideDataV2 {
  title: string;
  section: Section;
  imageDataUrl: string;
  /** data URL del logo WHITE — para fondos oscuros (fullbleed, cita, dato) */
  logoWhiteDataUrl?: string;
  /** data URL del logo DARK — para fondos claros (titular, cta) */
  logoDarkDataUrl?: string;
  excerpt?: string;
  dateLabel?: string;
  sourceLabel?: string;
  layout: SlideLayout;
  quote?: { text: string; author?: string };
  stat?: { value: string; label: string };
}

export const INK = "#0a0a0a";
export const CREAM = "#f5efe4";
export const BRAND = "#f97316";

export const HALFTONE_DARK = "radial-gradient(circle, rgba(10,10,10,0.18) 1px, transparent 1.5px)";
export const HALFTONE_DARK_SOFT = "radial-gradient(circle, rgba(10,10,10,0.10) 1px, transparent 1.5px)";
export const HALFTONE_WHITE = "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1.5px)";
export const HALFTONE_WHITE_SOFT = "radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1.5px)";

export const CARRUSEL_W = 1080;
export const CARRUSEL_H = 1350;
export const STORY_W = 1080;
export const STORY_H = 1920;

export function fitN(s: string, max: number): string {
  // U+2011 (guion no-separador) no tiene glifo en Oswald → tofu. Normalizar a "-".
  const c = s.replace(/\u2011/g, "-").replace(/\s+/g, " ").trim();
  if (c.length <= max) return c;
  const cut = c.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return cut.slice(0, sp > max * 0.7 ? sp : max - 1) + "…";
}

/** Auto-fit de títulos: elige el font size más grande cuyas líneas estimadas
 *  entran en maxHeight. Devuelve también la cantidad de líneas para que el
 *  caller posicione la barra/excerpt inmediatamente debajo (sin gap vacío).
 *
 *  Estimación: Oswald 700 uppercase promedia ~0.60em por carácter. Es
 *  deliberadamente conservador (sobreestima líneas) para que nunca se pase
 *  de largo: peor caso, el título queda un escalón más chico. */
export function autoFitTitle(
  title: string,
  width: number,
  maxHeight: number,
  lineHeight: number,
  sizes: number[],
): { size: number; lines: number } {
  const chars = title.replace(/\u2011/g, "-").replace(/\s+/g, " ").trim().length || 1;
  for (const size of sizes) {
    const charsPerLine = width / (size * 0.6);
    const lines = Math.ceil(chars / charsPerLine);
    if (lines * size * lineHeight <= maxHeight) return { size, lines };
  }
  const size = sizes[sizes.length - 1];
  const lines = Math.ceil(chars / (width / (size * 0.6)));
  return { size, lines };
}

/** Logo sin chip — directo sobre el fondo. */
export function Logo({
  logoDataUrl,
  bottom,
  right,
  size,
}: {
  logoDataUrl?: string;
  bottom: number;
  right: number;
  size: number;
}) {
  return React.createElement(
    "div",
    {
      style: {
        position: "absolute",
        bottom,
        right,
        display: "flex",
      },
    },
    logoDataUrl
      ? React.createElement("img", {
          src: logoDataUrl,
          style: { width: size, height: size, objectFit: "contain" },
        })
      : React.createElement(
          "div",
          {
            style: {
              fontFamily: "Oswald",
              fontWeight: 700,
              fontSize: 28,
              color: "#ffffff",
              letterSpacing: 1,
            },
          },
          "QN",
        ),
  );
}

export function WebText({
  inkColor,
  bottom,
  left,
  fontSize = 24,
}: {
  inkColor: string;
  bottom: number;
  left: number;
  fontSize?: number;
}) {
  return React.createElement(
    "div",
    {
      style: {
        position: "absolute",
        bottom,
        left,
        display: "flex",
        fontFamily: "Oswald",
        fontWeight: 600,
        fontSize,
        letterSpacing: 0.5,
      },
    },
    React.createElement("span", { style: { color: BRAND } }, "que"),
    React.createElement("span", { style: { color: inkColor } }, "noticia.com.ar"),
  );
}

export function Chip({
  label,
  color,
  top,
  left,
  fontSize = 26,
  textColor = "#ffffff",
}: {
  label: string;
  color: string;
  top: number;
  left: number;
  fontSize?: number;
  textColor?: string;
}) {
  return React.createElement(
    "div",
    {
      style: {
        position: "absolute",
        top,
        left,
        display: "flex",
        backgroundColor: color,
        color: textColor,
        fontFamily: "Oswald",
        fontWeight: 700,
        fontSize,
        letterSpacing: 2,
        padding: "10px 22px",
        textTransform: "uppercase",
      },
    },
    label,
  );
}

export function HalftoneBar({
  bg,
  top,
  left,
  width,
  height = 10,
  size = "6px",
}: {
  bg: string;
  top: number;
  left: number;
  width: number;
  height?: number;
  size?: string;
}) {
  return React.createElement("div", {
    style: { position: "absolute", top, left, width, height, backgroundImage: bg, backgroundSize: size },
  });
}

// ============================================================
//  CARRUSEL 1080×1350
// ============================================================

function CarruselFullBleed(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  return React.createElement(
    "div",
    { style: { display: "flex", width: CARRUSEL_W, height: CARRUSEL_H, position: "relative", fontFamily: "Inter", backgroundColor: INK } },
    React.createElement("img", { src: data.imageDataUrl, style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: CARRUSEL_H, objectFit: "cover" } }),
    React.createElement("div", { style: { position: "absolute", top: 480, left: 0, width: CARRUSEL_W, height: 870, background: "linear-gradient(to top, rgba(10,10,10,0.95), rgba(10,10,10,0))" } }),
    React.createElement(Chip, { label: cfg.label, color: cfg.color, top: 60, left: 60 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 820, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: autoFitTitle(data.title, 960, 330, 1.08, [68, 56, 46]).size, lineHeight: 1.08, color: "#ffffff" } },
      fitN(data.title, 160),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE_SOFT, top: 1170, left: 60, width: 960, height: 8 }),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 150 }),
  );
}

function CarruselTitular(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  // Auto-fit: título completo, font escalonado + barra/excerpt pegados al bloque.
  const { size, lines } = autoFitTitle(data.title, 960, 540, 1.02, [98, 80, 64, 52]);
  const titleHeight = Math.ceil(lines * size * 1.02);
  const barTop = Math.min(880, 340 + titleHeight + 70);
  const excerptTop = barTop + 40;
  return React.createElement(
    "div",
    { style: { display: "flex", width: CARRUSEL_W, height: CARRUSEL_H, position: "relative", fontFamily: "Inter", backgroundColor: CREAM } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: 12, backgroundColor: cfg.color } }),
    React.createElement("div", { style: { position: "absolute", top: 0, right: 0, width: 400, height: 240, backgroundImage: HALFTONE_DARK_SOFT, backgroundSize: "8px 8px" } }),
    React.createElement(Chip, { label: cfg.label, color: cfg.color, top: 90, left: 60 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 340, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: size, lineHeight: 1.02, color: INK, textTransform: "uppercase" } },
      fitN(data.title, 200),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_DARK, top: barTop, left: 60, width: 960, height: 10 }),
    data.excerpt &&
      React.createElement(
        "div",
        { style: { position: "absolute", top: excerptTop, left: 60, width: 960, display: "flex", fontFamily: "Inter", fontWeight: 400, fontSize: 28, lineHeight: 1.4, color: "#6b5d4f" } },
        fitN(data.excerpt, 160),
      ),
    React.createElement(WebText, { inkColor: INK, bottom: 48, left: 60 }),
    React.createElement(Logo, { logoDataUrl: data.logoDarkDataUrl, bottom: 24, right: 60, size: 150 }),
  );
}

function CarruselCita(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  const quote = data.quote;
  return React.createElement(
    "div",
    { style: { display: "flex", width: CARRUSEL_W, height: CARRUSEL_H, position: "relative", fontFamily: "Inter", backgroundColor: INK } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: CARRUSEL_H, backgroundImage: HALFTONE_WHITE_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: 12, backgroundColor: BRAND } }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 40, left: 40, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 320, lineHeight: 0.8, color: BRAND } },
      "\u201C",
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 420, left: 80, width: 920, display: "flex", fontFamily: "Oswald", fontWeight: 500, fontSize: 66, lineHeight: 1.22, color: "#ffffff" } },
      quote ? fitN(quote.text, 140) : fitN(data.title, 110),
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 940, left: 80, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 28, color: BRAND, letterSpacing: 0.5 } },
      quote?.author ? `\u2014 ${quote.author}` : `\u2014 ${cfg.label}`,
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE, top: 1100, left: 60, width: 960, height: 8 }),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 150 }),
  );
}

function CarruselDato(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  const stat = data.stat;
  return React.createElement(
    "div",
    { style: { display: "flex", width: CARRUSEL_W, height: CARRUSEL_H, position: "relative", fontFamily: "Inter", backgroundColor: cfg.color } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: CARRUSEL_H, backgroundImage: HALFTONE_WHITE_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement(Chip, { label: cfg.label, color: INK, top: 60, left: 60 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 300, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 240, lineHeight: 1, color: "#ffffff", justifyContent: "center" } },
      stat ? stat.value : "—",
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 600, left: 80, width: 920, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 48, lineHeight: 1.3, color: "#ffffff", justifyContent: "center", textAlign: "center" } },
      stat ? stat.label : fitN(data.title, 70),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE, top: 870, left: 60, width: 960, height: 8 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 910, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 600, fontSize: 40, lineHeight: 1.2, color: "#ffffff" } },
      fitN(data.title, 60),
    ),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 150 }),
  );
}

function CarruselCta(data: SlideDataV2): React.ReactElement {
  // Placa de marca pura (misma lógica que StoryCta, métricas 1080×1350).
  return React.createElement(
    "div",
    { style: { display: "flex", width: CARRUSEL_W, height: CARRUSEL_H, position: "relative", fontFamily: "Inter", backgroundColor: BRAND } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: CARRUSEL_H, backgroundImage: HALFTONE_DARK_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 380, left: 0, width: CARRUSEL_W, display: "flex", justifyContent: "center" } },
      data.logoDarkDataUrl
        ? React.createElement("img", { src: data.logoDarkDataUrl, style: { width: 420, height: 420, objectFit: "contain" } })
        : React.createElement("div", { style: { fontFamily: "Oswald", fontWeight: 700, fontSize: 84, color: INK } }, "¡QUE NOTICIA!"),
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 850, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 44, lineHeight: 1.3, color: INK, textTransform: "uppercase", letterSpacing: 2, justifyContent: "center", textAlign: "center" } },
      "Todo lo que pasa en Tucumán",
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_DARK, top: 1020, left: 240, width: 600, height: 8 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1080, left: 0, width: CARRUSEL_W, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 30, color: INK, justifyContent: "center" } },
      "Seguí leyendo en",
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1130, left: 0, width: CARRUSEL_W, display: "flex", fontFamily: "Oswald", fontWeight: 600, fontSize: 44, letterSpacing: 0.5, justifyContent: "center" } },
      React.createElement("span", { style: { color: "#ffffff" } }, "que"),
      React.createElement("span", { style: { color: INK } }, "noticia.com.ar"),
    ),
  );
}

// ============================================================
//  STORIES 1080×1920
// ============================================================

function StoryFullBleed(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  return React.createElement(
    "div",
    { style: { display: "flex", width: STORY_W, height: STORY_H, position: "relative", fontFamily: "Inter", backgroundColor: INK } },
    React.createElement("img", { src: data.imageDataUrl, style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: STORY_H, objectFit: "cover" } }),
    React.createElement("div", { style: { position: "absolute", top: 880, left: 0, width: STORY_W, height: 1040, background: "linear-gradient(to top, rgba(10,10,10,0.96), rgba(10,10,10,0))" } }),
    React.createElement(Chip, { label: cfg.label, color: cfg.color, top: 60, left: 60, fontSize: 30 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1180, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: autoFitTitle(data.title, 960, 500, 1.08, [84, 70, 58]).size, lineHeight: 1.08, color: "#ffffff" } },
      fitN(data.title, 180),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE_SOFT, top: 1700, left: 60, width: 960, height: 8 }),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60, fontSize: 26 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 180 }),
  );
}

function StoryTitular(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  // Auto-fit: título completo, font escalonado + barra/excerpt pegados al bloque.
  const { size, lines } = autoFitTitle(data.title, 960, 820, 1.02, [118, 96, 78, 62]);
  const titleHeight = Math.ceil(lines * size * 1.02);
  const barTop = Math.min(1300, 480 + titleHeight + 90);
  const excerptTop = barTop + 60;
  return React.createElement(
    "div",
    { style: { display: "flex", width: STORY_W, height: STORY_H, position: "relative", fontFamily: "Inter", backgroundColor: CREAM } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: 14, backgroundColor: cfg.color } }),
    React.createElement("div", { style: { position: "absolute", top: 0, right: 0, width: 440, height: 300, backgroundImage: HALFTONE_DARK_SOFT, backgroundSize: "8px 8px" } }),
    React.createElement(Chip, { label: cfg.label, color: cfg.color, top: 100, left: 60, fontSize: 30 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 480, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: size, lineHeight: 1.02, color: INK, textTransform: "uppercase" } },
      fitN(data.title, 220),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_DARK, top: barTop, left: 60, width: 960, height: 12 }),
    data.excerpt &&
      React.createElement(
        "div",
        { style: { position: "absolute", top: excerptTop, left: 60, width: 960, display: "flex", fontFamily: "Inter", fontWeight: 400, fontSize: 32, lineHeight: 1.4, color: "#6b5d4f" } },
        fitN(data.excerpt, 180),
      ),
    React.createElement(WebText, { inkColor: INK, bottom: 48, left: 60, fontSize: 26 }),
    React.createElement(Logo, { logoDataUrl: data.logoDarkDataUrl, bottom: 24, right: 60, size: 180 }),
  );
}

function StoryCita(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  const quote = data.quote;
  return React.createElement(
    "div",
    { style: { display: "flex", width: STORY_W, height: STORY_H, position: "relative", fontFamily: "Inter", backgroundColor: INK } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: STORY_H, backgroundImage: HALFTONE_WHITE_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: 14, backgroundColor: BRAND } }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 60, left: 40, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 480, lineHeight: 0.8, color: BRAND } },
      "\u201C",
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 640, left: 80, width: 920, display: "flex", fontFamily: "Oswald", fontWeight: 500, fontSize: 78, lineHeight: 1.22, color: "#ffffff" } },
      quote ? fitN(quote.text, 180) : fitN(data.title, 130),
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1360, left: 80, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 34, color: BRAND, letterSpacing: 0.5 } },
      quote?.author ? `\u2014 ${quote.author}` : `\u2014 ${cfg.label}`,
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE, top: 1620, left: 60, width: 960, height: 8 }),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60, fontSize: 26 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 180 }),
  );
}

function StoryDato(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  const stat = data.stat;
  return React.createElement(
    "div",
    { style: { display: "flex", width: STORY_W, height: STORY_H, position: "relative", fontFamily: "Inter", backgroundColor: cfg.color } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: STORY_H, backgroundImage: HALFTONE_WHITE_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement(Chip, { label: cfg.label, color: INK, top: 60, left: 60, fontSize: 30 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 460, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 340, lineHeight: 1, color: "#ffffff", justifyContent: "center" } },
      stat ? stat.value : "—",
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 860, left: 80, width: 920, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 54, lineHeight: 1.3, color: "#ffffff", justifyContent: "center", textAlign: "center" } },
      stat ? stat.label : fitN(data.title, 80),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE, top: 1280, left: 60, width: 960, height: 8 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1340, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 600, fontSize: 46, lineHeight: 1.2, color: "#ffffff" } },
      fitN(data.title, 70),
    ),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60, fontSize: 26 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 180 }),
  );
}

function StoryCta(data: SlideDataV2): React.ReactElement {
  // Placa de marca pura: cierra el turno sin nota (sin chip de sección ni título
  // repetido). Logo grande + slogan + CTA de lectura.
  return React.createElement(
    "div",
    { style: { display: "flex", width: STORY_W, height: STORY_H, position: "relative", fontFamily: "Inter", backgroundColor: BRAND } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: STORY_H, backgroundImage: HALFTONE_DARK_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 640, left: 0, width: STORY_W, display: "flex", justifyContent: "center" } },
      data.logoDarkDataUrl
        ? React.createElement("img", { src: data.logoDarkDataUrl, style: { width: 500, height: 500, objectFit: "contain" } })
        : React.createElement("div", { style: { fontFamily: "Oswald", fontWeight: 700, fontSize: 96, color: INK } }, "¡QUE NOTICIA!"),
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1240, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 56, lineHeight: 1.3, color: INK, textTransform: "uppercase", letterSpacing: 2, justifyContent: "center", textAlign: "center" } },
      "Todo lo que pasa en Tucumán",
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_DARK, top: 1480, left: 240, width: 600, height: 10 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1560, left: 0, width: STORY_W, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 34, color: INK, justifyContent: "center" } },
      "Seguí leyendo en",
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1620, left: 0, width: STORY_W, display: "flex", fontFamily: "Oswald", fontWeight: 600, fontSize: 52, letterSpacing: 0.5, justifyContent: "center" } },
      React.createElement("span", { style: { color: "#ffffff" } }, "que"),
      React.createElement("span", { style: { color: INK } }, "noticia.com.ar"),
    ),
  );
}

// ============================================================
//  Exports
// ============================================================

const CARRUSEL_LAYOUTS: Record<SlideLayout, (d: SlideDataV2) => React.ReactElement> = {
  fullbleed: CarruselFullBleed,
  titular: CarruselTitular,
  cita: CarruselCita,
  dato: CarruselDato,
  cta: CarruselCta,
};

const STORY_LAYOUTS: Record<SlideLayout, (d: SlideDataV2) => React.ReactElement> = {
  fullbleed: StoryFullBleed,
  titular: StoryTitular,
  cita: StoryCita,
  dato: StoryDato,
  cta: StoryCta,
};

export function SlideTemplateV2(data: SlideDataV2): React.ReactElement {
  return (CARRUSEL_LAYOUTS[data.layout] ?? CarruselFullBleed)(data);
}

export function SlideTemplateStoryV2(data: SlideDataV2): React.ReactElement {
  return (STORY_LAYOUTS[data.layout] ?? StoryFullBleed)(data);
}