-- Create listings table
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(user_id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete restrict not null,
  title text not null,
  description text,
  price_cents int, -- for sales
  is_rental boolean default false,
  rental_day_price_cents int, -- null for sales
  rental_deposit_cents int, -- null for sales
  rental_min_days int, -- null for sales
  rental_max_days int, -- null for sales
  condition text check (condition in ('new', 'like_new', 'good', 'fair')) not null,
  quantity int default 1,
  delivery_methods text[] not null default '{}', -- in_person, ticket_transfer, barcode_upload, mail
  campus_location text, -- optional pickup spot
  status text check (status in ('draft', 'active', 'paused', 'sold', 'removed')) default 'draft',
  views int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- Create listing_assets table
create table public.listing_assets (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  kind text check (kind in ('image', 'barcode', 'pdf')) not null,
  path text not null, -- Supabase Storage key
  checksum text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Create tickets_meta table (optional metadata for ticket listings)
create table public.tickets_meta (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  event_title text,
  event_datetime timestamptz,
  section text,
  row text,
  seat text,
  barcode_format text,
  transfer_platform text, -- Ticketmaster, SeatGeek, other
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.listings enable row level security;
alter table public.listing_assets enable row level security;
alter table public.tickets_meta enable row level security;

-- RLS Policies for listings
create policy "Active listings are viewable by everyone" on public.listings
  for select using (status = 'active');

create policy "Users can view their own listings" on public.listings
  for select using (auth.uid() = seller_id);

create policy "Users can insert their own listings" on public.listings
  for insert with check (auth.uid() = seller_id);

create policy "Users can update their own listings" on public.listings
  for update using (auth.uid() = seller_id);

create policy "Users can delete their own listings" on public.listings
  for delete using (auth.uid() = seller_id);

-- RLS Policies for listing_assets
create policy "Listing assets are viewable if listing is visible" on public.listing_assets
  for select using (
    exists (
      select 1 from public.listings 
      where id = listing_id 
      and (status = 'active' or seller_id = auth.uid())
    )
  );

create policy "Users can insert assets for their own listings" on public.listing_assets
  for insert with check (
    exists (
      select 1 from public.listings 
      where id = listing_id 
      and seller_id = auth.uid()
    )
  );

create policy "Users can update assets for their own listings" on public.listing_assets
  for update using (
    exists (
      select 1 from public.listings 
      where id = listing_id 
      and seller_id = auth.uid()
    )
  );

create policy "Users can delete assets for their own listings" on public.listing_assets
  for delete using (
    exists (
      select 1 from public.listings 
      where id = listing_id 
      and seller_id = auth.uid()
    )
  );

-- RLS Policies for tickets_meta
create policy "Tickets meta is viewable if listing is visible" on public.tickets_meta
  for select using (
    exists (
      select 1 from public.listings 
      where id = listing_id 
      and (status = 'active' or seller_id = auth.uid())
    )
  );

create policy "Users can insert tickets meta for their own listings" on public.tickets_meta
  for insert with check (
    exists (
      select 1 from public.listings 
      where id = listing_id 
      and seller_id = auth.uid()
    )
  );

create policy "Users can update tickets meta for their own listings" on public.tickets_meta
  for update using (
    exists (
      select 1 from public.listings 
      where id = listing_id 
      and seller_id = auth.uid()
    )
  );

create policy "Users can delete tickets meta for their own listings" on public.tickets_meta
  for delete using (
    exists (
      select 1 from public.listings 
      where id = listing_id 
      and seller_id = auth.uid()
    )
  );

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.listings
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.tickets_meta
  for each row execute procedure public.handle_updated_at();

-- Create indexes for better performance
create index idx_listings_seller_id on public.listings(seller_id);
create index idx_listings_category_id on public.listings(category_id);
create index idx_listings_status on public.listings(status);
create index idx_listings_created_at on public.listings(created_at desc);
create index idx_listing_assets_listing_id on public.listing_assets(listing_id);
create index idx_tickets_meta_listing_id on public.tickets_meta(listing_id);
