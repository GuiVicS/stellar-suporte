import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, type OSStatus } from '@/types';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock, MapPin, Printer, ChevronRight, XCircle, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const TechnicianHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: allOrders = [], isLoading } = useServiceOrders();
  const myOrders = allOrders.filter(o => o.technician_id === user?.user_id);
  const completed = myOrders.filter(o => o.status === 'concluido' || o.status === 'cancelado');

  if (isLoading) {
    return (
      <div className="p-5 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold">Histórico</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {completed.length} {completed.length === 1 ? 'ordem finalizada' : 'ordens finalizadas'}
        </p>
      </div>

      <div className="px-5 space-y-3 pb-24">
        {completed.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <Archive className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma OS finalizada ainda</p>
          </Card>
        )}

        {completed.map(os => {
          const date = new Date(os.finished_at || os.updated_at || os.created_at!);
          const isDone = os.status === 'concluido';
          return (
            <Card
              key={os.id}
              className="p-4 shadow-card border-border/50 transition-all active:scale-[0.98]"
              onClick={() => navigate(`/tech/os/${os.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                  isDone ? "bg-status-done/15 text-status-done" : "bg-status-cancelled/15 text-status-cancelled"
                )}>
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-semibold text-accent">{os.code}</span>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", OS_STATUS_COLORS[os.status as OSStatus])}>
                      {OS_STATUS_LABELS[os.status as OSStatus]}
                    </span>
                  </div>
                  <div className="text-sm font-semibold truncate">{os.customer?.name}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </div>
                    {os.machine && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Printer className="w-3 h-3" />
                        {os.machine.model}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TechnicianHistory;
