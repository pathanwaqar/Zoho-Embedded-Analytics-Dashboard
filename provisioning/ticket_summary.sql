-- Zoho Analytics Query Table definition for "Ticket_Summary".
-- A Query Table is a virtual table backed by this SQL, defined once via
-- the Analytics API (see createQueryTable.js) and then usable as the data
-- source for reports/dashboards exactly like a regular imported table.
--
-- Source table "Tickets" is populated by sync-service/syncTickets.js from
-- the Catalyst SaaS Starter's ticket data (see ../../01-catalyst-saas-starter).

SELECT
    "tenant_id" AS "Tenant",
    "project_id" AS "Project",
    DATE("created_time") AS "Date",
    "priority" AS "Priority",
    COUNT("ticket_id") AS "Ticket Count",
    SUM(CASE WHEN "status" = 'closed' THEN 1 ELSE 0 END) AS "Closed Count",
    SUM(CASE WHEN "status" != 'closed' THEN 1 ELSE 0 END) AS "Open Count",
    ROUND(
        SUM(CASE WHEN "status" = 'closed' THEN 1 ELSE 0 END) * 100.0 / COUNT("ticket_id"),
        1
    ) AS "Close Rate %"
FROM "Tickets"
GROUP BY "tenant_id", "project_id", DATE("created_time"), "priority"
