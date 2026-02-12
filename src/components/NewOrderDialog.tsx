import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Wrench, Plus } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useProfiles } from '@/hooks/useProfiles';
import { useCreateServiceOrder } from '@/hooks/useServiceOrders';
import { useAuth } from '@/contexts/AuthContext';
import { OS_TYPE_LABELS } from '@/types';
import type { OSType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import QuickCustomerDialog from '@/components/QuickCustomerDialog';

type DBPriority = 'baixa' | 'media' | 'alta' | 'urgente';
type DBOSType = 'instalacao' | 'corretiva' | 'preventiva' | 'treinamento';

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: 'a_fazer' | 'em_deslocamento' | 'em_atendimento' | 'aguardando_peca' | 'concluido' | 'cancelado';
}

const NewOrderDialog = ({ open, onOpenChange, defaultStatus }: NewOrderDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: customers = [] } = useCustomers();
  const { data: profiles = [] } = useProfiles();
  const createOrder = useCreateServiceOrder();
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);

  const technicians = profiles.filter(p => p.active);

  const [form, setForm] = useState({
    customer_id: '',
    technician_id: '',
    type: '' as DBOSType | '',
    priority: 'media' as DBPriority,
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time_start: '08:00',
    scheduled_time_end: '09:00',
    problem_description: '',
  });

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const canSubmit =
    form.customer_id && form.type && form.problem_description.trim().length > 0 && !createOrder.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const scheduledStart = new Date(`${form.scheduled_date}T${form.scheduled_time_start}:00`);
    const scheduledEnd = new Date(`${form.scheduled_date}T${form.scheduled_time_end}:00`);
    const durationMin = Math.max(30, Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60000));

    createOrder.mutate({
      customer_id: form.customer_id,
      type: form.type as DBOSType,
      priority: form.priority,
      status: defaultStatus || 'a_fazer',
      scheduled_start: scheduledStart.toISOString(),
      scheduled_end: scheduledEnd.toISOString(),
      estimated_duration_min: durationMin,
      problem_description: form.problem_description,
      technician_id: form.technician_id || null,
      created_by: user?.user_id || null,
    }, {
      onSuccess: (data) => {
        toast({
          title: '✅ OS criada com sucesso!',
          description: `Código: ${data.code}`,
        });
        setForm({
          customer_id: '',
          technician_id: '',
          type: '',
          priority: 'media',
          scheduled_date: new Date().toISOString().split('T')[0],
          scheduled_time_start: '08:00',
          scheduled_time_end: '09:00',
          problem_description: '',
        });
        onOpenChange(false);
      },
      onError: (err) => {
        toast({ title: '❌ Erro ao criar OS', description: String(err), variant: 'destructive' });
      },
    });
  };

  const priorities = [
    { value: 'baixa' as const, label: '🟢 Baixa' },
    { value: 'media' as const, label: '🟡 Média' },
    { value: 'alta' as const, label: '🟠 Alta' },
    { value: 'urgente' as const, label: '🔴 Urgente' },
  ];

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Wrench className="w-5 h-5 text-primary" />
            Nova Ordem de Serviço
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar uma nova OS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Cliente */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Cliente <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Select value={form.customer_id} onValueChange={v => update('customer_id', v)}>
                <SelectTrigger className="h-11 flex-1">
                  <SelectValue placeholder="Escolha o cliente" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  {customers.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum cliente cadastrado</div>
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 flex-shrink-0"
                onClick={() => setQuickCustomerOpen(true)}
                title="Cadastrar novo cliente"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tipo + Prioridade lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select value={form.type} onValueChange={v => update('type', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  {(Object.entries(OS_TYPE_LABELS) as [OSType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Prioridade</Label>
              <Select value={form.priority} onValueChange={v => update('priority', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  {priorities.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data e Período */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Data</Label>
              <Input
                type="date"
                value={form.scheduled_date}
                onChange={e => update('scheduled_date', e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Início</Label>
              <Input
                type="time"
                value={form.scheduled_time_start}
                onChange={e => update('scheduled_time_start', e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Fim</Label>
              <Input
                type="time"
                value={form.scheduled_time_end}
                onChange={e => update('scheduled_time_end', e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          {/* Técnico */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Técnico (opcional)</Label>
            <Select value={form.technician_id} onValueChange={v => update('technician_id', v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Atribuir depois" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[100]">
                {technicians.map(t => (
                  <SelectItem key={t.id} value={t.user_id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              O que está acontecendo? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Ex: Impressora travando papel na bandeja 2..."
              value={form.problem_description}
              onChange={e => update('problem_description', e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="brand-gradient text-primary-foreground"
          >
            {createOrder.isPending ? 'Criando...' : 'Criar OS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <QuickCustomerDialog
      open={quickCustomerOpen}
      onOpenChange={setQuickCustomerOpen}
      onCreated={(id) => update('customer_id', id)}
    />
    </>
  );
};

export default NewOrderDialog;
