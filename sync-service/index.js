const catalystSDK = require('zcatalyst-sdk-node');
const { syncTickets } = require('./syncTickets');

/**
 * Scheduled Catalyst Function (see catalyst-config.json, runs nightly).
 * Reads all tickets from this project's Data Store and pushes them into
 * Zoho Analytics. Uses UPDATEADD (see analyticsClient.bulkImportRows), so
 * re-running this is safe and only ever upserts by ticket_id.
 */
module.exports = async (event, context) => {
  const catalystApp = catalystSDK.initialize(context);
  const zcql = catalystApp.zcql();

  const rows = await zcql.executeZCQLQuery('SELECT * FROM Tickets');
  const tickets = rows.map((r) => r.Tickets);

  const result = await syncTickets(tickets);
  console.log(`Nightly Analytics sync complete: ${result.synced} row(s)`);

  context.closeWithSuccess();
};
