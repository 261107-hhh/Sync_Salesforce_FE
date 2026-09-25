import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Cloud, Database, RefreshCw, LogOut, User, Link as LinkIcon, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, sfStatus }) {
  const { user, logout } = useAuth();

  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
          }}>
            <Cloud size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
              Salesforce Sync
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Spring Boot 3 + PostgreSQL Platform
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('sync')}
            className={`btn ${activeTab === 'sync' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <RefreshCw size={15} />
            Sync Center
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`btn ${activeTab === 'explorer' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <Database size={15} />
            Data Explorer
          </button>

          <button
            onClick={() => setActiveTab('connection')}
            className={`btn ${activeTab === 'connection' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <LinkIcon size={15} />
            SF Connection
          </button>
        </nav>

        {/* User Info & Connection Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Salesforce Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: sfStatus?.connected ? 'rgba(52, 211, 153, 0.12)' : 'rgba(248, 113, 113, 0.12)',
            border: `1px solid ${sfStatus?.connected ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
            fontSize: '0.75rem',
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
              padding: '0.3rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              fontSize: '0.82rem'
            }}>
              <User size={15} color="#38bdf8" />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({user.email})</span>
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
