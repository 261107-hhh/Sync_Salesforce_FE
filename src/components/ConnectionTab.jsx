import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { KeyRound, Shield, AlertCircle, CheckCircle2, Unlink, Lock, Building2, Zap, Radio } from 'lucide-react';

export default function ConnectionTab({ sfStatus, onStatusChange }) {
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

  // Pre-fill existing instanceUrl if available from status
  useEffect(() => {
    if (sfStatus?.connected) {
      if (sfStatus?.instanceUrl) setInstanceUrl(sfStatus.instanceUrl);
      if (sfStatus?.mode) setMode(sfStatus.mode);
    } else {
      if (mode !== 'mock') {
        setInstanceUrl('');
      }
    }
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
      } else if (mode === 'mock') {
        payload.instanceUrl = instanceUrl.trim() || 'https://mock.salesforce.local';
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

  const handleQuickConnectMock = async () => {
    if (!isManager) return;
    setConnecting(true);
    setFeedback(null);
    try {
      const payload = { mode: 'mock', instanceUrl: 'https://mock.salesforce.local' };
      if (activeOrgId) {
        await api.post(`/api/orgs/${activeOrgId}/salesforce/connect`, payload);
      }
      try {
        await api.post('/api/auth/connect', payload);
      } catch (e) {
        // ignore
      }

      setFeedback({
        type: 'success',
        message: `Mock Sandbox activated successfully for ${activeOrgName || 'organization'}!`
      });

      if (onStatusChange) {
        await onStatusChange({
          connected: true,
          isMock: true,
          mode: 'mock',
          instanceUrl: 'https://mock.salesforce.local',
          username: 'developer@sandbox.mock'
        });
      }
      if (fetchMyOrgs) await fetchMyOrgs();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to activate mock sandbox'
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
              <Building2 size={18} color="#38bdf8" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Organization Workspace:</span>
              <strong style={{ color: '#fff' }}>{activeOrgName || activeOrgId}</strong>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
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
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
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
              isManager && (
                <button
                  type="button"
                  onClick={handleQuickConnectMock}
                  disabled={connecting}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Zap size={14} color="#38bdf8" />
                  Quick Connect Mock
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
            <Lock size={18} color="#38bdf8" />
            <div>
              <strong style={{ color: '#fff' }}>Shared Organization Connection: </strong>
              Salesforce integration is managed by Organization Administrators. As a <strong>{activeOrgRole}</strong>, you automatically use this shared connection to sync records.
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

        {/* Mode Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { id: 'eca', label: 'External Client App', desc: 'OAuth 2.0 Client Credentials (Production Recommended)' },
            { id: 'mock', label: 'Mock Sandbox', desc: 'Local testing & simulation without live SF org' },
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
                  disabled={!isManager}
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
                  disabled={!isManager}
                  placeholder="3MVG9lKcPoNInDA..."
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
                  disabled={!isManager}
                  placeholder="••••••••••••••••••••••••"
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
                <label className="form-label">Salesforce Instance URL</label>
                <input
                  type="url"
                  required
                  disabled={!isManager}
                  placeholder="https://yourcompany.my.salesforce.com"
                  className="form-input"
                  value={instanceUrl}
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
              Mock Sandbox mode allows your entire organization team to simulate syncing, querying, and record creation locally without requiring live Salesforce credentials.
            </div>
          )}

          {isManager && (
            <button
              type="submit"
              disabled={connecting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {connecting ? 'Saving & Authenticating...' : (mode === 'mock' ? 'Activate Mock Sandbox for Team' : 'Authenticate & Connect Salesforce')}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
