# Retail Pricing Feed Manager

A single-page web application for managing retail store pricing data across a chain of 3,000+ stores. Supports CSV upload, search, edit, and full audit history.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 · TypeScript · Vite        |
| Styling  | Tailwind CSS                        |
| State    | TanStack Query (React Query)        |
| Backend  | Node.js · Express · TypeScript      |
| Database | SQLite (dev) → PostgreSQL (prod)    |
| CSV      | csv-parse (server) · multer upload  |
| Security | Helmet · CORS · Rate limiting       |

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Install & Run

```bash
# 1. Clone the repo
git clone <repo-url>
cd retail-pricing-app

# 2. Install all dependencies (root + backend + frontend)
npm run install:all

# 3. Start both API and UI in dev mode
npm run dev
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3001
- **API Health:** http://localhost:3001/api/health

### Seed Sample Data (optional)

```bash
npm run seed
```

This seeds 20 stores × 50 SKUs × 3 days = 3,000 pricing records for demo purposes.

### Upload a Sample CSV

```bash
# The sample CSV is at scripts/sample.csv
# Use the Upload page in the UI, or via curl:
curl -X POST http://localhost:3001/api/feeds \
  -F "file=@scripts/sample.csv"
```

---

## API Reference

### Feeds

| Method | Path             | Description                      |
|--------|------------------|----------------------------------|
| POST   | /api/feeds       | Upload a CSV pricing feed        |
| GET    | /api/feeds       | List all upload batches          |
| GET    | /api/feeds/:id   | Get batch details + errors       |
| DELETE | /api/feeds/:id   | Delete batch + its records       |

### Pricing Records

| Method | Path                   | Description                      |
|--------|------------------------|----------------------------------|
| GET    | /api/pricing           | Search with filters + pagination |
| GET    | /api/pricing/stats     | Dashboard aggregate stats        |
| GET    | /api/pricing/:id       | Get single record                |
| PUT    | /api/pricing/:id       | Update record (audit logged)     |
| GET    | /api/pricing/:id/audit | View change history              |

#### Search Parameters

| Param        | Type   | Description                    |
|--------------|--------|--------------------------------|
| store_id     | string | Exact match                    |
| sku          | string | Partial match (LIKE %…%)       |
| product_name | string | Partial match (LIKE %…%)       |
| price_min    | number | Minimum price                  |
| price_max    | number | Maximum price                  |
| date_from    | string | ISO date YYYY-MM-DD            |
| date_to      | string | ISO date YYYY-MM-DD            |
| page         | number | Page number (default: 1)       |
| limit        | number | Page size (default: 50, max 200)|
| sort_by      | string | Column name                    |
| sort_order   | string | asc \| desc                    |

---

## CSV Format

```csv
store_id,sku,product_name,price,date
STORE-0001,MILK-2L,Full Cream Milk 2L,3.50,2024-06-15
```

- Headers are **case-insensitive** and spaces are normalised
- `price` must be a positive decimal
- `date` must be `YYYY-MM-DD`
- Re-uploading the same `(store_id, sku, date)` overwrites the existing record (idempotent)

---

## Project Structure

```
retail-pricing-app/
├── backend/
│   └── src/
│       ├── app.ts                # Express server + middleware
│       ├── config/database.ts    # SQLite setup + schema
│       ├── controllers/          # Business logic
│       ├── routes/               # Express routers
│       ├── middleware/upload.ts  # Multer CSV upload
│       ├── services/csv.service.ts
│       ├── scripts/seed.ts       # Demo data
│       └── types/index.ts
├── frontend/
│   └── src/
│       ├── App.tsx               # Router + layout
│       ├── pages/                # Dashboard, Upload, Pricing
│       ├── components/           # Reusable UI components
│       ├── services/api.ts       # Axios API client
│       └── types/index.ts
├── docs/
│   ├── context-diagram.md
│   ├── solution-architecture.md
│   ├── design-decisions.md
│   └── assumptions.md
└── scripts/
    └── sample.csv                # 24-row demo feed
```

---

## Architecture Documents

- [Context Diagram](docs/context-diagram.md)
- [Solution Architecture](docs/solution-architecture.md)
- [Design Decisions](docs/design-decisions.md)
- [Assumptions & NFRs](docs/assumptions.md)

---

## Production Considerations

| Area         | Recommendation                                                  |
|--------------|-----------------------------------------------------------------|
| Database     | Replace SQLite with PostgreSQL (RDS Multi-AZ)                   |
| Auth         | Add JWT middleware + OAuth2 SSO (Azure AD / Okta)              |
| Storage      | Move uploaded CSVs to S3 / Azure Blob                           |
| API          | Deploy as Docker containers on ECS / K8s behind an ALB          |
| Frontend     | Deploy React bundle to S3 + CloudFront                          |
| Monitoring   | Add Prometheus `/metrics` endpoint; ship logs to CloudWatch/Datadog |
| Queue        | For very large files (>500k rows), push to SQS/worker process   |
| Multi-region | Cross-region read replicas for stores in different geographies  |
