"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Ad, AdType, Section } from "@/lib/types";
import { sectionConfig } from "@/lib/types";
import { saveAd } from "@/app/admin/ads/actions";
import { compressAd } from "@/lib/compress-ad";

interface ClientOption {
  id: string;
  name: string;
}

const adTypes: { value: AdType; label: string }[] = [
  { value: "leaderboard", label: "Leaderboard (1280×160 · 8:1)" },
  { value: "rectangle", label: "Rectangle (400×250 · 8:5)" },
  { value: "sidebar", label: "Sidebar (400×250 · 8:5)" },
  { value: "modal", label: "Modal (hasta 900×600)" },
  { value: "infeed", label: "In-Feed (400×250 · 8:5)" },
  { value: "sticky_footer", label: "Sticky Footer (1280×160 · 8:1, solo móvil)" },
];

const sectionOptions: { value: Section | ""; label: string }[] = [
  { value: "", label: "Todas las secciones" },
  ...Object.entries(sectionConfig).map(([key, cfg]) => ({
    value: key as Section,
    label: cfg.label,
  })),
];

// Medidas y relaciones estándar por tipo de banner.
// Una sola imagen con la relación correcta escala sin recortes en todos los breakpoints.
const AD_MEASURES: Record<AdType, string> = {
  leaderboard: "1280 × 160 px",
  rectangle: "400 × 250 px",
  sidebar: "400 × 250 px",
  modal: "hasta 900 × 600 px",
  infeed: "400 × 250 px",
  sticky_footer: "1280 × 160 px",
};

const AD_RATIOS: Record<AdType, string> = {
  leaderboard: "8:1",
  rectangle: "8:5",
  sidebar: "8:5",
  modal: "libre (se ajusta con object-contain)",
  infeed: "8:5",
  sticky_footer: "8:1",
};

interface AdFormProps {
  ad?: Ad;
  clients: ClientOption[];
}

export default function AdForm({ ad, clients }: AdFormProps) {
  const router = useRouter();
  const isEditing = !!ad;

  const [clientId, setClientId] = useState<string>(ad?.client_id ?? "");
  const [title, setTitle] = useState(ad?.title ?? "");
  const [type, setType] = useState<AdType>(ad?.type ?? "leaderboard");
  const [section, setSection] = useState<Section | "">(ad?.section ?? "");
  const [linkUrl, setLinkUrl] = useState(ad?.link_url ?? "");
  const [active, setActive] = useState(ad?.active ?? true);
  const [priority, setPriority] = useState(ad?.priority ?? 0);
  const [displayDuration, setDisplayDuration] = useState(ad?.display_duration ?? 15);
  const [startsAtDate, setStartsAtDate] = useState(
    ad?.starts_at ? ad.starts_at.slice(0, 10) : "",
  );
  const [startsAtTime, setStartsAtTime] = useState(
    ad?.starts_at ? ad.starts_at.slice(11, 16) : "00:00",
  );
  const [expiresAtDate, setExpiresAtDate] = useState(
    ad?.expires_at ? ad.expires_at.slice(0, 10) : "",
  );
  const [expiresAtTime, setExpiresAtTime] = useState(
    ad?.expires_at ? ad.expires_at.slice(11, 16) : "23:59",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(ad?.image_url ?? "");
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState(ad?.mobile_image_url ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [mobileCompressing, setMobileCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressAd(file, type);
      setImageFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      // fallback al original si la compresión falla
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  };

  const handleMobileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMobileCompressing(true);
    try {
      const compressed = await compressAd(file, type);
      setMobileImageFile(compressed);
      setMobilePreviewUrl(URL.createObjectURL(compressed));
    } catch {
      setMobileImageFile(file);
      setMobilePreviewUrl(URL.createObjectURL(file));
    } finally {
      setMobileCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    if (ad) formData.set("id", ad.id);
    formData.set("title", title);
    formData.set("type", type);
    formData.set("section", section);
    formData.set("client_id", clientId);
    formData.set("link_url", linkUrl);
    if (imageFile) formData.set("image_file", imageFile);
    if (mobileImageFile) formData.set("mobile_image_file", mobileImageFile);
    if (ad?.image_url) formData.set("existing_image_url", ad.image_url);
    if (ad?.mobile_image_url) formData.set("existing_mobile_image_url", ad.mobile_image_url);
    if (active) formData.set("active", "on");
    formData.set("priority", String(priority));
    formData.set("display_duration", String(displayDuration));
    formData.set(
      "starts_at",
      startsAtDate ? new Date(`${startsAtDate}T${startsAtTime}`).toISOString() : "",
    );
    formData.set(
      "expires_at",
      expiresAtDate ? new Date(`${expiresAtDate}T${expiresAtTime}`).toISOString() : "",
    );

    startTransition(async () => {
      const result = await saveAd(null, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {error && (
        <div className="p-3 bg-[#e63946]/10 text-[#e63946] rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Título
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="Aviso publicitario"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Cliente
        </label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
        >
          <option value="">Sin cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Tipo de espacio
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AdType)}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          >
            {adTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Sección objetivo
          </label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value as Section | "")}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          >
            {sectionOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Imagen del aviso
        </label>
        <p className="text-xs text-muted mb-1">
          Medida recomendada: <span className="font-semibold text-ink">{AD_MEASURES[type]}</span>. Relación de aspecto {AD_RATIOS[type]}. La imagen se muestra entera (sin recortes) y escala proporcional en desktop y mobile.
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={compressing}
          className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-ink file:text-white file:text-xs file:font-bold hover:file:bg-ink/80 disabled:opacity-50"
        />
        {compressing && (
          <p className="text-xs text-muted mt-1">Comprimiendo...</p>
        )}
        {!compressing && imageFile && imageFile.type === "image/gif" && (
          <p className="text-xs text-muted mt-1">GIF sin comprimir (preserva animación).</p>
        )}
        {!compressing && imageFile && imageFile.type !== "image/gif" && (
          <p className="text-xs text-muted mt-1">Optimizada a WebP · {Math.round(imageFile.size / 1024)}KB.</p>
        )}
        {previewUrl && (
          <div className="mt-2">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-32 rounded border border-border object-contain"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Imagen mobile alternativa (opcional)
        </label>
        <p className="text-xs text-muted mb-1">
          Solo si querés usar una creatividad distinta para mobile. Si no se sube, se reutiliza la imagen de arriba con la misma relación de aspecto.
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={handleMobileFileChange}
          disabled={mobileCompressing}
          className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-ink file:text-white file:text-xs file:font-bold hover:file:bg-ink/80 disabled:opacity-50"
        />
        {mobileCompressing && (
          <p className="text-xs text-muted mt-1">Comprimiendo...</p>
        )}
        {!mobileCompressing && mobileImageFile && mobileImageFile.type === "image/gif" && (
          <p className="text-xs text-muted mt-1">GIF sin comprimir (preserva animación).</p>
        )}
        {!mobileCompressing && mobileImageFile && mobileImageFile.type !== "image/gif" && (
          <p className="text-xs text-muted mt-1">Optimizada a WebP · {Math.round(mobileImageFile.size / 1024)}KB.</p>
        )}
        {mobilePreviewUrl && (
          <div className="mt-2">
            <img
              src={mobilePreviewUrl}
              alt="Preview mobile"
              className="max-h-24 rounded border border-border object-contain"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          URL de destino (link)
        </label>
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Fecha de inicio
        </label>
        <div className="flex gap-3">
          <input
            type="date"
            value={startsAtDate}
            onChange={(e) => setStartsAtDate(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
          <input
            type="time"
            value={startsAtTime}
            onChange={(e) => setStartsAtTime(e.target.value)}
            className="w-28 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Fecha de vencimiento
        </label>
        <div className="flex gap-3">
          <input
            type="date"
            value={expiresAtDate}
            onChange={(e) => setExpiresAtDate(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
          <input
            type="time"
            value={expiresAtTime}
            onChange={(e) => setExpiresAtTime(e.target.value)}
            className="w-28 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Prioridad
          </label>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Duración (seg)
          </label>
          <p className="text-xs text-muted mb-1">
            Tiempo de impresión en rotación. Default: 15s.
          </p>
          <input
            type="number"
            min={5}
            max={60}
            value={displayDuration}
            onChange={(e) => setDisplayDuration(Number(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            &nbsp;
          </label>
          <label className="flex items-center gap-2 cursor-pointer h-[42px]">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 accent-[#10b981]"
            />
            <span className="text-sm font-semibold">Activo</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-ink text-white font-bold rounded hover:bg-ink/80 transition-colors disabled:opacity-50"
        >
          {pending ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Aviso"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="px-6 py-2.5 bg-white text-ink font-bold rounded border border-border hover:bg-[#f0efed] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}