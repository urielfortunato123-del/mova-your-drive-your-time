-- Create rides table for storing real ride data
CREATE TABLE public.rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT,
  pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed',
  waiting_time INTEGER DEFAULT 0, -- in minutes
  waiting_value NUMERIC DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Drivers can view their own rides"
  ON public.rides
  FOR SELECT
  USING (driver_id IN (
    SELECT id FROM driver_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Drivers can insert their own rides"
  ON public.rides
  FOR INSERT
  WITH CHECK (driver_id IN (
    SELECT id FROM driver_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Drivers can update their own rides"
  ON public.rides
  FOR UPDATE
  USING (driver_id IN (
    SELECT id FROM driver_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Drivers can delete their own rides"
  ON public.rides
  FOR DELETE
  USING (driver_id IN (
    SELECT id FROM driver_profiles WHERE user_id = auth.uid()
  ));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX idx_rides_pickup_time ON public.rides(pickup_time);
CREATE INDEX idx_rides_status ON public.rides(status);