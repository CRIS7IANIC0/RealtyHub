import type { Metadata } from "next";
import VerifyClient from "./VerifyClient";

export const metadata: Metadata = {
  title: "RealtyHub — Verificar contrato",
  description: "Comprueba que un contrato firmado electrónicamente no ha sido alterado.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await Promise.resolve(params);
  return <VerifyClient contractId={id} />;
}
