-- Create storage buckets for the marketplace

-- Create listing-images bucket (public read via signed URL)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images', 
  false, -- private bucket, use signed URLs
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Create delivery-proofs bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'delivery-proofs',
  'delivery-proofs',
  false, -- private bucket
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
);

-- Create chat-attachments bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false, -- private bucket
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain']
);

-- Create barcodes bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'barcodes',
  'barcodes',
  false, -- private bucket
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
);

-- Storage policies for listing-images bucket
create policy "Users can upload listing images" on storage.objects
  for insert with check (
    bucket_id = 'listing-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view listing images" on storage.objects
  for select using (bucket_id = 'listing-images');

create policy "Users can update their own listing images" on storage.objects
  for update using (
    bucket_id = 'listing-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own listing images" on storage.objects
  for delete using (
    bucket_id = 'listing-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for delivery-proofs bucket
create policy "Users can upload delivery proofs" on storage.objects
  for insert with check (
    bucket_id = 'delivery-proofs' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view delivery proofs for their orders" on storage.objects
  for select using (
    bucket_id = 'delivery-proofs' and
    (
      auth.uid()::text = (storage.foldername(name))[1] or
      exists (
        select 1 from public.orders 
        where id::text = (storage.foldername(name))[2]
        and (buyer_id = auth.uid() or seller_id = auth.uid())
      )
    )
  );

-- Storage policies for chat-attachments bucket
create policy "Users can upload chat attachments" on storage.objects
  for insert with check (
    bucket_id = 'chat-attachments' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view chat attachments for their threads" on storage.objects
  for select using (
    bucket_id = 'chat-attachments' and
    exists (
      select 1 from public.threads 
      where id::text = (storage.foldername(name))[2]
      and (buyer_id = auth.uid() or seller_id = auth.uid())
    )
  );

-- Storage policies for barcodes bucket
create policy "Users can upload barcodes" on storage.objects
  for insert with check (
    bucket_id = 'barcodes' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view barcodes for their listings" on storage.objects
  for select using (
    bucket_id = 'barcodes' and
    exists (
      select 1 from public.listings 
      where id::text = (storage.foldername(name))[2]
      and seller_id = auth.uid()
    )
  );
