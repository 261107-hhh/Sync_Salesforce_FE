import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import TeamManagement from './TeamManagement';
import ConnectionTab from './ConnectionTab';
import {
  User,
  Building2,
  Users,
  Link as LinkIcon,
  Shield,
  Check,
  Plus,
  Mail,
  Calendar,
  Lock,
  ExternalLink,
  LogOut,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Zap,
  Unlink
} from 'lucide-react';

export default function UserAccountTab({
  sfStatus,
  onStatusChange,
  onOpenCreateOrg,
  initialSubTab = 'workspaces'
}) {
  const {
    user,
    logout,
    activeOrgId,
    activeOrgName,
    activeOrgRole,
    organizations,
    switchOrg
  } = useAuth();

  const [subTab, setSubTab] = useState(initialSubTab);
  const [switchingId, setSwitchingId] = useState(null);
  const [mockConnecting, setMockConnecting] = useState(false);
  const [mockFeedback, setMockFeedback] = useState(null);

  const handleConnectMock = async () => {
    if (activeOrgRole !== 'OWNER' && activeOrgRole !== 'ADMIN') {
      alert('Only Organization Owners and Admins can connect to the Mock Sandbox.');
      return;
    }

    setMockConnecting(true);
    setMockFeedback(null);
    try {
      const payload = { mode: 'mock', instanceUrl: 'https://mock.salesforce.local' };
      if (activeOrgId) {
        await api.post(`/api/orgs/${activeOrgId}/salesforce/connect`, payload);
      }
      try {
        await api.post('/api/auth/connect', payload);
      } catch (e) {
        console.warn('Session mock connect sync:', e);
      }

      setMockFeedback({
        type: 'success',
        message: `Successfully connected ${activeOrgName || 'workspace'} to Mock Sandbox!`
      });

      if (onStatusChange) {
        await onStatusChange({
          connected: true,
          isMock: true,
          mode: 'mock',
          instanceUrl: 'https://mock.salesforce.local',
          username: null,
          organizationId: activeOrgId,
          organizationName: activeOrgName
        });
      }
    } catch (err) {
      console.error('Connect mock error:', err);
      setMockFeedback({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to connect to Mock Sandbox'
      });
    } finally {
      setMockConnecting(false);
    }
  };

  const handleDisconnectMock = async () => {
    if (activeOrgRole !== 'OWNER' && activeOrgRole !== 'ADMIN') {
      alert('Only Organization Owners and Admins can disconnect the Mock Sandbox.');
      return;
    }

    const confirmed = window.confirm(`Disconnect Mock Sandbox for ${activeOrgName || 'this workspace'}?`);
    if (!confirmed) return;

    setMockConnecting(true);
    setMockFeedback(null);
    try {
      if (activeOrgId) {
        await api.post(`/api/orgs/${activeOrgId}/salesforce/disconnect`);
      }
      try {
        await api.post('/api/auth/disconnect');
      } catch (e) {
        console.warn('Session mock disconnect sync:', e);
      }

      setMockFeedback({
        type: 'info',
        message: `Disconnected Mock Sandbox for ${activeOrgName || 'workspace'}. Workspace is now disconnected.`
      });

      if (onStatusChange) {
        await onStatusChange({
          connected: false,
          isMock: false,
          mode: 'disconnected',
          instanceUrl: null,
          username: null,
          organizationId: activeOrgId,
          organizationName: activeOrgName
        });
      }
    } catch (err) {
      console.error('Disconnect mock error:', err);
      setMockFeedback({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to disconnect Mock Sandbox'
      });
    } finally {
      setMockConnecting(false);
    }
  };

  const handleSelectOrg = async (orgId) => {
    if (orgId === activeOrgId) return;
    setSwitchingId(orgId);
    try {
      await switchOrg(orgId);
    } finally {
      setSwitchingId(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'OWNER':
        return { label: 'OWNER', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.3)' };
      case 'ADMIN':
        return { label: 'ADMIN', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' };
      case 'MEMBER':
        return { label: 'MEMBER', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.3)' };
      default:
        return { label: role || 'READONLY', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const roleStyle = getRoleBadge(activeOrgRole);
  const userInitials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* User Account Master Profile Banner */}
      <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.85))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          
          {/* Left: Avatar + Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.4rem',
              fontWeight: 800,
              boxShadow: '0 6px 20px rgba(56, 189, 248, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              {userInitials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {user?.name || 'User Account'}
                </h2>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: roleStyle.color,
                  background: roleStyle.bg,
                  border: `1px solid ${roleStyle.border}`,
                  padding: '2px 8px',
                  borderRadius: 6
                }}>
                  {roleStyle.label} in {activeOrgName || 'Workspace'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={14} color="#38bdf8" /> {user?.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building2 size={14} color="#a855f7" /> {organizations.length} Workspace{organizations.length === 1 ? '' : 's'}
                </span>
                {user?.id && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ID: #{user.id}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {onOpenCreateOrg && (
              <button
                type="button"
                onClick={onOpenCreateOrg}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} /> New Workspace
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              title="Log out of session"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.85rem',
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Workspace</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeOrgName || activeOrgId || 'Default Organization'}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Salesforce Integration</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: sfStatus?.connected ? '#34d399' : '#f87171', marginTop: '0.2rem' }}>
              {sfStatus?.connected ? (sfStatus.isMock ? 'Mock Sandbox' : 'SF Connected') : 'Disconnected'}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role Permissions</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: roleStyle.color, marginTop: '0.2rem' }}>
              {activeOrgRole} ({activeOrgRole === 'OWNER' || activeOrgRole === 'ADMIN' ? 'Full Control' : (activeOrgRole === 'MEMBER' ? 'Read / Write' : 'Read Only')})
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Account Security</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} /> JWT Authenticated
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.35rem', borderRadius: 'var(--radius-md)' }}>
        <button
          type="button"
          onClick={() => setSubTab('workspaces')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: subTab === 'workspaces' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: subTab === 'workspaces' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: subTab === 'workspaces' ? 600 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Building2 size={15} />
          <span>Workspaces ({organizations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('team')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: subTab === 'team' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: subTab === 'team' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: subTab === 'team' ? 600 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={15} />
          <span>Team Management</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('salesforce')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: subTab === 'salesforce' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: subTab === 'salesforce' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: subTab === 'salesforce' ? 600 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <LinkIcon size={15} />
          <span>SF Setup & Connection</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('profile')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: subTab === 'profile' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: subTab === 'profile' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: subTab === 'profile' ? 600 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <User size={15} />
          <span>Profile & Security</span>
        </button>
      </div>

      {/* SUB-TAB 1: WORKSPACES & ORGANIZATIONS */}
      {subTab === 'workspaces' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Your Workspaces & Organizations
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, marginTop: '0.2rem' }}>
                  Manage multiple business tenants, switch active context, and view Salesforce linkage
                </p>
              </div>

              {onOpenCreateOrg && (
                <button
                  type="button"
                  onClick={onOpenCreateOrg}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={14} /> Create New Workspace
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {organizations.map((org) => {
                const isSelected = org.id === activeOrgId;
                const orgRoleStyle = getRoleBadge(org.role);

                return (
                  <div
                    key={org.id}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isSelected ? '#38bdf8' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 20px rgba(56, 189, 248, 0.15)' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Building2 size={18} color={isSelected ? '#38bdf8' : 'var(--text-muted)'} />
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                            {org.name}
                          </h4>
                        </div>
                        {isSelected && (
                          <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: orgRoleStyle.color,
                          background: orgRoleStyle.bg,
                          border: `1px solid ${orgRoleStyle.border}`,
                          padding: '1px 6px',
                          borderRadius: 4
                        }}>
                          {org.role || 'MEMBER'}
                        </span>

                        <span style={{
                          fontSize: '0.68rem',
                          color: org.salesforceConnected ? '#34d399' : '#f87171',
                          background: org.salesforceConnected ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                          border: `1px solid ${org.salesforceConnected ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                          padding: '1px 6px',
                          borderRadius: 4
                        }}>
                          {org.salesforceConnected ? 'SF Connected' : 'SF Offline'}
                        </span>
                      </div>

                      {org.sfInstanceUrl && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {org.sfInstanceUrl}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Org ID: {org.id}
                      </span>
                      {isSelected ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Check size={14} /> Currently Selected
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectOrg(org.id)}
                          disabled={switchingId === org.id}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                        >
                          {switchingId === org.id ? 'Switching...' : 'Switch to this Workspace'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TEAM MANAGEMENT */}
      {subTab === 'team' && (
        <div>
          <TeamManagement />
        </div>
      )}

      {/* SUB-TAB 3: SALESFORCE SETUP & CONNECTION */}
      {subTab === 'salesforce' && (
        <div>
          <ConnectionTab
            sfStatus={sfStatus}
            onStatusChange={onStatusChange}
            onNavigateProfile={() => setSubTab('profile')}
          />
        </div>
      )}

      {/* SUB-TAB 4: PROFILE & SECURITY DETAILS */}
      {subTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
          {/* Identity & Account Data */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>
              User Identity Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={user?.name || ''} readOnly />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="text" className="form-input" value={user?.email || ''} readOnly />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">User ID</label>
                  <input type="text" className="form-input" value={`#USR-${user?.id || '0'}`} readOnly />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Created</label>
                  <input
                    type="text"
                    className="form-input"
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'Permanent Member'}
                    readOnly
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Active Workspace</label>
                  <input type="text" className="form-input" value={activeOrgName || activeOrgId || ''} readOnly />
                </div>

                <div className="form-group">
                  <label className="form-label">Active Workspace Role</label>
                  <input type="text" className="form-input" value={activeOrgRole || 'MEMBER'} readOnly />
                </div>
              </div>
            </div>
          </div>

          {/* Role Permissions Matrix */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>
              Permissions in {activeOrgName || 'Workspace'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem' }}>Explore & Search Data</span>
                <span style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 600 }}>✓ Granted</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem' }}>Create & Edit Records</span>
                <span style={{ color: activeOrgRole !== 'READONLY' ? '#34d399' : '#f87171', fontSize: '0.78rem', fontWeight: 600 }}>
                  {activeOrgRole !== 'READONLY' ? '✓ Granted' : '✕ Restricted'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem' }}>Trigger Sync & Retries</span>
                <span style={{ color: activeOrgRole !== 'READONLY' ? '#34d399' : '#f87171', fontSize: '0.78rem', fontWeight: 600 }}>
                  {activeOrgRole !== 'READONLY' ? '✓ Granted' : '✕ Restricted'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem' }}>Salesforce Setup & Credentials</span>
                <span style={{ color: (activeOrgRole === 'OWNER' || activeOrgRole === 'ADMIN') ? '#34d399' : '#f87171', fontSize: '0.78rem', fontWeight: 600 }}>
                  {(activeOrgRole === 'OWNER' || activeOrgRole === 'ADMIN') ? '✓ Admin Only' : '✕ Restricted'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem' }}>Team Management & Invites</span>
                <span style={{ color: (activeOrgRole === 'OWNER' || activeOrgRole === 'ADMIN') ? '#34d399' : '#f87171', fontSize: '0.78rem', fontWeight: 600 }}>
                  {(activeOrgRole === 'OWNER' || activeOrgRole === 'ADMIN') ? '✓ Admin Only' : '✕ Restricted'}
                </span>
              </div>
            </div>
          </div>

          {/* DEDICATED MOCK SANDBOX ENVIRONMENT CARD */}
          <div className="card" style={{
            gridColumn: '1 / -1',
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.45), rgba(15, 23, 42, 0.75))',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            boxShadow: '0 6px 25px rgba(168, 85, 247, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={22} color="#c084fc" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Developer & Testing: Salesforce Mock Sandbox
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                    Isolated simulated Salesforce environment for development and testing without requiring live credentials
                  </p>
                </div>
              </div>

              <div>
                {sfStatus?.connected && sfStatus.isMock ? (
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                    <CheckCircle2 size={13} /> Mock Sandbox Active
                  </span>
                ) : sfStatus?.connected && !sfStatus.isMock ? (
                  <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                    <ShieldCheck size={13} /> Live SF Active ({sfStatus.mode?.toUpperCase()})
                  </span>
                ) : (
                  <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                    <AlertCircle size={13} /> Salesforce Disconnected
                  </span>
                )}
              </div>
            </div>

            {mockFeedback && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                background: mockFeedback.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : (mockFeedback.type === 'info' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(248, 113, 113, 0.1)'),
                border: `1px solid ${mockFeedback.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : (mockFeedback.type === 'info' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(248, 113, 113, 0.3)')}`,
                color: mockFeedback.type === 'success' ? '#34d399' : (mockFeedback.type === 'info' ? '#38bdf8' : '#f87171')
              }}>
                {mockFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{mockFeedback.message}</span>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mock Target Endpoint</span>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                  https://mock.salesforce.local
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Simulated Sandbox Environment</span>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '0.2rem' }}>
                  Isolated Test Sandbox
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pre-Populated Data</span>
                <div style={{ fontSize: '0.85rem', color: '#c084fc', fontWeight: 600, marginTop: '0.2rem' }}>
                  Accounts, Contacts, Deals, Leads
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 540 }}>
                {sfStatus?.connected && sfStatus.isMock ? (
                  <>Mock Sandbox is actively linked to workspace <strong>{activeOrgName || activeOrgId}</strong>. You can simulate syncing and test relational data flows.</>
                ) : sfStatus?.connected && !sfStatus.isMock ? (
                  <>Workspace is connected to live Salesforce (<strong>{sfStatus.instanceUrl}</strong>). To connect to Mock Sandbox, disconnect live SF first under the <em>SF Setup & Connection</em> tab.</>
                ) : (
                  <>This organization is currently disconnected from Salesforce. Administrators can click below to link the simulated Mock Sandbox.</>
                )}
              </div>

              <div>
                {(activeOrgRole === 'OWNER' || activeOrgRole === 'ADMIN') ? (
                  sfStatus?.connected && sfStatus.isMock ? (
                    <button
                      type="button"
                      onClick={handleDisconnectMock}
                      disabled={mockConnecting}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Unlink size={14} />
                      {mockConnecting ? 'Disconnecting...' : 'Disconnect Mock Sandbox'}
                    </button>
                  ) : (!sfStatus?.connected ? (
                    <button
                      type="button"
                      onClick={handleConnectMock}
                      disabled={mockConnecting}
                      className="btn btn-primary btn-sm"
                      style={{
                        padding: '0.45rem 1.15rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        border: '1px solid #8b5cf6',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)'
                      }}
                    >
                      <Zap size={14} />
                      {mockConnecting ? 'Connecting...' : 'Connect to Mock Sandbox'}
                    </button>
                  ) : null)
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Admin or Owner role required to configure mock sandbox
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
