# Context Diagram — Retail Pricing Feed Manager

## System Context (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    External Actors                                       │
│                                                                                          │
│   ┌──────────────────┐          ┌──────────────────┐       ┌──────────────────────────┐ │
│   │  Store Pricing   │          │  Category / HQ   │       │    ERP / POS Systems     │ │
│   │    Analysts      │          │    Managers      │       │  (future integration)    │ │
│   │                  │          │                  │       │                          │ │
│   │ • Upload CSV     │          │ • View dashboards│       │ • Push pricing events    │ │
│   │ • Edit records   │          │ • Audit changes  │       │ • Pull approved prices   │ │
│   └────────┬─────────┘          └────────┬─────────┘       └──────────────┬───────────┘ │
│            │                            │                                 │             │
└────────────│────────────────────────────│─────────────────────────────────│─────────────┘
             │                            │                                 │
             ▼                            ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│                       RETAIL PRICING FEED MANAGER                                        │
│                       ─────────────────────────                                          │
│                                                                                          │
│  A single-page web application that enables retail chain personnel to:                   │
│                                                                                          │
│  1. INGEST   → Upload CSV pricing feeds from any of 3,000+ stores                       │
│  2. VALIDATE → Enforce schema rules, report row-level errors on upload                   │
│  3. STORE    → Persist pricing records in a durable, indexed relational store            │
│  4. SEARCH   → Query records by store, SKU, product name, price range, date              │
│  5. AUDIT    → Track every field-level change with who/when metadata                     │
│  6. EDIT     → Correct individual pricing records via a validated form                   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
             │                            │                                 │
             ▼                            ▼                                 ▼
┌─────────────────┐           ┌──────────────────────┐        ┌────────────────────────┐
│  SQLite / PG    │           │  Local File System   │        │  Browser Storage       │
│  Database       │           │  (uploaded CSVs)     │        │  (React Query cache)   │
│                 │           │                      │        │                        │
│  pricing_records│           │  Stored for audit    │        │  30s stale-time        │
│  upload_batches │           │  and re-processing   │        │  client-side           │
│  audit_logs     │           │                      │        │                        │
└─────────────────┘           └──────────────────────┘        └────────────────────────┘
```

## Key Interfaces

| From              | To                       | Protocol      | Description                              |
|-------------------|--------------------------|---------------|------------------------------------------|
| Browser (SPA)     | REST API (Express)       | HTTP/JSON     | All data operations                      |
| REST API          | SQLite / PostgreSQL       | SQL (driver)  | Persistence layer                        |
| Browser           | REST API                 | multipart     | CSV file upload                          |
| REST API          | Filesystem               | Node.js fs    | CSV file storage and streaming           |

## Deployment Context

```
  [User Browser]
       │  HTTPS
       ▼
  [CDN / Reverse Proxy (nginx / Cloudfront)]
       │
       ├─── Static assets (React SPA)
       │
       └─── /api/* ────► [Node.js Express API cluster]
                              │
                        ┌─────┴──────┐
                   [Database]   [Object Storage]
                   PostgreSQL   (CSV originals)
```
