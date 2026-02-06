-- =============================================
-- SISTEMA DE API KEYS PARA ADMIN/INTEGRAÇÕES
-- =============================================

-- 1) Tabela admin_users (quem pode gerenciar API Keys)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'finance', 'support', 'superadmin')),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

-- 2) Tabela api_keys
CREATE TABLE IF NOT EXISTS public.api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    api_key text NOT NULL UNIQUE,
    scope text DEFAULT 'all' CHECK (scope IN ('all', 'finance', 'rides', 'reports', 'readonly')),
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    last_used_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys(api_key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_users_user ON public.admin_users(user_id) WHERE is_active = true;

-- =============================================
-- RLS POLICIES
-- =============================================

-- admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = _user_id
        AND is_active = true
    )
$$;

-- Função para verificar se é superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = _user_id
        AND is_active = true
        AND role = 'superadmin'
    )
$$;

-- Políticas admin_users
CREATE POLICY "Superadmins can manage admin_users"
    ON public.admin_users FOR ALL
    USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Admins can view admin_users"
    ON public.admin_users FOR SELECT
    USING (public.is_admin(auth.uid()));

-- api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view api_keys"
    ON public.api_keys FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Superadmins can manage api_keys"
    ON public.api_keys FOR ALL
    USING (public.is_superadmin(auth.uid()));

-- Trigger para updated_at em admin_users
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();