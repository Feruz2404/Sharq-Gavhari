-- Sharq Gavhari -- reset/create the default admin account.
-- Run this in the Supabase SQL Editor whenever you need to (re)set the admin
-- login. Requires that schema.sql has been applied (users table exists,
-- pgcrypto enabled).
--
-- After running, log in to /admin/login with:
--   Login:    Admin       (or admin@sharqgavhari.uz)
--   Password: see project README
--
-- The password_hash is produced at SQL execution time by pgcrypto's crypt()
-- with a bf salt at cost 10, yielding a standard bcrypt hash. Only the hash
-- is stored in the users row.

create extension if not exists "pgcrypto";

insert into users (name, email, password_hash, role)
values (
  'Admin',
  'admin@sharqgavhari.uz',
  crypt('sharqgavhariadmin', gen_salt('bf', 10)),
  'admin'
)
on conflict (email) do update set
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role;
