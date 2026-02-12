import React, { useCallback, useMemo } from 'react';
import { useServiceOrders, useUpdateServiceOrder } from '@/hooks/useServiceOrders';
import { OS_STATUS_COLORS, PRIORITY_COLORS } from '@/types';
import type { OSStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import OrderDetailDialog from '@/components/OrderDetailDialog';
import NewOrderDialog from '@/components/NewOrderDialog';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'day' | 'week' | 'month';

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 20;
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

const VIEW_LABELS: Record<ViewMode, string> = { day: 'Dia', week: 'Semana', month: 'Mês' };

/* ── helpers ── */
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getWeekDays = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(start);
    dd.setDate(start.getDate() + i);
    return dd;
  });
};

const getMonthDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const days: Date[] = [];
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let i = 1; i <= last.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  while (days.length % 7 !== 0) {
    days.push(new Date(year, month + 1, days.length - last.getDate() - startDay + 1));
  }
  return days;
};

const formatTime = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/* ── Google Calendar overlap layout algorithm ── */
interface LayoutEvent {
  os: any;
  startMin: number;
  endMin: number;
  col: number;
  totalCols: number;
}

function computeOverlapLayout(orders: any[]): LayoutEvent[] {
  if (orders.length === 0) return [];

  // Convert to { os, startMin, endMin }
  const events = orders.map(os => {
    const start = new Date(os.scheduled_start);
    const end = os.scheduled_end
      ? new Date(os.scheduled_end)
      : new Date(start.getTime() + (os.estimated_duration_min || 60) * 60000);
    const startMin = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
    const endMin = (end.getHours() - START_HOUR) * 60 + end.getMinutes();
    return { os, startMin, endMin: Math.max(endMin, startMin + 15) };
  }).filter(e => e.startMin >= 0).sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  // Group into overlapping clusters (Google Calendar algorithm)
  const result: LayoutEvent[] = [];
  let clusterStart = 0;

  while (clusterStart < events.length) {
    // Find all events in this cluster
    const cluster: typeof events = [events[clusterStart]];
    let clusterEnd = events[clusterStart].endMin;

    for (let i = clusterStart + 1; i < events.length; i++) {
      if (events[i].startMin < clusterEnd) {
        cluster.push(events[i]);
        clusterEnd = Math.max(clusterEnd, events[i].endMin);
      } else {
        break;
      }
    }

    // Assign columns using greedy algorithm
    const columns: { endMin: number }[] = [];
    for (const event of cluster) {
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        if (event.startMin >= columns[col].endMin) {
          columns[col].endMin = event.endMin;
          result.push({ ...event, col, totalCols: 0 });
          placed = true;
          break;
        }
      }
      if (!placed) {
        result.push({ ...event, col: columns.length, totalCols: 0 });
        columns.push({ endMin: event.endMin });
      }
    }

    // Set totalCols for all events in this cluster
    const totalCols = columns.length;
    for (let i = result.length - cluster.length; i < result.length; i++) {
      result[i].totalCols = totalCols;
    }

    clusterStart += cluster.length;
  }

  return result;
}

/* ── Event card for time grid ── */
const TimeEvent: React.FC<{
  os: any;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onResizeEnd: (osId: string, newEndMin: number) => void;
  style: React.CSSProperties;
  compact?: boolean;
}> = ({ os, onClick, onDragStart, onResizeEnd, style, compact }) => {
  const start = new Date(os.scheduled_start);
  const end = os.scheduled_end ? new Date(os.scheduled_end) : new Date(start.getTime() + (os.estimated_duration_min || 60) * 60000);
  const resizingRef = React.useRef(false);
  const startYRef = React.useRef(0);
  const startHeightRef = React.useRef(0);
  const elRef = React.useRef<HTMLDivElement>(null);

  const handleResizeStart = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = elRef.current?.offsetHeight || 0;

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current || !elRef.current) return;
      const delta = ev.clientY - startYRef.current;
      const newHeight = Math.max(24, startHeightRef.current + delta);
      elRef.current.style.height = `${newHeight}px`;
    };

    const onMouseUp = (ev: MouseEvent) => {
      if (!resizingRef.current || !elRef.current) return;
      resizingRef.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const finalHeight = elRef.current.offsetHeight;
      const durationMin = (finalHeight / HOUR_HEIGHT) * 60;
      const startMin = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
      const newEndMin = startMin + durationMin;
      onResizeEnd(os.id, newEndMin);
    };

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [os.id, start, onResizeEnd]);

  return (
    <div
      ref={elRef}
      draggable
      onDragStart={onDragStart}
      onClick={(e) => { if (!resizingRef.current) { e.stopPropagation(); onClick(); } }}
      style={style}
      className={cn(
        "absolute rounded-md px-2 py-1 overflow-hidden cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg z-10 border-l-[3px] border-primary/40",
        OS_STATUS_COLORS[os.status as OSStatus]
      )}
    >
      <div className="text-[10px] font-semibold opacity-80 leading-tight">{formatTime(start)} – {formatTime(end)}</div>
      <div className={cn("font-bold truncate leading-tight", compact ? "text-[10px]" : "text-xs")}>{os.customer?.name || os.code}</div>
      {!compact && os.technician && <div className="text-[10px] opacity-70 truncate">{os.technician.name}</div>}
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize group/resize flex items-end justify-center"
      >
        <div className="w-8 h-[3px] rounded-full bg-foreground/20 group-hover/resize:bg-foreground/50 mb-0.5 transition-colors" />
      </div>
    </div>
  );
};

/* ── Day Column (shared between Day and Week view) ── */
const DayColumn: React.FC<{
  date: Date;
  orders: any[];
  showHeader: boolean;
  onSelectOrder: (os: any) => void;
  onDragStart: (e: React.DragEvent, osId: string) => void;
  onDrop: (e: React.DragEvent, hour: number) => void;
  onResizeEnd: (osId: string, newEndMin: number) => void;
  dragOverHour: number | null;
  setDragOverHour: (h: number | null) => void;
  isWeekView?: boolean;
}> = ({ date, orders, showHeader, onSelectOrder, onDragStart, onDrop, onResizeEnd, dragOverHour, setDragOverHour, isWeekView }) => {
  const dayOrders = orders.filter(os => {
    const osDate = new Date(os.scheduled_start);
    return isSameDay(osDate, date);
  });

  const layoutEvents = useMemo(() => computeOverlapLayout(dayOrders), [dayOrders]);

  // Compute busy hours
  const busyHours = useMemo(() => {
    const set = new Set<number>();
    dayOrders.forEach(os => {
      const start = new Date(os.scheduled_start);
      const end = os.scheduled_end
        ? new Date(os.scheduled_end)
        : new Date(start.getTime() + (os.estimated_duration_min || 60) * 60000);
      for (let h = start.getHours(); h < end.getHours() + (end.getMinutes() > 0 ? 1 : 0); h++) {
        set.add(h);
      }
    });
    return set;
  }, [dayOrders]);

  const isToday = isSameDay(date, new Date());
  const PADDING = 4; // px gap between side-by-side events
  const LEFT_MARGIN = 4; // px from left edge
  const MAX_WIDTH_PCT = 0.85; // leave 15% free for drop zone

  return (
    <div className="flex-1 min-w-0 relative border-r border-border/30 last:border-r-0">
      {showHeader && (
        <div className={cn(
          "text-center py-2 border-b border-border sticky top-0 bg-card z-20",
          isToday && "bg-primary/5"
        )}>
          <div className="text-[10px] text-muted-foreground uppercase">
            {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
          </div>
          <div className={cn(
            "text-lg font-bold",
            isToday && "w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto"
          )}>
            {date.getDate()}
          </div>
        </div>
      )}
      <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
        {/* Hour grid lines */}
        {hours.map((hour, i) => {
          const isFree = !busyHours.has(hour);
          return (
            <div
              key={hour}
              className={cn(
                "absolute left-0 right-0 border-t border-border/30 group/slot",
                dragOverHour === hour && "bg-accent/10",
                isFree && "hover:bg-green-500/5"
              )}
              style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              onDragOver={(e) => { e.preventDefault(); setDragOverHour(hour); }}
              onDragLeave={() => setDragOverHour(null)}
              onDrop={(e) => onDrop(e, hour)}
            >
              {isFree && (
                <div className="absolute inset-y-0 right-1 flex items-center opacity-0 group-hover/slot:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-[9px] font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">Livre</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Current time indicator */}
        {isToday && (() => {
          const now = new Date();
          const nowMin = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
          if (nowMin < 0 || nowMin > (END_HOUR - START_HOUR) * 60) return null;
          const top = (nowMin / 60) * HOUR_HEIGHT;
          return (
            <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top }}>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1" />
                <div className="flex-1 h-[2px] bg-destructive" />
              </div>
            </div>
          );
        })()}

        {/* Events positioned with overlap layout */}
        {layoutEvents.map((le) => {
          const top = (le.startMin / 60) * HOUR_HEIGHT;
          const height = Math.max(((le.endMin - le.startMin) / 60) * HOUR_HEIGHT, 24);
          const availableWidth = MAX_WIDTH_PCT;
          const colWidth = `calc(${availableWidth * 100}% / ${le.totalCols} - ${PADDING}px)`;
          const left = `calc(${LEFT_MARGIN}px + ${availableWidth * 100}% * ${le.col} / ${le.totalCols})`;

          return (
            <TimeEvent
              key={le.os.id}
              os={le.os}
              onClick={() => onSelectOrder(le.os)}
              onDragStart={(e) => onDragStart(e, le.os.id)}
              onResizeEnd={onResizeEnd}
              compact={isWeekView && le.totalCols > 1}
              style={{
                top,
                height,
                minHeight: 24,
                left,
                width: colWidth,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ── Time Gutter ── */
const TimeGutter = () => {
  const isToday = isSameDay(new Date(), new Date());
  return (
    <div className="w-14 flex-shrink-0 relative" style={{ height: hours.length * HOUR_HEIGHT }}>
      {hours.map((hour, i) => (
        <div
          key={hour}
          className="absolute left-0 right-0 text-[11px] text-muted-foreground text-right pr-2 font-mono"
          style={{ top: i * HOUR_HEIGHT - 7 }}
        >
          {String(hour).padStart(2, '0')}:00
        </div>
      ))}
    </div>
  );
};

/* ── Month View ── */
const MonthView: React.FC<{
  date: Date;
  orders: any[];
  onSelectOrder: (os: any) => void;
}> = ({ date, orders, onSelectOrder }) => {
  const days = getMonthDays(date);
  const today = new Date();

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground font-semibold border-b border-border">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === date.getMonth();
          const isDayToday = isSameDay(day, today);
          const dayOrders = orders.filter(os => isSameDay(new Date(os.scheduled_start), day));

          return (
            <div
              key={i}
              className={cn(
                "min-h-[90px] border-b border-r border-border/40 p-1",
                !isCurrentMonth && "bg-muted/20 opacity-50"
              )}
            >
              <div className={cn(
                "text-xs font-medium mb-1",
                isDayToday && "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
              )}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayOrders.slice(0, 3).map(os => {
                  const time = formatTime(new Date(os.scheduled_start));
                  return (
                    <div
                      key={os.id}
                      onClick={() => onSelectOrder(os)}
                      className={cn(
                        "text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
                        OS_STATUS_COLORS[os.status as OSStatus]
                      )}
                    >
                      {time} {os.customer?.name || os.code}
                    </div>
                  );
                })}
                {dayOrders.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dayOrders.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main Agenda ── */
const AgendaView = () => {
  const [date, setDate] = React.useState(new Date());
  const [view, setView] = React.useState<ViewMode>('week');
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
  const [newOrderOpen, setNewOrderOpen] = React.useState(false);
  const [dragOverHour, setDragOverHour] = React.useState<number | null>(null);
  const { data: allOrders = [], isLoading } = useServiceOrders();
  const updateOrder = useUpdateServiceOrder();
  const { toast } = useToast();

  const navigate = useCallback((dir: -1 | 0 | 1) => {
    if (dir === 0) { setDate(new Date()); return; }
    setDate(prev => {
      const d = new Date(prev);
      if (view === 'day') d.setDate(d.getDate() + dir);
      else if (view === 'week') d.setDate(d.getDate() + dir * 7);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  }, [view]);

  const headerLabel = useMemo(() => {
    if (view === 'day') return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (view === 'week') {
      const days = getWeekDays(date);
      const s = days[0];
      const e = days[6];
      if (s.getMonth() === e.getMonth()) {
        return `${s.getDate()} – ${e.getDate()} de ${s.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
      }
      return `${s.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [date, view]);

  const isToday = isSameDay(date, new Date());

  const handleDragStart = useCallback((e: React.DragEvent, osId: string) => {
    e.dataTransfer.setData('text/plain', osId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetHour: number) => {
    e.preventDefault();
    setDragOverHour(null);
    const osId = e.dataTransfer.getData('text/plain');
    if (!osId) return;
    const os = allOrders.find(o => o.id === osId);
    if (!os) return;

    const oldStart = new Date(os.scheduled_start);
    const oldHour = oldStart.getHours();
    if (oldHour === targetHour) return;

    const diffMs = (targetHour - oldHour) * 60 * 60 * 1000;
    const newStart = new Date(oldStart.getTime() + diffMs);
    const newEnd = os.scheduled_end ? new Date(new Date(os.scheduled_end).getTime() + diffMs) : null;

    updateOrder.mutate({
      id: osId,
      scheduled_start: newStart.toISOString(),
      ...(newEnd ? { scheduled_end: newEnd.toISOString() } : {}),
    }, {
      onSuccess: () => toast({ title: `⏰ OS movida para ${String(targetHour).padStart(2, '0')}:00` }),
      onError: (err) => toast({ title: 'Erro ao mover OS', description: String(err), variant: 'destructive' }),
    });
  }, [allOrders, updateOrder, toast]);

  const handleResizeEnd = useCallback((osId: string, newEndMin: number) => {
    const os = allOrders.find(o => o.id === osId);
    if (!os) return;
    const start = new Date(os.scheduled_start);
    const newEndHour = Math.floor(newEndMin / 60) + START_HOUR;
    const newEndMinute = Math.round(newEndMin % 60 / 15) * 15; // snap to 15min
    const newEnd = new Date(start);
    newEnd.setHours(newEndHour, newEndMinute, 0, 0);
    if (newEnd <= start) return;

    const durationMin = Math.round((newEnd.getTime() - start.getTime()) / 60000);
    const endH = String(newEnd.getHours()).padStart(2, '0');
    const endM = String(newEnd.getMinutes()).padStart(2, '0');

    updateOrder.mutate({
      id: osId,
      scheduled_end: newEnd.toISOString(),
      estimated_duration_min: durationMin,
    }, {
      onSuccess: () => toast({ title: `⏰ Duração ajustada até ${endH}:${endM}` }),
      onError: (err) => toast({ title: 'Erro ao redimensionar', description: String(err), variant: 'destructive' }),
    });
  }, [allOrders, updateOrder, toast]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in h-full flex flex-col">
      {/* Header — Google Calendar style */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(0)} disabled={view === 'day' && isToday}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold capitalize">{headerLabel}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['day', 'week', 'month'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  view === v ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted text-muted-foreground"
                )}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
          <Button className="brand-gradient text-primary-foreground" size="sm" onClick={() => setNewOrderOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova OS
          </Button>
        </div>
      </div>

      {/* Content */}
      {view === 'month' ? (
        <MonthView date={date} orders={allOrders} onSelectOrder={setSelectedOrder} />
      ) : (
        <div className="flex-1 overflow-auto border border-border rounded-xl bg-card">
          <div className="flex min-w-0">
            <div className="flex-shrink-0 border-r border-border">
              {view === 'week' && <div className="h-[52px] border-b border-border" />}
              {view === 'day' && <div className="h-0" />}
              <TimeGutter />
            </div>

            {view === 'day' ? (
              <DayColumn
                date={date}
                orders={allOrders}
                showHeader={false}
                onSelectOrder={setSelectedOrder}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onResizeEnd={handleResizeEnd}
                dragOverHour={dragOverHour}
                setDragOverHour={setDragOverHour}
                isWeekView={false}
              />
            ) : (
              getWeekDays(date).map(d => (
                <DayColumn
                  key={d.toISOString()}
                  date={d}
                  orders={allOrders}
                  showHeader
                  onSelectOrder={setSelectedOrder}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  onResizeEnd={handleResizeEnd}
                  dragOverHour={dragOverHour}
                  setDragOverHour={setDragOverHour}
                  isWeekView
                />
              ))
            )}
          </div>
        </div>
      )}

      {allOrders.filter(os => {
        if (view === 'day') return isSameDay(new Date(os.scheduled_start), date);
        return true;
      }).length === 0 && view === 'day' && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma OS agendada para este dia
        </div>
      )}

      <OrderDetailDialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)} order={selectedOrder ? (allOrders.find(o => o.id === selectedOrder.id) || selectedOrder) : null} />
      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} />
    </div>
  );
};

export default AgendaView;
