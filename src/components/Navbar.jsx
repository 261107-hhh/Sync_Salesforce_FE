import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Cloud,
  Database,
  RefreshCw,
  LogOut,
  User,
  Building2,
  FileText,
  Star,
  Sun,
  Moon
} from 'lucide-react';
import OodlesLogo from './OodlesLogo';

export default function Navbar({ activeTab, setActiveTab, sfStatus }) {
  const {
    user,
    logout,
    defaultOrgId,
    activeOrgId,
    activeOrgName,
    activeOrgRole
  } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const isAdminOrHigher = activeOrgRole === 'ADMIN' || activeOrgRole === 'OWNER';

  const getRoleBadge = (role) => {
    switch (role) {
      case 'OWNER':
        return { label: 'OWNER', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.3)' };
      case 'ADMIN':
        return { label: 'ADMIN', color: '#2F83C5', bg: 'rgba(47, 131, 197, 0.15)', border: 'rgba(47, 131, 197, 0.35)' };
      case 'MEMBER':
        return { label: 'MEMBER', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.3)' };
      default:
        return { label: role || 'READONLY', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const roleStyle = getRoleBadge(activeOrgRole);

  return (
    <header style={{
      background: 'var(--header-bg)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--header-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background-color 0.2s ease, border-color 0.2s ease'
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
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
            title="Go to Data Explorer"
          >
            <OodlesLogo height={28} isDark={isDark} />
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '0.85rem' }}>
              <h1 style={{ fontSize: '0.92rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                SF Sync
              </h1>
              <p style={{ fontSize: '0.68rem', color: 'var(--oodles-primary)', fontWeight: 600 }}>
                Enterprise Hub
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
              background: 'var(--oodles-light)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Active workspace (Click to manage workspaces in Account)"
          >
            <Building2 size={14} color="var(--oodles-primary)" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

        {/* Right: Salesforce Status, Theme Switcher, User Account Button & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Salesforce Status Badge */}
          <div
            onClick={() => setActiveTab('account')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              background: sfStatus?.connected ? 'var(--badge-success-bg)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${sfStatus?.connected ? 'var(--badge-success-border)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontSize: '0.72rem',
              fontWeight: 600,
              color: sfStatus?.connected ? 'var(--badge-success-text)' : 'var(--accent-red)',
              cursor: 'pointer'
            }}
            title="Salesforce Connection Status (Click to configure in Account)"
          >
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: sfStatus?.connected ? '#00B27A' : '#EF4444',
              boxShadow: sfStatus?.connected ? '0 0 8px #00B27A' : 'none'
            }} />
            {sfStatus?.connected ? (sfStatus.isMock ? 'Mock Sandbox' : 'SF Connected') : 'SF Disconnected'}
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={isDark ? "Switch to Oodles Light Mode" : "Switch to Executive Dark Mode"}
            aria-label="Toggle color theme"
          >
            {isDark ? (
              <Sun size={16} color="#FBBF24" />
            ) : (
              <Moon size={16} color="#2F83C5" />
            )}
          </button>

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
