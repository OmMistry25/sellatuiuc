-- Add delivery_notes column to orders table
ALTER TABLE public.orders 
ADD COLUMN delivery_notes text;
