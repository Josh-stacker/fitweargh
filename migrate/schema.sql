-- ============================================================
-- FitwearGH full schema — run this in new Supabase SQL editor
-- Run top to bottom in one shot
-- ============================================================

-- extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- profiles (linked to auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  address     text,
  city        text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- admin_users
-- ============================================================
create table if not exists public.admin_users (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'admin',
  created_at  timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "Admins can view admin_users"
  on public.admin_users for select
  using (public.is_admin());

-- ============================================================
-- is_admin() — security definer breaks recursive RLS on admin_users
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

-- ============================================================
-- products
-- ============================================================
create table if not exists public.products (
  id                   uuid primary key default uuid_generate_v4(),
  name                 text not null,
  price                numeric(10,2) not null default 0,
  discount_price       numeric(10,2),
  category             text not null default '',
  categories           text[] not null default '{}',
  sizes                text[] not null default '{}',
  colors               text[] not null default '{}',
  stock                integer not null default 0,
  color_size_stock     jsonb not null default '{}',
  image_url            text not null default '',
  image_path           text not null default '',
  images               text[] not null default '{}',
  image_paths          text[] not null default '{}',
  display_image_index  integer not null default 0,
  color_image_map      jsonb not null default '{}',
  subcategories        text[] not null default '{}',
  size_chart_id        text,
  description          text not null default '',
  created_at           timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Products are publicly readable"
  on public.products for select
  using (true);

create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin() or auth.role() = 'service_role');

-- ============================================================
-- categories
-- ============================================================
create table if not exists public.categories (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null unique,
  slug          text,
  image_url     text,
  image_path    text,
  product_count integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Categories are publicly readable"
  on public.categories for select
  using (true);

create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin() or auth.role() = 'service_role');

-- ============================================================
-- orders
-- ============================================================
create table if not exists public.orders (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid references auth.users(id) on delete set null,
  customer_name      text,
  customer_email     text,
  customer_phone     text,
  address            text,
  city               text,
  delivery_area      text,
  delivery_fee       numeric(10,2) not null default 0,
  line_items         jsonb not null default '[]',
  items              integer not null default 0,
  total              numeric(10,2) not null default 0,
  status             text not null default 'pending',
  payment_provider   text,
  payment_reference  text,
  payment_status     text not null default 'unpaid',
  paid_at            timestamptz,
  created_at         timestamptz not null default now()
);

create unique index if not exists orders_payment_reference_idx
  on public.orders (payment_reference)
  where payment_reference is not null;

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Anyone can create an order"
  on public.orders for insert
  with check (true);

create policy "Admins can manage orders"
  on public.orders for all
  using (public.is_admin() or auth.role() = 'service_role');

-- ============================================================
-- hero_slides
-- ============================================================
create table if not exists public.hero_slides (
  id             uuid primary key default uuid_generate_v4(),
  title          text not null default '',
  subtitle       text not null default '',
  badge          text not null default '',
  cta_text       text not null default 'Shop Now',
  bg_image_url   text not null default '',
  bg_image_path  text not null default '',
  image1_url     text not null default '',
  image1_path    text not null default '',
  image2_url     text not null default '',
  image2_path    text not null default '',
  bg_position    text not null default '50% 40%',
  display_order  integer not null default 0,
  active         boolean not null default true,
  page           text not null default 'Homepage',
  created_at     timestamptz not null default now()
);

alter table public.hero_slides enable row level security;

create policy "Hero slides publicly readable"
  on public.hero_slides for select
  using (true);

create policy "Admins can manage hero_slides"
  on public.hero_slides for all
  using (public.is_admin() or auth.role() = 'service_role');

-- ============================================================
-- shipping_methods
-- ============================================================
create table if not exists public.shipping_methods (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  description  text not null default '',
  price        numeric(10,2) not null default 0,
  enabled      boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.shipping_methods enable row level security;

create policy "Shipping methods publicly readable"
  on public.shipping_methods for select
  using (true);

create policy "Admins can manage shipping_methods"
  on public.shipping_methods for all
  using (public.is_admin() or auth.role() = 'service_role');

-- ============================================================
-- site_settings  (key/value store for homepage config)
-- ============================================================
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Site settings publicly readable"
  on public.site_settings for select
  using (true);

create policy "Admins can manage site_settings"
  on public.site_settings for all
  using (public.is_admin() or auth.role() = 'service_role');

-- ============================================================
-- carts  (persisted cart for logged-in users)
-- ============================================================
create table if not exists public.carts (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade unique,
  items      jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.carts enable row level security;

create policy "Users can manage own cart"
  on public.carts for all
  using (auth.uid() = user_id);

-- ============================================================
-- mail_queue
-- ============================================================
create table if not exists public.mail_queue (
  id          uuid primary key default uuid_generate_v4(),
  to_email    text not null,
  subject     text not null,
  html        text not null,
  status      text not null default 'pending',
  attempts    integer not null default 0,
  error       text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);

alter table public.mail_queue enable row level security;

create policy "Admins can view mail_queue"
  on public.mail_queue for select
  using (public.is_admin() or auth.role() = 'service_role');

create policy "Service role can manage mail_queue"
  on public.mail_queue for all
  using (auth.role() = 'service_role');

-- ============================================================
-- delivery_areas  (from supabase-delivery-areas.sql)
-- ============================================================
create table if not exists public.delivery_areas (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  price       numeric(10,2) not null default 0,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.delivery_areas enable row level security;

create policy "Delivery areas publicly readable"
  on public.delivery_areas for select
  using (true);

create policy "Admins can manage delivery_areas"
  on public.delivery_areas for all
  using (public.is_admin() or auth.role() = 'service_role');

-- ============================================================
-- size_charts  (from supabase-size-charts.sql)
-- ============================================================
create table if not exists public.size_charts (
  id          text primary key,
  name        text not null,
  headers     text[] not null default '{}',
  rows        jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

alter table public.size_charts enable row level security;

create policy "Size charts publicly readable"
  on public.size_charts for select
  using (true);

create policy "Admins can manage size_charts"
  on public.size_charts for all
  using (public.is_admin() or auth.role() = 'service_role');

-- ============================================================
-- color_image_map additions already in products.color_image_map jsonb
-- supabase-subcategories.sql — subcategories already in products.subcategories[]
-- supabase-paystack-orders.sql — columns already in orders table above
-- ============================================================

-- ============================================================
-- Storage bucket: public-assets (create via dashboard or CLI)
-- Dashboard -> Storage -> New bucket -> "public-assets" -> Public: ON
-- ============================================================
