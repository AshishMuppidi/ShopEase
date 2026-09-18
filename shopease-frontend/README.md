# ShopEase — Frontend

A React single-page storefront and admin console for the **ShopEase** Spring Boot
backend (`com.ashish.ecommerce`). Every screen talks to the real REST API — there is
no mock data, no client-side price math, and no third-party payment SDK. The frontend
only ever *displays* the prices and totals the backend returns.

- **Stack:** React 18 · Vite 5 · Tailwind CSS 3 · React Router 6 · Axios · React Context (no Redux/Zustand)
- **Auth:** JWT access + refresh with token rotation, handled by a single Axios interceptor (401 → refresh → retry once, no loop).
- **Language:** plain JavaScript (no TypeScript).

---

## 1. Prerequisites

You need the backend running before the frontend is useful — the UI has no data of
its own.

- **Node.js 18+** and npm (for the frontend).
- **Java 17+** and **MySQL 8** running on `localhost:3306` (for the backend).
- The backend project (included in this bundle under `shopease-backend/`).

---

## 2. Start the backend

From the backend project (`shopease-backend/ecommerce/ecommerce`):

1. Create the database it expects:

   ```sql
   CREATE DATABASE ecommerce_db;
   ```

2. The backend reads its config from `src/main/resources/application.properties`.
   The MySQL password defaults to `ashish007`; override it (and other secrets) with
   environment variables if needed:

   ```
   DB_PASSWORD, JWT_SECRET, PAYMENT_WEBHOOK_SECRET, CORS_ALLOWED_ORIGIN
   ```

3. Run it (defaults to port **8080**):

   ```bash
   ./mvnw spring-boot:run
   ```

On first start the backend seeds its product catalog from DummyJSON **server-side**
(that call happens in the backend, never in this frontend). Hibernate is set to
`ddl-auto=update`, so tables are created automatically.

> **CORS is pinned to `http://localhost:3000`.** The backend's security config sets
> `cors.allowed-origin` to `http://localhost:3000` by default, so the frontend **must**
> run on port 3000 or every API call will be blocked by the browser. (See step 4.)

---

## 3. Configure the frontend

From this folder (`shopease-frontend/`):

```bash
npm install
```

The API base URL is read from an environment variable. A ready-to-use `.env` is
included, and `.env.example` documents it:

```
# .env
VITE_API_BASE_URL=http://localhost:8080/api
```

The value **includes the `/api` suffix** because the backend controllers hard-code the
`/api` prefix on every route. If your backend runs elsewhere, change this one line.

---

## 4. Run the frontend

```bash
npm run dev
```

This starts Vite on **http://localhost:3000** (the port is fixed in `vite.config.js`
via `strictPort: true` to match the backend's CORS allow-list — see the note in step 2).
Open that URL in your browser.

Other scripts:

```bash
npm run build     # production build → dist/
npm run preview   # serve the production build, also on port 3000
```

---

## 5. Create an admin account

Registration always creates a **CUSTOMER** — the backend has no self-service admin
sign-up and does not seed an admin user. To get into the admin console:

1. Register normally through the UI (or `POST /api/auth/register`).
2. Promote that user to admin directly in MySQL. The `role` column stores the enum
   name as a string, so:

   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
   ```

3. Log out and log back in (the app reads your role from `/api/users/me` at login, so
   a fresh login is needed to pick up the new role).

Once you're an admin, an **Admin** link appears in the navbar and `/admin/*` routes
unlock. Non-admins who try to reach an admin URL are sent to a “forbidden” screen, and
the backend independently enforces `ROLE_ADMIN` on every `/api/admin/**` endpoint.

---

## 6. What you can do (end-to-end)

**As a shopper**

- Register, log in, and stay logged in across refreshes (tokens are restored on load).
- Browse the catalog on **Home** and **Products**, with keyword search, category filter, and pagination.
- Open a **Product** page, pick a variant, and add it to the **Cart** or **Wishlist**.
- Review the cart (server-calculated totals), then **Checkout**: enter a shipping
  address → the server creates a pending order, reserves inventory, and clears your cart.
- Complete the **simulated payment** (success or failure) and land on an order
  confirmation page.
- See the order in your **Order history**, open its details, and **cancel** it while
  it's still eligible.

**As an admin** (`/admin/*`)

- **Categories:** create, edit, and deactivate.
- **Products:** create, edit, and deactivate; jump to a product's variants.
- **Variants:** create and deactivate per product (SKU, attributes, price, inventory).
- **Orders:** browse all orders, open details, and advance status through the
  transitions the backend actually allows.

---

## 7. How it's wired

**All HTTP goes through `src/api/`.** No component calls `axios` directly. Each resource
has its own module (`auth`, `products`, `categories`, `cart`, `wishlist`, `orders`,
`payment`, `admin`), and they all share one configured `axiosClient`.

**The Axios interceptor owns auth.** It attaches the bearer token to every request and,
on a `401`, performs a single-flight token refresh (queuing any concurrent requests),
persists both rotated tokens, and retries the original request once. If refresh fails,
it clears the session and redirects to `/login` — it never loops, and it never tries to
refresh the auth endpoints themselves.

**Global state lives in three React Contexts:** `AuthContext` (user + role, login/register/logout),
`CartContext` (server-authoritative cart; every mutation stores the full `CartResponse`
the backend returns), and `WishlistContext`.

**Pricing is never computed here.** Cart totals (`cart.totalPrice`), line subtotals
(`item.subTotal`), unit prices (`item.unitPrice`), and order totals (`order.totalAmount`)
are all rendered verbatim from the backend. The only client-side arithmetic on cart data
is summing item quantities for the navbar badge.

**Routing** is in `App.jsx`: public auth pages, customer pages behind `ProtectedRoute`,
and admin pages behind `AdminRoute`, all inside a shared `Layout`.

**Every data screen handles loading, empty, and error states** via a small reusable UI
kit (`Button`, `Input`, `Card`, `Badge`, `LoadingSpinner`, `EmptyState`, `ErrorMessage`,
`Modal`). Errors are mapped to friendly messages (401/403/404/409/500 are distinguished)
— raw stack traces are never shown.

---

## 8. Project structure

```
shopease-frontend/
├─ .env / .env.example        # VITE_API_BASE_URL
├─ vite.config.js             # dev/preview locked to port 3000
├─ tailwind.config.js
├─ index.html
└─ src/
   ├─ api/                    # axiosClient + one module per resource
   ├─ context/                # AuthContext, CartContext, WishlistContext
   ├─ components/             # UI kit, layout, route guards, order & admin widgets
   ├─ lib/                    # constants (order state machine), errors, format, page
   └─ pages/                  # customer pages + pages/admin/*
```

---

## 9. Honest notes & known limitations

These are real behaviors of the backend as it stands, surfaced truthfully in the UI
rather than papered over:

- **The `POST /api/payments/confirm` endpoint was added to the backend for this frontend.**
  The original backend only resolved payments via an asynchronous webhook, which a browser
  can't reliably trigger. An authenticated, owner-checked `confirm` endpoint was added so
  the checkout flow can complete a payment directly. It mirrors the webhook's resolution
  logic (`SUCCESS` → order `PROCESSING`; `FAILURE` → order `FAILED` + inventory restored).

- **A failed payment is terminal.** The backend only issues a payment intent for a
  `PENDING` order, and a failed payment moves the order to `FAILED` (restoring stock).
  There is no way to retry payment on the same order, so the UI tells you the order was
  cancelled and to start a new one — it does not fake a retry.

- **The admin product list shows active products only.** The storefront and the admin
  product list share the same `GET /api/products` endpoint, which filters to
  `active = true`. "Deleting" a product deactivates it (soft delete), so it disappears
  from both views, and there is **no backend endpoint to list or reactivate a
  soft-deleted product** through the UI. Deactivated *variants*, by contrast, remain
  visible on the variants page (that endpoint returns inactive rows) and are clearly
  labeled. These gaps are called out inline on the relevant admin pages.

- **Register returns no tokens.** `POST /api/auth/register` returns the created user but
  no JWTs, so the app automatically logs the user in immediately afterward for a smooth
  experience.

- **Pagination shape is handled defensively.** Spring's `Page` can serialize as a flat
  object or a nested `page` object depending on configuration; `src/lib/page.js`
  normalizes both. If pages ever look empty, that's the first place to check against your
  running backend.

---

## 10. Build & wiring verification

Because this environment couldn't reach the npm registry, a full `vite build` / ESLint
run wasn't possible here. Instead the wiring was verified with:

- a **deterministic import/export cross-checker** over all 59 source files (157 relative
  imports) — every import resolves and every named/default import matches an export;
- `node --check` on all plain `.js` modules (API layer, contexts, lib) — all pass;
- an **independent code review against the backend source** confirming every response
  field the UI reads exists on the matching DTO with the same name, every `src/api`
  method maps to a real controller route/verb/param, `/admin/*` is role-gated, and none
  of the core rules (no client-side pricing, no mock data, no raw axios in components, no
  payment SDK) are violated.

Run `npm install && npm run build` in an environment with registry access to produce the
production bundle.
