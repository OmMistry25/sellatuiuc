-- Create threads table
create table public.threads (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade, -- nullable for pre-offer chat
  buyer_id uuid references public.profiles(user_id) on delete cascade not null,
  seller_id uuid references public.profiles(user_id) on delete cascade not null,
  is_anonymous boolean default true, -- true until order close
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create messages table
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid references public.threads(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  attachments jsonb[] default '{}',
  created_at timestamptz default now()
);

-- Create reviews table
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  rater_id uuid references auth.users(id) on delete cascade not null,
  ratee_id uuid references auth.users(id) on delete cascade not null,
  rating int check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- RLS Policies for threads
create policy "Thread members can view their threads" on public.threads
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Users can create threads" on public.threads
  for insert with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Thread members can update their threads" on public.threads
  for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- RLS Policies for messages
create policy "Thread members can view messages" on public.messages
  for select using (
    exists (
      select 1 from public.threads 
      where id = thread_id 
      and (buyer_id = auth.uid() or seller_id = auth.uid())
    )
  );

create policy "Thread members can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.threads 
      where id = thread_id 
      and (buyer_id = auth.uid() or seller_id = auth.uid())
    )
  );

create policy "Users can update their own messages" on public.messages
  for update using (auth.uid() = sender_id);

create policy "Users can delete their own messages" on public.messages
  for delete using (auth.uid() = sender_id);

-- RLS Policies for reviews
create policy "Reviews are viewable by everyone" on public.reviews
  for select using (true);

create policy "Users can create reviews for completed orders" on public.reviews
  for insert with check (
    auth.uid() = rater_id and
    exists (
      select 1 from public.orders 
      where id = order_id 
      and state = 'completed'
      and (buyer_id = auth.uid() or seller_id = auth.uid())
    )
  );

create policy "Users can update their own reviews" on public.reviews
  for update using (auth.uid() = rater_id);

create policy "Users can delete their own reviews" on public.reviews
  for delete using (auth.uid() = rater_id);

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.threads
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.reviews
  for each row execute procedure public.handle_updated_at();

-- Create indexes for better performance
create index idx_threads_buyer_id on public.threads(buyer_id);
create index idx_threads_seller_id on public.threads(seller_id);
create index idx_threads_order_id on public.threads(order_id);
create index idx_messages_thread_id on public.messages(thread_id);
create index idx_messages_created_at on public.messages(created_at desc);
create index idx_reviews_order_id on public.reviews(order_id);
create index idx_reviews_rater_id on public.reviews(rater_id);
create index idx_reviews_ratee_id on public.reviews(ratee_id);

-- Function to update thread updated_at when message is added
create or replace function public.update_thread_updated_at()
returns trigger as $$
begin
  update public.threads 
  set updated_at = now() 
  where id = new.thread_id;
  return new;
end;
$$ language plpgsql;

-- Trigger to update thread when message is added
create trigger update_thread_on_message
  after insert on public.messages
  for each row execute procedure public.update_thread_updated_at();

-- Function to update profile rating when review is added/updated
create or replace function public.update_profile_rating()
returns trigger as $$
begin
  -- Update the ratee's average rating
  update public.profiles 
  set rating = (
    select avg(rating)::numeric(3,2)
    from public.reviews 
    where ratee_id = new.ratee_id
  )
  where user_id = new.ratee_id;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to update profile rating on review changes
create trigger update_rating_on_review
  after insert or update or delete on public.reviews
  for each row execute procedure public.update_profile_rating();
