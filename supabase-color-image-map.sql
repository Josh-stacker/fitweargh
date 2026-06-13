alter table public.products
add column if not exists color_image_map jsonb not null default '{}'::jsonb;
