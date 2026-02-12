import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, OS_TYPE_LABELS } from '@/types';
import type { OSStatus, OSType, Priority } from '@/types';
import { cn } from '@/lib/utils';
import {
  Clock, MapPin, Phone, Printer, User, FileText, Calendar, Wrench,
  Paperclip, X, Loader2, Download, Trash2, Save,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUpdateServiceOrder } from '@/hooks/useServiceOrders';
import { useProfiles } from '@/hooks/useProfiles';
import { useCustomers, useCustomerAddresses, useMachines } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiDelete } from '@/integrations/api/client';

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any | null;
}

/* ─── Editable text block (Notion-style) ─── */
const EditableBlock = ({
  label,
  value,
  onChange,
  placeholder,
  multiline = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) => (
  <div className="group">
    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    {multiline ? (
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || `Adicionar ${label.toLowerCase()}...`}
        className="mt-1 min-h-[60px] bg-transparent border-none shadow-none resize-none px-0 focus-visible:ring-0 text-sm placeholder:text-muted-foreground/40"
      />
    ) : (
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || `Adicionar ${label.toLowerCase()}...`}
        className="mt-1 bg-transparent border-none shadow-none px-0 focus-visible:ring-0 text-sm h-8 placeholder:text-muted-foreground/40"
      />
    )}
  </div>
);

/* ─── Property Row (Notion-style) ─── */
const PropRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-4 py-1.5 group">
    <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</span>
    <div className="flex-1">{children}</div>
  </div>
);

/* ─── File type helpers ─── */
const getFileKind = (file: File): 'photo' | 'audio' | 'file' => {
  if (file.type.startsWith('image/')) return 'photo';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'file';
};

const getEvidenceIcon = (kind: string, url: string) => {
  if (kind === 'photo') return '🖼️';
  if (kind === 'audio') return '🎵';
  if (url?.endsWith('.pdf')) return '📄';
  return '📎';
};

const OrderDetailDialog = ({ open, onOpenChange, order }: OrderDetailDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateOrder = useUpdateServiceOrder();
  const { data: profiles = [] } = useProfiles();
  const { data: customers = [] } = useCustomers();
  const technicians = profiles.filter(p => p.active);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local editable state
  const [form, setForm] = useState({
    status: '' as OSStatus,
    priority: '' as Priority,
    type: '' as OSType,
    technician_id: '' as string,
    customer_id: '' as string,
    address_id: '' as string,
    machine_id: '' as string,
    scheduled_start: '',
    scheduled_end: '',
    estimated_duration_min: 60,
    problem_description: '',
    diagnosis: '',
    resolution: '',
    next_steps: '',
  });

  // Fetch addresses and machines based on selected customer
  const { data: customerAddresses = [] } = useCustomerAddresses(form.customer_id || undefined);
  const { data: customerMachines = [] } = useMachines(form.customer_id || undefined);

  // Helper: convert ISO/UTC string to local datetime-local format
  const toLocalDatetimeString = (isoStr: string | null | undefined): string => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Sync form when order changes
  useEffect(() => {
    if (order) {
      setForm({
        status: order.status,
        priority: order.priority,
        type: order.type,
        technician_id: order.technician_id || '',
        customer_id: order.customer_id || '',
        address_id: order.address_id || '',
        machine_id: order.machine_id || '',
        scheduled_start: toLocalDatetimeString(order.scheduled_start),
        scheduled_end: toLocalDatetimeString(order.scheduled_end),
        estimated_duration_min: order.estimated_duration_min || 60,
        problem_description: order.problem_description || '',
        diagnosis: order.diagnosis || '',
        resolution: order.resolution || '',
        next_steps: order.next_steps || '',
      });
    }
  }, [order]);

  const { data: evidences = [] } = useQuery({
    queryKey: ['evidences', order?.id],
    queryFn: async () => {
      if (!order?.id) return [];
      return apiGet<any[]>(`/api/evidences/service-orders/${order.id}`);
    },
    enabled: !!order?.id && open,
  });

  const handleSave = async () => {
    if (!order?.id) return;
    setSaving(true);
    updateOrder.mutate({
      id: order.id,
      status: form.status,
      priority: form.priority,
      type: form.type,
      technician_id: form.technician_id || null,
      customer_id: form.customer_id,
      address_id: form.address_id || null,
      machine_id: form.machine_id || null,
      scheduled_start: form.scheduled_start ? new Date(form.scheduled_start).toISOString() : order.scheduled_start,
      scheduled_end: form.scheduled_end ? new Date(form.scheduled_end).toISOString() : null,
      estimated_duration_min: form.estimated_duration_min,
      problem_description: form.problem_description,
      diagnosis: form.diagnosis,
      resolution: form.resolution,
      next_steps: form.next_steps,
    }, {
      onSuccess: () => {
        toast({ title: '✅ OS atualizada!' });
        setSaving(false);
      },
      onError: (err) => {
        toast({ title: 'Erro ao salvar', description: String(err), variant: 'destructive' });
        setSaving(false);
      },
    });
  };

  const handleFileUpload = async (files: FileList) => {
    if (!order?.id || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const kind = getFileKind(file);
        const objectUrl = URL.createObjectURL(file);
        await apiPost('/api/evidences', {
          os_id: order.id,
          kind,
          file_url: objectUrl,
        });
      }

      qc.invalidateQueries({ queryKey: ['evidences', order.id] });
      toast({ title: `📎 ${files.length} arquivo(s) anexado(s)!` });
    } catch (e: any) {
      toast({ title: 'Erro ao enviar', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvidence = async (ev: any) => {
    try {
      await apiDelete(`/api/evidences/${ev.id}`);
      qc.invalidateQueries({ queryKey: ['evidences', order?.id] });
      toast({ title: 'Arquivo removido' });
    } catch (e: any) {
      toast({ title: 'Erro ao remover', description: e.message, variant: 'destructive' });
    }
  };

  if (!order) return null;

  const scheduledStart = new Date(order.scheduled_start);
  const time = scheduledStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = scheduledStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const endTime = order.scheduled_end
    ? new Date(order.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const addressStr = order.address
    ? [order.address.street, order.address.number, order.address.city, order.address.state].filter(Boolean).join(', ')
    : null;

  const photos = evidences.filter((e: any) => e.kind === 'photo');
  const otherFiles = evidences.filter((e: any) => e.kind !== 'photo');

  const hasChanges =
    form.status !== order.status ||
    form.priority !== order.priority ||
    form.type !== order.type ||
    (form.technician_id || '') !== (order.technician_id || '') ||
    (form.customer_id || '') !== (order.customer_id || '') ||
    (form.address_id || '') !== (order.address_id || '') ||
    (form.machine_id || '') !== (order.machine_id || '') ||
    form.scheduled_start !== (order.scheduled_start ? order.scheduled_start.slice(0, 16) : '') ||
    form.scheduled_end !== (order.scheduled_end ? order.scheduled_end.slice(0, 16) : '') ||
    form.estimated_duration_min !== (order.estimated_duration_min || 60) ||
    form.problem_description !== (order.problem_description || '') ||
    form.diagnosis !== (order.diagnosis || '') ||
    form.resolution !== (order.resolution || '') ||
    form.next_steps !== (order.next_steps || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-mono font-bold text-accent">{order.code}</span>
            <span className="text-lg font-semibold truncate">{order.customer?.name || 'Cliente'}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasChanges && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="brand-gradient text-primary-foreground"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                Salvar
              </Button>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Properties (Notion-style) */}
          <div className="space-y-0.5">
            <PropRow label="Status">
              <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v as OSStatus }))}>
                <SelectTrigger className="h-8 w-auto min-w-[160px] border-none shadow-none bg-transparent hover:bg-muted/50 px-2">
                  <span className={cn("status-badge text-xs", OS_STATUS_COLORS[form.status])}>
                    {OS_STATUS_LABELS[form.status]}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  {(Object.entries(OS_STATUS_LABELS) as [OSStatus, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <span className={cn("status-badge text-xs", OS_STATUS_COLORS[k])}>{v}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropRow>

            <PropRow label="Prioridade">
              <Select value={form.priority} onValueChange={(v) => setForm(p => ({ ...p, priority: v as Priority }))}>
                <SelectTrigger className="h-8 w-auto min-w-[120px] border-none shadow-none bg-transparent hover:bg-muted/50 px-2">
                  <span className={cn("status-badge text-xs", PRIORITY_COLORS[form.priority])}>
                    {PRIORITY_LABELS[form.priority]}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <span className={cn("status-badge text-xs", PRIORITY_COLORS[k])}>{v}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropRow>

            <PropRow label="Tipo">
              <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v as OSType }))}>
                <SelectTrigger className="h-8 w-auto min-w-[140px] border-none shadow-none bg-transparent hover:bg-muted/50 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  {(Object.entries(OS_TYPE_LABELS) as [OSType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropRow>

            <PropRow label="Técnico">
              <Select value={form.technician_id || '__none__'} onValueChange={(v) => setForm(p => ({ ...p, technician_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger className="h-8 w-auto min-w-[160px] border-none shadow-none bg-transparent hover:bg-muted/50 px-2">
                  <SelectValue placeholder="Nenhum atribuído" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {technicians.map(t => (
                    <SelectItem key={t.id} value={t.user_id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropRow>

            <PropRow label="Cliente">
              <Select value={form.customer_id} onValueChange={(v) => setForm(p => ({ ...p, customer_id: v, address_id: '', machine_id: '' }))}>
                <SelectTrigger className="h-8 w-auto min-w-[160px] border-none shadow-none bg-transparent hover:bg-muted/50 px-2">
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100] max-h-60">
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropRow>

            <PropRow label="Endereço">
              <Select value={form.address_id || '__none__'} onValueChange={(v) => setForm(p => ({ ...p, address_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger className="h-8 w-auto min-w-[160px] border-none shadow-none bg-transparent hover:bg-muted/50 px-2">
                  <SelectValue placeholder="Nenhum endereço" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {customerAddresses.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label || 'Endereço'} — {a.street}{a.number ? `, ${a.number}` : ''}, {a.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropRow>

            <PropRow label="Equipamento">
              <Select value={form.machine_id || '__none__'} onValueChange={(v) => setForm(p => ({ ...p, machine_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger className="h-8 w-auto min-w-[160px] border-none shadow-none bg-transparent hover:bg-muted/50 px-2">
                  <SelectValue placeholder="Nenhum equipamento" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {customerMachines.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.model}{m.serial_number ? ` • ${m.serial_number}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropRow>

            <PropRow label="Início">
              <Input
                type="datetime-local"
                value={form.scheduled_start}
                onChange={e => setForm(p => ({ ...p, scheduled_start: e.target.value }))}
                className="h-8 w-auto border-none shadow-none bg-transparent hover:bg-muted/50 px-2 text-sm"
              />
            </PropRow>

            <PropRow label="Fim">
              <Input
                type="datetime-local"
                value={form.scheduled_end}
                onChange={e => setForm(p => ({ ...p, scheduled_end: e.target.value }))}
                className="h-8 w-auto border-none shadow-none bg-transparent hover:bg-muted/50 px-2 text-sm"
              />
            </PropRow>

            <PropRow label="Duração (min)">
              <Input
                type="number"
                min={0}
                value={form.estimated_duration_min}
                onChange={e => setForm(p => ({ ...p, estimated_duration_min: parseInt(e.target.value) || 0 }))}
                className="h-8 w-20 border-none shadow-none bg-transparent hover:bg-muted/50 px-2 text-sm"
              />
            </PropRow>

            {order.customer?.phone && (
              <PropRow label="Telefone">
                <span className="text-sm">{order.customer.phone}</span>
              </PropRow>
            )}
          </div>

          <Separator />

          {/* Editable text blocks */}
          <EditableBlock
            label="Descrição do Problema"
            value={form.problem_description}
            onChange={v => setForm(p => ({ ...p, problem_description: v }))}
            placeholder="Descreva o problema relatado pelo cliente..."
          />

          <EditableBlock
            label="Diagnóstico"
            value={form.diagnosis}
            onChange={v => setForm(p => ({ ...p, diagnosis: v }))}
            placeholder="Adicionar diagnóstico técnico..."
          />

          <EditableBlock
            label="Resolução"
            value={form.resolution}
            onChange={v => setForm(p => ({ ...p, resolution: v }))}
            placeholder="Descrever a resolução aplicada..."
          />

          <EditableBlock
            label="Próximos Passos"
            value={form.next_steps}
            onChange={v => setForm(p => ({ ...p, next_steps: v }))}
            placeholder="Adicionar próximos passos..."
          />

          {/* Timestamps */}
          {(order.arrived_at || order.started_at || order.finished_at) && (
            <>
              <Separator />
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Histórico</span>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {order.arrived_at && <p>📍 Chegou às {new Date(order.arrived_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}
                  {order.started_at && <p>🔧 Iniciou às {new Date(order.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}
                  {order.finished_at && <p>✅ Finalizou às {new Date(order.finished_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
              </div>
            </>
          )}

          {/* Attachments */}
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Anexos ({evidences.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs h-7"
              >
                {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Paperclip className="w-3 h-3 mr-1" />}
                Anexar arquivo
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFileUpload(e.target.files);
                e.target.value = '';
              }}
            />

            {/* Photo grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {photos.map((ev: any) => (
                  <div key={ev.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                    <a href={ev.file_url} target="_blank" rel="noopener noreferrer">
                      <img src={ev.file_url} alt="" className="w-full h-full object-cover" />
                    </a>
                    <button
                      onClick={() => handleDeleteEvidence(ev)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Other files (audio, pdf, etc) */}
            {otherFiles.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {otherFiles.map((ev: any) => {
                  const fileName = decodeURIComponent(ev.file_url.split('/').pop() || 'arquivo');
                  return (
                    <div key={ev.id} className="group flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                      <span className="text-base">{getEvidenceIcon(ev.kind, ev.file_url)}</span>
                      <div className="flex-1 min-w-0">
                        {ev.kind === 'audio' ? (
                          <audio controls className="w-full h-7" src={ev.file_url} />
                        ) : (
                          <a href={ev.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline truncate block">
                            {fileName}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={ev.file_url} download target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => handleDeleteEvidence(ev)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {evidences.length === 0 && !uploading && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/50 rounded-lg py-6 text-center cursor-pointer hover:border-accent/50 hover:bg-muted/20 transition-colors"
              >
                <Paperclip className="w-5 h-5 mx-auto text-muted-foreground/50 mb-1" />
                <p className="text-xs text-muted-foreground">Clique ou arraste para anexar fotos, áudios, PDFs...</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailDialog;
