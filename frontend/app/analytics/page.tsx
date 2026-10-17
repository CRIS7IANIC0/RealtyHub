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

export interface AgentStat {
  agent_id: string;
  name: string;
  office_name: string | null;
  deals: number;
  contracts_total: number;
  close_rate: number;
  revenue: number;
  avg_ticket: number;
  avg_hours: number;
  leads: number;
  lead_conversion: number;
  commission_earned: number;
}

export interface OfficeStat {
  office_id: string;
  name: string;
  region: string | null;
  agents: number;
  deals: number;
  revenue: number;
  avg_ticket: number;
  avg_hours: number;
  leads: number;
  lead_conversion: number;
}

export interface AnalyticsData {
  total_revenue: number;
  total_sales: number;
  avg_ticket?: number;
  avg_closing_hours?: number;
  avg_closing_by_property_type?: { property_type: string; deals: number; avg_hours: number }[];
  lead_conversion?: { total_leads: number; converted: number; rate: number };
  conversion_by_source?: { source: string; leads: number; converted: number; rate: number }[];
  agents?: AgentStat[];
  offices?: OfficeStat[];
  by_operation?: { operation: string; deals: number; revenue: number }[];
  monthly?: { month: string; deals: number; revenue: number }[];
  generated_at?: string;
  data_complete?: boolean;
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
