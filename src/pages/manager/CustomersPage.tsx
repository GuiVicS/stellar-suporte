import React, { useState } from 'react';
import { useCustomers, useCustomerAddresses, useMachines } from '@/hooks/useCustomers';
import { apiPost } from '@/integrations/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Search, Building2, Phone, Mail, MapPin, Cpu,
  ChevronRight, User, Upload,
} from 'lucide-react';
import ImportCustomersDialog from '@/components/ImportCustomersDialog';
import { cn } from '@/lib/utils';

/* ─── New Customer Dialog ─── */
const NewCustomerDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', cpf_cnpj: '', main_contact_name: '', phone: '', email: '',
    street: '', number: '', city: '', state: '', zip: '',
  });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

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

      qc.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Cliente cadastrado!' });
      setForm({ name: '', cpf_cnpj: '', main_contact_name: '', phone: '', email: '', street: '', number: '', city: '', state: '', zip: '' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Novo Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Basic info */}
          <div className="space-y-3">
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
                <Label className="text-sm">Contato Principal</Label>
                <Input value={form.main_contact_name} onChange={e => update('main_contact_name', e.target.value)} placeholder="João Silva" className="h-11" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Telefone</Label>
                <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(11) 99999-0000" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">E-mail</Label>
                <Input value={form.email} onChange={e => update('email', e.target.value)} placeholder="contato@empresa.com" className="h-11" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço Principal</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm">Rua</Label>
                <Input value={form.street} onChange={e => update('street', e.target.value)} placeholder="Av. Paulista" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Nº</Label>
                <Input value={form.number} onChange={e => update('number', e.target.value)} placeholder="1000" className="h-11" />
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
                <Input value={form.zip} onChange={e => update('zip', e.target.value)} placeholder="01310-100" className="h-11" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Add Machine Dialog ─── */
const AddMachineDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: string;
}> = ({ open, onOpenChange, customerId }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ model: '', serial_number: '', notes: '' });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.model.trim()) {
      toast({ title: 'Informe o modelo', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await apiPost(`/api/customers/${customerId}/machines`, {
        model: form.model.trim(),
        serial_number: form.serial_number.trim(),
        notes: form.notes.trim(),
      });
      qc.invalidateQueries({ queryKey: ['machines', customerId] });
      toast({ title: 'Máquina adicionada!' });
      setForm({ model: '', serial_number: '', notes: '' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Máquina</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Modelo <span className="text-destructive">*</span></Label>
            <Input value={form.model} onChange={e => update('model', e.target.value)} placeholder="Ex: Ricoh MP 2555" className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Nº de Série</Label>
            <Input value={form.serial_number} onChange={e => update('serial_number', e.target.value)} placeholder="ABC123456" className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Observações</Label>
            <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Localização, andar, setor..." rows={2} className="resize-none text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Adicionar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Customer Detail Panel ─── */
const CustomerDetail: React.FC<{ customerId: string }> = ({ customerId }) => {
  const { data: addresses } = useCustomerAddresses(customerId);
  const { data: machines } = useMachines(customerId);
  const [machineOpen, setMachineOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Addresses */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Endereços</p>
        {(!addresses || addresses.length === 0) ? (
          <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado</p>
        ) : (
          <div className="space-y-2">
            {addresses.map(a => (
              <div key={a.id} className="flex items-start gap-2 text-sm bg-muted/50 rounded-lg p-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">{a.label || 'Endereço'}</span>
                  <p className="text-muted-foreground">
                    {a.street}{a.number ? `, ${a.number}` : ''} — {a.city}{a.state ? `/${a.state}` : ''}
                    {a.zip ? ` • ${a.zip}` : ''}
                  </p>
                </div>
                {a.is_default && <Badge variant="secondary" className="ml-auto text-[10px]">Padrão</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Machines */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Máquinas / Equipamentos</p>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setMachineOpen(true)}>
            <Plus className="w-3 h-3" /> Adicionar
          </Button>
        </div>
        {(!machines || machines.length === 0) ? (
          <p className="text-sm text-muted-foreground">Nenhuma máquina cadastrada</p>
        ) : (
          <div className="space-y-2">
            {machines.map(m => (
              <div key={m.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-3">
                <Cpu className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{m.model}</span>
                  {m.serial_number && <span className="text-muted-foreground ml-2">• {m.serial_number}</span>}
                  {m.notes && <p className="text-xs text-muted-foreground truncate">{m.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddMachineDialog open={machineOpen} onOpenChange={setMachineOpen} customerId={customerId} />
    </div>
  );
};

/* ─── Main Page ─── */
const CustomersPage = () => {
  const { data: customers, isLoading } = useCustomers();
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = (customers || []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.cpf_cnpj || '').includes(search) ||
    (c.phone || '').includes(search)
  );

  const selected = filtered.find(c => c.id === selectedId);

  return (
    <div className="p-4 lg:p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} cliente{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-1.5">
            <Upload className="w-4 h-4" /> Importar
          </Button>
          <Button onClick={() => setNewOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CNPJ ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      {/* Content: list + detail */}
      <div className="flex gap-4 h-[calc(100%-140px)]">
        {/* Customer list */}
        <div className="w-full lg:w-1/2 xl:w-2/5 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
            </div>
          ) : (
            filtered.map(c => (
              <Card
                key={c.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedId === c.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedId(c.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                      {c.cpf_cnpj && <span>{c.cpf_cnpj}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="hidden lg:block flex-1 overflow-y-auto">
          {selected ? (
            <Card className="h-full">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{selected.name}</h2>
                    {selected.cpf_cnpj && <p className="text-sm text-muted-foreground">{selected.cpf_cnpj}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {selected.main_contact_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{selected.main_contact_name}</span>
                    </div>
                  )}
                  {selected.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selected.phone}</span>
                    </div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-2 text-sm col-span-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selected.email}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4">
                  <CustomerDetail customerId={selected.id} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Selecione um cliente para ver detalhes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewCustomerDialog open={newOpen} onOpenChange={setNewOpen} />
      <ImportCustomersDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};

export default CustomersPage;
