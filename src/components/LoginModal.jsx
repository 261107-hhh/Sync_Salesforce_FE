import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Building2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginModal() {
  const { login, register, registerOrg } = useAuth();
  
  // Modes: 'login' | 'org_register' | 'user_register'
  const [authMode, setAuthMode] = useState('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOrgNameChange = (e) => {
    const val = e.target.value;
    setOrgName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (authMode === 'login') {
        res = await login(email, password);
      } else if (authMode === 'org_register') {
        res = await registerOrg({
          organizationName: orgName.trim(),
          slug: slug.trim(),
          adminName: name.trim(),
          adminEmail: email.trim(),
          adminPassword: password
        });
      } else if (authMode === 'user_register') {
        res = await register(email, password, name.trim());
      }

      if (!res.success) {
        setError(res.message || 'Authentication failed.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Network error');
    } finally {
      setLoading(false);
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
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(56, 189, 248, 0.35)',
            marginBottom: '1rem',
            color: '#fff'
          }}>
            {authMode === 'org_register' ? <Building2 size={24} /> : <Lock size={24} />}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            {authMode === 'login' && 'Sign in to Platform'}
            {authMode === 'org_register' && 'Register Company Workspace'}
            {authMode === 'user_register' && 'Create User Account'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {authMode === 'login' && 'Access multi-tenant Salesforce Sync, Data Explorer & Reports'}
            {authMode === 'org_register' && 'Set up your company tenant with isolated database & team management'}
            {authMode === 'user_register' && 'Sign up to join existing workspaces or explore the system'}
          </p>
        </div>

        {/* Auth Mode Switcher Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.35rem',
          background: 'var(--bg-input)',
          padding: '0.3rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem'
        }}>
          {[
            { id: 'login', label: 'Sign In' },
            { id: 'org_register', label: 'Company' },
            { id: 'user_register', label: 'User' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setAuthMode(tab.id); setError(''); }}
              style={{
                padding: '0.45rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: authMode === tab.id ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                color: authMode === tab.id ? '#38bdf8' : 'var(--text-muted)',
                fontWeight: authMode === tab.id ? 600 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            color: '#f87171',
            fontSize: '0.82rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Company Workspace fields */}
          {authMode === 'org_register' && (
            <>
              <div className="form-group">
                <label className="form-label">Company / Organization Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Health Corp"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    value={orgName}
                    onChange={handleOrgNameChange}
                  />
                  <Building2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tenant Slug (Unique URL identifier)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme-health"
                  className="form-input"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                />
              </div>
            </>
          )}

          {/* User Name for Registration */}
          {(authMode === 'org_register' || authMode === 'user_register') && (
            <div className="form-group">
              <label className="form-label">
                {authMode === 'org_register' ? 'Admin Full Name' : 'Full Name'}
              </label>
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
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label">
              {authMode === 'org_register' ? 'Admin Corporate Email' : 'Email Address'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="name@company.com"
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
          >
            {loading ? 'Please wait...' : (
              authMode === 'login' ? 'Sign In' : (
                authMode === 'org_register' ? 'Create Company & Sign In' : 'Register & Sign In'
              )
            )}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {authMode === 'login' ? (
            <div>
              New organization?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('org_register'); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Sign up your company
              </button>
            </div>
          ) : (
            <div>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
