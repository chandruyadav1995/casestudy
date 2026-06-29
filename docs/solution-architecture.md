# Solution Architecture — Retail Pricing Feed Manager

## 1. Architecture Style

**Layered REST SPA** — a React single-page application communicates with a stateless Express REST API backed by a relational database.  The architecture deliberately keeps layers thin and responsibilities separated; it can evolve to microservices if individual domains (e.g., ingestion pipeline, audit) need independent scaling.

---

## 2. Component View (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Browser (React SPA)                                 │
│                                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────────────────┐ │
│  │  Dashboard  │  │  Upload Page │  │       Pricing Page                  │ │
│  │  - Stats    │  │  - Drop zone │  │  - SearchFilters (store/sku/price/  │ │
│  │  - Recent   │  │  - Progress  │  │    date range)                      │ │
│  │    uploads  │  │  - Validation│  │  - PricingTable (sort / paginate)   │ │
│  │             │  │    summary   │  │  - EditModal (form + audit log)     │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  api.ts (axios)  ←→  TanStack Query (cache / invalidate)               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │ HTTP REST / multipart
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Node.js Express API  (port 3001)                         │
│                                                                              │
│  Middleware:  helmet · cors · compression · morgan · rate-limit              │
│                                                                              │
│  ┌──────────────────────┐    ┌──────────────────────────────────────────┐   │
│  │   /api/feeds         │    │   /api/pricing                           │   │
│  │                      │    │                                          │   │
│  │  POST /  → upload    │    │  GET  /stats   → dashboard counts        │   │
│  │  GET  /  → list      │    │  GET  /        → paginated search        │   │
│  │  GET  /:id           │    │  GET  /:id     → single record           │   │
│  │  DELETE /:id         │    │  PUT  /:id     → update + audit log      │   │
│  │                      │    │  GET  /:id/audit → change history        │   │
│  └──────────────────────┘    └──────────────────────────────────────────┘   │
│                                                                              │
│  Services:   csv.service.ts (parse + validate)                               │
│  Middleware: upload.ts (multer, 50MB limit, CSV-only)                        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ better-sqlite3 (dev) / pg (prod)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Database Schema                                    │
│                                                                              │
│  upload_batches          pricing_records              audit_logs             │
│  ─────────────           ───────────────              ──────────             │
│  id PK                   id PK                        id PK                  │
│  filename                store_id  ◄─── INDEX        record_id FK            │
│  original_filename        sku       ◄─── INDEX        field_changed          │
│  uploaded_at              product_name ◄─ INDEX       old_value              │
│  record_count             price    ◄─── INDEX        new_value              │
│  success_count            date     ◄─── INDEX        changed_at             │
│  error_count              created_at                  changed_by             │
│  status                   updated_at                                         │
│  errors (JSON)            upload_batch_id FK                                 │
│                           UNIQUE(store_id, sku, date)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Production Deployment Architecture

```
                          ┌─────────────────────────────────────┐
                          │        AWS / Azure / GCP            │
                          │                                      │
  Users (3000 stores)     │  ┌────────┐    ┌─────────────────┐  │
  ──────────────────► CDN ──►│  ALB   │───►│  ECS / K8s      │  │
                          │  │(HTTPS) │    │  API Containers  │  │
                          │  └────────┘    │  (Node.js ×N)   │  │
                          │               └────────┬────────┘  │
                          │                        │            │
                          │  ┌─────────────────────▼──────────┐ │
                          │  │   RDS PostgreSQL (Multi-AZ)    │ │
                          │  │   + Read Replica               │ │
                          │  └────────────────────────────────┘ │
                          │                                      │
                          │  ┌────────────────────────────────┐  │
                          │  │   S3 (CSV file storage)        │  │
                          │  └────────────────────────────────┘  │
                          │                                      │
                          │  React SPA → S3 + CloudFront        │
                          └─────────────────────────────────────┘
```

---

## 4. Data Flow: CSV Upload

```
1. User selects CSV file in browser
2. Frontend validates extension client-side (fast feedback)
3. POST /api/feeds (multipart) → Express / multer saves to disk
4. csv.service.ts streams file through csv-parse
5. Each row validated by Joi schema
6. Valid rows bulk-inserted via SQLite transaction
   → UPSERT on (store_id, sku, date) — idempotent re-uploads
7. upload_batches record updated with counts + any row errors
8. Response returned: { batch_id, success_count, error_count, errors[] }
9. Frontend React Query invalidates ['feeds'] and ['stats'] caches
10. User sees success/error summary immediately
```

---

## 5. Data Flow: Search & Edit

```
GET /api/pricing?store_id=STORE-0001&price_min=5&page=2
  → Dynamic WHERE clause built from validated query params
  → Parameterised SQL (no injection risk)
  → Returns paginated { data[], total, page, total_pages }

PUT /api/pricing/42  { price: 4.99 }
  → Validate fields server-side
  → DB transaction:
      a. INSERT INTO audit_logs (old → new values)
      b. UPDATE pricing_records SET price=4.99, updated_at=now()
  → Returns updated record
```
