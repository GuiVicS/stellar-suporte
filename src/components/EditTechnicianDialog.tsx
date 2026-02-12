import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet, apiPatch } from '@/integrations/api/client';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface EditTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician: {
    id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

const EditTechnicianDialog = ({ open, onOpenChange, technician }: EditTechnicianDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'tecnico' });
  const queryClient = useQueryClient();

  const { data: userRole } = useQuery({
    queryKey: ['user-role', technician?.user_id],
    queryFn: async () => {
      if (!technician?.user_id) return null;
      // Busca role a partir do endpoint de perfis/técnicos já retornando role
      const profile = await apiGet<any>(`/api/profiles`);
      const match = (profile as any[]).find(p => p.user_id === technician.user_id);
      return match?.role || 'tecnico';
    },
    enabled: !!technician?.user_id && open,
  });

  useEffect(() => {
    if (technician) {
      setForm({
        name: technician.name,
        email: technician.email,
        phone: technician.phone || '',
        role: userRole || 'tecnico',
      });
    }
  }, [technician, userRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!technician) return;

    setLoading(true);
    try {
      await apiPatch(`/api/profiles/${technician.id}`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        role: form.role,
      });

      toast.success('Usuário atualizado!');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['user-role', technician.user_id] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome *</Label>
            <Input id="edit-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={form.email} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefone</Label>
            <Input id="edit-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-0000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Perfil</Label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTechnicianDialog;
