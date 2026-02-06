
-- Adicionar campos de pagamento na tabela rides_v2
ALTER TABLE public.rides_v2
ADD COLUMN payment_method text DEFAULT 'cash',
ADD COLUMN payment_status text DEFAULT 'pending',
ADD COLUMN paid_at timestamp with time zone;

-- Comentários explicativos
COMMENT ON COLUMN public.rides_v2.payment_method IS 'Método: credit_card, debit_card, cash, pix';
COMMENT ON COLUMN public.rides_v2.payment_status IS 'Status: pending, paid, failed';
COMMENT ON COLUMN public.rides_v2.paid_at IS 'Quando foi pago (para pix/crédito antecipado)';
