alter table public.orders
  add column if not exists delivery_area text,
  add column if not exists delivery_fee numeric not null default 0;
