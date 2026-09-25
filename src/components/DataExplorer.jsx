import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Search, Plus, Eye, ChevronLeft, ChevronRight, UserCheck, RefreshCw } from 'lucide-react';

export default function DataExplorer({ onOpenDetails, onOpenCreate, sfStatus }) {
  const [activeTable, setActiveTable] = useState('Account');
  const [tableCounts, setTableCounts] = useState([]);
  const [records, setRecords] = useState([]);
  const [columns, setColumns] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTableCounts();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [activeTable, page, search]);

  const fetchTableCounts = async () => {
    try {
      const res = await api.get('/api/data/tables');
      if (res.data.success) {
        setTableCounts(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch tables summary');
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/data/${activeTable}`, {
        params: { page, limit: 15, search }
      });
      if (res.data.success) {
        setRecords(res.data.data.records || []);
        setColumns(res.data.data.columns || []);
        setTotalPages(res.data.data.totalPages || 1);
        setTotalRecords(res.data.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const isLive = sfStatus?.connected && !sfStatus?.isMock;

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
                  onClick={() => { setActiveTable(tab); setPage(1); }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={`Search ${activeTable}...`}
                className="form-input"
                style={{ paddingLeft: '2.2rem', width: 240, padding: '0.45rem 0.85rem 0.45rem 2.2rem', fontSize: '0.82rem' }}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Refresh */}
            <button
              onClick={() => { fetchRecords(); fetchTableCounts(); }}
              className="btn btn-secondary btn-sm"
              title="Refresh table"
            >
              <RefreshCw size={14} />
            </button>

            {/* New Record Button */}
            <button
              onClick={() => onOpenCreate(activeTable)}
              disabled={!isLive}
              className="btn btn-accent btn-sm"
              title={isLive ? 'Create record in Salesforce' : 'Connect live Salesforce to create records'}
            >
              <Plus size={15} />
              New {activeTable}
            </button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>
                    {col === 'Account_Name' ? 'Related Account' : (col === 'custom_app_created_by' ? 'Created By (App)' : col)}
                  </th>
                ))}
                {activeTable === 'Account' && <th>Related</th>}
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>Loading records...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No records match your criteria.</td></tr>
              ) : (
                records.map((row, idx) => {
                const rowId = row.Id || row.id || row.ID || idx;
                const getVal = (col) => {
                  if (row[col] !== undefined && row[col] !== null) return row[col];
                  const matchKey = Object.keys(row).find((k) => k.toLowerCase() === col.toLowerCase());
                  return matchKey ? row[matchKey] : null;
                };

                const accountId = row.AccountId || row.accountid || row.accountId;
                const accountName = row.Account_Name || row.account_name || row.AccountName;
                const createdBy = getVal('custom_app_created_by');

                return (
                  <tr key={rowId}>
                    {columns.map((col) => {
                      const val = getVal(col);

                      if (col.toLowerCase() === 'id') {
                        return <td key={col} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38bdf8' }}>{val || rowId}</td>;
                      }

                      if (col === 'Account_Name' || col.toLowerCase() === 'accountid') {
                        return (
                          <td key={col}>
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
                        );
                      }

                      if (col === 'custom_app_created_by') {
                        return (
                          <td key={col}>
                            {createdBy ? (
                              <span className="creator-badge" title="Created by user in Custom App">
                                <UserCheck size={12} /> {createdBy}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>SF Sync</span>
                            )}
                          </td>
                        );
                      }

                      return <td key={col}>{val !== null && val !== undefined ? String(val) : '-'}</td>;
                    })}

                    {/* Account Specific Related Pills */}
                    {activeTable === 'Account' && (
                      <td>
                        <span
                          className="account-pill"
                          style={{ marginRight: 6, fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                          onClick={() => onOpenDetails('Account', rowId)}
                        >
                          👥 {row._contact_count || 0} Contacts
                        </span>
                        <span
                          className="account-pill"
                          style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                          onClick={() => onOpenDetails('Account', rowId)}
                        >
                          💼 {row._opportunity_count || 0} Deals
                        </span>
                      </td>
                    )}

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => onOpenDetails(activeTable, rowId)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={13} />
                        View Details
                      </button>
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
            Showing {records.length} of {totalRecords} records
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
