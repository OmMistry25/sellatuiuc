-- Create orders table
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references public.profiles(user_id) on delete cascade not null,
  seller_id uuid references public.profiles(user_id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete restrict not null,
  type text check (type in ('buy', 'rent')) not null,
  quantity int not null default 1,
  rental_start date, -- null for purchases
  rental_end date, -- null for purchases
  subtotal_cents int not null,
  fees_cents int not null,
  deposit_cents int, -- null for purchases
  total_cents int not null,
  stripe_payment_intent_id text,
  state text check (state in (
    'initiated', 
    'seller_accept', 
    'delivering', 
    'delivered_pending_confirm', 
    'completed', 
    'cancelled', 
    'disputed'
  )) default 'initiated',
  delivery_method text not null,
  delivery_proof_path text, -- storage key
  auto_release_at timestamptz, -- T+48h for auto release
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- Create order_events table for audit trail
create table public.order_events (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  actor uuid references auth.users(id) not null,
  type text check (type in (
    'created', 
    'authorized', 
    'accepted', 
    'proof_uploaded', 
    'confirmed', 
    'auto_released', 
    'cancelled', 
    'disputed', 
    'refunded', 
    'payout_sent'
  )) not null,
  data jsonb,
  created_at timestamptz default now()
);

-- Create payouts table
create table public.payouts (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  seller_id uuid references public.profiles(user_id) on delete cascade not null,
  amount_cents int not null,
  stripe_transfer_id text,
  status text check (status in ('pending', 'paid', 'failed')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create refunds table
create table public.refunds (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  stripe_refund_id text not null,
  amount_cents int not null,
  created_at timestamptz default now()
);

-- Create disputes table
create table public.disputes (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  opened_by uuid references auth.users(id) not null,
  reason text not null,
  state text check (state in (
    'open', 
    'needs_more_info', 
    'resolved_refund', 
    'resolved_release', 
    'admin_only'
  )) default 'open',
  resolution text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.payouts enable row level security;
alter table public.refunds enable row level security;
alter table public.disputes enable row level security;

-- RLS Policies for orders
create policy "Users can view their own orders" on public.orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Users can insert orders as buyer" on public.orders
  for insert with check (auth.uid() = buyer_id);

create policy "Users can update their own orders" on public.orders
  for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- RLS Policies for order_events
create policy "Users can view events for their orders" on public.order_events
  for select using (
    exists (
      select 1 from public.orders 
      where id = order_id 
      and (buyer_id = auth.uid() or seller_id = auth.uid())
    )
  );

create policy "Users can insert events for their orders" on public.order_events
  for insert with check (
    exists (
      select 1 from public.orders 
      where id = order_id 
      and (buyer_id = auth.uid() or seller_id = auth.uid())
    )
  );

-- RLS Policies for payouts
create policy "Users can view their own payouts" on public.payouts
  for select using (auth.uid() = seller_id);

-- RLS Policies for refunds
create policy "Users can view refunds for their orders" on public.refunds
  for select using (
    exists (
      select 1 from public.orders 
      where id = order_id 
      and (buyer_id = auth.uid() or seller_id = auth.uid())
    )
  );

-- RLS Policies for disputes
create policy "Users can view disputes for their orders" on public.disputes
  for select using (
    exists (
      select 1 from public.orders 
      where id = order_id 
      and (buyer_id = auth.uid() or seller_id = auth.uid())
    ) or
    exists (
      select 1 from public.admin_users 
      where user_id = auth.uid()
    )
  );

create policy "Users can create disputes for their orders" on public.disputes
  for insert with check (
    exists (
      select 1 from public.orders 
      where id = order_id 
      and (buyer_id = auth.uid() or seller_id = auth.uid())
    )
  );

create policy "Admins can update disputes" on public.disputes
  for update using (
    exists (
      select 1 from public.admin_users 
      where user_id = auth.uid()
    )
  );

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.orders
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.payouts
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.disputes
  for each row execute procedure public.handle_updated_at();

-- Create indexes for better performance
create index idx_orders_buyer_id on public.orders(buyer_id);
create index idx_orders_seller_id on public.orders(seller_id);
create index idx_orders_listing_id on public.orders(listing_id);
create index idx_orders_state on public.orders(state);
create index idx_orders_auto_release_at on public.orders(auto_release_at);
create index idx_order_events_order_id on public.order_events(order_id);
create index idx_order_events_created_at on public.order_events(created_at desc);
create index idx_payouts_seller_id on public.payouts(seller_id);
create index idx_payouts_status on public.payouts(status);
create index idx_refunds_order_id on public.refunds(order_id);
create index idx_disputes_order_id on public.disputes(order_id);
create index idx_disputes_state on public.disputes(state);
