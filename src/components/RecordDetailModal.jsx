import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Copy,
  Check,
  Link2,
  Code,
  Building,
  UserCheck,
  Edit3,
  Clock,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  DollarSign,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import SyncedByBadge from './SyncedByBadge';

// Static set of all standard keys defined outside component to avoid allocations on render
const STATIC_RENDERED_KEYS = new Set([
  'id', 'Id', 'ID', 'Name', 'name', 'FirstName', 'LastName', 'Salutation', 'Title',
  'Department', 'AccountId', 'Account_Name', 'ReportsToId', 'LeadSource', 'Birthdate',
  'Email', 'Phone', 'MobilePhone', 'HomePhone', 'OtherPhone', 'Fax', 'AssistantName',
  'AssistantPhone', 'Description', 'Type', 'Industry', 'AnnualRevenue', 'NumberOfEmployees',
  'Ownership', 'Rating', 'Website', 'StageName', 'Amount', 'CloseDate', 'Probability',
  'ExpectedRevenue', 'NextStep', 'CampaignId', 'Company', 'Status',
  // Contact Addresses
  'MailingStreet', 'MailingCity', 'MailingState', 'MailingPostalCode', 'MailingCountry',
  'OtherStreet', 'OtherCity', 'OtherState', 'OtherPostalCode', 'OtherCountry',
  // Account Addresses
  'BillingStreet', 'BillingCity', 'BillingState', 'BillingPostalCode', 'BillingCountry',
  'ShippingStreet', 'ShippingCity', 'ShippingState', 'ShippingPostalCode', 'ShippingCountry',
  // Lead Addresses
  'Street', 'City', 'State', 'PostalCode', 'Country',
  // Internal/Audit
  'custom_app_created_by', 'custom_app_created_at', 'custom_app_modified_by', 'custom_app_modified_at',
  'customAppCreatedBy', 'customAppCreatedAt', 'customAppModifiedBy', 'customAppModifiedAt',
  'is_custom_app_created', 'isCustomAppCreated', 'synced_by', 'syncedBy', 'organization_id',
  'organizationId', 'raw_data', 'rawData', 'CreatedDate', 'LastModifiedDate', 'SystemModstamp',
  'createdDate', 'lastModifiedDate', 'systemModstamp', '_contact_count', '_opportunity_count'
]);

export default function RecordDetailModal({
  isOpen,
  onClose,
  objectName,
  recordId,
  onOpenCreateWithAccount,
  onEditRecord,
  onOpenRecordDetails
}) {
  const { activeOrgRole } = useAuth();
  const isReadOnly = activeOrgRole === 'READONLY';

  const [activeTab, setActiveTab] = useState('fields');
  const [loading, setLoading] = useState(false);
  const [relatedData, setRelatedData] = useState(null);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [rawRecord, setRawRecord] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldSearch, setFieldSearch] = useState('');

  // Debounce field filter input by 200ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setFieldSearch(searchQuery.trim().toLowerCase());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen && objectName && recordId) {
      setActiveTab('fields');
      setSearchQuery('');
      setFieldSearch('');
      setRelatedData(null);
      fetchDetails();
      loadRelatedIfNeeded();
    }
  }, [isOpen, objectName, recordId]);

  const fetchDetails = async () => {
    setLoading(true);
    setRawRecord(null);

    try {
      const rawRes = await api.get(`/api/data/${objectName}/${recordId}`);
      if (rawRes.data.success) {
        setRawRecord(rawRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load record details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedIfNeeded = async () => {
    if (relatedData || loadingRelated || !recordId) return;
    setLoadingRelated(true);
    try {
      const relRes = await api.get(`/api/data/${objectName}/${recordId}/related`);
      if (relRes.data.success) {
        setRelatedData(relRes.data.data);
      }
    } catch (err) {
      console.warn('Could not load related records:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const copyJson = () => {
    if (!rawRecord) return;
    navigator.clipboard.writeText(JSON.stringify(rawRecord, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const rec = rawRecord || {};

  // Memoized remaining keys computed unconditionally on every render BEFORE any early returns
  const remainingKeys = useMemo(() => {
    return Object.keys(rec).filter((k) => !STATIC_RENDERED_KEYS.has(k));
  }, [rec]);

  if (!isOpen) return null;

  const lower = objectName?.toLowerCase();

  // Extract explicit custom app audit values
  const customAppCreatedBy = rec.custom_app_created_by || rec.customAppCreatedBy || null;
  const customAppCreatedAt = rec.custom_app_created_at || rec.customAppCreatedAt || null;
  const customAppModifiedBy = rec.custom_app_modified_by || rec.customAppModifiedBy || null;
  const customAppModifiedAt = rec.custom_app_modified_at || rec.customAppModifiedAt || null;
  const syncedBy = rec.synced_by || rec.syncedBy || null;
  const isCustomAppCreated = Boolean(rec.is_custom_app_created || rec.isCustomAppCreated || customAppCreatedBy);
  const isModifiedInCustomApp = Boolean(customAppModifiedBy);

  // Salesforce metadata
  const sfCreatedDate = rec.CreatedDate || rec.createdDate || null;
  const sfLastModifiedDate = rec.LastModifiedDate || rec.lastModifiedDate || null;
  const parentAccId = rec.AccountId || rec.accountId || rec.accountid;
  const parentAccName = rec.Account_Name || rec.account_name || rec.AccountName || relatedData?.account?.name;

  // Helper to render field value (displaying null clearly and beautifully when empty)
  const renderValue = (val) => {
    if (val === null || val === undefined || val === '') {
      return (
        <span style={{
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          fontSize: '0.76rem',
          background: 'var(--table-header-bg)',
          border: '1px dashed var(--border-color)',
          padding: '0.12rem 0.45rem',
          borderRadius: '4px',
          width: 'fit-content',
          display: 'inline-block'
        }}>
          null
        </span>
      );
    }
    return <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', wordBreak: 'break-word', fontWeight: 500 }}>{String(val)}</span>;
  };

  // Helper to render an individual field card with search filter support and redirection
  const renderField = (label, key, overrideVal = undefined) => {
    const val = overrideVal !== undefined ? overrideVal : (rec[key] !== undefined ? rec[key] : (rec[key.toLowerCase()] !== undefined ? rec[key.toLowerCase()] : null));

    // Apply search filter if active
    if (fieldSearch) {
      const q = fieldSearch.toLowerCase();
      const matchLabel = label.toLowerCase().includes(q);
      const matchKey = key.toLowerCase().includes(q);
      const matchVal = val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      if (!matchLabel && !matchKey && !matchVal) return null;
    }

    return (
      <div key={label} style={{
        background: 'var(--table-header-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.55rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem'
      }}>
        <div style={{ marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600 }}>
            {label}
          </span>
        </div>
        {/* Interactive redirection links for relational fields */}
        {key === 'AccountId' && val && onOpenRecordDetails ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{String(val)}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              onClick={() => onOpenRecordDetails('Account', val)}
              title="View Parent Account Details"
            >
              <Building size={12} /> View Account →
            </button>
          </div>
        ) : key === 'Account_Name' && parentAccId && onOpenRecordDetails ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>{String(val)}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              onClick={() => onOpenRecordDetails('Account', parentAccId)}
              title="View Parent Account Details"
            >
              <Building size={12} /> View Account →
            </button>
          </div>
        ) : key === 'ReportsToId' && val && onOpenRecordDetails ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{String(val)}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem', color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              onClick={() => onOpenRecordDetails('Contact', val)}
              title="View Manager Contact Details"
            >
              <UserCheck size={12} /> View Manager →
            </button>
          </div>
        ) : (
          renderValue(val)
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content record-detail-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {rec.name || rec.Name || `${objectName} Record`}
                </h3>
                <span className={`badge ${isCustomAppCreated ? 'badge-info' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                  {isCustomAppCreated ? 'Custom App Origin' : 'Salesforce Synced'}
                </span>
                {isModifiedInCustomApp && (
                  <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(192, 132, 252, 0.2)', border: '1px solid rgba(192, 132, 252, 0.5)', color: '#c084fc', fontWeight: 600 }}>
                    ✏️ Modified in Custom App
                  </span>
                )}
                {/* Header redirect badge for Contact/Opportunity to Account */}
                {(lower === 'contact' || lower === 'opportunity') && parentAccId && onOpenRecordDetails && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => onOpenRecordDetails('Account', parentAccId)}
                    title={`View Account: ${parentAccName || parentAccId}`}
                  >
                    <Building size={12} /> Account: {parentAccName || String(parentAccId).slice(0, 10)} →
                  </button>
                )}
                {/* Header quick jump for Account to Linked Data */}
                {lower === 'account' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => {
                      setActiveTab('relations');
                      loadRelatedIfNeeded();
                    }}
                  >
                    <Link2 size={12} /> Linked Contacts & Deals →
                  </button>
                )}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#38bdf8' }}>
                ID: {recordId}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!isReadOnly && onEditRecord && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditRecord(objectName, rec);
                }}
                className="btn btn-primary btn-sm"
                title="Edit this record"
              >
                <Edit3 size={13} />
                Edit Record
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1.5rem 0', background: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('fields')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1rem',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'fields' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === 'fields' ? '#38bdf8' : 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FileText size={15} />
              All Fields & Addresses
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('relations');
                loadRelatedIfNeeded();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1rem',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'relations' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === 'relations' ? '#38bdf8' : 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Link2 size={15} />
              Linked Records
            </button>

            {/* <button
              type="button"
              onClick={() => setActiveTab('json')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1rem',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'json' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === 'json' ? '#38bdf8' : 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Code size={15} />
              Raw Payload
            </button> */}
          </div>

          {activeTab === 'fields' && (
            <div style={{ position: 'relative', width: 220, marginBottom: '0.4rem' }}>
              <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.3rem 0.5rem 0.3rem 1.8rem',
                  fontSize: '0.78rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title="Clear field search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ flex: 1, minHeight: 380, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading record details...
            </div>
          ) : activeTab === 'fields' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* PROMINENT CUSTOM APP MODIFIED BANNER */}
              {isModifiedInCustomApp ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(90deg, var(--pill-purple-bg) 0%, var(--bg-card) 100%)',
                  border: '1px solid var(--pill-purple-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--pill-purple-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit3 size={16} color="var(--pill-purple-text)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Modified in Custom App by: <span style={{ color: 'var(--accent-purple)', textDecoration: 'underline' }}>{customAppModifiedBy}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Timestamp: {customAppModifiedAt ? new Date(customAppModifiedAt).toLocaleString() : 'Recent update'}
                      </div>
                    </div>
                  </div>
                  <span className="badge" style={{ background: 'var(--pill-purple-bg)', border: '1px solid var(--pill-purple-border)', color: 'var(--pill-purple-text)', fontSize: '0.72rem' }}>
                    Custom App Audit Verified
                  </span>
                </div>
              ) : null}

              {/* AUDIT & OWNERSHIP CARDS (Created By, Modified By, Synced By) */}
              <div className="audit-cards-grid" style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem'
              }}>
                {/* Created By Card */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <UserCheck size={12} color="#38bdf8" /> Created By
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {customAppCreatedBy ? (
                      <span style={{ color: '#38bdf8' }}>{customAppCreatedBy}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Salesforce System</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {customAppCreatedAt ? new Date(customAppCreatedAt).toLocaleString() : (sfCreatedDate ? new Date(sfCreatedDate).toLocaleString() : 'Timestamp unavailable')}
                  </div>
                </div>

                {/* Modified By Card */}
                <div style={{ background: isModifiedInCustomApp ? 'var(--pill-purple-bg)' : 'transparent', padding: isModifiedInCustomApp ? '0.3rem 0.5rem' : '0', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Edit3 size={12} color={isModifiedInCustomApp ? 'var(--accent-purple)' : 'var(--text-muted)'} /> Modified By (Custom App)
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {isModifiedInCustomApp ? (
                      <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>{customAppModifiedBy}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>Not modified in custom app</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {customAppModifiedAt ? new Date(customAppModifiedAt).toLocaleString() : (sfLastModifiedDate ? `SF: ${new Date(sfLastModifiedDate).toLocaleString()}` : '-')}
                  </div>
                </div>

                {/* Synced By Card */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <RefreshCw size={12} color="#34d399" /> Synced By
                  </div>
                  <SyncedByBadge syncedBy={syncedBy} variant="modal" />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Multi-Tenant Secure Sync
                  </div>
                </div>
              </div>

              {/* CONTACT VIEW: SEPARATE MAILING & OTHER ADDRESSES */}
              {lower === 'contact' && (
                <>
                  {/* General Information */}
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Briefcase size={14} color="#38bdf8" /> General Information
                    </h4>
                    <div className="field-cards-grid">
                      {renderField('Full Name', 'Name')}
                      {renderField('Salutation', 'Salutation')}
                      {renderField('First Name', 'FirstName')}
                      {renderField('Last Name', 'LastName')}
                      {renderField('Title', 'Title')}
                      {renderField('Department', 'Department')}
                      {renderField('Related Account ID', 'AccountId')}
                      {renderField('Related Account Name', 'Account_Name', rec.Account_Name || rec.account_name)}
                      {renderField('Reports To ID', 'ReportsToId')}
                      {renderField('Lead Source', 'LeadSource')}
                      {renderField('Birthdate', 'Birthdate')}
                    </div>
                  </div>

                  {/* Communication Details */}
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={14} color="#34d399" /> Contact & Phone Details
                    </h4>
                    <div className="field-cards-grid">
                      {renderField('Email Address', 'Email')}
                      {renderField('Phone', 'Phone')}
                      {renderField('Mobile Phone', 'MobilePhone')}
                      {renderField('Home Phone', 'HomePhone')}
                      {renderField('Other Phone', 'OtherPhone')}
                      {renderField('Fax', 'Fax')}
                      {renderField('Assistant Name', 'AssistantName')}
                      {renderField('Assistant Phone', 'AssistantPhone')}
                    </div>
                  </div>

                  {/* DISTINCT ADDRESS 1: MAILING ADDRESS */}
                  <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #38bdf8', background: 'rgba(56, 189, 248, 0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="#38bdf8" /> Mailing Address
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Primary Contact Postal Address</span>
                    </div>
                    <div className="field-cards-grid">
                      {renderField('Mailing Street', 'MailingStreet')}
                      {renderField('Mailing City', 'MailingCity')}
                      {renderField('Mailing State / Province', 'MailingState')}
                      {renderField('Mailing Zip / Postal Code', 'MailingPostalCode')}
                      {renderField('Mailing Country', 'MailingCountry')}
                    </div>
                  </div>

                  {/* DISTINCT ADDRESS 2: OTHER ADDRESS */}
                  <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #c084fc', background: 'rgba(192, 132, 252, 0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="#c084fc" /> Other Address (Different from Mailing)
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Secondary / Branch Location</span>
                    </div>
                    <div className="field-cards-grid">
                      {renderField('Other Street', 'OtherStreet')}
                      {renderField('Other City', 'OtherCity')}
                      {renderField('Other State / Province', 'OtherState')}
                      {renderField('Other Zip / Postal Code', 'OtherPostalCode')}
                      {renderField('Other Country', 'OtherCountry')}
                    </div>
                  </div>

                  {/* Description & Notes */}
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Description & Notes
                    </h4>
                    {renderField('Description', 'Description')}
                  </div>
                </>
              )}

              {/* ACCOUNT VIEW: SEPARATE BILLING & SHIPPING ADDRESSES */}
              {lower === 'account' && (
                <>
                  {/* Account Information */}
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Account Overview
                    </h4>
                    <div className="field-cards-grid">
                      {renderField('Account Name', 'Name')}
                      {renderField('Type', 'Type')}
                      {renderField('Industry', 'Industry')}
                      {renderField('Annual Revenue', 'AnnualRevenue', rec.AnnualRevenue || rec.annualRevenue ? `$${Number(rec.AnnualRevenue || rec.annualRevenue).toLocaleString()}` : null)}
                      {renderField('Number of Employees', 'NumberOfEmployees')}
                      {renderField('Ownership', 'Ownership')}
                      {renderField('Rating', 'Rating')}
                      {renderField('Phone', 'Phone')}
                      {renderField('Fax', 'Fax')}
                      {renderField('Website', 'Website')}
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #38bdf8', background: 'rgba(56, 189, 248, 0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="#38bdf8" /> Billing Address
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Financial Invoicing Location</span>
                    </div>
                    <div className="field-cards-grid">
                      {renderField('Billing Street', 'BillingStreet')}
                      {renderField('Billing City', 'BillingCity')}
                      {renderField('Billing State / Province', 'BillingState')}
                      {renderField('Billing Zip / Postal Code', 'BillingPostalCode')}
                      {renderField('Billing Country', 'BillingCountry')}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #34d399', background: 'rgba(52, 211, 153, 0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="#34d399" /> Shipping Address (Different from Billing)
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Warehouse / Delivery Location</span>
                    </div>
                    <div className="field-cards-grid">
                      {renderField('Shipping Street', 'ShippingStreet')}
                      {renderField('Shipping City', 'ShippingCity')}
                      {renderField('Shipping State / Province', 'ShippingState')}
                      {renderField('Shipping Zip / Postal Code', 'ShippingPostalCode')}
                      {renderField('Shipping Country', 'ShippingCountry')}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Description
                    </h4>
                    {renderField('Description', 'Description')}
                  </div>
                </>
              )}

              {/* OPPORTUNITY VIEW */}
              {lower === 'opportunity' && (
                <>
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Opportunity Overview
                    </h4>
                    <div className="field-cards-grid">
                      {renderField('Opportunity Name', 'Name')}
                      {renderField('Stage', 'StageName')}
                      {renderField('Amount', 'Amount', rec.Amount || rec.amount ? `$${Number(rec.Amount || rec.amount).toLocaleString()}` : null)}
                      {renderField('Close Date', 'CloseDate')}
                      {renderField('Probability (%)', 'Probability')}
                      {renderField('Type', 'Type')}
                      {renderField('Lead Source', 'LeadSource')}
                      {renderField('Expected Revenue', 'ExpectedRevenue')}
                      {renderField('Next Step', 'NextStep')}
                      {renderField('Related Account ID', 'AccountId')}
                      {renderField('Related Account Name', 'Account_Name', rec.Account_Name || rec.account_name)}
                      {renderField('Campaign ID', 'CampaignId')}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Description & Context
                    </h4>
                    {renderField('Description', 'Description')}
                  </div>
                </>
              )}

              {/* LEAD VIEW */}
              {lower === 'lead' && (
                <>
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Lead Information
                    </h4>
                    <div className="field-cards-grid">
                      {renderField('Full Name', 'Name')}
                      {renderField('Salutation', 'Salutation')}
                      {renderField('First Name', 'FirstName')}
                      {renderField('Last Name', 'LastName')}
                      {renderField('Company', 'Company')}
                      {renderField('Title', 'Title')}
                      {renderField('Status', 'Status')}
                      {renderField('Rating', 'Rating')}
                      {renderField('Industry', 'Industry')}
                      {renderField('Number of Employees', 'NumberOfEmployees')}
                      {renderField('Annual Revenue', 'AnnualRevenue')}
                      {renderField('Lead Source', 'LeadSource')}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Communication
                    </h4>
                    <div className="field-cards-grid">
                      {renderField('Email', 'Email')}
                      {renderField('Phone', 'Phone')}
                      {renderField('Mobile Phone', 'MobilePhone')}
                      {renderField('Fax', 'Fax')}
                      {renderField('Website', 'Website')}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #38bdf8', background: 'rgba(56, 189, 248, 0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="#38bdf8" /> Lead Address
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lead Territory Location</span>
                    </div>
                    <div className="field-cards-grid">
                      {renderField('Street', 'Street')}
                      {renderField('City', 'City')}
                      {renderField('State / Province', 'State')}
                      {renderField('Zip / Postal Code', 'PostalCode')}
                      {renderField('Country', 'Country')}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Description
                    </h4>
                    {renderField('Description', 'Description')}
                  </div>
                </>
              )}

              {/* REMAINING / CUSTOM ATTRIBUTES (DISPLAYING ALL FIELDS INCLUDING NULL VALUES) */}
              {remainingKeys.length > 0 && (
                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #a855f7', background: 'rgba(168, 85, 247, 0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', margin: 0 }}>
                      All Additional Record Attributes ({remainingKeys.length} Fields — Including Null Values)
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Complete schema transparency
                    </span>
                  </div>
                  <div className="field-cards-grid">
                    {remainingKeys.map((k) => renderField(k, k))}
                  </div>
                </div>
              )}

            </div>
          ) : activeTab === 'relations' ? (
            /* Relationships Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {lower === 'account' && (
                <>
                  {/* Related Contacts */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Related Contacts ({relatedData?.contacts?.length || 0})
                      </span>
                      {!isReadOnly && onOpenCreateWithAccount && (
                        <button
                          onClick={() => onOpenCreateWithAccount('Contact', recordId)}
                          className="btn btn-secondary btn-sm"
                        >
                          + Add Contact for this Account
                        </button>
                      )}
                    </div>
                    {(!relatedData?.contacts || relatedData.contacts.length === 0) ? (
                      <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No contacts linked to this account.</div>
                    ) : (
                      <div className="table-responsive-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Contact Name</th>
                              <th>Title</th>
                              <th>Email</th>
                              <th>Phone</th>
                              <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relatedData.contacts.map((c) => (
                              <tr
                                key={c.id}
                                style={{ cursor: onOpenRecordDetails ? 'pointer' : 'default' }}
                                onClick={() => onOpenRecordDetails && onOpenRecordDetails('Contact', c.id)}
                              >
                                <td>
                                  <strong style={{ color: '#38bdf8', textDecoration: 'underline' }}>{c.name}</strong>
                                </td>
                                <td>{c.title || '-'}</td>
                                <td>{c.email || '-'}</td>
                                <td>{c.phone || '-'}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onOpenRecordDetails) onOpenRecordDetails('Contact', c.id);
                                    }}
                                    title="View Contact Details"
                                  >
                                    View Contact →
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Related Opportunities */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Related Opportunities ({relatedData?.opportunities?.length || 0})
                      </span>
                      {!isReadOnly && onOpenCreateWithAccount && (
                        <button
                          onClick={() => onOpenCreateWithAccount('Opportunity', recordId)}
                          className="btn btn-secondary btn-sm"
                        >
                          + Add Opportunity for this Account
                        </button>
                      )}
                    </div>
                    {(!relatedData?.opportunities || relatedData.opportunities.length === 0) ? (
                      <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No opportunities linked to this account.</div>
                    ) : (
                      <div className="table-responsive-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Opportunity Deal</th>
                              <th>Stage</th>
                              <th>Amount</th>
                              <th>Close Date</th>
                              <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relatedData.opportunities.map((o) => (
                              <tr
                                key={o.id}
                                style={{ cursor: onOpenRecordDetails ? 'pointer' : 'default' }}
                                onClick={() => onOpenRecordDetails && onOpenRecordDetails('Opportunity', o.id)}
                              >
                                <td>
                                  <strong style={{ color: '#c084fc', textDecoration: 'underline' }}>{o.name}</strong>
                                </td>
                                <td><span className="badge badge-info">{o.stageName}</span></td>
                                <td style={{ color: '#34d399', fontWeight: 600 }}>{o.amount ? `$${Number(o.amount).toLocaleString()}` : '-'}</td>
                                <td>{o.closeDate || '-'}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onOpenRecordDetails) onOpenRecordDetails('Opportunity', o.id);
                                    }}
                                    title="View Opportunity Details"
                                  >
                                    View Deal →
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Contact/Opportunity Parent Account Info */}
              {(lower === 'contact' || lower === 'opportunity') && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    Parent Organization Account
                  </h4>
                  {relatedData?.account ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <span
                          className="account-pill"
                          style={{ fontSize: '0.9rem', padding: '0.35rem 0.85rem', cursor: onOpenRecordDetails ? 'pointer' : 'default' }}
                          onClick={() => onOpenRecordDetails && onOpenRecordDetails('Account', relatedData.account.id)}
                          title="Click to view Account details"
                        >
                          🏢 {relatedData.account.name}
                        </span>
                        <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Industry: {relatedData.account.industry || '-'} • City: {relatedData.account.billingCity || '-'}
                        </div>
                      </div>
                      {onOpenRecordDetails && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onOpenRecordDetails('Account', relatedData.account.id)}
                        >
                          View Account Details →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Not linked to an account yet.</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Raw JSON Tab */
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                <button onClick={copyJson} className="btn btn-secondary btn-sm">
                  {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
              <pre style={{
                background: '#060910',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: '#e2e8f0',
                overflowX: 'auto',
                maxHeight: 400
              }}>
                {JSON.stringify(rawRecord, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
