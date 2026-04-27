# Supabase Storage setup

The app uses **four** public buckets. The backend will try to **auto-create** them on the first upload using the service-role key. If your service role does not have permission to create buckets (custom policies), create them manually in **Storage → Buckets**.

| Bucket            | Public | Used for                                |
| ----------------- | ------ | --------------------------------------- |
| `logos`           | yes    | Restaurant logo                         |
| `backgrounds`     | yes    | Hero / background imagery               |
| `product-images`  | yes    | Product photos                          |
| `category-images` | yes    | Category card images                    |

> Legacy bucket name `restaurant-assets` is still accepted by the API for backwards compatibility but new uploads should target the buckets above.

## Auto-create behavior

`POST /api/upload` (admin only) does the following:

1. Validate the multipart `file` field and the `bucket` form field.
2. Check if the bucket exists (`supabase.storage.getBucket`).
3. If missing, create it as **public** with a 5 MB file-size limit and the allowed MIME types below.
4. If creation fails (e.g. service role lacks `storage.buckets:write`), the API returns **HTTP 500** with a clear message that points to this document.

The service-role key is **never** exposed to the frontend; uploads are always proxied through the backend.

## Allowed file types

Multer accepts only:

- `image/jpeg`
- `image/png`
- `image/webp`

Max size: **5 MB** (override with `MAX_UPLOAD_MB` env var on the backend).

## Manual setup (if auto-create is blocked)

In Supabase dashboard:

1. Open **Storage → New bucket**.
2. Name: `logos` — toggle **Public bucket** → ON → Save.
3. Repeat for `backgrounds`, `product-images`, `category-images`.

That is everything. Reload `/admin/settings` and try the upload again — the 'Bucket not found' error will disappear.

## Optional — keep buckets private

If you prefer private buckets, add this on `storage.objects`:

```sql
create policy "public read" on storage.objects
for select to anon
using (bucket_id in ('logos','backgrounds','product-images','category-images'));
```

The service-role backend already bypasses RLS, so writes continue to work without any extra policy.

## Troubleshooting

- **'Bucket not found'** in `/admin/settings` → backend's service-role key is missing or invalid. Check `backend/.env`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  Restart `npm run dev` after editing the env file.
- **'Storage bucket … could not be created automatically'** → create the bucket manually (steps above).
- **413 Payload Too Large** → file exceeds 5 MB; reduce or set `MAX_UPLOAD_MB` higher on the backend.
