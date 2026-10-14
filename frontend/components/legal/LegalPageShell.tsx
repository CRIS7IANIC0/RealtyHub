import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LEGAL_UPDATED } from "./LegalContent";

export default function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <header className="bg-white border-b border-[#ebebeb]">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 py-4 flex items-center justify-between">
          <BrandLogo />
          <Link
            href="/"
            className="text-[14px] font-medium text-[#222222] hover:text-[#ff385c] transition-colors no-underline"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[820px] mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-[20px] border border-[#ebebeb] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 sm:p-10">
          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.5px] text-[#222222]">
            {title}
          </h1>
          <p className="text-[13px] text-[#6a6a6a] mt-1">
            Última actualización: {LEGAL_UPDATED}
          </p>
          {children}
        </div>
      </main>

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <Footer />
      </div>
    </div>
  );
}
