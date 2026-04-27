# Production deployment guide

Sharq Gavhari is split into a **Vite SPA** (frontend) and a **stateful Express API** (backend). They are deployed to different platforms because the backend is not a serverless function — it owns long-running CORS, JWT auth, multer file uploads, and a custom CORS allow list.

```
Browser  ──▶  Vercel (frontend, static SPA)
                │
                │  fetch  VITE_API_URL
                ▼
              Render / Railway / Fly  (backend, Express)
                │
                ▼
              Supabase (Postgres + Storage)
```

## 1. Supabase

One project hosts the database and storage for both environments (local dev and production):

1. Create a Supabase project.
2. SQL editor → run `database/schema.sql`.
3. SQL editor → run `database/migrations/add-settings-branding-fields.sql`.
4. SQL editor → run `database/seed.sql` (replace the bcrypt hash placeholder).
5. Storage → create public buckets: `logos`, `backgrounds`, `category-images`, `product-images` (the backend will also auto-create them on first upload using the service role key, but creating them up front avoids the first-upload failure).

Copy these values from Supabase → Project Settings → API:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (**backend only — never put in Vercel/frontend env**)

## 2. Backend → Render (recommended) / Railway / Fly

The backend is a plain `node server.js` process. Any host that runs Node 20 will work. Below are the Render steps; Railway/Fly are equivalent.

### Render

1. New → Web Service → connect GitHub repo `Feruz2404/Sharq-Gavhari`.
2. Settings:
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (which runs `node server.js`)
   - **Health Check Path**: `/api/health`
   - **Region**: closest to your users
3. Environment variables:

   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   JWT_SECRET=<generate a long random string>
   JWT_EXPIRES_IN=7d
   CLIENT_URL=https://your-vercel-domain.vercel.app
   MAX_UPLOAD_MB=5
   ```

   `CLIENT_URL` accepts a comma-separated list:

   ```
   CLIENT_URL=https://sharqgavhari.uz,https://www.sharqgavhari.uz,https://sharq-gavhari.vercel.app
   ```

   Vercel preview deploys (`https://<branch>-<hash>.vercel.app`) are allowed by default. Set `ALLOW_VERCEL_PREVIEWS=false` to disable that.

4. Deploy. Note the public URL (e.g. `https://sharq-gavhari-api.onrender.com`).
5. Verify: `curl https://sharq-gavhari-api.onrender.com/api/health` should return `{"ok":true,"name":"sharq-gavhari-api",...}`.

### Railway / Fly

Use the same env vars and `Root Directory = backend`, `npm install`, `npm start`. On Fly, add a `fly.toml` with `internal_port = 5000` and bind `PORT` from Fly's env.

## 3. Frontend → Vercel

1. Import GitHub repo `Feruz2404/Sharq-Gavhari` into Vercel.
2. Project settings:

   | Setting            | Value           |
   | ------------------ | --------------- |
   | Root Directory     | `frontend`      |
   | Framework Preset   | Vite            |
   | Build Command      | `npm run build` |
   | Output Directory   | `dist`          |
   | Install Command    | `npm install`   |
   | Node.js Version    | 20.x            |

3. Environment variables (apply to **Production**, **Preview**, and **Development**):

   ```
   VITE_API_URL=https://sharq-gavhari-api.onrender.com/api
   VITE_PUBLIC_BASE_URL=https://your-vercel-domain.vercel.app
   ```

   Replace both URLs with your actual deployed domains. The `/api` suffix on `VITE_API_URL` is required.

4. Deploy. SPA deep-link routing is handled by `frontend/vercel.json` (`/(.*)` → `/index.html`), so `/admin/products`, `/category/salatlar`, and `/table/12` all work on hard refresh.

## 4. Connect frontend ↔ backend

Once both sides are deployed:

1. Confirm the **backend** `CLIENT_URL` includes the **frontend** Vercel domain.
2. Confirm the **frontend** `VITE_API_URL` points to the **backend** public URL with `/api`.
3. Trigger a redeploy on whichever side you changed env vars on (env changes do not auto-redeploy on Vercel).
4. Open `https://your-vercel-domain.vercel.app/menu`. The browser network tab should show requests to `https://sharq-gavhari-api.onrender.com/api/...` returning 200.

## 5. Smoke test in production

- `/menu` loads, categories appear, products appear.
- Switch language UZ ↔ RU ↔ EN — labels and product names update.
- `/category/<slug>` and `/product/<id>` load.
- `/cart` adds and removes items, totals update.
- `/admin/login` with `Admin` / your admin password — JWT cookie/header is issued.
- `/admin/settings` — upload logo and background, click **Saqlash**, hard reload — both persist; `/menu` shows them.
- `/admin/categories` and `/admin/products` — create/edit/delete works, dropdowns float above other cards (portal-rendered).
- DevTools → Application → Manifest — install icon visible on `/admin` and `/tablet` routes.

## 6. Common issues

| Symptom                                                                | Cause / fix                                                                                                                                                                                  |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `404 NOT_FOUND` on `/admin/products` after refresh                     | Missing or misplaced `vercel.json`. It must live at `frontend/vercel.json` (because **Root Directory = frontend**).                                                                          |
| All API requests to `http://localhost:5000/api`                        | `VITE_API_URL` is missing on Vercel. Add it and redeploy.                                                                                                                                    |
| `CORS error: origin https://...vercel.app not allowed`                 | Add the Vercel domain to backend `CLIENT_URL` (comma-separated), or keep `ALLOW_VERCEL_PREVIEWS=true`.                                                                                       |
| Logo / background upload returns `Bucket not found`                    | Backend service role lacks permissions or the bucket was not created. Create the bucket manually in Supabase → Storage and mark it public.                                                   |
| `401 Unauthorized` for every admin write                               | Browser's `Authorization` header is being stripped by an intermediate proxy. Confirm Vercel is not rewriting `/api` and that requests go directly to the backend public URL.                  |
| Service worker keeps serving the old build                             | Bump the SW version, or in DevTools → Application → Service Workers → Unregister, then hard reload. The Vercel cache headers in `vercel.json` already mark `/sw.js` as `must-revalidate`.    |
| Backend cold start on Render free tier (~30s)                          | Expected on the free plan. Upgrade to a paid Render service or use a paid Railway/Fly plan to avoid cold starts.                                                                              |

## 7. Custom domain (optional)

1. Vercel → Project → Settings → Domains → add `menu.sharqgavhari.uz` (or similar). Follow the DNS instructions.
2. Update backend `CLIENT_URL` to include the custom domain.
3. Redeploy backend so the new CORS allow list takes effect.

## 8. Rotating secrets

- **Supabase service role key**: Supabase → Project Settings → API → Reset service role key. Update `SUPABASE_SERVICE_ROLE_KEY` on Render and redeploy backend.
- **JWT secret**: generate a new long random string, update `JWT_SECRET` on Render, redeploy. All existing admin tokens will be invalidated and admins must log in again.

## 9. What is intentionally NOT deployed to Vercel

- `backend/` — Express server with multer uploads, custom CORS, and long-lived process. Vercel serverless functions have a 4.5 MB request body limit, no persistent filesystem, and a 10-second default timeout, which are incompatible with the upload route. If you ever want a single-platform deployment, the migration path is to split each route in `backend/src/routes/*` into a Vercel API route under `frontend/api/`, swap multer for `formidable` or direct Supabase signed-URL uploads, and remove the `cors` middleware (Vercel handles same-origin). That is a non-trivial rewrite — the current split is the recommended setup.
