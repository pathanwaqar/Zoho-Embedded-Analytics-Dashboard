const { getAccessToken } = require('./analyticsClient');

const API_BASE = 'https://analyticsapi.zoho.com/restapi/v2';
const WORKSPACE_ID = process.env.ZOHO_ANALYTICS_WORKSPACE_ID;

/**
 * Applies row-level security to the Ticket_Summary view so a given Zoho
 * user (representing one tenant's embed session) only ever sees rows
 * matching that tenant's ID, regardless of what's in the shared table.
 *
 * NOTE: verify this endpoint/payload shape against the current Zoho
 * Analytics API docs before relying on it in production — the row-security
 * API has changed shape across API versions.
 */
async function applyRowLevelSecurity(viewId, { userEmail, tenantId }) {
  const token = await getAccessToken();

  const res = await fetch(`${API_BASE}/workspaces/${WORKSPACE_ID}/views/${viewId}/rowsecurity`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'ZANALYTICS-ORGID': process.env.ZOHO_ANALYTICS_ORG_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      emailIds: [userEmail],
      criteria: `"Tenant" = '${tenantId}'`,
    }),
  });

  const data = await res.json();
  if (data.status !== 'success') {
    throw new Error(`Row security update failed: ${JSON.stringify(data.summary || data)}`);
  }
  return data;
}

module.exports = { applyRowLevelSecurity };
