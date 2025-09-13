-- Add delivered_at column to orders table
ALTER TABLE public.orders 
ADD COLUMN delivered_at timestamptz;
