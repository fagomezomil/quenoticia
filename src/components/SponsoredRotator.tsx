"use client";

import { useState, useEffect } from "react";
import ArticleCard from "@/components/ArticleCard";
import type { Article } from "@/lib/types";

interface SponsoredRotatorProps {
  /** Sponsored contents ya convertidos al tipo Article. */
  sponsored: Article[];
}

/**
 * Contenedor que rota entre los contenidos patrocinados cada 15 segundos.
 * Cada instancia arranca en un índice aleatorio para que los contenedores
 * del feed no estén sincronizados (rotación independiente y aleatoria).
 * Reutiliza ArticleCard con sponsored=true para mantener el diseño visual.
 */
export default function SponsoredRotator({ sponsored }: SponsoredRotatorProps) {
  const [index, setIndex] = useState<number>(() =>
    sponsored.length === 0 ? 0 : Math.floor(Math.random() * sponsored.length),
  );

  useEffect(() => {
    if (sponsored.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % sponsored.length);
    }, 15000);
    return () => clearInterval(id);
  }, [sponsored.length]);

  if (sponsored.length === 0) return null;

  const current = sponsored[index] ?? sponsored[0];
  return <ArticleCard article={current} variant="standard" sponsored />;
}