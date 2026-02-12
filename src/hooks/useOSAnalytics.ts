import { useMemo } from 'react';

interface OSData {
  id: string;
  status: string;
  type: string;
  priority: string;
  problem_description: string;
  diagnosis?: string | null;
  resolution?: string | null;
  customer?: { name: string; id: string } | null;
  machine?: { model: string; id: string } | null;
  technician_id?: string | null;
  scheduled_start: string;
  finished_at?: string | null;
  started_at?: string | null;
  estimated_duration_min?: number | null;
}

export interface ProblemPattern {
  keyword: string;
  count: number;
  percentage: number;
}

export interface MachineIssue {
  model: string;
  count: number;
  topProblem: string;
}

export interface CustomerRecurrence {
  name: string;
  count: number;
  lastStatus: string;
}

export interface AnalyticsData {
  totalOrders: number;
  completedOrders: number;
  completionRate: number;
  avgResolutionHours: number | null;
  problemPatterns: ProblemPattern[];
  machineIssues: MachineIssue[];
  customerRecurrence: CustomerRecurrence[];
  statusDistribution: { status: string; count: number }[];
  typeDistribution: { type: string; count: number }[];
  priorityDistribution: { priority: string; count: number }[];
  urgentPending: number;
  awaitingParts: number;
}

// Common problem keywords in printer/technical services (PT-BR)
const PROBLEM_KEYWORDS = [
  'atolamento', 'papel', 'toner', 'cartucho', 'tinta',
  'fusão', 'borrada', 'mancha', 'listras', 'erro',
  'lenta', 'travando', 'não imprime', 'não puxa',
  'rede', 'wi-fi', 'driver', 'scanner', 'bandeja',
  'aquecimento', 'ruído', 'barulho', 'desligando',
  'qualidade', 'resolução', 'desgaste', 'rolo',
  'instalação', 'configuração', 'manutenção',
];

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return PROBLEM_KEYWORDS.filter(kw => lower.includes(kw));
}

export const useOSAnalytics = (orders: OSData[]): AnalyticsData => {
  return useMemo(() => {
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'concluido');
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    // Average resolution time (hours)
    const resolutionTimes = completed
      .filter(o => o.started_at && o.finished_at)
      .map(o => {
        const start = new Date(o.started_at!).getTime();
        const end = new Date(o.finished_at!).getTime();
        return (end - start) / (1000 * 60 * 60);
      })
      .filter(h => h > 0 && h < 48); // filter outliers

    const avgResolutionHours = resolutionTimes.length > 0
      ? Math.round((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) * 10) / 10
      : null;

    // Problem patterns from descriptions + diagnosis
    const keywordCounts: Record<string, number> = {};
    orders.forEach(o => {
      const text = [o.problem_description, o.diagnosis, o.resolution].filter(Boolean).join(' ');
      const keywords = extractKeywords(text);
      keywords.forEach(kw => {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      });
    });

    const problemPatterns: ProblemPattern[] = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({
        keyword,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Machine issues
    const machineMap: Record<string, { model: string; problems: string[] }> = {};
    orders.forEach(o => {
      if (!o.machine) return;
      if (!machineMap[o.machine.model]) {
        machineMap[o.machine.model] = { model: o.machine.model, problems: [] };
      }
      machineMap[o.machine.model].problems.push(o.problem_description);
    });

    const machineIssues: MachineIssue[] = Object.values(machineMap)
      .map(m => ({
        model: m.model,
        count: m.problems.length,
        topProblem: m.problems[0]?.substring(0, 60) + (m.problems[0]?.length > 60 ? '...' : '') || '',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Customer recurrence
    const customerMap: Record<string, { name: string; count: number; lastStatus: string }> = {};
    orders.forEach(o => {
      if (!o.customer) return;
      const key = o.customer.name;
      if (!customerMap[key]) {
        customerMap[key] = { name: key, count: 0, lastStatus: o.status };
      }
      customerMap[key].count++;
      customerMap[key].lastStatus = o.status;
    });

    const customerRecurrence: CustomerRecurrence[] = Object.values(customerMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Distributions
    const statusDist: Record<string, number> = {};
    const typeDist: Record<string, number> = {};
    const priorityDist: Record<string, number> = {};

    orders.forEach(o => {
      statusDist[o.status] = (statusDist[o.status] || 0) + 1;
      typeDist[o.type] = (typeDist[o.type] || 0) + 1;
      priorityDist[o.priority] = (priorityDist[o.priority] || 0) + 1;
    });

    return {
      totalOrders: total,
      completedOrders: completed.length,
      completionRate,
      avgResolutionHours,
      problemPatterns,
      machineIssues,
      customerRecurrence,
      statusDistribution: Object.entries(statusDist).map(([status, count]) => ({ status, count })),
      typeDistribution: Object.entries(typeDist).map(([type, count]) => ({ type, count })),
      priorityDistribution: Object.entries(priorityDist).map(([priority, count]) => ({ priority, count })),
      urgentPending: orders.filter(o => o.priority === 'urgente' && o.status !== 'concluido' && o.status !== 'cancelado').length,
      awaitingParts: orders.filter(o => o.status === 'aguardando_peca').length,
    };
  }, [orders]);
};
