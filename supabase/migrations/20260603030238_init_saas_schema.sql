-- 1. Criação das Tabelas

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stripe_customer_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_members_role_check CHECK (role IN ('owner', 'admin', 'member')),
  CONSTRAINT organization_members_org_user_key UNIQUE (organization_id, user_id)
);

-- 2. Funções Auxiliares para Evitar Recursão Infinita nas Políticas de RLS

CREATE OR REPLACE FUNCTION public.is_organization_member(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = $2
  );
$$;

CREATE OR REPLACE FUNCTION public.is_organization_admin_or_owner(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = $2 AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_organization_owner(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = $2 AND role = 'owner'
  );
$$;

-- 3. Habilitar o Row Level Security (RLS)

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS para a Tabela organizations

CREATE POLICY "Allow members to view organization"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (public.is_organization_member(id, auth.uid()));

CREATE POLICY "Allow authenticated users to create organizations"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow admins and owners to update organization"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (public.is_organization_admin_or_owner(id, auth.uid()));

CREATE POLICY "Allow owners to delete organization"
  ON public.organizations
  FOR DELETE
  TO authenticated
  USING (public.is_organization_owner(id, auth.uid()));

-- 5. Políticas de RLS para a Tabela organization_members

CREATE POLICY "Allow members to view organization members"
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (public.is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Allow admins and owners to add members"
  ON public.organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_organization_admin_or_owner(organization_id, auth.uid()));

CREATE POLICY "Allow admins and owners to update member roles"
  ON public.organization_members
  FOR UPDATE
  TO authenticated
  USING (public.is_organization_admin_or_owner(organization_id, auth.uid()));

CREATE POLICY "Allow admins/owners to remove members, and members to remove themselves"
  ON public.organization_members
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_organization_admin_or_owner(organization_id, auth.uid())
  );

-- 6. Gatilhos de Automação para Criação de Organização no Sign Up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_name text;
  new_org_id uuid;
BEGIN
  -- Tenta buscar o nome nos metadados do usuário
  org_name := NEW.raw_user_meta_data->>'name';
  IF org_name IS NULL OR org_name = '' THEN
    org_name := NEW.raw_user_meta_data->>'full_name';
  END IF;

  -- Fallback extraindo a parte do e-mail antes do '@'
  IF org_name IS NULL OR org_name = '' THEN
    org_name := split_part(NEW.email, '@', 1);
  END IF;

  -- Fallback secundário de segurança
  IF org_name IS NULL OR org_name = '' THEN
    org_name := 'Usuario';
  END IF;

  -- 1. Cria a organização padrão do novo usuário
  INSERT INTO public.organizations (name)
  VALUES ('Organização de ' || org_name)
  RETURNING id INTO new_org_id;

  -- 2. Insere o novo usuário como 'owner' da organização recém-criada
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
