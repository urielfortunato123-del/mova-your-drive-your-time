-- MOVA Premium Tables

-- Add premium fields to driver_profiles
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS plano text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS premium_status text DEFAULT 'inativo',
ADD COLUMN IF NOT EXISTS premium_inicio timestamp with time zone;

-- Monthly goals tracking table
CREATE TABLE public.premium_monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
  month_year text NOT NULL, -- Format: "2026-01"
  corridas_mes integer DEFAULT 0,
  horas_logadas_mes numeric(10,2) DEFAULT 0,
  litros_combustivel_mes numeric(10,2) DEFAULT 0,
  gasto_manutencao_mes numeric(10,2) DEFAULT 0,
  seguro_ativo boolean DEFAULT false,
  bonus_status text DEFAULT 'em_progresso', -- em_progresso, liberado, nao_liberado
  bonus_valor numeric(10,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(driver_id, month_year)
);

-- Premium history table
CREATE TABLE public.premium_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  metas_atingidas boolean DEFAULT false,
  bonus_recebido numeric(10,2) DEFAULT 0,
  status_final text DEFAULT 'pendente', -- pendente, aprovado, reprovado
  corridas_total integer DEFAULT 0,
  horas_total numeric(10,2) DEFAULT 0,
  litros_total numeric(10,2) DEFAULT 0,
  manutencao_total numeric(10,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(driver_id, month_year)
);

-- Premium partners table
CREATE TABLE public.premium_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL, -- posto, oficina, banco
  nome text NOT NULL,
  endereco text,
  cidade text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  servicos text[], -- Array of services
  tag text, -- "Conta para o bônus", "Obrigatório para o Premium"
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.premium_monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_partners ENABLE ROW LEVEL SECURITY;

-- RLS policies for premium_monthly_goals
CREATE POLICY "Drivers can view their own goals"
ON public.premium_monthly_goals FOR SELECT
USING (driver_id IN (SELECT id FROM public.driver_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can insert their own goals"
ON public.premium_monthly_goals FOR INSERT
WITH CHECK (driver_id IN (SELECT id FROM public.driver_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can update their own goals"
ON public.premium_monthly_goals FOR UPDATE
USING (driver_id IN (SELECT id FROM public.driver_profiles WHERE user_id = auth.uid()));

-- RLS policies for premium_history
CREATE POLICY "Drivers can view their own history"
ON public.premium_history FOR SELECT
USING (driver_id IN (SELECT id FROM public.driver_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can insert their own history"
ON public.premium_history FOR INSERT
WITH CHECK (driver_id IN (SELECT id FROM public.driver_profiles WHERE user_id = auth.uid()));

-- RLS policies for premium_partners (public read)
CREATE POLICY "Anyone can view active partners"
ON public.premium_partners FOR SELECT
USING (is_active = true);

-- Update trigger for premium_monthly_goals
CREATE TRIGGER update_premium_monthly_goals_updated_at
BEFORE UPDATE ON public.premium_monthly_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample premium partners
INSERT INTO public.premium_partners (tipo, nome, endereco, cidade, servicos, tag, latitude, longitude) VALUES
('posto', 'Posto Shell Centro', 'Av. Paulista, 1000', 'São Paulo', ARRAY['Gasolina', 'Etanol', 'Diesel'], 'Conta para o bônus', -23.5629, -46.6544),
('posto', 'Posto Ipiranga Sul', 'Rua Augusta, 500', 'São Paulo', ARRAY['Gasolina', 'Etanol', 'GNV'], 'Conta para o bônus', -23.5519, -46.6556),
('oficina', 'Auto Center Premium', 'Rua Oscar Freire, 200', 'São Paulo', ARRAY['Troca de óleo', 'Alinhamento', 'Balanceamento'], 'Conta para o bônus', -23.5609, -46.6689),
('oficina', 'Mecânica Express', 'Av. Rebouças, 800', 'São Paulo', ARRAY['Revisão completa', 'Freios', 'Suspensão'], 'Conta para o bônus', -23.5649, -46.6789),
('banco', 'Bradesco S.A.', 'Av. Paulista, 1450', 'São Paulo', ARRAY['Seguro veicular', 'Conta PJ/MEI', 'Financiamento'], 'Obrigatório para o Premium', -23.5617, -46.6558);