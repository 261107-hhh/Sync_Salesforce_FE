import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, User, Building2, AlertCircle, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import OodlesLogo from './OodlesLogo';

export default function LoginModal() {
  const { login, register, registerOrg } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Modes: 'login' | 'org_register' | 'user_register'
  const [authMode, setAuthMode] = useState('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

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
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      background: isDark
        ? 'radial-gradient(circle at 50% 20%, #0d1e38 0%, #070c18 100%)'
        : 'radial-gradient(circle at 50% 15%, #F0F7FF 0%, #F8F9FA 100%)',
      overflow: 'hidden',
      transition: 'background 0.3s ease'
    }}>
      {/* Decorative Oodles Blue Upper Glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #1A73B5, #2F83C5, #00B27A, #2F83C5, #1A73B5)'
      }} />

      {/* Floating Theme Toggle in Header Corner */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 10 }}>
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={isDark ? "Switch to Oodles Light Mode" : "Switch to Executive Dark Mode"}
          style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)' }}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color="#2F83C5" />}
        </button>
      </div>

      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '350px',
        background: isDark
          ? 'radial-gradient(circle, rgba(47, 131, 197, 0.18) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(47, 131, 197, 0.1) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Container Card */}
      <div className="card" style={{
        width: '100%',
        maxWidth: 480,
        padding: '2.5rem',
        borderRadius: '16px',
        background: isDark ? 'rgba(15, 25, 45, 0.88)' : '#FFFFFF',
        border: isDark ? '1px solid rgba(47, 131, 197, 0.25)' : '1px solid var(--border-color)',
        boxShadow: isDark
          ? '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          : '0 20px 45px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.03)',
        position: 'relative',
        zIndex: 1,
        transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
      }}>
        {/* Oodles Brand Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-block', marginBottom: '1.25rem' }}>
            <OodlesLogo height={36} isDark={isDark} />
          </div>

          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.3
          }}>
            {authMode === 'login' && 'Sign In To Get Started'}
            {authMode === 'org_register' && 'Register Company Workspace'}
            {authMode === 'user_register' && 'Create User Account'}
          </h1>
          <p style={{
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            marginTop: '0.45rem',
            lineHeight: 1.5,
            padding: '0 0.5rem'
          }}>
            {authMode === 'login' && 'One workspace to request support, track progress, and manage every aspect of your work.'}
            {authMode === 'org_register' && 'Set up your company tenant with isolated database & team management.'}
            {authMode === 'user_register' && 'Sign up to join existing workspaces or explore the system.'}
          </p>
        </div>

        {/* Auth Mode Switcher Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.35rem',
          background: isDark ? 'rgba(10, 17, 32, 0.75)' : '#F1F5F9',
          padding: '0.3rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
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
                padding: '0.5rem',
                border: 'none',
                borderRadius: '6px',
                background: authMode === tab.id ? 'linear-gradient(135deg, #1A73B5, #2F83C5)' : 'transparent',
                color: authMode === tab.id ? '#fff' : 'var(--text-secondary)',
                fontWeight: authMode === tab.id ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: authMode === tab.id ? '0 2px 10px rgba(47, 131, 197, 0.35)' : 'none',
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
            background: 'rgba(248, 113, 113, 0.12)',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            color: '#f87171',
            fontSize: '0.82rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
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
                    style={{ paddingLeft: '2.5rem' }}
                    value={orgName}
                    autoComplete="off"
                    onChange={handleOrgNameChange}
                  />
                  <Building2 size={16} color="#2F83C5" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
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
                  autoComplete="off"
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
                  style={{ paddingLeft: '2.5rem' }}
                  value={name}
                  autoComplete="off"
                  onChange={(e) => setName(e.target.value)}
                />
                <User size={16} color="#2F83C5" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
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
                style={{ paddingLeft: '2.5rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail size={16} color="#2F83C5" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: authMode === 'login' ? '0.75rem' : '1.15rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={16} color="#2F83C5" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Remember Me & Forgot Password (Exact feature from my.oodles.io/#/login) */}
          {authMode === 'login' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              fontSize: '0.8rem'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#2F83C5', cursor: 'pointer', width: 14, height: 14 }}
                />
                <span>Keep me logged in</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Password recovery: Please contact your workspace administrator.')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2F83C5',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  padding: 0
                }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.92rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1A73B5, #2F83C5)',
              boxShadow: '0 4px 18px rgba(47, 131, 197, 0.35)'
            }}
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
                style={{ background: 'none', border: 'none', color: '#2F83C5', fontWeight: 600, cursor: 'pointer', padding: 0 }}
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
                style={{ background: 'none', border: 'none', color: '#2F83C5', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Footer Badge */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <ShieldCheck size={14} color="#00B27A" />
          <span>Oodles Enterprise Salesforce Hub &bull; Multi-Tenant Platform</span>
        </div>
      </div>

      {/* Page Footer */}
      <footer style={{
        marginTop: '1.5rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        &copy; {new Date().getFullYear()} Oodles Technologies. All rights reserved.
      </footer>
    </div>
  );
}
