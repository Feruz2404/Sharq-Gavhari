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
├─ README.md
└─ .gitignore
```

## Quick start

### 1. Database

1. Create a Supabase project.
2. Run `database/schema.sql` in the SQL editor.
3. Run `database/seed.sql` (replace the placeholder bcrypt hash with a real one — see file).
4. Follow `database/storage-setup.md` to create the `restaurant-assets`, `category-images`, `product-images` buckets.

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in Supabase + JWT + CLIENT_URL
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
- CORS pinned to `CLIENT_URL`.
- The frontend never sees the service role key.

## License

Proprietary — Sharq Gavhari restaurant.
