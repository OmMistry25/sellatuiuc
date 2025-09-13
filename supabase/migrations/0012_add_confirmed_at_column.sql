-- Add confirmed_at column to orders table
ALTER TABLE public.orders 
ADD COLUMN confirmed_at timestamptz;
