# Design Decisions

## DD-01: SQLite (dev) / PostgreSQL (prod) via same driver interface

**Decision:** Use `better-sqlite3` locally; swap to `pg` / managed RDS in production using the same SQL dialect (minor adjustments for dialect differences).

**Alternatives considered:**
- **MongoDB** — rejected; pricing data is highly relational (store→SKU→date), and SQL joins/aggregations are well understood by retail data teams.
- **MySQL** — viable; PostgreSQL chosen for its stronger support for `ON CONFLICT DO UPDATE` (upsert), partial indexes, and JSONB for error payloads.

**Rationale:** SQLite removes all infrastructure setup for local development and testing. The schema is designed to be PostgreSQL-compatible from day one (no SQLite-specific syntax). Switching is a two-line environment variable change.

---

## DD-02: UPSERT on (store_id, SKU, date)

**Decision:** `INSERT … ON CONFLICT (store_id, sku, date) DO UPDATE SET price=excluded.price, …`

**Rationale:** Stores re-submit pricing feeds daily. Rather than erroring on duplicates or requiring pre-deduplication, the API idempotently applies the latest value. This means:
- Re-uploading the same file is safe (no double-counting).
- Corrections can be distributed as a full or partial feed without custom diff logic.
- Each unique (store, SKU, date) triplet represents one canonical pricing point.

---

## DD-03: Server-side CSV parsing (not client-side)

**Decision:** Upload the raw file to Express; parse on the server with `csv-parse` + Joi validation.

**Alternatives considered:** Parse in browser with PapaParse before upload.

**Rationale:**
- Files can be 50MB+ with hundreds of thousands of rows. Client-side parsing blocks the UI thread.
- Server validation is the authoritative gate; client-side validation is cosmetic.
- Stored CSVs provide an audit trail and enable re-processing without re-upload.

---

## DD-04: Audit log as a separate table (not event sourcing)

**Decision:** Record field-level changes in `audit_logs` table on every `PUT /pricing/:id`.

**Alternatives considered:** Full event sourcing (store every state as an event).

**Rationale:** Event sourcing adds complexity (projections, event replay) that is not justified at this scale. A simple audit table answers "what changed, when, by whom" for compliance purposes without significant overhead. The UI surfaces the last 20 entries per record.

---

## DD-05: React Query for server state

**Decision:** Use TanStack Query (React Query) rather than Redux or Zustand for server state.

**Rationale:**
- All application state is server-derived (pricing records, upload history, stats).
- React Query provides caching, background refresh, stale-while-revalidate, and optimistic updates out of the box.
- Reduces boilerplate significantly vs. Redux + thunks.
- 30-second stale time balances freshness with API load for a dashboard with 3000 potential concurrent users.

---

## DD-06: Pagination default 50 rows, max 200

**Decision:** Default page size 50, maximum 200.

**Rationale:** A 3000-store chain with 50 SKUs and daily pricing generates ~150,000 records per day. Returning unbounded result sets would cause client memory issues and increase latency. 50 rows renders comfortably in a viewport; 200 is a safe ceiling for bulk exports. Large exports should use the dedicated "Export CSV" button which downloads the current filtered page.

---

## DD-07: Rate limiting — split upload vs read endpoints

**Decision:** Upload endpoint: 10 requests/minute. Read endpoints: 300 requests/15 minutes.

**Rationale:** CSV processing is CPU/IO intensive. Limiting uploads prevents a misbehaving client from saturating the server. Read endpoints serve dashboards and search; a higher limit accommodates legitimate high-frequency polling by monitoring tools.

---

## DD-08: Monorepo with npm workspaces

**Decision:** Single repository, `frontend/` and `backend/` workspaces, shared root `concurrently` dev script.

**Rationale:** Shared type definitions, atomic commits across API and UI, and a single `npm install` for new developers. Given the team size implied by a single SPA, the overhead of a multi-repo setup is not justified.
