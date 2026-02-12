import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiPost } from '@/integrations/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface QuickCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (customerId: string) => void;
}

const QuickCustomerDialog = ({ open, onOpenChange, onCreated }: QuickCustomerDialogProps) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', cpf_cnpj: '', main_contact_name: '', phone: '', email: '',
    street: '', number: '', city: '', state: '', zip: '',
  });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const reset = () => setForm({
    name: '', cpf_cnpj: '', main_contact_name: '', phone: '', email: '',
    street: '', number: '', city: '', state: '', zip: '',
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Preencha o nome do cliente', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const customer = await apiPost<any>('/api/customers', {
        name: form.name.trim(),
        cpf_cnpj: form.cpf_cnpj.trim(),
        main_contact_name: form.main_contact_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      });

      if (form.street.trim()) {
        await apiPost(`/api/customers/${customer.id}/addresses`, {
          label: 'Principal',
          street: form.street.trim(),
          number: form.number.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip: form.zip.trim(),
          is_default: true,
        });
      }

      await qc.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: '✅ Cliente cadastrado!' });
      reset();
      onOpenChange(false);
      onCreated?.(customer.id);
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto z-[110]">
        <DialogHeader>
          <DialogTitle className="text-lg">Novo Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados do Cliente</p>
          <div className="space-y-1.5">
            <Label className="text-sm">Nome / Razão Social <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ex: Copiadora Brasil Ltda" className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">CPF / CNPJ</Label>
              <Input value={form.cpf_cnpj} onChange={e => update('cpf_cnpj', e.target.value)} placeholder="00.000.000/0001-00" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Contato</Label>
              <Input value={form.main_contact_name} onChange={e => update('main_contact_name', e.target.value)} placeholder="Nome do contato" className="h-11" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Telefone</Label>
              <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(11) 99999-0000" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">E-mail</Label>
              <Input value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@empresa.com" className="h-11" />
            </div>
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Endereço (opcional)</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm">Rua</Label>
              <Input value={form.street} onChange={e => update('street', e.target.value)} placeholder="Rua / Avenida" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Nº</Label>
              <Input value={form.number} onChange={e => update('number', e.target.value)} placeholder="123" className="h-11" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Cidade</Label>
              <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="São Paulo" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Estado</Label>
              <Input value={form.state} onChange={e => update('state', e.target.value)} placeholder="SP" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">CEP</Label>
              <Input value={form.zip} onChange={e => update('zip', e.target.value)} placeholder="00000-000" className="h-11" />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="brand-gradient text-primary-foreground">
            {saving ? 'Salvando...' : 'Cadastrar Cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickCustomerDialog;
