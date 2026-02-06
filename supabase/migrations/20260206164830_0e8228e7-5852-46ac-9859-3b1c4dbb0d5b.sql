-- =============================================
-- SCHEMA COMPLETO PARA CONECTAR PASSENGER + DRIVER
-- =============================================

-- 1) Tabela users_profile (perfil unificado para passageiros e motoristas)
CREATE TABLE IF NOT EXISTS public.users_profile (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('passenger', 'driver')),
    full_name text NOT NULL,
    phone text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 2) Tabela driver_profiles_v2 (dados específicos do motorista - nova versão)
CREATE TABLE IF NOT EXISTS public.driver_profiles_v2 (
    user_id uuid PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
    is_online boolean DEFAULT false NOT NULL,
    last_lat double precision,
    last_lng double precision,
    last_seen timestamptz,
    vehicle_plate text,
    vehicle_model text,
    vehicle_year int,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 3) Tabela rides_v2 (corridas com novo fluxo)
CREATE TABLE IF NOT EXISTS public.rides_v2 (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id uuid NOT NULL REFERENCES public.users_profile(id),
    driver_id uuid REFERENCES public.users_profile(id),
    status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    origin_lat double precision NOT NULL,
    origin_lng double precision NOT NULL,
    origin_address text NOT NULL,
    dest_lat double precision NOT NULL,
    dest_lng double precision NOT NULL,
    dest_address text NOT NULL,
    scheduled_for timestamptz,
    price_cents int DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 4) Tabela ride_events (auditoria)
CREATE TABLE IF NOT EXISTS public.ride_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id uuid NOT NULL REFERENCES public.rides_v2(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    payload jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 5) Tabela ride_offers (ofertas para motoristas)
CREATE TABLE IF NOT EXISTS public.ride_offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id uuid NOT NULL REFERENCES public.rides_v2(id) ON DELETE CASCADE,
    driver_id uuid NOT NULL REFERENCES public.users_profile(id),
    status text NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'ACCEPTED', 'EXPIRED')),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_rides_v2_passenger ON public.rides_v2(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_v2_driver ON public.rides_v2(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_v2_status ON public.rides_v2(status);
CREATE INDEX IF NOT EXISTS idx_ride_offers_driver_status ON public.ride_offers(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_ride_offers_ride ON public.ride_offers(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_events_ride ON public.ride_events(ride_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_v2_online ON public.driver_profiles_v2(is_online) WHERE is_online = true;

-- =============================================
-- TRIGGER para updated_at em rides_v2
-- =============================================
CREATE OR REPLACE FUNCTION public.update_rides_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_rides_v2_updated_at ON public.rides_v2;
CREATE TRIGGER update_rides_v2_updated_at
    BEFORE UPDATE ON public.rides_v2
    FOR EACH ROW
    EXECUTE FUNCTION public.update_rides_v2_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

-- users_profile
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.users_profile FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users_profile FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.users_profile FOR INSERT
    WITH CHECK (auth.uid() = id);

-- driver_profiles_v2
ALTER TABLE public.driver_profiles_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own profile"
    ON public.driver_profiles_v2 FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update own profile"
    ON public.driver_profiles_v2 FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Drivers can insert own profile"
    ON public.driver_profiles_v2 FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- rides_v2
ALTER TABLE public.rides_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passengers can view own rides"
    ON public.rides_v2 FOR SELECT
    USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view assigned rides"
    ON public.rides_v2 FOR SELECT
    USING (auth.uid() = driver_id);

CREATE POLICY "Passengers can insert rides"
    ON public.rides_v2 FOR INSERT
    WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Passengers can cancel before accepted"
    ON public.rides_v2 FOR UPDATE
    USING (auth.uid() = passenger_id AND status IN ('REQUESTED', 'MATCHING'));

CREATE POLICY "Drivers can update assigned rides"
    ON public.rides_v2 FOR UPDATE
    USING (auth.uid() = driver_id);

-- ride_offers
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own offers"
    ON public.ride_offers FOR SELECT
    USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can accept own offers"
    ON public.ride_offers FOR UPDATE
    USING (auth.uid() = driver_id AND status = 'SENT');

-- ride_events
ALTER TABLE public.ride_events ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é participante da corrida
CREATE OR REPLACE FUNCTION public.is_ride_participant(ride_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.rides_v2
        WHERE id = ride_uuid
        AND (passenger_id = auth.uid() OR driver_id = auth.uid())
    )
$$;

CREATE POLICY "Participants can view ride events"
    ON public.ride_events FOR SELECT
    USING (public.is_ride_participant(ride_id));

-- =============================================
-- REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_profiles_v2;