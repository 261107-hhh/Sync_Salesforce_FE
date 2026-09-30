import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Moon,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header style={{
      background: 'var(--header-bg)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--header-border)',
      position: 'sticky',
      top: 0,
      zIndex: mobileMenuOpen ? 99999 : 100,
      transition: 'background-color 0.2s ease, border-color 0.2s ease'
    }}>
      <div className="navbar-container">
        {/* Left: Brand + Active Workspace Indicator (Desktop Only) */}
        <div className="navbar-brand-section">
          <div
            onClick={() => handleNavClick('explorer')}
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

          {/* Active Workspace Link (Hidden when hamburger is present) */}
          <div
            onClick={() => handleNavClick('account')}
            className="desktop-only-workspace-badge"
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
            <span className="navbar-workspace-badge" style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeOrgName || activeOrgId || 'Default Organization'}
            </span>
          </div>
        </div>

        {/* Center: Desktop Main Navigation Tabs */}
        <nav className="navbar-nav-section">
          <button
            onClick={() => handleNavClick('explorer')}
            className={`btn ${activeTab === 'explorer' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <Database size={14} />
            <span>Data Explorer</span>
          </button>

          <button
            onClick={() => handleNavClick('sync')}
            className={`btn ${activeTab === 'sync' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <RefreshCw size={14} />
            <span>Sync Center</span>
          </button>

          <button
            onClick={() => handleNavClick('sync-logs')}
            className={`btn ${activeTab === 'sync-logs' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <FileText size={14} />
            <span>Sync Logs</span>
          </button>
        </nav>

        {/* Right: Salesforce Status, Theme Switcher, User Button, Logout & Hamburger Toggle */}
        <div className="navbar-actions-section">
          {/* Salesforce Status Badge (Hidden when hamburger is present) */}
          <div
            onClick={() => handleNavClick('account')}
            className="desktop-only-sf-status"
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
            <span>{sfStatus?.connected ? (sfStatus.isMock ? 'Mock Sandbox' : 'SF Connected') : 'SF Disconnected'}</span>
          </div>

          {/* Theme Toggle Button (Hidden when hamburger is present) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn desktop-only-theme-toggle"
            title={isDark ? "Switch to Oodles Light Mode" : "Switch to Executive Dark Mode"}
            aria-label="Toggle color theme"
          >
            {isDark ? (
              <Sun size={16} color="#FBBF24" />
            ) : (
              <Moon size={16} color="#2F83C5" />
            )}
          </button>

          {/* User Account Button (Desktop Only) */}
          {user && (
            <button
              type="button"
              onClick={() => handleNavClick('account')}
              className={`btn ${activeTab === 'account' ? 'btn-primary' : 'btn-secondary'} btn-sm desktop-only-user-btn`}
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

          {/* Logout Button (Desktop Only) */}
          <button onClick={logout} className="btn btn-secondary btn-sm desktop-only-logout-btn" title="Log out">
            <LogOut size={14} />
          </button>

          {/* Mobile/Tablet Hamburger Menu Button */}
          <button
            type="button"
            className="navbar-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            title={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Slide-Out Drawer Menu (Rendered via Portal to document.body so it always renders above <main>) */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-drawer-panel">
            {/* Drawer Top Bar */}
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <OodlesLogo height={24} isDark={isDark} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>SF Sync Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Profile Card */}
            {user && (
              <div className="mobile-drawer-user-card">
                <div className="mobile-drawer-avatar">
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      color: roleStyle.color,
                      background: roleStyle.bg,
                      border: `1px solid ${roleStyle.border}`,
                      padding: '1px 5px',
                      borderRadius: 4
                    }}>
                      {roleStyle.label}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--oodles-primary)', fontWeight: 600 }}>
                      🏢 {activeOrgName || activeOrgId || 'Workspace'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Salesforce Status in Drawer */}
            <div
              onClick={() => handleNavClick('account')}
              className="mobile-drawer-sf-status"
              title="Salesforce Connection Status"
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: sfStatus?.connected ? '#00B27A' : '#EF4444',
                boxShadow: sfStatus?.connected ? '0 0 8px #00B27A' : 'none'
              }} />
              <span style={{ fontWeight: 600, fontSize: '0.78rem', color: sfStatus?.connected ? 'var(--badge-success-text)' : 'var(--accent-red)' }}>
                {sfStatus?.connected ? (sfStatus.isMock ? 'Mock Sandbox Active' : 'Salesforce Connected') : 'Salesforce Disconnected'}
              </span>
            </div>

            {/* Navigation List */}
            <div className="mobile-drawer-nav-list">
              <button
                onClick={() => handleNavClick('explorer')}
                className={`mobile-drawer-nav-item ${activeTab === 'explorer' ? 'active' : ''}`}
              >
                <Database size={18} />
                <span>Data Explorer</span>
              </button>

              <button
                onClick={() => handleNavClick('sync')}
                className={`mobile-drawer-nav-item ${activeTab === 'sync' ? 'active' : ''}`}
              >
                <RefreshCw size={18} />
                <span>Sync Center</span>
              </button>

              <button
                onClick={() => handleNavClick('sync-logs')}
                className={`mobile-drawer-nav-item ${activeTab === 'sync-logs' ? 'active' : ''}`}
              >
                <FileText size={18} />
                <span>Sync Logs</span>
              </button>

              <button
                onClick={() => handleNavClick('account')}
                className={`mobile-drawer-nav-item ${activeTab === 'account' ? 'active' : ''}`}
              >
                <User size={18} />
                <span>Account & Workspaces</span>
              </button>
            </div>

            {/* Drawer Footer Actions */}
            <div className="mobile-drawer-footer">
              <button
                type="button"
                onClick={toggleTheme}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isDark ? <Sun size={15} color="#FBBF24" /> : <Moon size={15} color="#2F83C5" />}
                <span>{isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#f87171' }}
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
}
