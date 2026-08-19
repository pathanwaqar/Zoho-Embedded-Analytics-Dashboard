const fs = require('fs');
const path = require('path');
const { createQueryTable } = require('./analyticsClient');

/**
 * One-time (or re-run-safe) provisioning script: creates the "Ticket_Summary"
 * Query Table from ticket_summary.sql. Run with:
 *   node provisioning/createQueryTable.js
 */
async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'ticket_summary.sql'), 'utf8');

  console.log('Creating Query Table "Ticket_Summary"...');
  const result = await createQueryTable('Ticket_Summary', sql);
  console.log('Created:', result.data?.viewId || result);
}

main().catch((err) => {
  console.error('Failed to create Query Table:', err.message);
  process.exit(1);
});
