import type { Metadata } from "next";
import SignClient from "./SignClient";

export const metadata: Metadata = {
  title: "RealtyHub — Firma electrónica de contrato",
  description: "Firma tu contrato de forma segura y con validez jurídica.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }> | { token: string };
}) {
  const { token } = await Promise.resolve(params);
  return <SignClient token={token} />;
}
