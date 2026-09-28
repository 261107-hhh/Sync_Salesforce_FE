import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Cloud,
  Database,
  RefreshCw,
  LogOut,
  User,
  Building2,
  FileText,
  Star
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, sfStatus }) {
  const {
    user,
    logout,
    defaultOrgId,
    activeOrgId,
    activeOrgName,
    activeOrgRole
  } = useAuth();

  const isAdminOrHigher = activeOrgRole === 'ADMIN' || activeOrgRole === 'OWNER';

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

  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Left: Brand + Active Workspace Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            onClick={() => setActiveTab('explorer')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            title="Go to Data Explorer"
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
            }}>
              <Cloud size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.2 }}>
                SF Sync
              </h1>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Multi-Tenant Platform
              </p>
            </div>
          </div>

          {/* Active Workspace Link (opens user account workspaces view) */}
          <div
            onClick={() => setActiveTab('account')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Active workspace (Click to manage workspaces in Account)"
          >
            <Building2 size={14} color="#38bdf8" />
            <span style={{ fontWeight: 600, color: '#fff', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeOrgName || activeOrgId || 'Default Organization'}
            </span>
          </div>
        </div>

        {/* Center: Main Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`btn ${activeTab === 'explorer' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <Database size={14} />
            Data Explorer
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`btn ${activeTab === 'sync' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <RefreshCw size={14} />
            Sync Center
          </button>

          <button
            onClick={() => setActiveTab('sync-logs')}
            className={`btn ${activeTab === 'sync-logs' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <FileText size={14} />
            Sync Logs
          </button>
        </nav>

        {/* Right: Salesforce Status, User Account Button & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Salesforce Status Badge */}
          <div
            onClick={() => setActiveTab('account')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              background: sfStatus?.connected ? 'rgba(52, 211, 153, 0.12)' : 'rgba(248, 113, 113, 0.12)',
              border: `1px solid ${sfStatus?.connected ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
              fontSize: '0.72rem',
              fontWeight: 500,
              color: sfStatus?.connected ? '#34d399' : '#f87171',
              cursor: 'pointer'
            }}
            title="Salesforce Connection Status (Click to configure in Account)"
          >
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: sfStatus?.connected ? '#34d399' : '#f87171',
              boxShadow: sfStatus?.connected ? '0 0 8px #34d399' : 'none'
            }} />
            {sfStatus?.connected ? (sfStatus.isMock ? 'Mock Sandbox' : 'SF Connected') : 'SF Disconnected'}
          </div>

          {/* User Account / Profile Button */}
          {user && (
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`btn ${activeTab === 'account' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.75rem'
              }}
              title="User Account & Settings (Profile, Workspaces, Team, SF Setup)"
            >
              <User size={14} />
              <span style={{ fontWeight: 600 }}>{user.name}</span>
              {activeOrgRole && (
                <span style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  color: roleStyle.color,
                  background: roleStyle.bg,
                  border: `1px solid ${roleStyle.border}`,
                  padding: '1px 5px',
                  borderRadius: 4
                }}>
                  {roleStyle.label}
                </span>
              )}
            </button>
          )}

          <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
