# Assumptions & Non-Functional Requirements

## Assumptions

| # | Assumption |
|---|------------|
| A1 | Each store submits a daily pricing feed; not real-time streaming. |
| A2 | Feeds are provided as flat CSV files; no EDI or proprietary formats in scope. |
| A3 | The application is accessed by a relatively small number of internal users (analysts, category managers) — not public-facing. |
| A4 | "Multiple countries" implies different locales and currencies, but this implementation uses a single currency representation. Multi-currency can be layered on by adding a `currency_code` column and store metadata. |
| A5 | Authentication and RBAC are out of scope for this deliverable; the architecture shows where it would be inserted (reverse proxy / JWT middleware). |
| A6 | The unique pricing key is `(store_id, sku, date)` — one price per product per store per day. Intra-day price changes would require adding a timestamp component. |
| A7 | CSV column headers can be in any case (normalised during parsing); the five required columns are `store_id`, `sku`, `product_name`, `price`, `date`. |

---

## Non-Functional Requirements Addressed

### Performance

| Requirement | Implementation |
|-------------|---------------|
| Sub-second search response for common filters | Composite indexes on `store_id`, `sku`, `date`, `price`, `product_name` |
| Efficient CSV import (100k rows) | Streaming CSV parser + single SQLite `TRANSACTION` (batch insert) |
| Responsive UI under load | React Query caching; stale-while-revalidate; paginated API responses |
| WAL mode for concurrent reads | `PRAGMA journal_mode = WAL` — allows concurrent reads during writes |

### Scalability

| Requirement | Implementation |
|-------------|---------------|
| 3,000 stores × 50 SKUs × 365 days = ~55M records/year | Indexed relational DB; tested schema design; horizontal API scaling via stateless containers |
| Multiple concurrent uploads | Each upload is an independent transaction; no global lock |
| Horizontal API scaling | Stateless Express server; all state in DB; session-free |

### Security

| Requirement | Implementation |
|-------------|---------------|
| SQL injection prevention | Parameterised queries (`db.prepare()`) throughout — no string concatenation |
| XSS prevention | React's JSX escaping; Helmet sets security headers (CSP, HSTS, etc.) |
| File upload safety | MIME type + extension validation; files stored outside web root; original filename sanitised |
| Rate limiting | Separate limits for upload (10/min) and read (300/15min) endpoints |
| CORS | Explicit allowlist; credentials mode off for API-only access |

### Availability

| Requirement | Implementation / Recommendation |
|-------------|-------------------------------|
| Zero-downtime deploys | Stateless API containers → rolling restart behind ALB |
| Database resilience | RDS Multi-AZ (production); WAL + automated backups |
| CDN for SPA | CloudFront / Netlify for static React bundle |
| Health check endpoint | `GET /api/health` — used by load balancer and uptime monitors |

### Data Integrity

| Requirement | Implementation |
|-------------|---------------|
| No duplicate records | UNIQUE constraint on `(store_id, sku, date)` |
| Referential integrity | Foreign keys enforced (`PRAGMA foreign_keys = ON`) |
| Audit trail | `audit_logs` table records every field change with timestamp |
| Validation on ingest | Joi schema validates every CSV row; errors reported without halting batch |
| Price constraint | `CHECK (price >= 0)` at DB level |

### Observability

| Requirement | Implementation |
|-------------|---------------|
| Request logging | `morgan` middleware (combined format in production) |
| Error tracking | Structured error responses; stack traces in development only |
| Metrics (recommended) | Prometheus `/metrics` endpoint (not in scope but easily added) |
| Upload batch visibility | `upload_batches` table tracks status, row counts, and error details per upload |

### Maintainability

| Requirement | Implementation |
|-------------|---------------|
| Type safety | TypeScript end-to-end (strict mode) |
| Shared types | `frontend/src/types` mirrors `backend/src/types` |
| Separation of concerns | Controllers / services / routes / middleware layers |
| Reproducible environments | `.env.example` template; workspace `npm install` script |

### Internationalisation (Multi-country)

The current implementation stores `store_id` as a free-form string; the recommended convention is to prefix with a 2-letter ISO country code (e.g., `AU-STORE-0001`, `GB-STORE-0042`). This enables country-scoped filtering without a schema change. Future work would add:
- `country_code` column on `pricing_records`
- `currency_code` column + conversion rates table
- Locale-aware date/number formatting in the UI
