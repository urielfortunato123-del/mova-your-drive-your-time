-- Add telefonia fields to driver_profiles
ALTER TABLE public.driver_profiles
ADD COLUMN operadora text DEFAULT NULL;

-- Add telefonia fields to premium_monthly_goals
ALTER TABLE public.premium_monthly_goals
ADD COLUMN meta_telefonia boolean DEFAULT false,
ADD COLUMN horas_app_mes numeric DEFAULT 0;

-- Add telefonia field to premium_history
ALTER TABLE public.premium_history
ADD COLUMN beneficio_telefonia boolean DEFAULT false,
ADD COLUMN bonus_telefonia numeric DEFAULT 0;