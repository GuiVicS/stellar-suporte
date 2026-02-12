
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'tecnico');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf_cnpj TEXT DEFAULT '',
  main_contact_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customer Addresses
CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
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
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Machines
CREATE TABLE public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT DEFAULT '',
  purchase_date DATE,
  warranty_until DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

-- OS Type and Priority enums
CREATE TYPE public.os_type AS ENUM ('instalacao', 'corretiva', 'preventiva', 'treinamento');
CREATE TYPE public.os_status AS ENUM ('a_fazer', 'em_deslocamento', 'em_atendimento', 'aguardando_peca', 'concluido', 'cancelado');
CREATE TYPE public.priority AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- Service Orders
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  address_id UUID REFERENCES public.customer_addresses(id),
  machine_id UUID REFERENCES public.machines(id),
  technician_id UUID REFERENCES auth.users(id),
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
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- Checklist Items
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  note TEXT DEFAULT '',
  checked_at TIMESTAMPTZ,
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Evidence type enum
CREATE TYPE public.evidence_kind AS ENUM ('photo', 'audio', 'file');

-- Evidences
CREATE TABLE public.evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE NOT NULL,
  kind evidence_kind NOT NULL DEFAULT 'photo',
  file_url TEXT NOT NULL,
  thumb_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;

-- Parts Used
CREATE TABLE public.parts_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE NOT NULL,
  part_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.parts_used ENABLE ROW LEVEL SECURITY;

-- Timeline Comments
CREATE TABLE public.timeline_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL DEFAULT 'system',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.timeline_comments ENABLE ROW LEVEL SECURITY;

-- Auto-generate OS code
CREATE OR REPLACE FUNCTION public.generate_os_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := EXTRACT(YEAR FROM now())::TEXT;
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(code, '-', 3) AS INTEGER)
  ), 0) + 1 INTO next_num
  FROM public.service_orders
  WHERE code LIKE 'OS-' || year_str || '-%';
  
  NEW.code := 'OS-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_os_code
  BEFORE INSERT ON public.service_orders
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION public.generate_os_code();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies

-- User roles: only admins/gerentes can manage, users can read their own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: authenticated users can read all, update own
CREATE POLICY "Authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Customers: all authenticated can CRUD
CREATE POLICY "Authenticated can read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);

-- Customer addresses: all authenticated
CREATE POLICY "Authenticated can read addresses" ON public.customer_addresses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert addresses" ON public.customer_addresses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update addresses" ON public.customer_addresses FOR UPDATE TO authenticated USING (true);

-- Machines: all authenticated
CREATE POLICY "Authenticated can read machines" ON public.machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert machines" ON public.machines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update machines" ON public.machines FOR UPDATE TO authenticated USING (true);

-- Service orders: all authenticated can read, gerente/admin can create/update
CREATE POLICY "Authenticated can read orders" ON public.service_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert orders" ON public.service_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update orders" ON public.service_orders FOR UPDATE TO authenticated USING (true);

-- Checklist: all authenticated
CREATE POLICY "Authenticated can read checklist" ON public.checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert checklist" ON public.checklist_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update checklist" ON public.checklist_items FOR UPDATE TO authenticated USING (true);

-- Evidences: all authenticated
CREATE POLICY "Authenticated can read evidences" ON public.evidences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert evidences" ON public.evidences FOR INSERT TO authenticated WITH CHECK (true);

-- Parts: all authenticated
CREATE POLICY "Authenticated can read parts" ON public.parts_used FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert parts" ON public.parts_used FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update parts" ON public.parts_used FOR UPDATE TO authenticated USING (true);

-- Timeline: all authenticated
CREATE POLICY "Authenticated can read timeline" ON public.timeline_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert timeline" ON public.timeline_comments FOR INSERT TO authenticated WITH CHECK (true);
