import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileCode,
  Building2,
  Lock,
  Filter,
  X,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import SyncedByBadge, { parseSyncedBy } from './SyncedByBadge';

export default function DataExplorer({ onOpenDetails, onOpenCreate, onOpenEdit, sfStatus, refreshSignal }) {
  const { activeOrgId, activeOrgName, activeOrgRole } = useAuth();
  const isReadOnly = activeOrgRole === 'READONLY';

  const [activeTable, setActiveTable] = useState('Account');
  const [tableCounts, setTableCounts] = useState([]);
  const [records, setRecords] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Tab-specific filters
  const [filterOrigin, setFilterOrigin] = useState('all'); // 'all' | 'custom' | 'salesforce'
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSyncedBy, setFilterSyncedBy] = useState('');

  // Debounce search input by 280ms to avoid network storms while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Clean table switch handler: resets filters in a single pass without cascading effect runs
  const handleSwitchTable = (newTab) => {
    if (newTab === activeTable) return;
    setActiveTable(newTab);
    setPage(1);
    setSearchInput('');
    setDebouncedSearch('');
    setFilterOrigin('all');
    setFilterIndustry('');
    setFilterType('');
    setFilterStage('');
    setFilterStatus('');
    setFilterDepartment('');
    setFilterSyncedBy('');
  };

  useEffect(() => {
    fetchTableCounts();
  }, [activeOrgId, refreshSignal]);

  useEffect(() => {
    fetchRecords();
  }, [activeTable, page, debouncedSearch, activeOrgId, refreshSignal]);

  const fetchTableCounts = async () => {
    try {
      const res = await api.get('/api/data/tables');
      if (res.data.success) {
        setTableCounts(res.data.data || []);
      }
    } catch (err) {
      console.warn('Could not fetch tables summary');
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/data/${activeTable}`, {
        params: { page, limit: 25, search: debouncedSearch }
      });
      if (res.data.success && res.data.data) {
        setRecords(res.data.data.records || []);
        setTotalPages(res.data.data.totalPages || 1);
        setTotalRecords(res.data.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'csv') => {
    setExporting(true);
    try {
      const res = await api.get(`/api/export/${activeTable}`, {
        params: { format },
        responseType: 'blob'
      });

      const blob = new Blob([res.data], {
        type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTable}_${activeOrgName || 'export'}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export records: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  // Extract unique users who have synced records in the current view
  const uniqueSyncedUsers = useMemo(() => {
    const usersSet = new Set();
    records.forEach((row) => {
      const raw = row.synced_by || row.syncedBy;
      parseSyncedBy(raw).forEach((u) => {
        usersSet.add(u.raw);
      });
    });
    return Array.from(usersSet).sort();
  }, [records]);

  // Filter records based on active object tab filters
  const filteredRecords = useMemo(() => {
    return records.filter((row) => {
      // Origin Filter
      const isCustom = Boolean(row.is_custom_app_created || row.custom_app_created_by);
      if (filterOrigin === 'custom' && !isCustom) return false;
      if (filterOrigin === 'salesforce' && isCustom) return false;

      // Synced By Filter
      if (filterSyncedBy) {
        const raw = row.synced_by || row.syncedBy;
        const users = parseSyncedBy(raw).map((u) => u.raw.toLowerCase());
        if (!users.includes(filterSyncedBy.toLowerCase())) return false;
      }

      // Account Filters
      if (activeTable === 'Account') {
        if (filterIndustry && (row.Industry || row.industry) !== filterIndustry) return false;
        if (filterType && (row.Type || row.type) !== filterType) return false;
      }

      // Contact Filters
      if (activeTable === 'Contact') {
        if (filterDepartment && (row.Department || row.department) !== filterDepartment) return false;
      }

      // Opportunity Filters
      if (activeTable === 'Opportunity') {
        if (filterStage && (row.StageName || row.stageName) !== filterStage) return false;
        if (filterType && (row.Type || row.type) !== filterType) return false;
      }

      // Lead Filters
      if (activeTable === 'Lead') {
        if (filterStatus && (row.Status || row.status) !== filterStatus) return false;
        if (filterIndustry && (row.Industry || row.industry) !== filterIndustry) return false;
      }

      return true;
    });
  }, [records, filterOrigin, filterSyncedBy, filterIndustry, filterType, filterStage, filterStatus, filterDepartment, activeTable]);

  const hasActiveFilters = Boolean(
    filterOrigin !== 'all' ||
    filterSyncedBy ||
    filterIndustry ||
    filterType ||
    filterStage ||
    filterStatus ||
    filterDepartment
  );

  const resetFilters = () => {
    setFilterOrigin('all');
    setFilterSyncedBy('');
    setFilterIndustry('');
    setFilterType('');
    setFilterStage('');
    setFilterStatus('');
    setFilterDepartment('');
  };

  const isLive = sfStatus?.connected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header Bar */}
      <div className="card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Table Switcher Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.3rem', borderRadius: 'var(--radius-md)' }}>
            {['Account', 'Contact', 'Opportunity', 'Lead'].map((tab) => {
              const count = tableCounts.find((t) => t.objectName === tab)?.count;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleSwitchTable(tab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: activeTable === tab ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: activeTable === tab ? '#38bdf8' : 'var(--text-secondary)',
                    fontWeight: activeTable === tab ? 600 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tab}</span>
                  {count !== undefined && (
                    <span style={{ fontSize: '0.72rem', opacity: 0.75, background: 'rgba(255, 255, 255, 0.08)', padding: '1px 6px', borderRadius: 10 }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={`Search ${activeTable}...`}
                className="form-input"
                style={{ paddingLeft: '2.2rem', paddingRight: searchInput ? '2rem' : '0.85rem', width: 220, padding: '0.45rem 0.85rem 0.45rem 2.2rem', fontSize: '0.82rem' }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  style={{
                    position: 'absolute',
                    right: '0.6rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={() => { fetchRecords(); fetchTableCounts(); }}
              className="btn btn-secondary btn-sm"
              title="Refresh table"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>

            {/* Export CSV */}
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="btn btn-secondary btn-sm"
              title="Export records as CSV"
            >
              <FileSpreadsheet size={14} />
              CSV
            </button>

            {/* Export JSON */}
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="btn btn-secondary btn-sm"
              title="Export records as JSON"
            >
              <FileCode size={14} />
              JSON
            </button>

            {/* New Record Button */}
            {!isReadOnly && (
              <button
                onClick={() => onOpenCreate(activeTable)}
                disabled={!isLive}
                className="btn btn-accent btn-sm"
                title={isLive ? 'Create record in Salesforce & Local Database' : 'Connect Salesforce to create records'}
              >
                <Plus size={15} />
                New {activeTable}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Object Filter Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginTop: '1rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <Filter size={14} /> Filters:
          </div>

          {/* Origin Filter (Applies to all objects) */}
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
            value={filterOrigin}
            onChange={(e) => setFilterOrigin(e.target.value)}
          >
            <option value="all">All Origins</option>
            <option value="custom">Created in Custom App</option>
            <option value="salesforce">Salesforce Synced</option>
          </select>

          {/* Account Filters */}
          {activeTable === 'Account' && (
            <>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
              >
                <option value="">All Industries</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Consulting">Consulting</option>
                <option value="Education">Education</option>
                <option value="Energy">Energy</option>
                <option value="Retail">Retail</option>
              </select>

              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Prospect">Prospect</option>
                <option value="Customer - Direct">Customer - Direct</option>
                <option value="Customer - Channel">Customer - Channel</option>
                <option value="Channel Partner / Reseller">Channel Partner / Reseller</option>
              </select>
            </>
          )}

          {/* Contact Filters */}
          {activeTable === 'Contact' && (
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="Finance">Finance</option>
              <option value="Executive">Executive</option>
            </select>
          )}

          {/* Opportunity Filters */}
          {activeTable === 'Opportunity' && (
            <>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
              >
                <option value="">All Stages</option>
                <option value="Prospecting">Prospecting</option>
                <option value="Qualification">Qualification</option>
                <option value="Needs Analysis">Needs Analysis</option>
                <option value="Value Proposition">Value Proposition</option>
                <option value="Proposal/Price Quote">Proposal/Price Quote</option>
                <option value="Negotiation/Review">Negotiation/Review</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>

              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Deal Types</option>
                <option value="New Customer">New Customer</option>
                <option value="Existing Customer - Upgrade">Existing Customer - Upgrade</option>
                <option value="Existing Customer - Replacement">Existing Customer - Replacement</option>
              </select>
            </>
          )}

          {/* Lead Filters */}
          {activeTable === 'Lead' && (
            <>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Open - Not Contacted">Open - Not Contacted</option>
                <option value="Working - Contacted">Working - Contacted</option>
                <option value="Closed - Converted">Closed - Converted</option>
                <option value="Closed - Not Converted">Closed - Not Converted</option>
              </select>

              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
              >
                <option value="">All Industries</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Consulting">Consulting</option>
              </select>
            </>
          )}

          {/* Synced By User Filter */}
          {uniqueSyncedUsers.length > 0 && (
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              value={filterSyncedBy}
              onChange={(e) => setFilterSyncedBy(e.target.value)}
              title="Filter records by user who synced them"
            >
              <option value="">All Synced Members ({uniqueSyncedUsers.length})</option>
              {uniqueSyncedUsers.map((user) => (
                <option key={user} value={user}>
                  Synced by: {user.includes('@') ? user.split('@')[0] : user}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: '#f87171' }}
            >
              <X size={12} /> Clear Filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing {filteredRecords.length} matching rows
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              {/* ACCOUNT TABLE HEADERS */}
              {activeTable === 'Account' && (
                <tr>
                  <th>ID</th>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th>Industry</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Annual Revenue</th>
                  <th>Origin</th>
                  <th>Created By</th>
                  <th>Modified By</th>
                  <th>Synced By</th>
                  <th>Related</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              )}

              {/* CONTACT TABLE HEADERS */}
              {activeTable === 'Contact' && (
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Title</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Related Account</th>
                  <th>Origin</th>
                  <th>Created By</th>
                  <th>Modified By</th>
                  <th>Synced By</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              )}

              {/* OPPORTUNITY TABLE HEADERS */}
              {activeTable === 'Opportunity' && (
                <tr>
                  <th>ID</th>
                  <th>Opportunity Name</th>
                  <th>Stage</th>
                  <th>Amount</th>
                  <th>Close Date</th>
                  <th>Probability</th>
                  <th>Related Account</th>
                  <th>Origin</th>
                  <th>Created By</th>
                  <th>Modified By</th>
                  <th>Synced By</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              )}

              {/* LEAD TABLE HEADERS */}
              {activeTable === 'Lead' && (
                <tr>
                  <th>ID</th>
                  <th>Lead Name</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Title</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Industry</th>
                  <th>Origin</th>
                  <th>Created By</th>
                  <th>Modified By</th>
                  <th>Synced By</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              )}
            </thead>

            <tbody style={{ opacity: loading ? 0.65 : 1, transition: 'opacity 0.15s ease' }}>
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan="14" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                      <RefreshCw size={16} className="spin" color="#38bdf8" />
                      Loading {activeTable} records from {activeOrgName || activeOrgId}...
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="14" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {loading ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                        <RefreshCw size={16} className="spin" color="#38bdf8" />
                        Fetching latest records...
                      </div>
                    ) : (
                      <>No records found matching your filters in workspace <strong>{activeOrgName || activeOrgId}</strong>.</>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => {
                  const rowId = row.Id || row.id || row.ID || idx;
                  const isCustom = Boolean(row.is_custom_app_created || row.isCustomAppCreated || row.custom_app_created_by || row.customAppCreatedBy);
                  const createdBy = row.custom_app_created_by || row.customAppCreatedBy || null;
                  const modifiedBy = row.custom_app_modified_by || row.customAppModifiedBy || null;
                  const syncedBy = row.synced_by || row.syncedBy || null;
                  const accountId = row.AccountId || row.accountId || row.accountid;
                  const accountName = row.Account_Name || row.account_name || row.AccountName;

                  return (
                    <tr key={rowId}>
                      {/* ID */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#38bdf8' }}>
                        {String(rowId).slice(0, 18)}
                      </td>

                      {/* ACCOUNT SPECIFIC ROW */}
                      {activeTable === 'Account' && (
                        <>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.Name || row.name || '-'}</td>
                          <td>{row.Type || row.type || '-'}</td>
                          <td>{row.Industry || row.industry || '-'}</td>
                          <td>{row.Phone || row.phone || '-'}</td>
                          <td>{row.BillingCity || row.billingCity || '-'}</td>
                          <td style={{ color: '#34d399', fontWeight: 600 }}>
                            {row.AnnualRevenue || row.annualRevenue ? `$${Number(row.AnnualRevenue || row.annualRevenue).toLocaleString()}` : '-'}
                          </td>
                        </>
                      )}

                      {/* CONTACT SPECIFIC ROW */}
                      {activeTable === 'Contact' && (
                        <>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {row.Name || `${row.FirstName || row.firstName || ''} ${row.LastName || row.lastName || ''}`.trim() || '-'}
                          </td>
                          <td>{row.Title || row.title || '-'}</td>
                          <td style={{ color: '#38bdf8' }}>{row.Email || row.email || '-'}</td>
                          <td>{row.Phone || row.phone || '-'}</td>
                          <td>{row.Department || row.department || '-'}</td>
                          <td>
                            {accountId ? (
                              <span
                                className="account-pill"
                                onClick={() => onOpenDetails('Account', accountId)}
                                title="Click to view Account"
                              >
                                🏢 {accountName || accountId}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* OPPORTUNITY SPECIFIC ROW */}
                      {activeTable === 'Opportunity' && (
                        <>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.Name || row.name || '-'}</td>
                          <td>
                            <span className="badge badge-info">{row.StageName || row.stageName || '-'}</span>
                          </td>
                          <td style={{ color: '#34d399', fontWeight: 700 }}>
                            {row.Amount || row.amount ? `$${Number(row.Amount || row.amount).toLocaleString()}` : '-'}
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>{row.CloseDate || row.closeDate || '-'}</td>
                          <td>{row.Probability || row.probability ? `${row.Probability || row.probability}%` : '-'}</td>
                          <td>
                            {accountId ? (
                              <span
                                className="account-pill"
                                onClick={() => onOpenDetails('Account', accountId)}
                                title="Click to view Account"
                              >
                                🏢 {accountName || accountId}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* LEAD SPECIFIC ROW */}
                      {activeTable === 'Lead' && (
                        <>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {row.Name || `${row.FirstName || row.firstName || ''} ${row.LastName || row.lastName || ''}`.trim() || '-'}
                          </td>
                          <td style={{ fontWeight: 500 }}>{row.Company || row.company || '-'}</td>
                          <td>
                            <span className="badge badge-info">{row.Status || row.status || '-'}</span>
                          </td>
                          <td>{row.Title || row.title || '-'}</td>
                          <td style={{ color: '#38bdf8' }}>{row.Email || row.email || '-'}</td>
                          <td>{row.Phone || row.phone || '-'}</td>
                          <td>{row.Industry || row.industry || '-'}</td>
                        </>
                      )}

                      {/* ORIGIN BADGE */}
                      <td>
                        <span className={`badge ${isCustom ? 'badge-info' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                          {isCustom ? 'Custom App' : 'SF Synced'}
                        </span>
                      </td>

                      {/* CREATED BY COLUMN */}
                      <td>
                        {createdBy ? (
                          <span className="creator-badge" title={`Created by user in Custom App on ${row.custom_app_created_at || ''}`}>
                            <UserCheck size={12} /> {createdBy.split('@')[0]}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>SF System</span>
                        )}
                      </td>

                      {/* MODIFIED BY COLUMN */}
                      <td>
                        {modifiedBy ? (
                          <span className="creator-badge" style={{ borderColor: 'rgba(192, 132, 252, 0.4)', color: '#c084fc' }} title={`Modified by ${modifiedBy} on ${row.custom_app_modified_at || ''}`}>
                            <Edit3 size={11} /> {modifiedBy.split('@')[0]}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>

                      {/* SYNCED BY COLUMN */}
                      <td>
                        <SyncedByBadge syncedBy={syncedBy} variant="table" />
                      </td>

                      {/* ACCOUNT RELATED PILLS */}
                      {activeTable === 'Account' && (
                        <td>
                          <span
                            className="account-pill"
                            style={{ marginRight: 6, fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                            onClick={() => onOpenDetails('Account', rowId)}
                          >
                            👥 {row._contact_count || 0} Contacts
                          </span>
                          <span
                            className="account-pill"
                            style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}
                            onClick={() => onOpenDetails('Account', rowId)}
                          >
                            💼 {row._opportunity_count || 0} Deals
                          </span>
                        </td>
                      )}

                      {/* ACTIONS: EDIT & DETAILS */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          {!isReadOnly && onOpenEdit && (
                            <button
                              onClick={() => onOpenEdit(activeTable, row)}
                              className="btn btn-secondary btn-sm"
                              title="Edit record fields"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <Edit3 size={12} />
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => onOpenDetails(activeTable, rowId)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <Eye size={12} />
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.15)',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            Showing {filteredRecords.length} of {totalRecords} records in <strong>{activeOrgName || activeOrgId}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
