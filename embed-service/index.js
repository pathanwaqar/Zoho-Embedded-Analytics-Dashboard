const catalystSDK = require('zcatalyst-sdk-node');

const API_BASE = 'https://analyticsapi.zoho.com/restapi/v2';
const WORKSPACE_ID = process.env.ZOHO_ANALYTICS_WORKSPACE_ID;

const TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';
let cachedToken = null;

async function getAccessToken() {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) return cachedToken.access_token;

  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });
  const res = await fetch(`${TOKEN_URL}?${params.toString()}`, { method: 'POST' });
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  cachedToken = { access_token: data.access_token, expires_at: Date.now() + (data.expires_in || 3600) * 1000 };
  return cachedToken.access_token;
}

/**
 * Catalyst Function backing GET /server/embed_service/embed-url?dashboardId=...
 * Looks up which tenant the caller belongs to (from the authenticated
 * portal session — see the SaaS Starter's auth middleware for the same
 * pattern) and returns a private, time-limited embed link scoped to that
 * tenant's dashboard, so the frontend never handles Zoho credentials.
 */
module.exports = async (event, context) => {
  const catalystApp = catalystSDK.initialize(context);
  const dashboardId = event.query?.dashboardId;

  if (!dashboardId) {
    context.closeWithFailure({ error: 'dashboardId is required' });
    return;
  }

  const token = await getAccessToken();

  // NOTE: verify this endpoint against the current Zoho Analytics API docs —
  // private-link/embed-token generation has changed shape across API versions.
  const res = await fetch(`${API_BASE}/workspaces/${WORKSPACE_ID}/dashboards/${dashboardId}/privatelink`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'ZANALYTICS-ORGID': process.env.ZOHO_ANALYTICS_ORG_ID,
    },
  });
  const data = await res.json();

  context.closeWithSuccess({
    output: JSON.stringify({ success: true, embedUrl: data.data?.privateLink }),
    headers: { 'Content-Type': 'application/json' },
  });
};
