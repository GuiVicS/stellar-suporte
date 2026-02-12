import React from 'react';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { useOSAnalytics } from '@/hooks/useOSAnalytics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3, Download, TrendingUp, Clock, RotateCcw,
  AlertTriangle, Wrench, Users, Printer, Zap,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfiles } from '@/hooks/useProfiles';
import {
  OS_STATUS_LABELS, OS_TYPE_LABELS, PRIORITY_LABELS,
  OS_STATUS_COLORS, PRIORITY_COLORS,
  type OSStatus, type OSType, type Priority,
} from '@/types';
import { cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--accent))',
  'hsl(var(--primary))',
  'hsl(142, 70%, 45%)',
  'hsl(48, 96%, 53%)',
  'hsl(0, 84%, 60%)',
  'hsl(262, 83%, 58%)',
];

const ReportsPage = () => {
  const { data: orders = [], isLoading } = useServiceOrders();
  const { data: profiles = [] } = useProfiles();
  const analytics = useOSAnalytics(orders as any);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  // Tech stats
  const techStats = profiles
    .map(tech => {
      const techOrders = orders.filter(o => o.technician_id === tech.user_id);
      const techDone = techOrders.filter(o => o.status === 'concluido').length;
      return {
        name: tech.name,
        total: techOrders.length,
        done: techDone,
        pct: techOrders.length > 0 ? Math.round((techDone / techOrders.length) * 100) : 0,
      };
    })
    .filter(t => t.total > 0)
    .sort((a, b) => b.pct - a.pct);

  const pieData = analytics.statusDistribution.map(s => ({
    name: OS_STATUS_LABELS[s.status as OSStatus] || s.status,
    value: s.count,
  }));

  const typeBarData = analytics.typeDistribution.map(t => ({
    name: OS_TYPE_LABELS[t.type as OSType] || t.type,
    value: t.count,
  }));

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios & Análises</h1>
          <p className="text-sm text-muted-foreground">Métricas, padrões e problemas frequentes</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" /> Exportar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total OS', value: analytics.totalOrders, icon: BarChart3, color: 'text-accent' },
          { label: 'Taxa Conclusão', value: `${analytics.completionRate}%`, icon: TrendingUp, color: 'text-status-done' },
          { label: 'Tempo Médio', value: analytics.avgResolutionHours ? `${analytics.avgResolutionHours}h` : '—', icon: Clock, color: 'text-status-transit' },
          { label: 'Aguardando Peça', value: analytics.awaitingParts, icon: RotateCcw, color: 'text-status-waiting' },
          { label: 'Urgentes Pendentes', value: analytics.urgentPending, icon: AlertTriangle, color: 'text-priority-urgent' },
        ].map(stat => (
          <Card key={stat.label} className="p-4 shadow-card border-border/50">
            <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 shadow-card border-border/50">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" /> Distribuição por Status
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((item, i) => (
              <span key={item.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {item.name} ({item.value})
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-5 shadow-card border-border/50">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-accent" /> OS por Tipo
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Problem patterns + Machine issues */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 shadow-card border-border/50">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-priority-urgent" /> Problemas Mais Frequentes
          </h3>
          {analytics.problemPatterns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
          ) : (
            <div className="space-y-3">
              {analytics.problemPatterns.map((p, i) => (
                <div key={p.keyword} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{p.keyword}</span>
                      <span className="text-xs text-muted-foreground">{p.count} OS ({p.percentage}%)</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${p.percentage}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 shadow-card border-border/50">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Printer className="w-4 h-4 text-accent" /> Equipamentos com Mais Chamados
          </h3>
          {analytics.machineIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
          ) : (
            <div className="space-y-3">
              {analytics.machineIssues.map(m => (
                <div key={m.model} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{m.model}</span>
                    <span className="text-xs font-bold text-accent">{m.count} OS</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.topProblem}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Customer recurrence + Tech performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 shadow-card border-border/50">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" /> Clientes com Mais Chamados
          </h3>
          {analytics.customerRecurrence.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
          ) : (
            <div className="space-y-2">
              {analytics.customerRecurrence.map(c => (
                <div key={c.name} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                      {c.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                  <span className="text-xs font-bold bg-muted px-2 py-1 rounded-full">{c.count} OS</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 shadow-card border-border/50">
          <h3 className="text-sm font-semibold mb-4">Desempenho por Técnico</h3>
          {techStats.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
          )}
          <div className="space-y-4">
            {techStats.map(tech => (
              <div key={tech.name} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {tech.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{tech.name}</span>
                    <span className="text-xs text-muted-foreground">{tech.done}/{tech.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${tech.pct}%` }} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-accent">{tech.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
