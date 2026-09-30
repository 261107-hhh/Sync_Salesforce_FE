import React, { useState } from 'react';
import api from '../api/client';
import { X, Building2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function QuickAccountModal({ isOpen, onClose, onAccountCreated }) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [type, setType] = useState('Prospect');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account Name is required.');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        Name: name.trim()
      };
      if (industry.trim()) payload.Industry = industry.trim();
      if (type.trim()) payload.Type = type.trim();
      if (phone.trim()) payload.Phone = phone.trim();
      if (website.trim()) payload.Website = website.trim();

      const res = await api.post('/api/data/Account/create', payload);
      if (res.data.success) {
        const createdId = res.data.data?.id;
        setSuccess(`Account "${name}" created successfully in Salesforce!`);
        setTimeout(() => {
          if (onAccountCreated) {
            onAccountCreated({ id: createdId, name: name.trim() });
          }
          // Reset form
          setName('');
          setIndustry('');
          setPhone('');
          setWebsite('');
          setError('');
          setSuccess('');
          onClose();
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create Account in Salesforce');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Quick Create Account
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Create a new related account on the fly
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
              <CheckCircle2 size={15} />
              <span>{success}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Account Name <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Global Industries"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select
                className="form-select"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">-- Select Industry --</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Consulting">Consulting</option>
                <option value="Energy">Energy</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="Prospect">Prospect</option>
                <option value="Customer - Direct">Customer - Direct</option>
                <option value="Customer - Channel">Customer - Channel</option>
                <option value="Channel Partner / Reseller">Channel Partner / Reseller</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                placeholder="(555) 019-2834"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website</label>
              <input
                type="text"
                placeholder="https://acme.com"
                className="form-input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn btn-primary btn-sm"
            >
              <Send size={13} />
              {submitting ? 'Creating in Salesforce...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
