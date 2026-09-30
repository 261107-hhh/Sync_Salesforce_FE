import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Building2, User, Lock, ArrowRight, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

export default function AcceptInviteModal({ token, onJoined, onCancel }) {
  const { acceptInvitation } = useAuth();
  const [inviteInfo, setInviteInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      loadInviteInfo();
    }
  }, [token]);

  const loadInviteInfo = async () => {
    setLoadingInfo(true);
    setError('');
    try {
      const res = await api.get('/api/orgs/invitations/info', {
        params: { token }
      });
      if (res.data.success && res.data.data) {
        setInviteInfo(res.data.data);
      } else {
        setError('Invalid or expired invitation link.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid or expired invitation token.');
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await acceptInvitation(token, name.trim(), password);
      if (res.success) {
        if (onJoined) onJoined(res.data);
      } else {
        setError(res.message || 'Failed to accept invitation');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(circle at center, #0f172a 0%, #060913 100%)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(56, 189, 248, 0.35)',
            marginBottom: '1rem',
            color: '#fff'
          }}>
            <Building2 size={26} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Join Organization
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            You have been invited to collaborate in a multi-tenant Salesforce data workspace
          </p>
        </div>

        {loadingInfo ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Verifying invitation credentials...
          </div>
        ) : error ? (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            {onCancel && (
              <button onClick={onCancel} className="btn btn-secondary" style={{ width: '100%' }}>
                Back to Sign In
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Invitation Details Banner */}
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              marginBottom: '1.5rem',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Organization:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{inviteInfo?.organizationName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{inviteInfo?.email}</span>
              </div>
              {inviteInfo?.role && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Role:</span>
                  <span className="badge badge-info">{inviteInfo.role}</span>
                </div>
              )}
              {inviteInfo?.invitedBy && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Invited By:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{inviteInfo.invitedBy}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Your Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Set Account Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  You will use this password alongside <strong>{inviteInfo?.email}</strong> to sign in anytime.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
              >
                {submitting ? 'Setting up account...' : `Accept & Join ${inviteInfo?.organizationName}`}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
