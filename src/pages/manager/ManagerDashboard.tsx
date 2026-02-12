import React from 'react';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { useProfiles } from '@/hooks/useProfiles';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types';
import { Card } from '@/components/ui/card';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import OrderDetailDialog from '@/components/OrderDetailDialog';
import NewOrderDialog from '@/components/NewOrderDialog';
import AvatarUpload from '@/components/AvatarUpload';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useServiceOrders();
  const { data: profiles = [] } = useProfiles();
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
  const [newOrderOpen, setNewOrderOpen] = React.useState(false);

  const technicians = profiles.filter(p =>
    orders.some(o => o.technician_id === p.user_id)
  );

  const stats = [
    { label: 'Total OS', value: orders.length, icon: ClipboardList, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Concluídas', value: orders.filter(o => o.status === 'concluido').length, icon: CheckCircle2, color: 'text-status-done', bg: 'bg-status-done/10' },
    { label: 'Em Andamento', value: orders.filter(o => ['em_deslocamento', 'em_atendimento'].includes(o.status)).length, icon: TrendingUp, color: 'text-status-active', bg: 'bg-status-active/10' },
    { label: 'Urgentes', value: orders.filter(o => o.priority === 'urgente').length, icon: AlertTriangle, color: 'text-priority-urgent', bg: 'bg-priority-urgent/10' },
  ];

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral das operações</p>
        </div>
        <Button onClick={() => setNewOrderOpen(true)} className="brand-gradient text-primary-foreground">
          Nova OS
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="p-4 shadow-card border-border/50">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Últimas Ordens de Serviço</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/manager/agenda')} className="text-accent text-xs">
              Ver Agenda <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {orders.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma OS cadastrada</p>
              </Card>
            )}
            {orders.slice(0, 6).map(os => {
              const time = new Date(os.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const endTime = os.scheduled_end ? new Date(os.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <Card key={os.id} onClick={() => setSelectedOrder(os)} className="p-4 shadow-card border-border/50 hover:shadow-elevated transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-accent">{os.code}</span>
                        <span className={cn("status-badge", OS_STATUS_COLORS[os.status])}>
                          {OS_STATUS_LABELS[os.status]}
                        </span>
                        <span className={cn("status-badge", PRIORITY_COLORS[os.priority])}>
                          {PRIORITY_LABELS[os.priority]}
                        </span>
                      </div>
                      <div className="text-sm font-medium truncate">{os.customer?.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {os.address?.city && `${os.address.city}, ${os.address.state} • `}{os.machine?.model}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {time}{endTime && ` – ${endTime}`}
                      </div>
                      {os.technician && (
                        <div className="text-xs text-muted-foreground mt-1">{os.technician.name}</div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Técnicos</h2>
          <div className="space-y-2">
            {technicians.length === 0 && (
              <Card className="p-6 text-center text-muted-foreground text-sm">
                Nenhum técnico atribuído
              </Card>
            )}
            {technicians.map(tech => {
              const techOrders = orders.filter(o => o.technician_id === tech.user_id);
              const done = techOrders.filter(o => o.status === 'concluido').length;
              return (
                <Card key={tech.id} className="p-4 shadow-card border-border/50">
                  <div className="flex items-center gap-3">
                    <AvatarUpload currentUrl={tech.avatar_url} userId={tech.user_id} name={tech.name} size="sm" editable={false} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{tech.name}</div>
                      <div className="text-xs text-muted-foreground">{techOrders.length} OS • {done} concluída(s)</div>
                    </div>
                    <div className="flex gap-1">
                      {techOrders.some(o => ['em_deslocamento', 'em_atendimento'].includes(o.status)) && (
                        <span className="w-2 h-2 rounded-full bg-status-active animate-pulse-dot" />
                      )}
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-status-done rounded-full transition-all"
                      style={{ width: `${techOrders.length > 0 ? (done / techOrders.length) * 100 : 0}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <OrderDetailDialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)} order={selectedOrder} />
      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} />
    </div>
  );
};

export default ManagerDashboard;
