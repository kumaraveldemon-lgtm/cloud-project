# Backend Migration Plan

## Goal

Replace browser-only `localStorage` persistence and business/data operations with a small cloud-deployable backend and a managed cloud database. Keep the current HTML/CSS interface and make the app run end to end; this is a practical first version, not a full enterprise system.

## Recommended stack

- **Backend:** Node.js LTS with Express. The project is already plain JavaScript, so this avoids a framework rewrite and lets the current frontend call JSON APIs.
- **Database:** Managed PostgreSQL on **Neon**. It is cloud-hosted, persistent across deployments, relational (a good fit for orders, customers, attendance, inventory, and production), and works through a standard `DATABASE_URL`.
- **Hosting:** **Render Web Service** for the Node app. Express serves both the existing static frontend and `/api` from one origin, avoiding separate frontend hosting and CORS configuration. Deploy from the repository; configure `DATABASE_URL` and other secrets in the host dashboard. The same app can run on Railway or another Node host if desired.
- **Database access:** `pg` with parameterized SQL and checked-in SQL migrations. Avoid a heavy ORM for this small app; PostgreSQL constraints and transactions cover data integrity for operations such as issuing stock and recording dispatches.

This pairing keeps the application small, uses a real managed cloud database rather than ephemeral/local SQLite storage, and has a straightforward deploy path: create the hosted database, set the connection string, then deploy the Node service.

## Current app findings

- The UI has Dashboard, Employee Attendance, Warehouse/Reel Stock, Production Planning, Orders, and Customers modules.
- `app.js` currently mixes DOM rendering with localStorage reads/writes, seeded demo data, validation, totals, and business rules.
- `index.html` also contains localStorage-dependent customer dropdown and bulk-attendance logic; these must move to API calls as part of the migration.
- The app is static HTML/CSS/JavaScript with no existing package/build setup. Preserve that simplicity; no frontend framework is required.

## Target architecture

1. Browser retains navigation, modal handling, input display, formatting, and rendering.
2. Browser calls `fetch('/api/...')` for reads and mutations. Remove localStorage as the source of truth.
3. Express validates requests, applies business rules, performs SQL queries/transactions, and returns JSON with appropriate HTTP status codes.
4. PostgreSQL stores persistent business data. On startup, the server applies versioned migrations and performs an idempotent first-time demo seed only when the database is empty (or via an explicit seed command).
5. Express serves `index.html`, `app.js`, and `styles.css` as static assets from the same origin as the API.

Keep rendering/presentation in the browser; move persistence, mutation rules, data validation, and server-derived summaries to the backend. This avoids an unnecessary UI rewrite while ensuring shared cloud data is authoritative.

## Initial database model

Use relational tables with primary keys, sensible `NOT NULL`/`CHECK` constraints, timestamps where useful, and indexes on common lookups. Start with:

- `employees`
- `attendance` — unique `(employee_id, attendance_date)`; employee reference
- `customers`
- `reel_stock` — include current quantity, received quantity, unit rate, status, supplier, location, and the reel specification fields
- `reorder_levels` — keyed by reel ID, or a default setting plus optional per-reel override
- `orders` — customer reference and order/dispatch/status fields
- `production_plans` — order reference, optional reel reference, machine, stage, quantities, and dates
- `price_history` — customer reference, specification, price, and date
- `app_settings` — company name, ageing threshold, shift length

Use integer/cents or PostgreSQL numeric types for quantities and currency rather than floating point for monetary values. Preserve the fields needed by existing UI and reports; normalize obvious relationships while avoiding over-modeling in this first pass.

## API outline

Use JSON, consistent error responses, and server-side validation. Initial endpoints (adjust response shapes to reduce frontend changes):

- `GET /api/dashboard` — KPI values, alerts, recent orders, active production, and reel summary
- `GET/POST /api/employees`; `PUT/DELETE /api/employees/:id`
- `GET /api/attendance?date=&month=&department=`; `PUT /api/attendance/:employeeId/:date`; `POST /api/attendance/bulk-present`
- `GET/POST /api/reels`; `PUT/DELETE /api/reels/:id`; `POST /api/reels/:id/issues`
- `GET /api/reports/stock-ageing`; `GET /api/reports/suppliers`
- `GET/POST /api/orders`; `PUT /api/orders/:id`; `POST /api/orders/:id/dispatches`
- `GET/POST /api/production-plans`; `PUT/DELETE /api/production-plans/:id`
- `GET/POST /api/customers`; `PUT/DELETE /api/customers/:id`; customer order/history and ranking reads
- `GET/PUT /api/settings`

The dashboard and report endpoints should calculate server-side aggregates so totals, low-stock rules, overdue orders, rankings, and date summaries are consistent. Mutations should use transactions where multiple tables are affected (for example, order dispatch plus order status, stock issue plus stock quantity). Add duplicate-ID and invalid-reference checks.

## Migration and implementation sequence

1. **Inventory behavior:** Map the existing localStorage keys, forms, and operations to the tables and API endpoints above. Confirm any legacy reel fields used by views before defining the final SQL columns.
2. **Create backend foundation:** Add `package.json`, Express entry point, static-file serving, `/api/health`, environment-variable loading, centralized error handling, and a local `.env.example` (never commit real credentials).
3. **Create schema and seed path:** Add SQL migrations and an idempotent demo seed command. Seed only when requested or the database is empty; never overwrite production data on every restart.
4. **Implement API and business rules:** Add reads/mutations module by module, including attendance calculations, inventory issue checks, order dispatch state, production/order linkage, and reports. Validate payloads on the server.
5. **Connect the current UI:** Replace `DB.get`/`DB.set` workflows in `app.js` with asynchronous API loading and writes. Update initial page loading and tab refreshes to handle loading/errors. Replace localStorage access and the bulk-attendance helper in `index.html` with API-backed behavior. Keep rendering helpers in the browser.
6. **Preserve existing browser data:** Provide a one-time import/migration route or script that can import exported `cbm_*` localStorage values into a clean database. Validate and deduplicate the import, then make it opt-in; demo users can instead start from server seed data. Do not silently import stale browser values on each visit.
7. **Verify locally:** Run migrations and seed against a local PostgreSQL instance, exercise all CRUD flows and dashboard/report views, and test invalid input, missing records, and stock/dispatch limits. Ensure no active code depends on `localStorage`.
8. **Deploy:** Create a Neon database, configure `DATABASE_URL` (and production mode) as Render environment variables, connect the repository to a Render Web Service, and deploy. Run migrations as a release/deploy step before serving traffic; use HTTPS provided by the host. Verify `/api/health`, static page loading, and create/read/update/delete flows against the hosted database.

## Scope and first-version safeguards

- Authentication is not present in the current app. Do not expose real employee/customer/business data publicly without adding access control. For a publicly reachable first deployment, add at least a simple managed login or restrict access behind an authenticated proxy before using real data.
- Keep database credentials server-side only; never place `DATABASE_URL` in frontend JavaScript.
- Use database transactions and foreign keys for integrity; return useful validation errors rather than silently falling back to empty arrays as localStorage does.
- Add backups/retention through the database provider and use a separate development database from production.
- Authentication/roles, audit trails, automated backups policy, pagination, and advanced reporting can be follow-up work if only a demonstrable running application is needed initially.

## Definition of done

- The existing interface is served by the Node app and all six modules read/write shared PostgreSQL data through the API.
- Dashboard, stock-ageing/supplier reports, customer history/ranking, attendance summaries, order dispatch, and production updates work without localStorage persistence.
- Demo seeding is repeatable without resetting data; database schema is created by migrations.
- The app can be deployed by configuring the managed database URL and deploying the Node service, with a health check confirming service/database connectivity.
