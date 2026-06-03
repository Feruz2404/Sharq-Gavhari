-- Sharq Gavhari Digital Menu — Supabase schema
-- Tables: users, categories, products, settings, restaurant_tables
-- NO orders / order_items / payments tables on purpose.

create extension if not exists "pgcrypto";

-- updated_at trigger function ------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- users ----------------------------------------------------------------------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique not null,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

-- categories -----------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name_uz text not null,
  name_ru text not null,
  name_en text not null,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_categories_is_active on categories (is_active);
drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();

-- products -------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name_uz text not null,
  name_ru text not null,
  name_en text not null,
  description_uz text,
  description_ru text,
  description_en text,
  ingredients_uz text,
  ingredients_ru text,
  ingredients_en text,
  image_url text,
  price numeric(12,2) not null default 0,
  discount_price numeric(12,2),
  weight text,
  preparation_time text,
  is_available boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_category_id on products (category_id);
create index if not exists idx_products_is_active on products (is_active);
create index if not exists idx_products_is_available on products (is_available);
drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

-- settings -------------------------------------------------------------------
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null default 'Sharq Gavhari',
  logo_url text,
  background_url text,
  background_image_url text,
  phone text,
  instagram text,
  telegram text,
  default_language text not null default 'uz',
  accent_color text not null default '#D4AF37',
  service_charge_percent numeric(5,2) not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_settings_updated_at on settings;
create trigger trg_settings_updated_at before update on settings
  for each row execute function set_updated_at();

-- restaurant_tables ----------------------------------------------------------
create table if not exists restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  table_number text not null,
  table_name text,
  qr_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_restaurant_tables_is_active on restaurant_tables (is_active);
drop trigger if exists trg_tables_updated_at on restaurant_tables;
create trigger trg_tables_updated_at before update on restaurant_tables
  for each row execute function set_updated_at();
