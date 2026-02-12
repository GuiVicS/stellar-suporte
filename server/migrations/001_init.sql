-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Usuários e perfis básicos (substitui auth.users do Supabase)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Papéis (tabela de referência)
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Tipo enum para papéis
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'gerente', 'tecnico');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf_cnpj TEXT DEFAULT '',
  main_contact_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Endereços de clientes
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Principal',
  street TEXT NOT NULL,
  number TEXT DEFAULT '',
  city TEXT NOT NULL,
  state TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Máquinas
CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  serial_number TEXT DEFAULT '',
  purchase_date DATE,
  warranty_until DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enums de OS
DO $$ BEGIN
  CREATE TYPE os_type AS ENUM ('instalacao', 'corretiva', 'preventiva', 'treinamento');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE os_status AS ENUM ('a_fazer', 'em_deslocamento', 'em_atendimento', 'aguardando_peca', 'concluido', 'cancelado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE priority AS ENUM ('baixa', 'media', 'alta', 'urgente');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Ordens de serviço
CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  address_id UUID REFERENCES customer_addresses(id),
  machine_id UUID REFERENCES machines(id),
  technician_id UUID REFERENCES users(id),
  type os_type NOT NULL DEFAULT 'corretiva',
  priority priority NOT NULL DEFAULT 'media',
  status os_status NOT NULL DEFAULT 'a_fazer',
  scheduled_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_end TIMESTAMPTZ,
  estimated_duration_min INTEGER DEFAULT 60,
  actual_departure_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  problem_description TEXT NOT NULL DEFAULT '',
  diagnosis TEXT DEFAULT '',
  resolution TEXT DEFAULT '',
  next_steps TEXT DEFAULT '',
  customer_signature_name TEXT DEFAULT '',
  customer_signature_doc TEXT DEFAULT '',
  customer_signature_image TEXT DEFAULT '',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Checklist
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  note TEXT DEFAULT '',
  checked_at TIMESTAMPTZ,
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Evidências
DO $$ BEGIN
  CREATE TYPE evidence_kind AS ENUM ('photo', 'audio', 'file');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  kind evidence_kind NOT NULL DEFAULT 'photo',
  file_url TEXT NOT NULL,
  thumb_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Peças utilizadas
CREATE TABLE IF NOT EXISTS parts_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Timeline
CREATE TABLE IF NOT EXISTS timeline_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'system',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Função para gerar código de OS
CREATE OR REPLACE FUNCTION generate_os_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := EXTRACT(YEAR FROM now())::TEXT;
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(code, '-', 3) AS INTEGER)
  ), 0) + 1 INTO next_num
  FROM service_orders
  WHERE code LIKE 'OS-' || year_str || '-%';

  NEW.code := 'OS-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_os_code
  BEFORE INSERT ON service_orders
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION generate_os_code();

-- Função de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON service_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

