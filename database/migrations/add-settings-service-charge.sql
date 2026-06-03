-- database/migrations/add-settings-service-charge.sql
-- Adds the configurable service charge percentage to the settings table.
-- Idempotent: safe to re-run. Apply via Supabase Studio -> SQL Editor.

alter table settings
  add column if not exists service_charge_percent numeric(5,2) not null default 20;

-- Defensive backfill for any pre-existing row that somehow has a null value.
update settings
   set service_charge_percent = 20
 where service_charge_percent is null;
