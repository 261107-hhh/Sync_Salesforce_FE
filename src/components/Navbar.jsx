import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Cloud,
  Database,
  RefreshCw,
  LogOut,
  User,
  Link as LinkIcon,
  Building2,
  ChevronDown,
  Check,
  Plus,
  Users,
  Shield
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, sfStatus, onOpenCreateOrg }) {
  const {
    user,
    logout,
    activeOrgId,
    activeOrgName,
    activeOrgRole,
    organizations,
    switchOrg
  } = useAuth();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOrgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOrg = async (orgId) => {
    if (orgId === activeOrgId) {
      setOrgDropdownOpen(false);
      return;
    }
    setOrgDropdownOpen(false);
    await switchOrg(orgId);
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
        {/* Left: Brand + Active Organization Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

          {/* Org Switcher Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.4rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Click to switch active organization"
            >
              <Building2 size={15} color="#38bdf8" />
              <span style={{ fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeOrgName || activeOrgId || 'Default Organization'}
              </span>

              {/* Role Badge */}
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: roleStyle.color,
                background: roleStyle.bg,
                border: `1px solid ${roleStyle.border}`,
                padding: '1px 6px',
                borderRadius: 6
              }}>
                {roleStyle.label}
              </span>

              <ChevronDown size={14} color="var(--text-muted)" style={{ transform: orgDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {/* Dropdown Menu */}
            {orgDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: 280,
                background: '#0b1329',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                padding: '0.4rem',
                zIndex: 200
              }}>
                <div style={{ padding: '0.4rem 0.6rem 0.5rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Your Workspaces ({organizations.length})
                </div>

                <div style={{ maxHeight: 220, overflowY: 'auto', padding: '0.25rem 0' }}>
                  {organizations.map((org) => {
                    const isSelected = org.id === activeOrgId;
                    return (
                      <div
                        key={org.id}
                        onClick={() => handleSelectOrg(org.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                          color: isSelected ? '#38bdf8' : 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          transition: 'background 0.1s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                          <Building2 size={14} color={isSelected ? '#38bdf8' : 'var(--text-muted)'} />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: isSelected ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {org.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Role: {org.role || 'MEMBER'} • {org.salesforceConnected ? 'SF Connected' : 'SF Offline'}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={14} color="#38bdf8" />}
                      </div>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => { setOrgDropdownOpen(false); if (onOpenCreateOrg) onOpenCreateOrg(); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Plus size={14} /> Create New Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation Tabs */}
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
            onClick={() => setActiveTab('team')}
            className={`btn ${activeTab === 'team' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <Users size={14} />
            Team
          </button>

          <button
            onClick={() => setActiveTab('connection')}
            className={`btn ${activeTab === 'connection' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <LinkIcon size={14} />
            SF Setup
          </button>
        </nav>

        {/* Right: Salesforce Status & User Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Salesforce Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            background: sfStatus?.connected ? 'rgba(52, 211, 153, 0.12)' : 'rgba(248, 113, 113, 0.12)',
            border: `1px solid ${sfStatus?.connected ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
            fontSize: '0.72rem',
            fontWeight: 500,
            color: sfStatus?.connected ? '#34d399' : '#f87171'
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: sfStatus?.connected ? '#34d399' : '#f87171',
              boxShadow: sfStatus?.connected ? '0 0 8px #34d399' : 'none'
            }} />
            {sfStatus?.connected ? (sfStatus.isMock ? 'Mock Sandbox' : 'SF Connected') : 'SF Disconnected'}
          </div>

          {/* User Profile Badge */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem'
            }}>
              <User size={14} color="#38bdf8" />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
            </div>
          )}

          <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
