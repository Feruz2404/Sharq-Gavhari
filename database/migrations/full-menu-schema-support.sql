-- Sharq Gavhari \u2014 full-menu schema support
-- Idempotent. Run before database/full-menu-seed.sql.
-- Adds the columns the full menu seed needs and a unique index used to
-- upsert products by their Russian name within a category.

alter table categories add column if not exists image_url text;

alter table products add column if not exists image_url        text;
alter table products add column if not exists weight           text;
alter table products add column if not exists preparation_time text;
alter table products add column if not exists discount_price   numeric(12,2);
alter table products add column if not exists sort_order       integer not null default 0;

-- Unique index used by `on conflict` upserts in full-menu-seed.sql.
-- A product is uniquely identified by its Russian name + category.
create unique index if not exists ux_products_name_ru_category
  on products (name_ru, category_id);
