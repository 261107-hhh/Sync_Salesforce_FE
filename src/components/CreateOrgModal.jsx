import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CreateOrgModal({ isOpen, onClose }) {
  const { createOrg } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    // Auto-generate clean slug
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await createOrg({ name: name.trim(), slug: slug.trim() });
      if (res.success) {
        setSuccess(`Organization "${name}" created! Switched to new workspace.`);
        setTimeout(() => {
          onClose();
          setName('');
          setSlug('');
          setSuccess('');
        }, 1200);
      } else {
        setError(res.message || 'Failed to create organization');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Create New Organization
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Set up a fresh multi-tenant workspace with isolated data
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                color: '#f87171',
                fontSize: '0.82rem',
                marginBottom: '1rem'
              }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                color: '#34d399',
                fontSize: '0.82rem',
                marginBottom: '1rem'
              }}>
                <CheckCircle2 size={15} />
                <span>{success}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Stark Logistics"
                className="form-input"
                value={name}
                onChange={handleNameChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Workspace URL Identifier (Slug)</label>
              <input
                type="text"
                required
                placeholder="e.g. stark-logistics"
                className="form-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Unique slug used for database tenant isolation: <code>org_{slug || 'your-slug'}</code>
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()} className="btn btn-primary">
              <Plus size={15} />
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
