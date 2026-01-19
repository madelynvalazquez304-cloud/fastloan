-- Create table for storing M-Pesa transaction callbacks
CREATE TABLE public.mpesa_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_request_id TEXT NOT NULL UNIQUE,
  merchant_request_id TEXT,
  result_code TEXT,
  result_desc TEXT,
  callback_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;

-- Allow the service role to insert/update (for edge function callbacks)
-- No public access needed as this is only accessed by edge functions

-- Create index for faster lookups
CREATE INDEX idx_mpesa_transactions_checkout_id ON public.mpesa_transactions(checkout_request_id);
CREATE INDEX idx_mpesa_transactions_created_at ON public.mpesa_transactions(created_at DESC);