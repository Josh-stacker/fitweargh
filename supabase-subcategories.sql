alter table public.products
  add column if not exists subcategories text[] not null default '{}';
