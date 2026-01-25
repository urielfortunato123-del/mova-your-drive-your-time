-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('driver', 'passenger')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'location', 'quick')),
  latitude NUMERIC,
  longitude NUMERIC,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast ride message lookup
CREATE INDEX idx_chat_messages_ride_id ON public.chat_messages(ride_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Drivers can view/send messages for their rides
CREATE POLICY "Users can view messages for their rides"
ON public.chat_messages
FOR SELECT
USING (
  sender_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.driver_profiles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update read status"
ON public.chat_messages
FOR UPDATE
USING (sender_id != auth.uid())
WITH CHECK (sender_id != auth.uid());

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;