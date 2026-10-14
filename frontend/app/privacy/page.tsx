import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";
import { PrivacyContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "Política de Privacidad | RealtyHub",
  description:
    "Cómo RealtyHub recolecta, usa y protege tus datos personales, cookies y tokens de sesión.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Política de Privacidad">
      <PrivacyContent />
    </LegalPageShell>
  );
}
