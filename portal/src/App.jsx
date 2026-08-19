import React, { useEffect, useState } from 'react';

/**
 * Authenticated route in the real app — this component assumes the caller
 * is already logged in and scoped to a tenant (same pattern as the
 * Catalyst SaaS Starter's AuthContext). It never talks to Zoho directly:
 * it asks our own embed-service for a private, tenant-scoped embed link
 * and drops that straight into an iframe.
 */
export default function App() {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const dashboardId = new URLSearchParams(window.location.search).get('dashboardId');

    fetch(`/server/embed_service/embed-url?dashboardId=${dashboardId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || 'Failed to load dashboard');
        setEmbedUrl(data.embedUrl);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: '#de350b', padding: '2rem' }}>{error}</p>;
  if (!embedUrl) return <p style={{ padding: '2rem' }}>Loading dashboard…</p>;

  return (
    <iframe
      title="Tenant Ticket Dashboard"
      src={embedUrl}
      style={{ width: '100%', height: '100vh', border: 'none' }}
    />
  );
}
