-- Fix storage policies to be less restrictive

-- Drop existing policies
drop policy if exists "Users can upload listing images" on storage.objects;
drop policy if exists "Users can update their own listing images" on storage.objects;
drop policy if exists "Users can delete their own listing images" on storage.objects;

-- Create new, more permissive policies for listing-images
create policy "Users can upload listing images" on storage.objects
  for insert with check (
    bucket_id = 'listing-images' and
    auth.uid() is not null
  );

create policy "Users can update their own listing images" on storage.objects
  for update using (
    bucket_id = 'listing-images' and
    auth.uid() is not null
  );

create policy "Users can delete their own listing images" on storage.objects
  for delete using (
    bucket_id = 'listing-images' and
    auth.uid() is not null
  );
