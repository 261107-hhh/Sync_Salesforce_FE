import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { KeyRound, Shield, AlertCircle, CheckCircle2, Unlink, Lock, Building2, Zap, Radio } from 'lucide-react';

export default function ConnectionTab({ sfStatus, onStatusChange, onNavigateProfile }) {
  const { activeOrgId, activeOrgName, activeOrgRole, fetchMyOrgs } = useAuth();
  const isManager = activeOrgRole === 'OWNER' || activeOrgRole === 'ADMIN';

  const [mode, setMode] = useState('eca');
  const [instanceUrl, setInstanceUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityToken, setSecurityToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Pre-fill existing instanceUrl if available from status, but NEVER set username or password by default
  useEffect(() => {
    if (sfStatus?.connected) {
      if (sfStatus?.instanceUrl && !sfStatus.isMock) setInstanceUrl(sfStatus.instanceUrl);
      if (sfStatus?.mode && sfStatus.mode !== 'mock') {
        setMode(sfStatus.mode);
      } else {
        setMode('eca');
      }
    } else {
      setInstanceUrl('');
      setMode('eca');
    }
    // Never pre-fill username or password by default in the UI
    setUsername('');
    setPassword('');
    setSecurityToken('');
    setClientId('');
    setClientSecret('');
  }, [sfStatus]);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!isManager) {
      alert('Only Organization Owners and Admins can configure Salesforce credentials.');
      return;
    }

    setConnecting(true);
    setFeedback(null);

    try {
      const payload = { mode };
      if (mode === 'eca') {
        payload.instanceUrl = instanceUrl.trim();
        payload.clientId = clientId.trim();
        payload.clientSecret = clientSecret.trim();
      } else if (mode === 'password') {
        payload.instanceUrl = instanceUrl.trim();
        payload.username = username.trim();
        payload.password = password;
        payload.securityToken = securityToken.trim();
      }

      // Multi-tenant Org connect endpoint
      if (activeOrgId) {
        await api.post(`/api/orgs/${activeOrgId}/salesforce/connect`, payload);
      }
      // Synchronize session client
      try {
        await api.post('/api/auth/connect', payload);
      } catch (authErr) {
        console.warn('Session sfClient connect sync:', authErr);
      }

      setFeedback({
        type: 'success',
        message: `Salesforce connected successfully for ${activeOrgName || 'organization'}!`
      });

      if (fetchMyOrgs) await fetchMyOrgs();
      if (onStatusChange) await onStatusChange();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || err.message || 'Connection failed'
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!isManager) return;

    const confirmed = window.confirm(
      `Are you sure you want to disconnect Salesforce for ${activeOrgName || 'this workspace'}?\n\n` +
      `Live synchronization and data fetching will be suspended until reconnected.`
    );
    if (!confirmed) return;

    setConnecting(true);
    setFeedback(null);
    try {
      if (activeOrgId) {
        await api.post(`/api/orgs/${activeOrgId}/salesforce/disconnect`);
      }
      try {
        await api.post('/api/auth/disconnect');
      } catch (authErr) {
        console.warn('Session sfClient disconnect sync:', authErr);
      }

      setFeedback({
        type: 'info',
        message: `Disconnected Salesforce integration for ${activeOrgName || 'organization'}.`
      });

      // Clear credentials
      setInstanceUrl('');
      setClientId('');
      setClientSecret('');
      setUsername('');
      setPassword('');
      setSecurityToken('');

      // Immediately propagate disconnected status
      if (onStatusChange) {
        await onStatusChange({
          connected: false,
          isMock: false,
          mode: 'disconnected',
          instanceUrl: null,
          username: null
        });
      }

      if (fetchMyOrgs) await fetchMyOrgs();
    } catch (err) {
      console.error('Disconnect failed:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to disconnect Salesforce'
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Building2 size={18} color="var(--oodles-primary)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Organization Workspace:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{activeOrgName || activeOrgId}</strong>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Salesforce Integration Setup
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Configure corporate credentials once for the entire organization
            </p>
          </div>
        </div>

        {/* Live Status Hero Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          background: sfStatus?.connected ? 'rgba(52, 211, 153, 0.08)' : 'rgba(248, 113, 113, 0.08)',
          border: `1px solid ${sfStatus?.connected ? 'rgba(52, 211, 153, 0.25)' : 'rgba(248, 113, 113, 0.25)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: sfStatus?.connected ? '#34d399' : '#f87171',
              boxShadow: sfStatus?.connected ? '0 0 10px #34d399' : '0 0 8px rgba(248, 113, 113, 0.5)'
            }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {sfStatus?.connected
                    ? (sfStatus.isMock ? 'Connected to Mock Sandbox' : 'Salesforce Integration Active')
                    : 'Salesforce Disconnected'}
                </strong>
                <span className={`badge ${sfStatus?.connected ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                  {sfStatus?.connected ? (sfStatus.mode ? sfStatus.mode.toUpperCase() : 'CONNECTED') : 'INACTIVE'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {sfStatus?.connected
                  ? (sfStatus.instanceUrl ? `Target Org: ${sfStatus.instanceUrl}` : 'Local mock data generation active')
                  : 'Syncing is currently disabled. Configure credentials or activate Mock Sandbox below.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {sfStatus?.connected ? (
              isManager && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={connecting}
                  className="btn btn-danger btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Unlink size={14} />
                  {connecting ? 'Disconnecting...' : 'Disconnect Salesforce'}
                </button>
              )
            ) : (
              isManager && onNavigateProfile && (
                <button
                  type="button"
                  onClick={onNavigateProfile}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.4)' }}
                >
                  <Zap size={14} />
                  Connect Mock in Profile & Security →
                </button>
              )
            )}
          </div>
        </div>

        {/* Read-Only Notice for Non-Admins */}
        {!isManager && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <Lock size={18} color="var(--oodles-primary)" />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Shared Organization Connection: </strong>
              Salesforce integration is managed by Organization Administrators. You automatically use this shared connection to sync records.
            </div>
          </div>
        )}

        {feedback && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            background: feedback.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : (feedback.type === 'info' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(248, 113, 113, 0.1)'),
            border: `1px solid ${feedback.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : (feedback.type === 'info' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(248, 113, 113, 0.3)')}`,
            color: feedback.type === 'success' ? '#34d399' : (feedback.type === 'info' ? '#38bdf8' : '#f87171')
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Mock Sandbox Shift Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1.1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(192, 132, 252, 0.08)',
          border: '1px solid rgba(192, 132, 252, 0.25)',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Zap size={18} color="#c084fc" />
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Simulated Mock Testing: </strong>
              The Mock Sandbox option is located under the <strong>Profile & Security</strong> tab for safe testing without live Salesforce credentials.
            </div>
          </div>
          {onNavigateProfile && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.4)' }}
              onClick={onNavigateProfile}
            >
              Go to Profile & Security →
            </button>
          )}
        </div>

        {/* Live Salesforce Mode Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { id: 'eca', label: 'External Client App (ECA)', desc: 'OAuth 2.0 Client Credentials (Production Recommended)' },
            { id: 'password', label: 'Username & Password', desc: 'Direct credentials flow with Security Token' }
          ].map((m) => (
            <div
              key={m.id}
              onClick={() => isManager && setMode(m.id)}
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: mode === m.id ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-input)',
                border: `1px solid ${mode === m.id ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-color)'}`,
                cursor: isManager ? 'pointer' : 'default',
                opacity: isManager ? 1 : 0.75,
                transition: 'all 0.15s ease',
                minWidth: 0
              }}
            >
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: mode === m.id ? '#38bdf8' : 'var(--text-primary)' }}>
                {m.label}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {m.desc}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleConnect} autoComplete="off">
          {mode === 'eca' && (
            <>
              <div className="form-group">
                <label className="form-label">Salesforce Instance URL</label>
                <input
                  type="url"
                  required
                  disabled={!isManager}
                  placeholder="https://yourcompany.my.salesforce.com"
                  className="form-input"
                  value={instanceUrl}
                  autoComplete="off"
                  onChange={(e) => setInstanceUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Consumer Key (Client ID)</label>
                <input
                  type="text"
                  required
                  disabled={!isManager}
                  placeholder="consumer key..."
                  className="form-input"
                  value={clientId}
                  autoComplete="off"
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Consumer Secret (Client Secret)</label>
                <input
                  type="password"
                  required
                  disabled={!isManager}
                  placeholder="••••••••••••••••••••••••"
                  className="form-input"
                  value={clientSecret}
                  autoComplete="new-password"
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </div>
            </>
          )}

          {mode === 'password' && (
            <>
              <div className="form-group">
                <label className="form-label">Salesforce Instance URL</label>
                <input
                  type="url"
                  required
                  disabled={!isManager}
                  placeholder="https://yourcompany.my.salesforce.com"
                  className="form-input"
                  value={instanceUrl}
                  autoComplete="off"
                  onChange={(e) => setInstanceUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Salesforce Integration Username</label>
                <input
                  type="email"
                  required
                  disabled={!isManager}
                  placeholder="integration.user@company.com"
                  className="form-input"
                  value={username}
                  autoComplete="off"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  disabled={!isManager}
                  placeholder="••••••••"
                  className="form-input"
                  value={password}
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Security Token (Optional if IP Whitelisted)</label>
                <input
                  type="password"
                  disabled={!isManager}
                  placeholder="Security token string"
                  className="form-input"
                  value={securityToken}
                  autoComplete="new-password"
                  onChange={(e) => setSecurityToken(e.target.value)}
                />
              </div>
            </>
          )}

          {isManager && (
            sfStatus?.connected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={connecting}
                  className="btn btn-danger"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                    color: '#fff',
                    border: '1px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <Unlink size={16} />
                  {connecting ? 'Disconnecting Salesforce...' : 'Disconnect Salesforce'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="submit"
                    disabled={connecting}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}
                    title="Submit to re-authenticate with newly entered credentials"
                  >
                    {connecting ? 'Updating...' : 'Update & Re-authenticate Credentials'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={connecting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              >
                {connecting ? 'Saving & Authenticating...' : 'Authenticate & Connect Salesforce'}
              </button>
            )
          )}
        </form>
      </div>
    </div>
  );
}
