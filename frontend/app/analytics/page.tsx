/* ─────────────────────────────────────────────────────────────
   RealtyHub — Dashboard de Analíticas (/analytics)
   Server Component · SSR (cache: 'no-store') · Strict Airbnb Design System
   ───────────────────────────────────────────────────────────── */

import type { Metadata } from 'next';
import AnalyticsClient from './AnalyticsClient';

export const metadata: Metadata = {
  title: 'RealtyHub — Dashboard de Analíticas',
  description: 'Métricas de negocio en tiempo real, volumen de ventas y contratos cerrados.',
};

export const dynamic = 'force-dynamic';

export interface AnalyticsData {
  total_revenue: number;
  total_sales: number;
}

import { GATEWAY } from '@/lib/config';

async function fetchAnalytics(): Promise<AnalyticsData> {
  try {
    const res = await fetch(`${GATEWAY}/analytics`, { cache: 'no-store' });
    if (!res.ok) {
      return { total_revenue: 0, total_sales: 0 };
    }
    return res.json();
  } catch {
    return { total_revenue: 0, total_sales: 0 };
  }
}

export default async function AnalyticsPage() {
  const data = await fetchAnalytics();
  return <AnalyticsClient data={data} />;
}
