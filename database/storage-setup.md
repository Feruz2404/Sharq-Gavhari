# Supabase Storage setup

The app uses three buckets. Create them in your Supabase project under **Storage → Buckets**:

| Bucket            | Public | Used for                                 |
| ----------------- | ------ | ---------------------------------------- |
| `restaurant-assets` | yes  | Logo, background image, generic media    |
| `category-images`   | yes  | Category card images                     |
| `product-images`    | yes  | Product photos                           |

All three buckets must be **public read** so customer browsers can load images directly via the public URL. Writes are restricted to the backend (which uses the service role key).

## Optional — Storage policies (if you keep buckets private)

If you make a bucket private, add the following SQL policy on `storage.objects` so the service-role backend can read/write while end users only read:

```sql
-- Public read
create policy "public read" on storage.objects
for select to anon
using (bucket_id in ('restaurant-assets','category-images','product-images'));

-- Service role full access (granted automatically; no policy required)
```

## Allowed file types

The backend `multer` middleware accepts only `image/jpeg`, `image/png`, `image/webp` (max 5 MB by default — set `MAX_UPLOAD_MB` to override).
