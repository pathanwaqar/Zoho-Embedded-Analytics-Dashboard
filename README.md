# Embedded Analytics Dashboard

A custom portal that pushes application data into **Zoho Analytics** via the Bulk API, provisions reports/dashboards programmatically, and embeds them back into a React app with row-level security — showing API-driven Analytics work beyond the drag-and-drop UI.

## Overview

Most "Zoho Analytics" work clients see is manual dashboard-building in the Zoho UI. This project demonstrates the developer-facing side: ingesting data from an external application into Zoho Analytics via API, creating/configuring reports and dashboards programmatically, and embedding those dashboards securely inside a custom customer-facing portal — one dashboard per tenant, with each tenant only seeing their own rows.

## Architecture

```
 ┌────────────────┐   Bulk API (data push)   ┌─────────────────────┐
 │  Source App     │ ───────────────────────▶ │   Zoho Analytics     │
 │ (Postgres/      │                          │  Workspace            │
 │  Catalyst Data  │                          │  - Table synced        │
 │  Store)         │                          │    from source data    │
 └────────────────┘                          │  - Reports/Dashboards   │
                                              │    created via API      │
                                              └──────────┬───────────┘
                                                         │ embed URL +
                                                         │ row-level
                                                         │ security token
                                                         ▼
                                              ┌─────────────────────┐
                                              │   React Portal       │
                                              │  (per-tenant view,   │
                                              │   iframe embed)      │
                                              └─────────────────────┘
```

## Tech Stack

- **Frontend:** React (dashboard portal shell)
- **Backend:** Node.js (Catalyst AppSail) — handles data sync + Analytics API calls
- **Analytics:** Zoho Analytics Bulk API, Reports API, Embed API
- **Auth:** OAuth 2.0 (`ZohoAnalytics.data.all`, `ZohoAnalytics.metadata.all`), per-tenant embed tokens

## Zoho Services / APIs Used

| Purpose | API |
|---|---|
| Data ingestion | Zoho Analytics Bulk API (create/append rows) |
| Programmatic report/dashboard creation | Zoho Analytics Reports API |
| Secure embedding | Zoho Analytics Embed API + row-level security (View restriction by criteria) |
| Scheduling data sync | Zoho Catalyst Job Scheduling |

## Key Features

- Nightly sync job pushes new/updated records from the source app into a Zoho Analytics table via the Bulk API
- Script that provisions a starter set of reports and a dashboard for a new tenant automatically via the Reports API (no manual clicking in the Zoho Analytics UI)
- Row-level security: each tenant's embed link only shows rows matching their `tenant_id`
- React portal wraps the embed in an authenticated route, so end customers never touch Zoho credentials directly

## Getting Started

### Prerequisites

- Zoho Analytics account (trial workspace is fine) with a workspace created
- Zoho API Console credentials with Analytics scopes (`ZohoAnalytics.data.all`, `ZohoAnalytics.metadata.all`)
- Node.js 18+

### Setup

```bash
git clone https://github.com/<your-username>/embedded-analytics-dashboard.git
cd embedded-analytics-dashboard
cp .env.example .env    # fill in your Zoho Analytics credentials

cd provisioning && npm install --no-save   # no package.json deps besides fetch (built-in Node 18+)
```

### 1. Create the Query Table

This creates the `Ticket_Summary` view from the real SQL in [`provisioning/ticket_summary.sql`](provisioning/ticket_summary.sql):

```bash
node provisioning/createQueryTable.js
```

### 2. Sync data in

```bash
node -e "require('./sync-service/syncTickets').syncTickets([
  { ROWID: '1', organization: 'acme', projectId: 'p1', priority: 'high', status: 'open', CREATEDTIME: new Date().toISOString() }
])"
```

In production this runs automatically as the `sync_service` scheduled Catalyst Function (nightly, see `sync-service/catalyst-config.json`), pulling real rows from the Catalyst SaaS Starter's `Tickets` table via ZCQL.

### 3. Provision a tenant dashboard

```bash
node provisioning/provisionTenant.js acme "Acme Corp" embed-user@yourorg.com <ticketSummaryViewId>
```

### 4. Run the portal

```bash
cd portal
npm install
npm run dev
```

### Deploy to Catalyst

```bash
catalyst init
catalyst deploy
```

## Project Structure

```
embedded-analytics-dashboard/
├── provisioning/
│   ├── ticket_summary.sql         # the actual Query Table SQL
│   ├── analyticsClient.js         # OAuth + Bulk API + Query Table API wrapper
│   ├── createQueryTable.js        # provisions the Ticket_Summary view
│   ├── setRowLevelSecurity.js     # applies per-tenant row security criteria
│   └── provisionTenant.js         # end-to-end: security + starter dashboard for a new tenant
├── sync-service/                  # scheduled Catalyst Function: ZCQL → Analytics Bulk API
├── embed-service/                 # Catalyst Function: mints per-tenant private embed links
├── portal/                        # React app rendering the embed in an iframe
├── catalyst.json
└── docs/
    └── row-level-security.md      # reporting model + row-security approach
```

## Roadmap

- [ ] Add a self-service "create my dashboard" onboarding flow
- [ ] Support scheduled PDF/email exports of dashboards per tenant
- [ ] Add incremental sync (delta only) instead of full nightly push

---

## Author

**Waqar Pathan**
Email: pathanwaqar26@gmail.com
