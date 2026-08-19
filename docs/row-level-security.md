# Row-Level Security & Reporting Model

## Reporting model

```
Tickets (raw table, synced nightly from the source app)
    │  columns: ticket_id, tenant_id, project_id, priority, status, created_time
    │
    ▼
Ticket_Summary (Query Table — see provisioning/ticket_summary.sql)
    │  grouped by tenant_id, project_id, date, priority
    │  adds computed columns: Ticket Count, Open Count, Closed Count, Close Rate %
    │
    ▼
Per-tenant Dashboard (created by provisioning/provisionTenant.js)
    │  3 components, all reading Ticket_Summary:
    │    - line chart: Open Count over Date
    │    - pie chart: Ticket Count by Priority
    │    - table: raw Ticket_Summary rows
    │
    ▼
Row-level security (applied per tenant on Ticket_Summary)
    criteria: "Tenant" = '<tenant_id>'
```

Reports and dashboards are built on `Ticket_Summary`, not the raw `Tickets`
table — pre-aggregating means the embedded charts render fast even as the
raw ticket volume grows, and it keeps the row-security criteria simple
(one column, one equality check) instead of needing to reason about joins.

## Row-level security approach

Zoho Analytics' row-level security binds a Zoho user (or group) to a
criteria expression on a specific view. Two ways to map "tenant" onto
that model:

1. **One Zoho user per tenant** — most explicit, but means provisioning a
   real Zoho Analytics user for every tenant in your app, which usually
   requires a paid per-user Analytics plan.
2. **One shared "embed" user + criteria baked into the private link** —
   what `embed-service/index.js` and `provisioning/setRowLevelSecurity.js`
   assume here: a single service account is used to generate short-lived
   private dashboard links, and the `"Tenant" = '<tenant_id>'` criteria is
   applied to the view (or passed via the private link's own criteria
   parameter, depending on which embedding approach — dashboard private
   link vs. iframe URL with row filters — is available on your plan).

Either way, the critical invariant is the same: **the criteria is applied
server-side, before the link is handed to the browser** — the React portal
(`portal/src/App.jsx`) never constructs or modifies the embed URL itself,
it only renders whatever URL `embed-service` returns.

## Data Store dependency

This project reads tenant ticket data from the same Catalyst project as
the [Catalyst SaaS Starter](../01-catalyst-saas-starter) — `sync-service`
queries the `Tickets` table via ZCQL, exactly as that project defines it.
If you're running this repo standalone, either deploy it into the same
Catalyst project as the SaaS Starter, or point `sync-service/index.js` at
your own ticket/order data source.
