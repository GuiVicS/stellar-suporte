import React from 'react';
import { useServiceOrders, useUpdateServiceOrder } from '@/hooks/useServiceOrders';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types';
import type { OSStatus } from '@/types';
import { Clock, MapPin, GripVertical, Package, Truck, Wrench, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import OrderDetailDialog from '@/components/OrderDetailDialog';
import NewOrderDialog from '@/components/NewOrderDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const columns: { status: OSStatus; label: string; icon: React.ReactNode; dotColor: string }[] = [
  { status: 'a_fazer', label: 'A Fazer', icon: <Package className="w-4 h-4" />, dotColor: 'bg-status-pending' },
  { status: 'em_deslocamento', label: 'Em Deslocamento', icon: <Truck className="w-4 h-4" />, dotColor: 'bg-status-transit' },
  { status: 'em_atendimento', label: 'Em Atendimento', icon: <Wrench className="w-4 h-4" />, dotColor: 'bg-status-active' },
  { status: 'aguardando_peca', label: 'Aguardando Peça', icon: <AlertCircle className="w-4 h-4" />, dotColor: 'bg-status-waiting' },
  { status: 'concluido', label: 'Concluído', icon: <CheckCircle2 className="w-4 h-4" />, dotColor: 'bg-status-done' },
];

const KanbanView = () => {
  const { data: allOrders = [], isLoading } = useServiceOrders();
  const updateOrder = useUpdateServiceOrder();
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
  const [dragOverCol, setDragOverCol] = React.useState<OSStatus | null>(null);
  const [newOrderStatus, setNewOrderStatus] = React.useState<OSStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, osId: string) => {
    e.dataTransfer.setData('osId', osId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: OSStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const osId = e.dataTransfer.getData('osId');
    const os = allOrders.find(o => o.id === osId);
    if (!os || os.status === targetStatus) return;
    const label = columns.find(c => c.status === targetStatus)?.label;
    updateOrder.mutate({ id: osId, status: targetStatus }, {
      onSuccess: () => toast.success(`OS movida para "${label}"`),
      onError: () => toast.error('Erro ao mover OS'),
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-64 w-72" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kanban</h1>
        <p className="text-sm text-muted-foreground">Arraste os cards para alterar o status das ordens de serviço</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 lg:-mx-6 lg:px-6">
        {columns.map(col => {
          const orders = allOrders.filter(o => o.status === col.status);
          const isDragOver = dragOverCol === col.status;

          return (
            <div
              key={col.status}
              className="flex-shrink-0 w-[280px] lg:w-[300px] flex flex-col"
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.status); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {/* Column header */}
              <div className={cn(
                "rounded-t-xl px-4 py-3 flex items-center justify-between bg-muted/50 transition-all",
                isDragOver && "ring-2 ring-primary/30"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", col.dotColor)} />
                  <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-foreground/10"
                    onClick={() => setNewOrderStatus(col.status)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center",
                    orders.length > 0
                      ? "bg-foreground/10 text-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {orders.length}
                  </span>
                </div>
              </div>

              {/* Column body */}
              <div className={cn(
                "rounded-b-xl border border-t-0 border-border/40 bg-card/50 flex-1 min-h-[300px] max-h-[calc(100vh-240px)] overflow-y-auto transition-colors",
                isDragOver && "bg-accent/5 border-primary/20"
              )}>
                <div className="p-2 space-y-2">
                  {orders.map(os => {
                    const time = new Date(os.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={os.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, os.id)}
                        onClick={() => setSelectedOrder(os)}
                        className="group bg-card rounded-lg border border-border/50 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing active:scale-[0.98] active:opacity-80"
                      >
                        {/* Top row: code + priority */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono font-bold text-accent tracking-wide">{os.code}</span>
                          <span className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            PRIORITY_COLORS[os.priority]
                          )}>
                            {PRIORITY_LABELS[os.priority]}
                          </span>
                        </div>

                        {/* Customer name */}
                        <div className="text-sm font-semibold text-foreground mb-0.5 truncate">
                          {os.customer?.name || '—'}
                        </div>

                        {/* Machine */}
                        {os.machine?.model && (
                          <div className="text-xs text-muted-foreground truncate mb-2">
                            {os.machine.model}
                            {os.machine.serial_number && ` • ${os.machine.serial_number}`}
                          </div>
                        )}

                        {/* Footer: time, location, technician */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="w-3 h-3 opacity-60" />
                              <span>{time}</span>
                            </div>
                            {os.address?.city && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <MapPin className="w-3 h-3 opacity-60" />
                                <span className="truncate max-w-[80px]">{os.address.city}</span>
                              </div>
                            )}
                          </div>
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Technician */}
                        {os.technician && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-[9px] font-bold text-primary-foreground flex-shrink-0">
                              {os.technician.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate">{os.technician.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
                      <div className="text-3xl mb-2 opacity-30">{col.icon}</div>
                      <span className="text-xs">Nenhuma OS</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <OrderDetailDialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)} order={selectedOrder} />
      <NewOrderDialog
        open={!!newOrderStatus}
        onOpenChange={(open) => !open && setNewOrderStatus(null)}
        defaultStatus={newOrderStatus || undefined}
      />
    </div>
  );
};

export default KanbanView;
