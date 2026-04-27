# Sharq Gavhari Digital Menu

Premium QR menu + internal tablet/admin system for the **Sharq Gavhari** restaurant.

- **Customers** scan a table QR, browse the menu in UZ / RU / EN, and add items to a **local cart** (localStorage only). The final cart is shown to the waiter physically — nothing is ever submitted to the backend.
- **Tablets / Admin** run the same app as an installable PWA (manifest + service worker only on `/tablet` and `/admin` routes).
- **Admin panel** manages categories, products, settings, and table QR codes (with PNG download).

> This is **not** a POS, online order, kitchen, or payment system. There are no `orders`, `order_items`, or `payments` tables, and no order-related endpoints.

## Stack

| Layer    | Tech                                                                |
| -------- | ------------------------------------------------------------------- |
| Frontend | React + Vite + React Router + Tailwind CSS + Framer Motion + Zustand + Axios + qrcode.react |
| Backend  | Node.js + Express + Supabase JS SDK + JWT + bcrypt + multer        |
| Database | Supabase Postgres + Supabase Storage                                |

## Project layout

```
sharq-gavhari/
├─ backend/        # Express API (categories, products, settings, tables, upload, auth)
├─ frontend/       # React + Vite app (customer, tablet, admin)
├─ database/       # Supabase schema, seed, storage setup guide
├─ docs/           # Deployment guide and other docs
├─ README.md
└─ .gitignore
```

## Quick start (local development)

### 1. Database

1. Create a Supabase project.
2. Run `database/schema.sql` in the SQL editor.
3. Run `database/migrations/add-settings-branding-fields.sql`.
4. Run `database/seed.sql` (replace the placeholder bcrypt hash with a real one — see file).
5. Follow `database/storage-setup.md` to create the `logos`, `backgrounds`, `category-images`, `product-images` buckets.

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in Supabase + JWT + CLIENT_URLS
npm install
npm run dev            # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev            # http://localhost:5173
```

## Production deployment

The full deployment guide lives in [`docs/deployment.md`](./docs/deployment.md). Short version:

### Frontend → Vercel

Import the GitHub repo into Vercel and set the project options as follows:

| Vercel setting     | Value             |
| ------------------ | ----------------- |
| Root Directory     | `frontend`        |
| Framework Preset   | Vite              |
| Build Command      | `npm run build`   |
| Output Directory   | `dist`            |
| Install Command    | `npm install`     |
| Node.js Version    | 20.x              |

Environment variables (Vercel → Project → Settings → Environment Variables — apply to **Production**, **Preview**, **Development**):

```
VITE_API_URL=https://YOUR_BACKEND_DOMAIN/api
VITE_PUBLIC_BASE_URL=https://sharq-gavhari.vercel.app
```

The `/api` suffix on `VITE_API_URL` is required. **After adding/changing env vars on Vercel, you must redeploy** — env changes do not auto-redeploy.

SPA routing is handled by `frontend/vercel.json` (rewrites `/(.*)` → `/index.html`), so deep links like `/admin/products` and `/category/salatlar` work after a hard refresh.

### Backend → Render / Railway / Fly

The Express API is **not** deployed to Vercel (it is a long-running server with file uploads, not a serverless function). Deploy `backend/` to Render, Railway, or Fly:

| Setting        | Value                            |
| -------------- | -------------------------------- |
| Root Directory | `backend`                        |
| Build Command  | `npm install`                    |
| Start Command  | `npm start` (`node server.js`)   |
| Health Check   | `/api/health`                    |

Environment variables:

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
CLIENT_URLS=http://localhost:5173,https://sharq-gavhari.vercel.app
MAX_UPLOAD_MB=5
```

`CLIENT_URLS` is a comma-separated list of allowed frontend origins. If you only need one, you can use the legacy single-origin variable instead:

```
CLIENT_URL=https://sharq-gavhari.vercel.app
```

If both are set, `CLIENT_URLS` wins. Vercel preview deploys (`*.vercel.app`) are allowed by default; set `ALLOW_VERCEL_PREVIEWS=false` to disable. The wildcard `*` is intentionally **not** supported because the API sends credentials.

After the backend has a public URL, paste that URL (with `/api` suffix) into the Vercel `VITE_API_URL` env var and redeploy the frontend.

## Routes

### Customer (no PWA)

- `/` loading splash → redirects to `/menu`
- `/menu` categories
- `/table/:tableNumber` saves the table number and redirects to `/menu`
- `/category/:slug` products in a category
- `/product/:id` product detail
- `/cart` local cart with the “Show this list to the waiter” final summary

### Tablet (PWA)

- `/tablet` home
- `/tablet/menu` menu
- `/tablet/cart` local cart with “Clear for next customer”

### Admin (PWA)

- `/admin/login`
- `/admin/dashboard`
- `/admin/categories`
- `/admin/products`
- `/admin/settings`
- `/admin/tables`

## Languages

UI labels live in `frontend/src/locales/{uz,ru,en}.js`. Every product/category row carries `*_uz`, `*_ru`, `*_en` columns. The selected language is persisted in `localStorage` (`sg_lang`); fallback is **uz**.

## Security

- Supabase **service role key** is only ever used by the backend.
- All admin write endpoints (`POST` / `PUT` / `PATCH` / `DELETE` and `/api/upload`) are protected by JWT (`requireAdmin` middleware).
- Admin passwords stored as bcrypt hashes (cost 10).
- CORS pinned to a comma-separated allow list (`CLIENT_URLS`), plus optional `*.vercel.app` previews. Wildcard `*` is never used.
- The frontend never sees the service role key.
- `.env` files are gitignored; `frontend/.env.example` and `backend/.env.example` are the canonical templates.

## License

Proprietary — Sharq Gavhari restaurant.
