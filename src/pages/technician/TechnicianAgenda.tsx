import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { OS_STATUS_LABELS, OS_STATUS_COLORS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TechnicianAgenda = () => {
  const { user } = useAuth();
  const { data: allOrders = [], isLoading } = useServiceOrders();
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const goBack = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const goForward = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const orders = allOrders.filter(o => {
    if (o.technician_id !== user?.user_id) return false;
    const osDate = new Date(o.scheduled_start);
    return (
      osDate.getFullYear() === selectedDate.getFullYear() &&
      osDate.getMonth() === selectedDate.getMonth() &&
      osDate.getDate() === selectedDate.getDate()
    );
  });

  if (isLoading) {
    return (
      <div className="p-5 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold">Agenda</h1>
        <div className="flex items-center gap-2 mt-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium capitalize">
            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goForward}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-5 space-y-2 pb-6">
        {orders.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma visita agendada</p>
          </Card>
        ) : (
          orders.map(os => {
            const time = new Date(os.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const endTime = os.scheduled_end ? new Date(os.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <Card key={os.id} className="p-4 shadow-card border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold text-accent">{os.code}</span>
                  <span className={cn("status-badge text-[10px]", OS_STATUS_COLORS[os.status])}>
                    {OS_STATUS_LABELS[os.status]}
                  </span>
                </div>
                <div className="text-sm font-semibold">{os.customer?.name}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{time}{endTime && ` – ${endTime}`}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{os.address?.city}</span>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TechnicianAgenda;
