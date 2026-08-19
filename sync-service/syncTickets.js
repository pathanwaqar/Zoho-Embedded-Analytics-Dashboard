const { bulkImportRows } = require('../provisioning/analyticsClient');

/**
 * Pulls tickets from the source app's Data Store (see
 * ../../01-catalyst-saas-starter/appsail/services/dataStore.js for the
 * equivalent table shape) and upserts them into the "Tickets" table in
 * Zoho Analytics via the Bulk API.
 *
 * Runs as a Catalyst scheduled Function in production (see
 * catalyst-config.json); callable directly for local testing.
 */
async function syncTickets(tickets) {
  const rows = tickets.map((t) => ({
    ticket_id: t.ROWID,
    tenant_id: t.organization,
    project_id: t.projectId,
    priority: t.priority,
    status: t.status,
    created_time: t.CREATEDTIME,
  }));

  if (!rows.length) {
    console.log('No tickets to sync');
    return { synced: 0 };
  }

  await bulkImportRows('Tickets', rows, { matchColumn: 'ticket_id' });
  console.log(`Synced ${rows.length} ticket row(s) to Zoho Analytics`);
  return { synced: rows.length };
}

module.exports = { syncTickets };
