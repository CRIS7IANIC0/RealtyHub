import ArrowIcon from "@/components/ui/ArrowIcon";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/Navbar";
import Footer from "../Footer";
import { LEGAL_UPDATED } from "./LegalContent";

export default function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f3efe8] flex flex-col">
      <header className="bg-white border-b border-[#e2dcd2]">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 py-4 flex items-center justify-between">
          <BrandLogo />
          <Link
            href="/"
            className="text-[14px] font-medium text-[#1e1c1a] hover:text-[#c4584c] transition-colors no-underline"
          >
            <ArrowIcon dir="left" /> Volver al inicio
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[820px] mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-[20px] border border-[#e2dcd2] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 sm:p-10">
          <h1 className="page-title text-[28px] md:text-[34px] font-semibold tracking-[-0.5px] text-[#1e1c1a]">
            {title}
          </h1>
          <p className="text-[13px] text-[#6b655e] mt-1">
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
