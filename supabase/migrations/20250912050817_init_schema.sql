-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create profiles table
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  email text unique not null,
  display_name text,
  handle text unique,
  campus_role text check (campus_role in ('student', 'staff')),
  is_verified boolean default false,
  stripe_customer_id text,
  stripe_connect_id text,
  rating numeric(3,2) default 0.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- Create categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create audit_log table for tracking changes
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users(id),
  table_name text not null,
  row_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);

-- Create admin_users table
create table public.admin_users (
  user_id uuid references auth.users(id) on delete cascade primary key,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.audit_log enable row level security;
alter table public.admin_users enable row level security;

-- RLS Policies for profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = user_id);

-- RLS Policies for categories
create policy "Categories are viewable by everyone" on public.categories
  for select using (true);

-- RLS Policies for audit_log (admin only)
create policy "Audit log is viewable by admins only" on public.audit_log
  for select using (
    exists (
      select 1 from public.admin_users 
      where user_id = auth.uid()
    )
  );

-- RLS Policies for admin_users
create policy "Admin users can view admin list" on public.admin_users
  for select using (
    exists (
      select 1 from public.admin_users 
      where user_id = auth.uid()
    )
  );

-- Function to handle updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.categories
  for each row execute procedure public.handle_updated_at();

-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
