import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CreateRecordModal({ isOpen, onClose, initialObject = 'Contact', prefillAccountId = null, onCreated }) {
  const [objectName, setObjectName] = useState(initialObject);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [accountLookups, setAccountLookups] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setObjectName(initialObject);
      setError('');
      setSuccess('');
      loadFields(initialObject);
      loadAccountLookups();
    }
  }, [isOpen, initialObject]);

  const loadAccountLookups = async () => {
    try {
      const res = await api.get('/api/lookups/Account');
      if (res.data.success) {
        setAccountLookups(res.data.data || []);
      }
    } catch (err) {
      console.warn('Could not load account lookups');
    }
  };

  const loadFields = async (obj) => {
    setLoadingFields(true);
    setFields([]);
    setFormData(prefillAccountId ? { AccountId: prefillAccountId } : {});
    try {
      const res = await api.get(`/api/objects/${obj}/fields`);
      if (res.data.success) {
        setFields(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load fields from Salesforce');
    } finally {
      setLoadingFields(false);
    }
  };

  const handleFieldChange = (fieldName, val) => {
    setFormData((prev) => ({ ...prev, [fieldName]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {};
      for (const [k, v] of Object.entries(formData)) {
        if (v !== '' && v !== null && v !== undefined) {
          payload[k] = v;
        }
      }

      const res = await api.post(`/api/data/${objectName}/create`, payload);
      if (res.data.success) {
        setSuccess(`Created successfully! Salesforce ID: ${res.data.data.id}`);
        if (onCreated) onCreated(objectName);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
              Create New {objectName}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Creates directly in Salesforce & stores locally with your user audit tracking
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
            
            {/* Object Selector */}
            <div className="form-group">
              <label className="form-label">Salesforce Object</label>
              <select
                className="form-select"
                value={objectName}
                onChange={(e) => { setObjectName(e.target.value); loadFields(e.target.value); }}
              >
                <option value="Account">Account</option>
                <option value="Contact">Contact</option>
                <option value="Opportunity">Opportunity</option>
                <option value="Lead">Lead</option>
              </select>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', color: '#f87171', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                <CheckCircle2 size={15} />
                <span>{success}</span>
              </div>
            )}

            {loadingFields ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Loading fields from Salesforce...
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {fields.slice(0, 24).map((f) => {
                  const isRequired = f.required;
                  const isAccountLookup = f.name === 'AccountId' || (f.type === 'reference' && f.referenceTo?.includes('Account'));

                  return (
                    <div key={f.name} className="form-group" style={{ gridColumn: f.type === 'textarea' ? 'span 2' : 'span 1' }}>
                      <label className="form-label">
                        {f.label} {isRequired && <span style={{ color: '#f87171' }}>*</span>}
                      </label>

                      {isAccountLookup ? (
                        <select
                          className="form-select"
                          required={isRequired}
                          value={formData[f.name] || ''}
                          onChange={(e) => handleFieldChange(f.name, e.target.value)}
                        >
                          <option value="">-- Select Related Account --</option>
                          {accountLookups.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      ) : f.picklistValues && f.picklistValues.length > 0 ? (
                        <select
                          className="form-select"
                          required={isRequired}
                          value={formData[f.name] || ''}
                          onChange={(e) => handleFieldChange(f.name, e.target.value)}
                        >
                          <option value="">-- Select {f.label} --</option>
                          {f.picklistValues.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          className="form-textarea"
                          placeholder={f.label}
                          value={formData[f.name] || ''}
                          onChange={(e) => handleFieldChange(f.name, e.target.value)}
                        />
                      ) : (
                        <input
                          type={f.type === 'email' ? 'email' : (f.type === 'date' ? 'date' : 'text')}
                          className="form-input"
                          required={isRequired}
                          placeholder={f.label}
                          value={formData[f.name] || ''}
                          onChange={(e) => handleFieldChange(f.name, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting || loadingFields} className="btn btn-primary">
              <Send size={15} />
              {submitting ? 'Creating in Salesforce...' : 'Create in Salesforce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
