const TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';
const API_BASE = 'https://analyticsapi.zoho.com/restapi/v2';

let cachedToken = null;

async function getAccessToken() {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken.access_token;
  }

  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  const res = await fetch(`${TOKEN_URL}?${params.toString()}`, { method: 'POST' });
  const data = await res.json();
  if (data.error) throw new Error(`OAuth refresh failed: ${data.error}`);

  cachedToken = { access_token: data.access_token, expires_at: Date.now() + (data.expires_in || 3600) * 1000 };
  return cachedToken.access_token;
}

async function analyticsRequest(path, options = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'ZANALYTICS-ORGID': process.env.ZOHO_ANALYTICS_ORG_ID,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();
  if (data.status !== 'success') {
    throw new Error(`Analytics API error: ${JSON.stringify(data.summary || data)}`);
  }
  return data;
}

const WORKSPACE_ID = process.env.ZOHO_ANALYTICS_WORKSPACE_ID;

/**
 * Creates a Query Table — a virtual table backed by a SQL query over
 * existing tables in the workspace, used as the source for aggregated
 * reports instead of a raw imported table.
 */
async function createQueryTable(tableName, sql) {
  return analyticsRequest(`/workspaces/${WORKSPACE_ID}/views`, {
    method: 'POST',
    body: JSON.stringify({
      viewName: tableName,
      viewType: 'Query',
      query: sql,
    }),
  });
}

/**
 * Bulk-import rows into a regular (non-query) table, e.g. "Tickets".
 * `importType` is APPEND for new rows or UPDATEADD to upsert on a matching
 * key column (used here so re-running the sync is safe/idempotent).
 */
async function bulkImportRows(tableName, rows, { matchColumn } = {}) {
  const importType = matchColumn ? 'UPDATEADD' : 'APPEND';

  return analyticsRequest(`/bulk/workspaces/${WORKSPACE_ID}/data`, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        tableName,
        importType,
        ...(matchColumn ? { matchingColumns: [matchColumn] } : {}),
      },
      dataFile: rows,
    }),
  });
}

module.exports = { createQueryTable, bulkImportRows, getAccessToken };
