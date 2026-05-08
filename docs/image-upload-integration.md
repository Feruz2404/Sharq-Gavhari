# Admin Image Upload — Integration Guide

This change introduces a direct-to-Supabase image pipeline. Image binaries no
longer pass through the Vercel API. Originals are kept byte-for-byte in private
storage; optimized + thumbnail WebPs are served on the customer menu.

## What was added

### Backend (`backend/`)
- `migrations/20260509_image_pipeline.sql` — adds `image_original_url`, `image_thumb_url`, `image_object_path`, `image_updated_at` to `products` and `categories`. Existing `image_url` keeps working.
- `migrations/20260509_storage_policies.sql` — creates `media` bucket and RLS: derivatives are public-readable; originals are private; direct anon/auth writes are blocked.
- `src/lib/supabaseAdmin.js` — server-only Supabase service-role client.
- `src/middleware/requireAdmin.js` — JWT + admin-role guard.
- `src/routes/media.routes.js` — endpoints listed below.
- `server.js` — mounts `/api/media`.

### Edge Function
- `supabase/functions/image-processor/index.ts` — sharp-based derivative generator.

### Frontend (`frontend/`)
- `src/store/mediaSlice.js` — Zustand upload state.
- `src/features/media/useImageUpload.js` — 3-step orchestration hook.
- `src/features/media/ImageUploader.jsx` — drop-in replacement for legacy image input.
- `src/features/media/ImageOriginalPreview.jsx` — admin-only signed-URL preview.
- `src/lib/menuImage.js` — `cardImage()` / `detailImage()` helpers for public/tablet.
- `src/i18n/uz.json` — Uzbek media strings (merge into your existing locale file if it already exists).

## Endpoints

| Method | Path | Auth | Body | Purpose |
|---|---|---|---|---|
| `POST` | `/api/media/sign`             | admin | `{ entityType, entityId, mime, size }`        | Issue signed upload URL |
| `POST` | `/api/media/finalize`         | admin | `{ entityType, entityId, objectPath }`        | Build derivatives + DB update |
| `GET`  | `/api/media/original-url`     | admin | `?objectPath=...`                              | Short-lived signed read URL |
| `DELETE` | `/api/media/:entityType/:entityId` | admin | —                                       | Purge images |

## Required env vars

### `backend/.env`
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
MAX_UPLOAD_BYTES=52428800           # 50 MB
ACCEPTED_MIME=image/jpeg,image/png,image/webp
SIGNED_UPLOAD_TTL_SECONDS=600
SIGNED_READ_TTL_SECONDS=600
```

### `frontend/.env`
```
VITE_API_BASE_URL=/api
VITE_MAX_UPLOAD_BYTES=52428800
VITE_ACCEPTED_MIME=image/jpeg,image/png,image/webp
```

## Wiring `ImageUploader` into existing admin forms

Replace the existing image field inside the **product form** and **category form**
with `ImageUploader`. The visual container is unchanged (same aspect-video card),
so layouts stay intact.

```jsx
import { ImageUploader } from '@/features/media/ImageUploader'

// inside the product/category form:
<ImageUploader
  entityType="product"      // or "category"
  entityId={form.id}
  value=
    image_url:          form.image_url,
    image_thumb_url:    form.image_thumb_url,
    image_original_url: form.image_original_url,
    image_object_path:  form.image_object_path,
  
  authToken={auth.token}
  onChange={(urls) => setForm((f) => ({ ...f, ...urls }))}
/>
```

## Wiring public + tablet rendering

For every product/category card and detail view, source the image from the helpers:

```jsx
import { cardImage, detailImage } from '@/lib/menuImage'

// list / cards:
<img src={cardImage(product)} loading="lazy" alt={product.name} />

// detail view:
<img src={detailImage(product)} alt={product.name} />
```

Do NOT use `image_original_url` on any public/tablet surface.

## Rollout

1. Apply both SQL migrations (Supabase SQL editor or CLI).
2. Deploy the Edge Function: `supabase functions deploy image-processor`.
3. Set the env vars above on Vercel and Supabase.
4. From `backend/`: `npm install && npm run build` (if a build step exists).
5. From `frontend/`: `npm install && npm run build`.
6. Smoke test: upload a 30 MB JPEG → verify the row gets all five image columns and that the public menu loads the WebP variants.
