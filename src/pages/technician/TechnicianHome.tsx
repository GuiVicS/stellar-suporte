import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceOrders, useUpdateServiceOrder } from '@/hooks/useServiceOrders';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, type OSStatus } from '@/types';
import { Card } from '@/components/ui/card';
import {
  Clock, MapPin, CheckCircle2, Printer,
  ChevronRight, ChevronLeft, ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const STATUS_FLOW: OSStatus[] = ['a_fazer', 'em_deslocamento', 'em_atendimento', 'aguardando_peca', 'concluido'];

const TechnicianHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: allOrders = [], isLoading } = useServiceOrders();
  const updateOrder = useUpdateServiceOrder();
  const { toast } = useToast();
  const orders = allOrders.filter(o => o.technician_id === user?.user_id);
  const pending = orders.filter(o => o.status !== 'concluido' && o.status !== 'cancelado');
  const done = orders.filter(o => o.status === 'concluido').length;
  const firstName = user?.name?.split(' ')[0] || 'Técnico';

  if (isLoading) {
    return (
      <div className="p-5 space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  const handleStatusChange = (osId: string, newStatus: OSStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    const extras: any = { id: osId, status: newStatus };
    if (newStatus === 'em_deslocamento') extras.actual_departure_at = new Date().toISOString();
    if (newStatus === 'em_atendimento') extras.arrived_at = new Date().toISOString();
    if (newStatus === 'concluido') extras.finished_at = new Date().toISOString();
    updateOrder.mutate(extras, {
      onSuccess: () => toast({ title: `✅ ${OS_STATUS_LABELS[newStatus]}` }),
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Compact header */}
      <div className="brand-gradient px-5 pt-5 pb-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-70">Olá, {firstName}</p>
            <h1 className="text-lg font-bold">{pending.length} pendente{pending.length !== 1 ? 's' : ''}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-lg font-bold">{done}/{orders.length}</div>
              <div className="text-[10px] opacity-70">concluídas</div>
            </div>
            {/* Mini progress ring */}
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.15" />
                <circle
                  cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3"
                  strokeDasharray={`${orders.length > 0 ? (done / orders.length) * 88 : 0} 88`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                {orders.length > 0 ? Math.round((done / orders.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order list */}
      <div className="px-4 pt-4 pb-24 space-y-2.5">
        {pending.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma OS pendente — bom trabalho! 🎉</p>
          </Card>
        )}

        {pending.map((os, i) => {
          const time = new Date(os.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const isUrgent = os.priority === 'urgente';
          const idx = STATUS_FLOW.indexOf(os.status as OSStatus);
          const prev = idx > 0 ? STATUS_FLOW[idx - 1] : null;
          const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;

          return (
            <Card
              key={os.id}
              className={cn(
                "p-3 shadow-card border-border/50 transition-all active:scale-[0.98]",
                isUrgent && "border-l-4 border-l-priority-urgent"
              )}
              onClick={() => navigate(`/tech/os/${os.id}`)}
            >
              {/* Row 1: time + customer + arrow */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-accent tabular-nums w-11 flex-shrink-0">{time}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{os.customer?.name}</div>
                  {os.address?.city && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{os.address.city}</span>
                      {os.machine && (
                        <>
                          <span className="mx-0.5">·</span>
                          <Printer className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{os.machine.model}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
              </div>

              {/* Row 2: status control */}
              <div className="flex items-center gap-2 mt-2 ml-[3.375rem]">
                <div className="inline-flex items-center border border-border rounded-lg overflow-hidden h-7">
                  {prev && (
                    <button
                      onClick={(e) => handleStatusChange(os.id, prev, e)}
                      className="px-1.5 h-full hover:bg-muted transition-colors border-r border-border"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                  <span className={cn(
                    "px-2.5 h-full flex items-center text-[10px] font-bold uppercase whitespace-nowrap",
                    OS_STATUS_COLORS[os.status as OSStatus]
                  )}>
                    {OS_STATUS_LABELS[os.status as OSStatus]}
                  </span>
                  {next && (
                    <button
                      onClick={(e) => handleStatusChange(os.id, next, e)}
                      className="px-1.5 h-full hover:bg-muted transition-colors border-l border-border"
                    >
                      {next === 'concluido' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-status-done" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TechnicianHome;
