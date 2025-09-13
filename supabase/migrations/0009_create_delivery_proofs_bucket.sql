-- Create delivery-proofs storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'delivery-proofs',
  'delivery-proofs',
  false, -- Private bucket for security
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for delivery-proofs bucket
CREATE POLICY "Users can upload delivery proofs for their orders" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'delivery-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view delivery proofs for their orders" ON storage.objects
FOR SELECT USING (
  bucket_id = 'delivery-proofs' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    auth.uid()::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Users can update delivery proofs for their orders" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'delivery-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete delivery proofs for their orders" ON storage.objects
FOR DELETE USING (
  bucket_id = 'delivery-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
