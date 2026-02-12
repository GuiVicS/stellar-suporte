export type UserRole = 'admin' | 'gerente' | 'tecnico';

export type OSType = 'instalacao' | 'corretiva' | 'preventiva' | 'treinamento';

export type OSStatus = 'a_fazer' | 'em_deslocamento' | 'em_atendimento' | 'aguardando_peca' | 'concluido' | 'cancelado';

export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';

export type EvidenceKind = 'photo' | 'audio' | 'file';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  avatar?: string;
  created_at: string;
}

export interface TechnicianProfile {
  user_id: string;
  region: string;
  skills: string[];
  work_hours: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  cpf_cnpj: string;
  main_contact_name: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  street: string;
  number: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
  is_default: boolean;
}

export interface Machine {
  id: string;
  customer_id: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  warranty_until: string;
  notes?: string;
}

export interface ServiceOrder {
  id: string;
  code: string;
  customer_id: string;
  customer?: Customer;
  address_id: string;
  address?: CustomerAddress;
  machine_id: string;
  machine?: Machine;
  technician_id: string | null;
  technician?: User;
  type: OSType;
  priority: Priority;
  status: OSStatus;
  scheduled_start: string;
  scheduled_end: string;
  estimated_duration_min: number;
  actual_departure_at?: string;
  arrived_at?: string;
  started_at?: string;
  finished_at?: string;
  problem_description: string;
  diagnosis?: string;
  resolution?: string;
  next_steps?: string;
  customer_signature_name?: string;
  customer_signature_doc?: string;
  customer_signature_image?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  os_id: string;
  label: string;
  checked: boolean;
  note?: string;
  checked_at?: string;
  required: boolean;
}

export interface Evidence {
  id: string;
  os_id: string;
  kind: EvidenceKind;
  file_url: string;
  thumb_url?: string;
  created_at: string;
  created_by: string;
}

export interface PartUsed {
  id: string;
  os_id: string;
  part_name: string;
  quantity: number;
  note?: string;
  created_at: string;
}

export interface TimelineComment {
  id: string;
  os_id: string;
  kind: 'system' | 'user';
  message: string;
  created_at: string;
  created_by?: string;
}

// UI Helpers
export const OS_TYPE_LABELS: Record<OSType, string> = {
  instalacao: 'Instalação',
  corretiva: 'Corretiva',
  preventiva: 'Preventiva',
  treinamento: 'Treinamento',
};

export const OS_STATUS_LABELS: Record<OSStatus, string> = {
  a_fazer: 'A Fazer',
  em_deslocamento: 'Em Deslocamento',
  em_atendimento: 'Em Atendimento',
  aguardando_peca: 'Aguardando Peça',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const OS_STATUS_COLORS: Record<OSStatus, string> = {
  a_fazer: 'bg-status-pending text-status-pending-foreground',
  em_deslocamento: 'bg-status-transit text-status-transit-foreground',
  em_atendimento: 'bg-status-active text-status-active-foreground',
  aguardando_peca: 'bg-status-waiting text-status-waiting-foreground',
  concluido: 'bg-status-done text-status-done-foreground',
  cancelado: 'bg-status-cancelled text-status-cancelled-foreground',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  baixa: 'bg-priority-low/15 text-priority-low',
  media: 'bg-priority-medium/15 text-priority-medium',
  alta: 'bg-priority-high/15 text-priority-high',
  urgente: 'bg-priority-urgent/15 text-priority-urgent',
};
