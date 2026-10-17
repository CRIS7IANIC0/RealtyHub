import type { Metadata } from "next";
import { Outfit, Rubik } from "next/font/google";
import "./globals.css";
import Preloader from "@/components/Preloader";
import Cursor from "@/components/Cursor";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransition from "@/components/PageTransition";

// Misma pareja tipográfica de Sinergia: Outfit (títulos, peso medio) y Rubik (texto).
const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Rubik({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RealtyHub — Propiedades en venta y alquiler",
  description:
    "Encuentra casas, apartamentos y locales en Colombia, agenda tu visita y firma con acompañamiento de un asesor.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Preloader />
        <Cursor />
        <SmoothScroll />
        <PageTransition />
        {children}
      </body>
    </html>
  );
}
