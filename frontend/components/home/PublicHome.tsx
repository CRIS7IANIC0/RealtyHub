"use client";

/* ─────────────────────────────────────────────────────────────
   PublicHome — landing pública (visitantes).
   Ritmo oscuro/claro:
   1. Hero a pantalla completa + buscador (oscuro)
   2. Destacadas: recorrido horizontal fijado al scroll (claro)
   3. Frase que se enciende palabra a palabra (oscuro)
   4. Venta y alquiler (claro)  5. Cómo funciona: tarjetas apiladas
   6. Llamado final en color  7. Pie de página (oscuro)
   ───────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero, { type OperationFilter } from "@/components/home/Hero";
import FeaturedScroller from "@/components/home/FeaturedScroller";
import Statement from "@/components/home/Statement";
import PropertyGrid from "@/components/home/PropertyGrid";
import HowItWorks from "@/components/home/HowItWorks";
import PromoBanner from "@/components/home/PromoBanner";
import { useFavorites } from "@/lib/useFavorites";
import { useReveal } from "@/lib/useReveal";
import {
  getPropertyImage,
  getPropertyImages,
  inferType,
  isAvailable,
  isRental,
  type PublicProperty,
} from "@/lib/property";

export default function PublicHome({
  properties,
  isLoading,
}: {
  properties: PublicProperty[];
  isLoading: boolean;
}) {
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [operation, setOperation] = useState<OperationFilter>("");
  const { isFavorite, toggle } = useFavorites();

  // Sólo se muestran al público los inmuebles Disponibles
  const available = useMemo(() => properties.filter(isAvailable), [properties]);

  const withPhoto = useMemo(() => available.filter((p) => !!getPropertyImage(p)), [available]);
  const featured = withPhoto[0] ?? available[0];
  const featuredList = useMemo(
    () => [...withPhoto, ...available.filter((p) => !getPropertyImage(p))].slice(0, 5),
    [withPhoto, available]
  );

  const filtered = useMemo(() => {
    const term = location.trim().toLowerCase();
    return available.filter((p) => {
      if (propertyType && inferType(p) !== propertyType) return false;
      if (operation === "Venta" && isRental(p)) return false;
      if (operation === "Alquiler" && !isRental(p)) return false;
      if (!term) return true;
      return [p.title, p.address, p.description, p.city].some((f) => f?.toLowerCase().includes(term));
    });
  }, [available, location, propertyType, operation]);

  const forSale = useMemo(() => filtered.filter((p) => !isRental(p)), [filtered]);
  const forRent = useMemo(() => filtered.filter(isRental), [filtered]);
  const saleTotal = useMemo(() => available.filter((p) => !isRental(p)).length, [available]);
  const rentTotal = available.length - saleTotal;

  const hasFilters = location.trim() !== "" || propertyType !== "" || operation !== "";

  useReveal([isLoading, filtered.length]);

  function scrollToResults() {
    document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen">
      <Navbar activeTab="inicio" overHero />

      <main>
        <Hero
          location={location}
          onLocationChange={setLocation}
          propertyType={propertyType}
          onPropertyTypeChange={setPropertyType}
          operation={operation}
          onOperationChange={setOperation}
          onSearch={scrollToResults}
          featured={featured}
          saleCount={saleTotal}
          rentCount={rentTotal}
          isLoading={isLoading}
        />

        {featuredList.length >= 1 && (
          <FeaturedScroller properties={featuredList} isFavorite={isFavorite} onToggleFavorite={toggle} />
        )}

        <Statement />

        <div className="w-full max-w-[1440px] mx-auto px-5 md:px-10 pt-28 md:pt-40 space-y-28 md:space-y-40 pb-28 md:pb-40">
          <div id="resultados" className="scroll-mt-28 space-y-28 md:space-y-40">
            {hasFilters && !isLoading && (
              <div className="flex flex-wrap items-center gap-4 text-[15px] text-[#6b655e] -mb-16">
                <span>
                  {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"} para tu búsqueda
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLocation("");
                    setPropertyType("");
                    setOperation("");
                  }}
                  className="font-medium text-[#1e1c1a] border-b border-[#1e1c1a] pb-0.5 hover:text-[#a64739] hover:border-[#a64739] cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {operation !== "Alquiler" && (
              <PropertyGrid
                id="propiedades-disponibles"
                title="Propiedades en venta"
                subtitle="Inmuebles listos para visitar y escriturar."
                properties={forSale}
                isLoading={isLoading}
                emptyMessage={
                  hasFilters
                    ? "Ninguna propiedad en venta coincide con tu búsqueda."
                    : "Por ahora no hay propiedades en venta disponibles. Vuelve pronto."
                }
                isFavorite={isFavorite}
                onToggleFavorite={toggle}
                viewAllHref="/properties"
              />
            )}

            {operation !== "Venta" && (
              <PropertyGrid
                id="propiedades-alquiler"
                title="Propiedades en alquiler"
                subtitle="Arriendos con disponibilidad inmediata."
                properties={forRent}
                isLoading={isLoading}
                emptyMessage={
                  hasFilters
                    ? "Ningún alquiler coincide con tu búsqueda."
                    : "Por ahora no hay propiedades en alquiler disponibles. Vuelve pronto."
                }
                isFavorite={isFavorite}
                onToggleFavorite={toggle}
                priceSuffix="/ mes"
                viewAllHref="/properties"
              />
            )}
          </div>

          <HowItWorks images={available.flatMap((p) => getPropertyImages(p).slice(0, 1)).slice(0, 3)} />
        </div>

        <PromoBanner />
      </main>

      <Footer dark />
    </div>
  );
}
