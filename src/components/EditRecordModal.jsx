import React, { useState, useEffect } from 'react';
import api from '../api/client';
import QuickAccountModal from './QuickAccountModal';
import {
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Building2,
  Plus,
  Edit3,
  MapPin,
  Phone,
  Briefcase,
  DollarSign,
  FileText
} from 'lucide-react';

export default function EditRecordModal({ isOpen, onClose, objectName, record, onUpdated }) {
  const [formData, setFormData] = useState({});
  const [accountLookups, setAccountLookups] = useState([]);
  const [quickAccountOpen, setQuickAccountOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const recordId = record?.Id || record?.id || record?.ID;

  useEffect(() => {
    if (isOpen && record) {
      setError('');
      setSuccess('');
      // Populate form data from record (flattening nulls and existing values)
      const initial = {};
      for (const [k, v] of Object.entries(record)) {
        if (v !== undefined) {
          initial[k] = v === null ? '' : v;
        }
      }
      setFormData(initial);

      if (objectName === 'Contact' || objectName === 'Opportunity') {
        loadAccountLookups();
      }
    }
  }, [isOpen, record, objectName]);

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

  const handleFieldChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleAccountCreated = (newAcc) => {
    setAccountLookups((prev) => [newAcc, ...prev.filter((a) => a.id !== newAcc.id)]);
    setFormData((prev) => ({ ...prev, AccountId: newAcc.id, Account_Name: newAcc.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recordId) {
      setError('Cannot update record: missing record ID.');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Build clean payload of editable fields
      const payload = {};
      const ignoredKeys = [
        'id', 'Id', 'ID', 'created_by', 'modified_by', 'synced_by',
        'custom_app_created_by', 'custom_app_created_at', 'custom_app_modified_by',
        'custom_app_modified_at', 'customAppCreatedBy', 'customAppCreatedAt',
        'customAppModifiedBy', 'customAppModifiedAt', 'is_custom_app_created',
        'isCustomAppCreated', 'organization_id', 'organizationId',
        'CreatedDate', 'LastModifiedDate', 'SystemModstamp', 'systemModstamp',
        'raw_data', 'rawData', 'Account_Name', '_contact_count', '_opportunity_count'
      ];

      for (const [k, v] of Object.entries(formData)) {
        if (!ignoredKeys.includes(k) && v !== undefined) {
          payload[k] = v === '' ? null : v;
        }
      }

      const res = await api.put(`/api/data/${objectName}/${recordId}`, payload);
      if (res.data.success) {
        setSuccess('Record updated successfully in Salesforce & local database!');
        if (onUpdated) onUpdated(objectName, res.data.data);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update record in Salesforce');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !record) return null;

  const currentAccountId = formData.AccountId || formData.accountId;

  const standardKnownKeys = new Set([
    'id', 'Id', 'ID', 'Name', 'name', 'FirstName', 'LastName', 'Salutation', 'AccountId', 'Title',
    'Department', 'Email', 'Phone', 'MobilePhone', 'HomePhone', 'OtherPhone', 'Fax',
    'MailingStreet', 'MailingCity', 'MailingState', 'MailingPostalCode', 'MailingCountry',
    'OtherStreet', 'OtherCity', 'OtherState', 'OtherPostalCode', 'OtherCountry',
    'LeadSource', 'Birthdate', 'Description', 'Type', 'Industry', 'AnnualRevenue',
    'NumberOfEmployees', 'Website', 'BillingStreet', 'BillingCity', 'BillingState',
    'BillingPostalCode', 'BillingCountry', 'ShippingStreet', 'ShippingCity', 'ShippingState',
    'ShippingPostalCode', 'ShippingCountry', 'StageName', 'Amount', 'CloseDate', 'Probability',
    'NextStep', 'Company', 'Status', 'Rating', 'Street', 'City', 'State', 'PostalCode', 'Country',
    'created_by', 'modified_by', 'synced_by', 'custom_app_created_by', 'custom_app_created_at',
    'custom_app_modified_by', 'custom_app_modified_at', 'customAppCreatedBy', 'customAppCreatedAt',
    'customAppModifiedBy', 'customAppModifiedAt', 'is_custom_app_created', 'isCustomAppCreated',
    'organization_id', 'organizationId', 'CreatedDate', 'LastModifiedDate', 'SystemModstamp',
    'systemModstamp', 'raw_data', 'rawData', 'Account_Name', 'account_name', '_contact_count', '_opportunity_count',
    'attributes', 'PhotoUrl', 'photoUrl'
  ]);

  const extraRecordFields = Object.keys(formData).filter((k) => !standardKnownKeys.has(k) && typeof formData[k] !== 'object');

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Edit3 size={18} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Edit {objectName}: {formData.Name || `${formData.FirstName || ''} ${formData.LastName || ''}`.trim() || recordId}
                </h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#38bdf8' }}>
                  ID: {recordId}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(80vh - 130px)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
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

              {/* -------------------- CONTACT FIELDS -------------------- */}
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
                        <input type="text" className="form-input" value={formData.FirstName || ''} onChange={(e) => handleFieldChange('FirstName', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Last Name <span style={{ color: '#f87171' }}>*</span></label>
                        <input type="text" required className="form-input" value={formData.LastName || ''} onChange={(e) => handleFieldChange('LastName', e.target.value)} />
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
                        <select className="form-select" value={currentAccountId || ''} onChange={(e) => handleFieldChange('AccountId', e.target.value)}>
                          <option value="">-- None / Unlinked --</option>
                          {accountLookups.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Title</label>
                        <input type="text" className="form-input" value={formData.Title || ''} onChange={(e) => handleFieldChange('Title', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Department</label>
                        <input type="text" className="form-input" value={formData.Department || ''} onChange={(e) => handleFieldChange('Department', e.target.value)} />
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
                        <input type="email" className="form-input" value={formData.Email || ''} onChange={(e) => handleFieldChange('Email', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input type="text" className="form-input" value={formData.Phone || ''} onChange={(e) => handleFieldChange('Phone', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mobile Phone</label>
                        <input type="text" className="form-input" value={formData.MobilePhone || ''} onChange={(e) => handleFieldChange('MobilePhone', e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Home Phone</label>
                        <input type="text" className="form-input" value={formData.HomePhone || ''} onChange={(e) => handleFieldChange('HomePhone', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Other Phone</label>
                        <input type="text" className="form-input" value={formData.OtherPhone || ''} onChange={(e) => handleFieldChange('OtherPhone', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Fax</label>
                        <input type="text" className="form-input" value={formData.Fax || ''} onChange={(e) => handleFieldChange('Fax', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* SEPARATE ADDRESS 1: MAILING ADDRESS */}
                  <div style={{ background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '4px solid #38bdf8' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} color="#38bdf8" /> Mailing Address
                    </h4>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Mailing Street</label>
                      <input type="text" placeholder="123 Main Street" className="form-input" value={formData.MailingStreet || ''} onChange={(e) => handleFieldChange('MailingStreet', e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Mailing City</label>
                        <input type="text" placeholder="City" className="form-input" value={formData.MailingCity || ''} onChange={(e) => handleFieldChange('MailingCity', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mailing State</label>
                        <input type="text" placeholder="State/Province" className="form-input" value={formData.MailingState || ''} onChange={(e) => handleFieldChange('MailingState', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mailing Postal Code</label>
                        <input type="text" placeholder="Zip/Postal" className="form-input" value={formData.MailingPostalCode || ''} onChange={(e) => handleFieldChange('MailingPostalCode', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mailing Country</label>
                        <input type="text" placeholder="Country" className="form-input" value={formData.MailingCountry || ''} onChange={(e) => handleFieldChange('MailingCountry', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* SEPARATE ADDRESS 2: OTHER ADDRESS */}
                  <div style={{ background: 'rgba(192, 132, 252, 0.03)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '4px solid #c084fc' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} color="#c084fc" /> Other Address (Different from Mailing)
                    </h4>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Other Street</label>
                      <input type="text" placeholder="Suite 400, Secondary Ave" className="form-input" value={formData.OtherStreet || ''} onChange={(e) => handleFieldChange('OtherStreet', e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Other City</label>
                        <input type="text" placeholder="City" className="form-input" value={formData.OtherCity || ''} onChange={(e) => handleFieldChange('OtherCity', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Other State</label>
                        <input type="text" placeholder="State/Province" className="form-input" value={formData.OtherState || ''} onChange={(e) => handleFieldChange('OtherState', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Other Postal Code</label>
                        <input type="text" placeholder="Zip/Postal" className="form-input" value={formData.OtherPostalCode || ''} onChange={(e) => handleFieldChange('OtherPostalCode', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Other Country</label>
                        <input type="text" placeholder="Country" className="form-input" value={formData.OtherCountry || ''} onChange={(e) => handleFieldChange('OtherCountry', e.target.value)} />
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
                        <input type="date" className="form-input" value={formData.Birthdate || ''} onChange={(e) => handleFieldChange('Birthdate', e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Description</label>
                      <textarea rows={2} className="form-textarea" placeholder="Notes about contact..." value={formData.Description || ''} onChange={(e) => handleFieldChange('Description', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {/* -------------------- ACCOUNT FIELDS -------------------- */}
              {objectName === 'Account' && (
                <>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Account Overview
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Account Name <span style={{ color: '#f87171' }}>*</span></label>
                        <input type="text" required className="form-input" value={formData.Name || ''} onChange={(e) => handleFieldChange('Name', e.target.value)} />
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
                        <input type="number" className="form-input" value={formData.AnnualRevenue || ''} onChange={(e) => handleFieldChange('AnnualRevenue', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Employees</label>
                        <input type="number" className="form-input" value={formData.NumberOfEmployees || ''} onChange={(e) => handleFieldChange('NumberOfEmployees', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input type="text" className="form-input" value={formData.Phone || ''} onChange={(e) => handleFieldChange('Phone', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Website</label>
                        <input type="text" className="form-input" value={formData.Website || ''} onChange={(e) => handleFieldChange('Website', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div style={{ background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '4px solid #38bdf8' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} color="#38bdf8" /> Billing Address
                    </h4>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Billing Street</label>
                      <input type="text" className="form-input" value={formData.BillingStreet || ''} onChange={(e) => handleFieldChange('BillingStreet', e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Billing City</label>
                        <input type="text" className="form-input" value={formData.BillingCity || ''} onChange={(e) => handleFieldChange('BillingCity', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Billing State</label>
                        <input type="text" className="form-input" value={formData.BillingState || ''} onChange={(e) => handleFieldChange('BillingState', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Billing Postal Code</label>
                        <input type="text" className="form-input" value={formData.BillingPostalCode || ''} onChange={(e) => handleFieldChange('BillingPostalCode', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Billing Country</label>
                        <input type="text" className="form-input" value={formData.BillingCountry || ''} onChange={(e) => handleFieldChange('BillingCountry', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div style={{ background: 'rgba(52, 211, 153, 0.03)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '4px solid #34d399' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} color="#34d399" /> Shipping Address (Different from Billing)
                    </h4>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Shipping Street</label>
                      <input type="text" className="form-input" value={formData.ShippingStreet || ''} onChange={(e) => handleFieldChange('ShippingStreet', e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Shipping City</label>
                        <input type="text" className="form-input" value={formData.ShippingCity || ''} onChange={(e) => handleFieldChange('ShippingCity', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Shipping State</label>
                        <input type="text" className="form-input" value={formData.ShippingState || ''} onChange={(e) => handleFieldChange('ShippingState', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Shipping Postal Code</label>
                        <input type="text" className="form-input" value={formData.ShippingPostalCode || ''} onChange={(e) => handleFieldChange('ShippingPostalCode', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Shipping Country</label>
                        <input type="text" className="form-input" value={formData.ShippingCountry || ''} onChange={(e) => handleFieldChange('ShippingCountry', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea rows={2} className="form-textarea" value={formData.Description || ''} onChange={(e) => handleFieldChange('Description', e.target.value)} />
                  </div>
                </>
              )}

              {/* -------------------- OPPORTUNITY FIELDS -------------------- */}
              {objectName === 'Opportunity' && (
                <>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Opportunity Metrics
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Opportunity Name <span style={{ color: '#f87171' }}>*</span></label>
                        <input type="text" required className="form-input" value={formData.Name || ''} onChange={(e) => handleFieldChange('Name', e.target.value)} />
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
                        <select className="form-select" value={currentAccountId || ''} onChange={(e) => handleFieldChange('AccountId', e.target.value)}>
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
                        <select className="form-select" required value={formData.StageName || ''} onChange={(e) => handleFieldChange('StageName', e.target.value)}>
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
                        <input type="number" className="form-input" value={formData.Amount || ''} onChange={(e) => handleFieldChange('Amount', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Close Date</label>
                        <input type="date" className="form-input" value={formData.CloseDate || ''} onChange={(e) => handleFieldChange('CloseDate', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Probability (%)</label>
                        <input type="number" min="0" max="100" className="form-input" value={formData.Probability || ''} onChange={(e) => handleFieldChange('Probability', e.target.value)} />
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
                        <input type="text" className="form-input" value={formData.NextStep || ''} onChange={(e) => handleFieldChange('NextStep', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea rows={2} className="form-textarea" value={formData.Description || ''} onChange={(e) => handleFieldChange('Description', e.target.value)} />
                  </div>
                </>
              )}

              {/* -------------------- LEAD FIELDS -------------------- */}
              {objectName === 'Lead' && (
                <>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Lead Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input type="text" className="form-input" value={formData.FirstName || ''} onChange={(e) => handleFieldChange('FirstName', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Last Name <span style={{ color: '#f87171' }}>*</span></label>
                        <input type="text" required className="form-input" value={formData.LastName || ''} onChange={(e) => handleFieldChange('LastName', e.target.value)} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Company <span style={{ color: '#f87171' }}>*</span></label>
                        <input type="text" required className="form-input" value={formData.Company || ''} onChange={(e) => handleFieldChange('Company', e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Status <span style={{ color: '#f87171' }}>*</span></label>
                        <select className="form-select" required value={formData.Status || ''} onChange={(e) => handleFieldChange('Status', e.target.value)}>
                          <option value="Open - Not Contacted">Open - Not Contacted</option>
                          <option value="Working - Contacted">Working - Contacted</option>
                          <option value="Closed - Converted">Closed - Converted</option>
                          <option value="Closed - Not Converted">Closed - Not Converted</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Title</label>
                        <input type="text" className="form-input" value={formData.Title || ''} onChange={(e) => handleFieldChange('Title', e.target.value)} />
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
                        <input type="email" className="form-input" value={formData.Email || ''} onChange={(e) => handleFieldChange('Email', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input type="text" className="form-input" value={formData.Phone || ''} onChange={(e) => handleFieldChange('Phone', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mobile Phone</label>
                        <input type="text" className="form-input" value={formData.MobilePhone || ''} onChange={(e) => handleFieldChange('MobilePhone', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Lead Address */}
                  <div style={{ background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '4px solid #38bdf8' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} color="#38bdf8" /> Lead Address
                    </h4>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Street</label>
                      <input type="text" className="form-input" value={formData.Street || ''} onChange={(e) => handleFieldChange('Street', e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input type="text" className="form-input" value={formData.City || ''} onChange={(e) => handleFieldChange('City', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input type="text" className="form-input" value={formData.State || ''} onChange={(e) => handleFieldChange('State', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Postal Code</label>
                        <input type="text" className="form-input" value={formData.PostalCode || ''} onChange={(e) => handleFieldChange('PostalCode', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Country</label>
                        <input type="text" className="form-input" value={formData.Country || ''} onChange={(e) => handleFieldChange('Country', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea rows={2} className="form-textarea" value={formData.Description || ''} onChange={(e) => handleFieldChange('Description', e.target.value)} />
                  </div>
                </>
              )}

              {/* -------------------- EXTRA CUSTOM FIELDS ON THIS RECORD -------------------- */}
              {extraRecordFields.length > 0 && (
                <div style={{ background: 'rgba(168, 85, 247, 0.03)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', borderLeft: '4px solid #a855f7' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Additional & Custom Fields ({extraRecordFields.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    {extraRecordFields.map((fieldKey) => (
                      <div key={fieldKey} className="form-group">
                        <label className="form-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{fieldKey}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData[fieldKey] || ''}
                          onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button type="button" onClick={onClose} disabled={submitting} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                <Save size={15} />
                {submitting ? 'Saving Changes...' : 'Save & Update in Salesforce'}
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
