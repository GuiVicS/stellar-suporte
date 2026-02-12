import React, { useState } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import AvatarUpload from '@/components/AvatarUpload';
import CreateTechnicianDialog from '@/components/CreateTechnicianDialog';
import EditTechnicianDialog from '@/components/EditTechnicianDialog';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { apiPatch } from '@/integrations/api/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const TechniciansPage = () => {
  const { data: profiles = [], isLoading: loadingProfiles } = useProfiles();
  const { data: orders = [], isLoading: loadingOrders } = useServiceOrders();
  const queryClient = useQueryClient();

  const [editTech, setEditTech] = useState<any>(null);
  const [deleteTech, setDeleteTech] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const isLoading = loadingProfiles || loadingOrders;
  const technicians = profiles.filter(p => p.active);

  const handleDelete = async () => {
    if (!deleteTech) return;
    setDeleting(true);
    try {
      await apiPatch(`/api/profiles/${deleteTech.id}`, { active: false });
      toast.success('Usuário desativado com sucesso');
      setDeleteTech(null);
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao desativar');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Técnicos</h1>
        <CreateTechnicianDialog />
      </div>
      {technicians.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p>Nenhum técnico cadastrado</p>
        </Card>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.map(tech => {
          const techOrders = orders.filter(o => o.technician_id === tech.user_id);
          const done = techOrders.filter(o => o.status === 'concluido').length;
          const active = techOrders.some(o => ['em_deslocamento', 'em_atendimento'].includes(o.status));
          return (
            <Card key={tech.id} className="p-5 shadow-card border-border/50 relative group">
              {/* Actions menu */}
              <div className="absolute top-3 right-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditTech(tech)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTech(tech)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Desativar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <AvatarUpload
                  currentUrl={tech.avatar_url}
                  userId={tech.user_id}
                  name={tech.name}
                  size="md"
                />
                <div>
                  <div className="font-semibold">{tech.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {active && <span className="w-2 h-2 rounded-full bg-status-active animate-pulse-dot" />}
                    {active ? 'Em atendimento' : 'Disponível'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded-lg p-2">
                  <div className="text-lg font-bold">{techOrders.length}</div>
                  <div className="text-[10px] text-muted-foreground">Total</div>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <div className="text-lg font-bold text-status-done">{done}</div>
                  <div className="text-[10px] text-muted-foreground">Feitas</div>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <div className="text-lg font-bold">{techOrders.length - done}</div>
                  <div className="text-[10px] text-muted-foreground">Pendentes</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <EditTechnicianDialog
        open={!!editTech}
        onOpenChange={(open) => !open && setEditTech(null)}
        technician={editTech}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTech} onOpenChange={(open) => !open && setDeleteTech(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar <strong>{deleteTech?.name}</strong>? O usuário não aparecerá mais na lista, mas seus dados serão preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TechniciansPage;
