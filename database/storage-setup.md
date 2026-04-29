# Supabase Storage setup

The app uses **four** public buckets. The backend will try to **auto-create** them on the first upload using the service-role key. If your service role does not have permission to create buckets (custom policies), create them manually in **Storage \u2192 Buckets**.

| Bucket            | Public | Used for                                |
| ----------------- | ------ | --------------------------------------- |
| `logos`           | yes    | Restaurant logo                         |
| `backgrounds`     | yes    | Hero / header image AND global app bg   |
| `product-images`  | yes    | Product photos                          |
| `category-images` | yes    | Category card images                    |

> Legacy bucket name `restaurant-assets` is still accepted by the API for backwards compatibility but new uploads should target the buckets above.

## Storage layout for the `backgrounds` bucket

The `backgrounds` bucket holds two **distinct** image roles. They are stored in separate sub-folders so they never overwrite each other and so admins can browse them independently:

| Sub-folder         | Used for                                                       | Settings field                  |
| ------------------ | -------------------------------------------------------------- | ------------------------------- |
| `backgrounds/hero/`   | Hero / header image rendered inside the menu hero card.     | `background_image_url`          |
| `backgrounds/global/` | Full-page background behind the entire customer app/menu.   | `global_background_image_url`   |

The folder is decided by the `folder` form-field on the upload request (`hero`, `global`, or empty). Only `''`, `global`, `hero`, and `cover` are accepted server-side.

## Auto-create behavior

`POST /api/upload` (admin only) does the following:

1. Validate the multipart `file` field, the `bucket` form field, and the optional `folder` form field.
2. Check if the bucket exists (`supabase.storage.getBucket`).
3. If missing, create it as **public** with the configured file-size limit and the allowed MIME types below.
4. If creation fails (e.g. service role lacks `storage.buckets:write`), the API returns **HTTP 500** with a clear message that points to this document.

The service-role key is **never** exposed to the frontend; uploads are always proxied through the backend.

## Allowed file types

Multer accepts only:

- `image/jpeg`
- `image/png`
- `image/webp`

## Max size

**Default: 15 MB** (override with `MAX_UPLOAD_MB` env var on the backend).

High-quality photography is supported \u2014 the backend does not re-encode or compress images, so original quality is preserved end-to-end.

If the upload exceeds the configured limit, the API responds with **HTTP 413** and a localized error message in the admin UI. Increase `MAX_UPLOAD_MB` and restart the backend if you need to allow even larger files.

## Manual setup (if auto-create is blocked)

In Supabase dashboard:

1. Open **Storage \u2192 New bucket**.
2. Name: `logos` \u2014 toggle **Public bucket** \u2192 ON \u2192 Save.
3. Repeat for `backgrounds`, `product-images`, `category-images`.

That is everything. Reload `/admin/settings` and try the upload again \u2014 the 'Bucket not found' error will disappear.

## Optional \u2014 keep buckets private

If you prefer private buckets, add this on `storage.objects`:

```sql
create policy "public read" on storage.objects
for select to anon
using (bucket_id in ('logos','backgrounds','product-images','category-images'));
```

The service-role backend already bypasses RLS, so writes continue to work without any extra policy.

## Troubleshooting

- **'Bucket not found'** in `/admin/settings` \u2192 backend's service-role key is missing or invalid. Check `backend/.env`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  Restart `npm run dev` after editing the env file.
- **'Storage bucket \u2026 could not be created automatically'** \u2192 create the bucket manually (steps above).
- **413 Payload Too Large** \u2192 file exceeds `MAX_UPLOAD_MB`; reduce or set `MAX_UPLOAD_MB` higher on the backend.
