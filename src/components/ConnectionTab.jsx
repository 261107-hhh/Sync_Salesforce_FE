import React, { useState } from 'react';
import api from '../api/client';
import { KeyRound, Shield, AlertCircle, CheckCircle2, Unlink } from 'lucide-react';

export default function ConnectionTab({ sfStatus, onStatusChange }) {
  const [mode, setMode] = useState('eca');
  const [instanceUrl, setInstanceUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityToken, setSecurityToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleConnect = async (e) => {
    e.preventDefault();
    setConnecting(true);
    setFeedback(null);

    try {
      const payload = { mode };
      if (mode === 'eca') {
        payload.instanceUrl = instanceUrl;
        payload.clientId = clientId;
        payload.clientSecret = clientSecret;
      } else if (mode === 'password') {
        payload.username = username;
        payload.password = password;
        payload.securityToken = securityToken;
      }

      const res = await api.post('/api/auth/connect', payload);
      if (res.data.success) {
        setFeedback({ type: 'success', message: res.data.data.message || 'Connected successfully!' });
        onStatusChange();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || err.message || 'Connection failed' });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.post('/api/auth/disconnect');
      onStatusChange();
      setFeedback({ type: 'info', message: 'Disconnected from Salesforce.' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              Salesforce Connection Setup
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Configure External Client App or credentials to sync data with PostgreSQL
            </p>
          </div>
          {sfStatus?.connected && (
            <button onClick={handleDisconnect} className="btn btn-danger btn-sm">
              <Unlink size={14} /> Disconnect
            </button>
          )}
        </div>

        {feedback && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            background: feedback.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
            color: feedback.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Mode Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { id: 'eca', label: 'External Client App', desc: 'OAuth 2.0 Client Credentials (Recommended)' },
            { id: 'mock', label: 'Mock Sandbox', desc: 'Offline testing & simulation' },
            { id: 'password', label: 'Username & Password', desc: 'Direct credentials flow' }
          ].map((m) => (
            <div
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: mode === m.id ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-input)',
                border: `1px solid ${mode === m.id ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-color)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: mode === m.id ? '#38bdf8' : '#fff' }}>
                {m.label}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {m.desc}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleConnect}>
          {mode === 'eca' && (
            <>
              <div className="form-group">
                <label className="form-label">Salesforce Instance URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://yourcompany.my.salesforce.com"
                  className="form-input"
                  value={instanceUrl}
                  onChange={(e) => setInstanceUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Consumer Key (Client ID)</label>
                <input
                  type="text"
                  required
                  placeholder="3MVG9..."
                  className="form-input"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Consumer Secret (Client Secret)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="form-input"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </div>
            </>
          )}

          {mode === 'password' && (
            <>
              <div className="form-group">
                <label className="form-label">Salesforce Username</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Security Token (Optional if IP whitelisted)</label>
                <input
                  type="password"
                  placeholder="Optional Security Token"
                  className="form-input"
                  value={securityToken}
                  onChange={(e) => setSecurityToken(e.target.value)}
                />
              </div>
            </>
          )}

          {mode === 'mock' && (
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px dashed rgba(56, 189, 248, 0.3)',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              Mock Sandbox mode allows you to simulate syncing, querying, and record creation locally without requiring a live Salesforce environment.
            </div>
          )}

          <button
            type="submit"
            disabled={connecting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {connecting ? 'Connecting...' : (mode === 'mock' ? 'Activate Mock Sandbox' : 'Authenticate & Connect')}
          </button>
        </form>
      </div>
    </div>
  );
}
