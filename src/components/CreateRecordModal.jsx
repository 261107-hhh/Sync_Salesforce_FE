import React, { useState, useEffect } from 'react';
import api from '../api/client';
import QuickAccountModal from './QuickAccountModal';
import {
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Building2,
  Plus,
  MapPin,
  Phone,
  Briefcase,
  DollarSign,
  FileText,
  UserCheck
} from 'lucide-react';

export default function CreateRecordModal({
  isOpen,
  onClose,
  initialObject = 'Contact',
  prefillAccountId = null,
  onCreated
}) {
  const [objectName, setObjectName] = useState(initialObject);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [accountLookups, setAccountLookups] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quickAccountOpen, setQuickAccountOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setObjectName(initialObject);
      setError('');
      setSuccess('');
      setFormData(prefillAccountId ? { AccountId: prefillAccountId } : {});
      loadFields(initialObject);
      loadAccountLookups();
    }
  }, [isOpen, initialObject, prefillAccountId]);

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
    try {
      const res = await api.get(`/api/objects/${obj}/fields`);
      if (res.data.success) {
        setFields(res.data.data || []);
      }
    } catch (err) {
      console.warn('Could not load dynamic fields schema:', err);
    } finally {
      setLoadingFields(false);
    }
  };

  const handleFieldChange = (fieldName, val) => {
    setFormData((prev) => ({ ...prev, [fieldName]: val }));
  };

  const handleAccountCreated = (newAcc) => {
    setAccountLookups((prev) => [newAcc, ...prev.filter((a) => a.id !== newAcc.id)]);
    setFormData((prev) => ({ ...prev, AccountId: newAcc.id }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Build clean payload with non-empty values
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
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter dynamic fields to only include custom or extra fields not covered in standard sections
  const standardKnownFields = [
    'Name', 'FirstName', 'LastName', 'Salutation', 'AccountId', 'Title', 'Department',
    'Email', 'Phone', 'MobilePhone', 'HomePhone', 'OtherPhone', 'Fax', 'LeadSource',
    'Birthdate', 'Description', 'Type', 'Industry', 'AnnualRevenue', 'NumberOfEmployees',
    'Website', 'StageName', 'Amount', 'CloseDate', 'Probability', 'NextStep',
    'Company', 'Status', 'Rating',
    // Contact Address fields
    'MailingStreet', 'MailingCity', 'MailingState', 'MailingPostalCode', 'MailingCountry',
    'OtherStreet', 'OtherCity', 'OtherState', 'OtherPostalCode', 'OtherCountry',
    // Account Address fields
    'BillingStreet', 'BillingCity', 'BillingState', 'BillingPostalCode', 'BillingCountry',
    'ShippingStreet', 'ShippingCity', 'ShippingState', 'ShippingPostalCode', 'ShippingCountry',
    // Lead Address fields
    'Street', 'City', 'State', 'PostalCode', 'Country'
  ];

  const extraCustomFields = fields.filter((f) => {
    const fn = f.name || f.apiName;
    return fn && !standardKnownFields.includes(fn) && f.createable !== false && f.updateable !== false;
  });

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Plus size={20} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Create New {objectName}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                  Creates directly in Salesforce & records local audit tracking (Created By & Synced By)
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(80vh - 130px)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Object Selector */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '0.2rem' }}>Selected Salesforce Object</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Choose which object record to create</span>
                </div>
                <select
                  className="form-select"
                  style={{ width: 220 }}
                  value={objectName}
                  onChange={(e) => {
                    const nextObj = e.target.value;
                    setObjectName(nextObj);
                    setFormData({});
                    loadFields(nextObj);
                  }}
                >
                  <option value="Contact">Contact</option>
                  <option value="Account">Account</option>
                  <option value="Opportunity">Opportunity</option>
                  <option value="Lead">Lead</option>
                </select>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
                  <CheckCircle2 size={15} />
                  <span>{success}</span>
                </div>
              )}

              {/* -------------------- CONTACT CREATION FIELDS -------------------- */}
              {objectName === 'Contact' && (
                <>
                  {/* General Info */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Briefcase size={14} color="#38bdf8" /> General Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Salutation</label>
                        <select className="form-select" value={formData.Salutation || ''} onChange={(e) => handleFieldChange('Salutation', e.target.value)}>
                          <option value="">-- None --</option>
                          <option value="Mr.">Mr.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Dr.">Dr.</option>
                          <option value="Prof.">Prof.</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. John"
                          value={formData.FirstName || ''}
                          onChange={(e) => handleFieldChange('FirstName', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Last Name <span style={{ color: '#f87171' }}>*</span></label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. Doe"
                          value={formData.LastName || ''}
                          onChange={(e) => handleFieldChange('LastName', e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {/* Related Account with + New Account */}
                      <div className="form-group">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <label className="form-label" style={{ margin: 0 }}>Related Account</label>
                          <button
                            type="button"
                            onClick={() => setQuickAccountOpen(true)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', color: '#38bdf8' }}
                          >
                            <Plus size={11} /> New Account
                          </button>
                        </div>
                        <select
                          className="form-select"
                          value={formData.AccountId || ''}
                          onChange={(e) => handleFieldChange('AccountId', e.target.value)}
                        >
                          <option value="">-- None / Unlinked --</option>
                          {accountLookups.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. VP of Sales"
                          value={formData.Title || ''}
                          onChange={(e) => handleFieldChange('Title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Department</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Engineering"
                          value={formData.Department || ''}
                          onChange={(e) => handleFieldChange('Department', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Communication Details */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={14} color="#34d399" /> Phone & Communication
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="john.doe@company.com"
                          value={formData.Email || ''}
                          onChange={(e) => handleFieldChange('Email', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="+1 (555) 000-0000"
                          value={formData.Phone || ''}
                          onChange={(e) => handleFieldChange('Phone', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mobile Phone</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="+1 (555) 000-1111"
                          value={formData.MobilePhone || ''}
                          onChange={(e) => handleFieldChange('MobilePhone', e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Home Phone</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Home phone"
                          value={formData.HomePhone || ''}
                          onChange={(e) => handleFieldChange('HomePhone', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Other Phone</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Other phone"
                          value={formData.OtherPhone || ''}
                          onChange={(e) => handleFieldChange('OtherPhone', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Fax</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Fax number"
                          value={formData.Fax || ''}
                          onChange={(e) => handleFieldChange('Fax', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEPARATE ADDRESS 1: MAILING ADDRESS */}
                  <div style={{ background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '4px solid #38bdf8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="#38bdf8" /> Mailing Address
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Primary Contact Postal Address</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Mailing Street</label>
                      <input
                        type="text"
                        placeholder="123 Main Street, Suite 100"
                        className="form-input"
                        value={formData.MailingStreet || ''}
                        onChange={(e) => handleFieldChange('MailingStreet', e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Mailing City</label>
                        <input
                          type="text"
                          placeholder="City"
                          className="form-input"
                          value={formData.MailingCity || ''}
                          onChange={(e) => handleFieldChange('MailingCity', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mailing State</label>
                        <input
                          type="text"
                          placeholder="State / Province"
                          className="form-input"
                          value={formData.MailingState || ''}
                          onChange={(e) => handleFieldChange('MailingState', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mailing Postal Code</label>
                        <input
                          type="text"
                          placeholder="Zip / Postal"
                          className="form-input"
                          value={formData.MailingPostalCode || ''}
                          onChange={(e) => handleFieldChange('MailingPostalCode', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mailing Country</label>
                        <input
                          type="text"
                          placeholder="Country"
                          className="form-input"
                          value={formData.MailingCountry || ''}
                          onChange={(e) => handleFieldChange('MailingCountry', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEPARATE ADDRESS 2: OTHER ADDRESS */}
                  <div style={{ background: 'rgba(192, 132, 252, 0.03)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '4px solid #c084fc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="#c084fc" /> Other Address (Different from Mailing)
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Secondary / Branch / Alternative Location</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Other Street</label>
                      <input
                        type="text"
                        placeholder="Secondary location street address"
                        className="form-input"
                        value={formData.OtherStreet || ''}
                        onChange={(e) => handleFieldChange('OtherStreet', e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Other City</label>
                        <input
                          type="text"
                          placeholder="City"
                          className="form-input"
                          value={formData.OtherCity || ''}
                          onChange={(e) => handleFieldChange('OtherCity', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Other State</label>
                        <input
                          type="text"
                          placeholder="State / Province"
                          className="form-input"
                          value={formData.OtherState || ''}
                          onChange={(e) => handleFieldChange('OtherState', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Other Postal Code</label>
                        <input
                          type="text"
                          placeholder="Zip / Postal"
                          className="form-input"
                          value={formData.OtherPostalCode || ''}
                          onChange={(e) => handleFieldChange('OtherPostalCode', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Other Country</label>
                        <input
                          type="text"
                          placeholder="Country"
                          className="form-input"
                          value={formData.OtherCountry || ''}
                          onChange={(e) => handleFieldChange('OtherCountry', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Additional Details & Description
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Lead Source</label>
                        <select className="form-select" value={formData.LeadSource || ''} onChange={(e) => handleFieldChange('LeadSource', e.target.value)}>
                          <option value="">-- None --</option>
                          <option value="Web">Web</option>
                          <option value="Phone Inquiry">Phone Inquiry</option>
                          <option value="Partner Referral">Partner Referral</option>
                          <option value="Purchased List">Purchased List</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Birthdate</label>
                        <input
                          type="date"
                          className="form-input"
                          value={formData.Birthdate || ''}
                          onChange={(e) => handleFieldChange('Birthdate', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Description / Notes</label>
                      <textarea
                        rows={2}
                        className="form-textarea"
                        placeholder="Internal notes about contact..."
                        value={formData.Description || ''}
                        onChange={(e) => handleFieldChange('Description', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* -------------------- ACCOUNT CREATION FIELDS -------------------- */}
              {objectName === 'Account' && (
                <>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Account Overview
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Account Name <span style={{ color: '#f87171' }}>*</span></label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. Acme Corporation"
                          value={formData.Name || ''}
                          onChange={(e) => handleFieldChange('Name', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Type</label>
                        <select className="form-select" value={formData.Type || ''} onChange={(e) => handleFieldChange('Type', e.target.value)}>
                          <option value="">-- None --</option>
                          <option value="Prospect">Prospect</option>
                          <option value="Customer - Direct">Customer - Direct</option>
                          <option value="Customer - Channel">Customer - Channel</option>
                          <option value="Channel Partner / Reseller">Channel Partner / Reseller</option>
                          <option value="Technology Partner">Technology Partner</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Industry</label>
                        <select className="form-select" value={formData.Industry || ''} onChange={(e) => handleFieldChange('Industry', e.target.value)}>
                          <option value="">-- None --</option>
                          <option value="Technology">Technology</option>
                          <option value="Finance">Finance</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Consulting">Consulting</option>
                          <option value="Retail">Retail</option>
                          <option value="Education">Education</option>
                          <option value="Energy">Energy</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Annual Revenue ($)</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g. 1000000"
                          value={formData.AnnualRevenue || ''}
                          onChange={(e) => handleFieldChange('AnnualRevenue', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Employees</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g. 50"
                          value={formData.NumberOfEmployees || ''}
                          onChange={(e) => handleFieldChange('NumberOfEmployees', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Main office phone"
                          value={formData.Phone || ''}
                          onChange={(e) => handleFieldChange('Phone', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Website</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="https://company.com"
                          value={formData.Website || ''}
                          onChange={(e) => handleFieldChange('Website', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEPARATE BILLING ADDRESS */}
                  <div style={{ background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '4px solid #38bdf8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="#38bdf8" /> Billing Address
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Financial Invoicing Location</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Billing Street</label>
                      <input
                        type="text"
                        placeholder="Invoicing street address"
                        className="form-input"
                        value={formData.BillingStreet || ''}
                        onChange={(e) => handleFieldChange('BillingStreet', e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Billing City</label>
                        <input
                          type="text"
                          placeholder="City"
                          className="form-input"
                          value={formData.BillingCity || ''}
                          onChange={(e) => handleFieldChange('BillingCity', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Billing State</label>
                        <input
                          type="text"
                          placeholder="State / Province"
                          className="form-input"
                          value={formData.BillingState || ''}
                          onChange={(e) => handleFieldChange('BillingState', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Billing Postal Code</label>
                        <input
                          type="text"
                          placeholder="Zip / Postal"
                          className="form-input"
                          value={formData.BillingPostalCode || ''}
                          onChange={(e) => handleFieldChange('BillingPostalCode', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Billing Country</label>
                        <input
                          type="text"
                          placeholder="Country"
                          className="form-input"
                          value={formData.BillingCountry || ''}
                          onChange={(e) => handleFieldChange('BillingCountry', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEPARATE SHIPPING ADDRESS */}
                  <div style={{ background: 'rgba(52, 211, 153, 0.03)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '4px solid #34d399' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="#34d399" /> Shipping Address (Different from Billing)
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Goods Delivery / Warehouse Location</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Shipping Street</label>
                      <input
                        type="text"
                        placeholder="Warehouse / delivery street address"
                        className="form-input"
                        value={formData.ShippingStreet || ''}
                        onChange={(e) => handleFieldChange('ShippingStreet', e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Shipping City</label>
                        <input
                          type="text"
                          placeholder="City"
                          className="form-input"
                          value={formData.ShippingCity || ''}
                          onChange={(e) => handleFieldChange('ShippingCity', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Shipping State</label>
                        <input
                          type="text"
                          placeholder="State / Province"
                          className="form-input"
                          value={formData.ShippingState || ''}
                          onChange={(e) => handleFieldChange('ShippingState', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Shipping Postal Code</label>
                        <input
                          type="text"
                          placeholder="Zip / Postal"
                          className="form-input"
                          value={formData.ShippingPostalCode || ''}
                          onChange={(e) => handleFieldChange('ShippingPostalCode', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Shipping Country</label>
                        <input
                          type="text"
                          placeholder="Country"
                          className="form-input"
                          value={formData.ShippingCountry || ''}
                          onChange={(e) => handleFieldChange('ShippingCountry', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      placeholder="Account summary or background..."
                      value={formData.Description || ''}
                      onChange={(e) => handleFieldChange('Description', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* -------------------- OPPORTUNITY CREATION FIELDS -------------------- */}
              {objectName === 'Opportunity' && (
                <>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Opportunity Metrics
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Opportunity Name <span style={{ color: '#f87171' }}>*</span></label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. Acme Enterprise Cloud Deal"
                          value={formData.Name || ''}
                          onChange={(e) => handleFieldChange('Name', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <label className="form-label" style={{ margin: 0 }}>Related Account</label>
                          <button
                            type="button"
                            onClick={() => setQuickAccountOpen(true)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', color: '#38bdf8' }}
                          >
                            <Plus size={11} /> New Account
                          </button>
                        </div>
                        <select
                          className="form-select"
                          value={formData.AccountId || ''}
                          onChange={(e) => handleFieldChange('AccountId', e.target.value)}
                        >
                          <option value="">-- None / Unlinked --</option>
                          {accountLookups.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Stage <span style={{ color: '#f87171' }}>*</span></label>
                        <select
                          className="form-select"
                          required
                          value={formData.StageName || 'Prospecting'}
                          onChange={(e) => handleFieldChange('StageName', e.target.value)}
                        >
                          <option value="Prospecting">Prospecting</option>
                          <option value="Qualification">Qualification</option>
                          <option value="Needs Analysis">Needs Analysis</option>
                          <option value="Value Proposition">Value Proposition</option>
                          <option value="Proposal/Price Quote">Proposal/Price Quote</option>
                          <option value="Negotiation/Review">Negotiation/Review</option>
                          <option value="Closed Won">Closed Won</option>
                          <option value="Closed Lost">Closed Lost</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Amount ($)</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g. 50000"
                          value={formData.Amount || ''}
                          onChange={(e) => handleFieldChange('Amount', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Close Date <span style={{ color: '#f87171' }}>*</span></label>
                        <input
                          type="date"
                          required
                          className="form-input"
                          value={formData.CloseDate || ''}
                          onChange={(e) => handleFieldChange('CloseDate', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Probability (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g. 20"
                          className="form-input"
                          value={formData.Probability || ''}
                          onChange={(e) => handleFieldChange('Probability', e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Deal Type</label>
                        <select className="form-select" value={formData.Type || ''} onChange={(e) => handleFieldChange('Type', e.target.value)}>
                          <option value="">-- None --</option>
                          <option value="New Customer">New Customer</option>
                          <option value="Existing Customer - Upgrade">Existing Customer - Upgrade</option>
                          <option value="Existing Customer - Replacement">Existing Customer - Replacement</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Lead Source</label>
                        <select className="form-select" value={formData.LeadSource || ''} onChange={(e) => handleFieldChange('LeadSource', e.target.value)}>
                          <option value="">-- None --</option>
                          <option value="Web">Web</option>
                          <option value="Phone Inquiry">Phone Inquiry</option>
                          <option value="Partner Referral">Partner Referral</option>
                          <option value="Purchased List">Purchased List</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Next Step</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Schedule demo"
                          value={formData.NextStep || ''}
                          onChange={(e) => handleFieldChange('NextStep', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      placeholder="Opportunity background or requirements..."
                      value={formData.Description || ''}
                      onChange={(e) => handleFieldChange('Description', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* -------------------- LEAD CREATION FIELDS -------------------- */}
              {objectName === 'Lead' && (
                <>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Lead Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Jane"
                          value={formData.FirstName || ''}
                          onChange={(e) => handleFieldChange('FirstName', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Last Name <span style={{ color: '#f87171' }}>*</span></label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. Smith"
                          value={formData.LastName || ''}
                          onChange={(e) => handleFieldChange('LastName', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Company <span style={{ color: '#f87171' }}>*</span></label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. Innovate LLC"
                          value={formData.Company || ''}
                          onChange={(e) => handleFieldChange('Company', e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Status <span style={{ color: '#f87171' }}>*</span></label>
                        <select
                          className="form-select"
                          required
                          value={formData.Status || 'Open - Not Contacted'}
                          onChange={(e) => handleFieldChange('Status', e.target.value)}
                        >
                          <option value="Open - Not Contacted">Open - Not Contacted</option>
                          <option value="Working - Contacted">Working - Contacted</option>
                          <option value="Closed - Converted">Closed - Converted</option>
                          <option value="Closed - Not Converted">Closed - Not Converted</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Director of IT"
                          value={formData.Title || ''}
                          onChange={(e) => handleFieldChange('Title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Industry</label>
                        <select className="form-select" value={formData.Industry || ''} onChange={(e) => handleFieldChange('Industry', e.target.value)}>
                          <option value="">-- None --</option>
                          <option value="Technology">Technology</option>
                          <option value="Finance">Finance</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Consulting">Consulting</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Rating</label>
                        <select className="form-select" value={formData.Rating || ''} onChange={(e) => handleFieldChange('Rating', e.target.value)}>
                          <option value="">-- None --</option>
                          <option value="Hot">Hot</option>
                          <option value="Warm">Warm</option>
                          <option value="Cold">Cold</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Contact Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="jane.smith@innovate.com"
                          value={formData.Email || ''}
                          onChange={(e) => handleFieldChange('Email', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Work phone"
                          value={formData.Phone || ''}
                          onChange={(e) => handleFieldChange('Phone', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mobile Phone</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Mobile phone"
                          value={formData.MobilePhone || ''}
                          onChange={(e) => handleFieldChange('MobilePhone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* LEAD ADDRESS */}
                  <div style={{ background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '4px solid #38bdf8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="#38bdf8" /> Lead Address
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Location / Territory</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Street</label>
                      <input
                        type="text"
                        placeholder="Street address"
                        className="form-input"
                        value={formData.Street || ''}
                        onChange={(e) => handleFieldChange('Street', e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          placeholder="City"
                          className="form-input"
                          value={formData.City || ''}
                          onChange={(e) => handleFieldChange('City', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input
                          type="text"
                          placeholder="State / Province"
                          className="form-input"
                          value={formData.State || ''}
                          onChange={(e) => handleFieldChange('State', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Postal Code</label>
                        <input
                          type="text"
                          placeholder="Zip / Postal"
                          className="form-input"
                          value={formData.PostalCode || ''}
                          onChange={(e) => handleFieldChange('PostalCode', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Country</label>
                        <input
                          type="text"
                          placeholder="Country"
                          className="form-input"
                          value={formData.Country || ''}
                          onChange={(e) => handleFieldChange('Country', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      placeholder="Lead background or initial conversation notes..."
                      value={formData.Description || ''}
                      onChange={(e) => handleFieldChange('Description', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* -------------------- EXTRA CUSTOM FIELDS (IF ANY) -------------------- */}
              {extraCustomFields.length > 0 && (
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Additional Salesforce Org Custom Fields ({extraCustomFields.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {extraCustomFields.map((f) => (
                      <div key={f.name} className="form-group">
                        <label className="form-label">
                          {f.label} {f.required && <span style={{ color: '#f87171' }}>*</span>}
                        </label>
                        {f.picklistValues && f.picklistValues.length > 0 ? (
                          <select
                            className="form-select"
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
                            type={f.type === 'email' ? 'email' : (f.type === 'date' ? 'date' : (f.type === 'number' ? 'number' : 'text'))}
                            className="form-input"
                            placeholder={f.label}
                            value={formData[f.name] || ''}
                            onChange={(e) => handleFieldChange(f.name, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" onClick={onClose} disabled={submitting} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                <Send size={15} />
                {submitting ? 'Creating in Salesforce...' : `Create ${objectName} in Salesforce`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Account Creation Sub-Modal */}
      <QuickAccountModal
        isOpen={quickAccountOpen}
        onClose={() => setQuickAccountOpen(false)}
        onAccountCreated={handleAccountCreated}
      />
    </>
  );
}
