/**
 * Compresión client-side de imágenes de ads.
 *
 * - GIF (animado o no) → skip, devuelve el File original (preserva animación).
 *   Los GIFs de ads ya vienen optimizados por el diseñador; el win real está en JPG/PNG.
 * - JPG/PNG/WebP → canvas resize + WebP quality 82.
 * - Sin upscaling: si la imagen es más chica que el max, se exporta como WebP sin resize.
 * - Mantiene aspect ratio original (fit, no cover, no recortes) — consistente con
 *   object-contain del render. El cliente sube con el ratio correcto.
 * - Max sizes por tipo (2x retina para que se vea nítido en displays HiDPI):
 *   leaderboard/sticky_footer: 1280×160 (8:1)
 *   rectangle/sidebar/infeed: 800×500 (8:5)
 *   modal: 1200×800 (libre, cap razonable)
 */
import type { AdType } from "@/lib/types";

const AD_QUALITY = 0.82;

const AD_MAX_SIZE: Record<AdType, { w: number; h: number }> = {
  leaderboard: { w: 1280, h: 160 },
  sticky_footer: { w: 1280, h: 160 },
  rectangle: { w: 800, h: 500 },
  sidebar: { w: 800, h: 500 },
  infeed: { w: 800, h: 500 },
  modal: { w: 1200, h: 800 },
};

const COMPRESSIBLE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function compressAd(file: File, type: AdType): Promise<File> {
  // GIF → skip (preserva animación)
  if (file.type === "image/gif") {
    return file;
  }

  // Solo comprimir JPG/PNG/WebP. Cualquier otro tipo se pasa igual (lo valida el server).
  if (!COMPRESSIBLE_TYPES.includes(file.type)) {
    return file;
  }

  const max = AD_MAX_SIZE[type];
  const img = await loadImage(file);

  // Sin upscaling. Fit dentro del max, mantener aspect ratio.
  let w = img.width;
  let h = img.height;
  if (w > max.w || h > max.h) {
    const scale = Math.min(max.w / w, max.h / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");

  // Fondo blanco por si la imagen tiene alpha (PNG con transparencia).
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", AD_QUALITY)
  );
  if (!blob) throw new Error("Falló la compresión a WebP");

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}