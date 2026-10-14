import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";
import { TermsContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "Términos y Condiciones | RealtyHub",
  description:
    "Condiciones de uso del portal inmobiliario RealtyHub: listados, visitas, responsabilidades y propiedad intelectual.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Términos y Condiciones">
      <TermsContent />
    </LegalPageShell>
  );
}
