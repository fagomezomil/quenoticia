/**
 * Compresión client-side de avatars usando canvas API.
 *
 * Resize a 256x256 (suficiente para retina 2x en display 128px), export WebP
 * quality 80. Típico: JPG 2MB → WebP 15-25KB (-99%).
 *
 * Cover square: la imagen se escala para llenar el cuadrado y se centra.
 * Fondo blanco para imágenes con alpha (PNG/GIF con transparencia).
 */

const AVATAR_SIZE = 256;
const AVATAR_QUALITY = 0.8;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(img.src);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function compressAvatar(
  file: File,
  size: number = AVATAR_SIZE,
  quality: number = AVATAR_QUALITY
): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");

  // Cover: escalar para llenar el cuadrado, centrar.
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;

  // Fondo blanco por si la imagen tiene alpha.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, x, y, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality)
  );
  if (!blob) throw new Error("Falló la compresión a WebP");
  return blob;
}