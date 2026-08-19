const { applyRowLevelSecurity } = require('./setRowLevelSecurity');
const { getAccessToken } = require('./analyticsClient');

const API_BASE = 'https://analyticsapi.zoho.com/restapi/v2';
const WORKSPACE_ID = process.env.ZOHO_ANALYTICS_WORKSPACE_ID;

/**
 * Runs once per new tenant onboarded to the portal:
 *   1. Ensures a Zoho Analytics user exists for the tenant's embed session
 *      (or reuses a shared "embed" user — see docs/row-level-security.md).
 *   2. Applies row-level security scoped to that tenant's rows.
 *   3. Creates a starter dashboard pinned to the Ticket_Summary view,
 *      filtered to that tenant, so a new tenant gets a working dashboard
 *      with zero manual clicking in the Zoho Analytics UI.
 */
async function provisionTenant({ tenantId, tenantName, embedUserEmail, ticketSummaryViewId }) {
  await applyRowLevelSecurity(ticketSummaryViewId, { userEmail: embedUserEmail, tenantId });

  const dashboard = await createTenantDashboard(tenantName, ticketSummaryViewId);

  console.log(`Provisioned dashboard "${dashboard.data.viewName}" (view ${dashboard.data.viewId}) for tenant ${tenantId}`);
  return dashboard;
}

async function createTenantDashboard(tenantName, ticketSummaryViewId) {
  const token = await getAccessToken();

  const res = await fetch(`${API_BASE}/workspaces/${WORKSPACE_ID}/dashboards`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'ZANALYTICS-ORGID': process.env.ZOHO_ANALYTICS_ORG_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dashboardName: `${tenantName} — Ticket Overview`,
      components: [
        { viewId: ticketSummaryViewId, chartType: 'line', xAxis: 'Date', yAxis: 'Open Count' },
        { viewId: ticketSummaryViewId, chartType: 'pie', groupBy: 'Priority', value: 'Ticket Count' },
        { viewId: ticketSummaryViewId, chartType: 'table' },
      ],
    }),
  });

  const data = await res.json();
  if (data.status !== 'success') {
    throw new Error(`Dashboard creation failed: ${JSON.stringify(data.summary || data)}`);
  }
  return data;
}

if (require.main === module) {
  provisionTenant({
    tenantId: process.argv[2],
    tenantName: process.argv[3],
    embedUserEmail: process.argv[4],
    ticketSummaryViewId: process.argv[5],
  }).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { provisionTenant };
