import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  RefreshCw,
  CheckSquare,
  Square,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  Play,
  Lock,
  Building2,
  AlertCircle,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Calendar,
  X
} from 'lucide-react';

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateOffset = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfMonthString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

export default function SyncCenter({ sfStatus, onNavigateToConnection, onNavigateToLogs }) {
  const { activeOrgId, activeOrgName, activeOrgRole } = useAuth();
  const isReadOnly = activeOrgRole === 'READONLY';

  const [selectedObjects, setSelectedObjects] = useState(['Account', 'Contact', 'Opportunity', 'Lead']);
  const [syncMode, setSyncMode] = useState('incremental');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(getTodayDateString());
  const [showFilters, setShowFilters] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retryingObject, setRetryingObject] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const prevStatusRef = useRef(null);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, [activeOrgId]);

  // Dynamic polling: fast (1.5s) when running, relaxed (7s) when idle
  useEffect(() => {
    const isRunning = syncStatus?.status === 'running';
    const intervalMs = isRunning ? 1500 : 7000;
    const interval = setInterval(fetchStatus, intervalMs);
    return () => clearInterval(interval);
  }, [activeOrgId, syncStatus?.status]);

  // Bug fix: Detect when sync finishes and immediately refresh history table
  useEffect(() => {
    if (syncStatus) {
      if (prevStatusRef.current === 'running' && (syncStatus.status === 'completed' || syncStatus.status === 'failed')) {
        fetchHistory();
      }
      prevStatusRef.current = syncStatus.status;
    }
  }, [syncStatus]);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/api/sync/status');
      if (res.data.success) {
        setSyncStatus(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch sync status');
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/api/sync/history');
      if (res.data.success) {
        setHistory(res.data.data || []);
      }
    } catch (err) {
      console.warn('Could not fetch sync history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleObject = (obj) => {
    if (selectedObjects.includes(obj)) {
      setSelectedObjects(selectedObjects.filter((o) => o !== obj));
    } else {
      setSelectedObjects([...selectedObjects, obj]);
    }
  };

  const handleStartSync = async (overrideObjects = null) => {
    const targetObjects = overrideObjects || selectedObjects;
    if (targetObjects.length === 0) return;
    setLoading(true);
    try {
      const filters = {};
      if (nameFilter.trim()) filters.nameContains = nameFilter.trim();

      if (syncMode === 'incremental') {
        if (fromDate) filters.fromDate = fromDate;
        if (toDate) filters.toDate = toDate;
      }

      await api.post('/api/sync/run', {
        objects: targetObjects,
        mode: syncMode,
        filters
      });
      fetchStatus();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to start sync');
    } finally {
      setLoading(false);
    }
  };

  // Inspect syncStatus details for failed objects
  const getFailedObjects = () => {
    if (!syncStatus?.details) return [];
    const failed = [];
    for (const [obj, detail] of Object.entries(syncStatus.details)) {
      if (detail && (detail.status === 'error' || detail.error)) {
        failed.push({ object: obj, error: detail.error || 'Sync failed' });
      }
    }
    return failed;
  };

  const failedObjects = getFailedObjects();

  const handleRetryFailed = async (objList) => {
    setRetryingObject(objList.join(', '));
    try {
      const filters = {};
      if (nameFilter.trim()) filters.nameContains = nameFilter.trim();
      if (syncMode === 'incremental') {
        if (fromDate) filters.fromDate = fromDate;
        if (toDate) filters.toDate = toDate;
      }

      await api.post('/api/sync/run', {
        objects: objList,
        mode: syncMode,
        filters
      });
      fetchStatus();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to retry sync');
    } finally {
      setRetryingObject(null);
    }
  };

  const isRunning = syncStatus?.status === 'running';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Disconnected Warning Notice */}
      {sfStatus && !sfStatus.connected && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(248, 113, 113, 0.08)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          color: '#f87171',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} />
            <div>
              <strong style={{ color: '#fff' }}>Salesforce is currently disconnected for this workspace. </strong>
              <span>Sync jobs cannot run until Salesforce credentials or Mock Sandbox is configured.</span>
            </div>
          </div>
          {onNavigateToConnection && (
            <button
              onClick={onNavigateToConnection}
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'rgba(248, 113, 113, 0.4)', color: '#fff' }}
            >
              Configure Connection
            </button>
          )}
        </div>
      )}

      {/* Partial Failure Notification & One-Click Retry Banner */}
      {failedObjects.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={22} color="#f87171" />
            <div>
              <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
                Notice: Some objects encountered an error during sync
              </strong>
              <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '0.2rem' }}>
                {failedObjects.map((f) => (
                  <span key={f.object} style={{ marginRight: '1rem' }}>
                    <strong>{f.object}:</strong> {f.error}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleRetryFailed(failedObjects.map((f) => f.object))}
              disabled={isRunning || retryingObject !== null}
              className="btn btn-primary btn-sm"
              style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', borderColor: '#ef4444' }}
            >
              <RotateCw size={14} className={retryingObject ? 'spin' : ''} />
              {retryingObject ? `Retrying...` : `Retry Failed (${failedObjects.map((f) => f.object).join(', ')})`}
            </button>
            {onNavigateToLogs && (
              <button
                onClick={onNavigateToLogs}
                className="btn btn-secondary btn-sm"
              >
                Inspect Logs
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Grid: Controls + Clean Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>

        {/* Controls Card */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
            Sync Orchestration
          </h2>

          {/* Object Checkboxes */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Salesforce Objects to Sync
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              {['Account', 'Contact', 'Opportunity', 'Lead'].map((obj) => (
                <div
                  key={obj}
                  onClick={() => toggleObject(obj)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: selectedObjects.includes(obj) ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-input)',
                    border: `1px solid ${selectedObjects.includes(obj) ? 'rgba(56, 189, 248, 0.35)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: selectedObjects.includes(obj) ? '#38bdf8' : 'var(--text-secondary)'
                  }}
                >
                  {selectedObjects.includes(obj) ? <CheckSquare size={16} /> : <Square size={16} />}
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Mode */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Synchronization Mode
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSyncMode('incremental')}
                className={`btn ${syncMode === 'incremental' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ flex: 1 }}
              >
                Incremental (Delta)
              </button>
              <button
                type="button"
                onClick={() => setSyncMode('full')}
                className={`btn ${syncMode === 'full' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ flex: 1 }}
              >
                Full Snapshot
              </button>
            </div>
          </div>

          {/* Incremental Query Window (Date Range) */}
          {syncMode === 'incremental' && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.07) 0%, rgba(15, 23, 42, 0.4) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} color="#38bdf8" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                    Incremental Query Date Range
                  </span>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontWeight: 500
                }}>
                  SOQL Query Filter
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {/* From Date */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Sync From Date</span>
                    {fromDate && (
                      <button
                        type="button"
                        onClick={() => setFromDate('')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                        title="Clear from date (uses last sync timestamp)"
                      >
                        Reset
                      </button>
                    )}
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(e) => setFromDate(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {fromDate ? `From: ${fromDate} 00:00:00 UTC` : 'Empty = Delta from last sync'}
                  </div>
                </div>

                {/* To Date */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Sync To Date</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {toDate && (
                        <button
                          type="button"
                          onClick={() => setToDate('')}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                          title="Clear to date constraint"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setToDate(getTodayDateString())}
                        style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                        title="Set to today"
                      >
                        Today
                      </button>
                    </div>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => setToDate(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {toDate ? (toDate === getTodayDateString() ? 'Defaulted to current date' : `Up to: ${toDate} 23:59:59 UTC`) : 'No upper bound'}
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '0.2rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>Presets:</span>
                <button
                  type="button"
                  onClick={() => { setFromDate(formatDateOffset(7)); setToDate(getTodayDateString()); }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', height: 'auto' }}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => { setFromDate(formatDateOffset(30)); setToDate(getTodayDateString()); }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', height: 'auto' }}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => { setFromDate(getStartOfMonthString()); setToDate(getTodayDateString()); }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', height: 'auto' }}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => { setFromDate(''); setToDate(getTodayDateString()); }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', height: 'auto' }}
                >
                  Auto Delta (Since Last Run)
                </button>
              </div>

              {/* Dynamic SOQL WHERE preview */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.72rem',
                color: '#94a3b8',
                fontFamily: 'monospace',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>WHERE </span>
                {fromDate
                  ? `LastModifiedDate >= ${fromDate}T00:00:00Z`
                  : `SystemModstamp > [LastSyncTimestamp]`}
                {toDate && ` AND LastModifiedDate <= ${toDate}T23:59:59Z`}
                {nameFilter.trim() && ` AND Name LIKE '%${nameFilter.trim()}%'`}
              </div>

              {/* Date validation alert if fromDate > toDate */}
              {fromDate && toDate && fromDate > toDate && (
                <div style={{ color: '#f87171', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertCircle size={13} />
                  <span>"Sync From Date" cannot be later than "Sync To Date".</span>
                </div>
              )}
            </div>
          )}

          {/* Full Snapshot info notice & WHERE preview */}
          {syncMode === 'full' && (
            <div style={{
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}>
                Full Snapshot syncs all records from Salesforce without date boundaries.
              </div>
              {nameFilter.trim() && (
                <div style={{
                  background: 'rgba(234, 179, 8, 0.1)',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  fontSize: '0.72rem',
                  color: '#facc15',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap'
                }}>
                  <span style={{ fontWeight: 600 }}>WHERE </span>
                  Name LIKE '%{nameFilter.trim()}%' (Applied to Full Sync)
                </div>
              )}
            </div>
          )}

          {/* Query Filters Collapsible */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  padding: '0.4rem 0',
                  flex: 1,
                  textAlign: 'left'
                }}
              >
                <Filter size={14} />
                <span>Additional Filters (SOQL Name)</span>
                {nameFilter.trim() && (
                  <span style={{
                    fontSize: '0.7rem',
                    background: 'rgba(234, 179, 8, 0.18)',
                    color: '#facc15',
                    border: '1px solid rgba(234, 179, 8, 0.35)',
                    borderRadius: '4px',
                    padding: '0.1rem 0.45rem',
                    fontWeight: 600
                  }}>
                    Active: "{nameFilter.trim()}"
                  </span>
                )}
                {showFilters ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
              </button>

              {nameFilter.trim() && (
                <button
                  type="button"
                  onClick={() => setNameFilter('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f87171',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    padding: '0.2rem 0.4rem'
                  }}
                  title="Clear name filter"
                >
                  <X size={12} /> Clear Name
                </button>
              )}
            </div>

            {showFilters && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Name contains</span>
                    {nameFilter && (
                      <button
                        type="button"
                        onClick={() => setNameFilter('')}
                        style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                      >
                        Clear
                      </button>
                    )}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="e.g. Acme, John..."
                      className="form-input"
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      style={{ paddingRight: nameFilter ? '2rem' : undefined }}
                    />
                    {nameFilter && (
                      <button
                        type="button"
                        onClick={() => setNameFilter('')}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.2rem'
                        }}
                        title="Clear filter"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    Filters all synced objects by <code>Name LIKE '%...%'</code>. Clear this field to fetch all records.
                  </div>
                </div>
              </div>
            )}

            {/* Quick reset all filters if any custom filter is active */}
            {(nameFilter.trim() || fromDate) && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => { setNameFilter(''); setFromDate(''); setToDate(getTodayDateString()); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    padding: '0.1rem 0',
                    textDecoration: 'underline'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  Reset all filters to default
                </button>
              </div>
            )}
          </div>

          {/* Trigger Button - Available to all authenticated organization members including ReadOnly */}
          <button
            onClick={() => handleStartSync()}
            disabled={
              isRunning ||
              selectedObjects.length === 0 ||
              loading ||
              (sfStatus && !sfStatus.connected) ||
              Boolean(syncMode === 'incremental' && fromDate && toDate && fromDate > toDate)
            }
            className={`btn ${sfStatus && !sfStatus.connected ? 'btn-secondary' : 'btn-primary'}`}
            style={{
              width: '100%',
              padding: '0.75rem',
              opacity: (sfStatus && !sfStatus.connected) ? 0.6 : 1,
              cursor: (sfStatus && !sfStatus.connected) ? 'not-allowed' : 'pointer'
            }}
            title={sfStatus && !sfStatus.connected ? 'Salesforce is disconnected. Connect in Settings first.' : ''}
          >
            <Play size={16} />
            {sfStatus && !sfStatus.connected
              ? 'Salesforce Disconnected — Sync Disabled'
              : (isRunning ? 'Syncing in background...' : 'Start Synchronization Now')}
          </button>
        </div>

        {/* Sync Summary & Quick Link Card (No terminal clutter) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Sync Status Overview</h2>
            <span className={`badge ${isRunning ? 'badge-info' : (failedObjects.length > 0 ? 'badge-danger' : 'badge-success')}`}>
              {syncStatus?.status?.toUpperCase() || 'IDLE'}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {syncStatus?.currentObject ? `Processing ${syncStatus.currentObject}...` : (isRunning ? 'Processing...' : 'Ready')}
              </span>
              <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                {syncStatus?.progressPercent || 0}%
              </span>
            </div>
            <div style={{ width: '100%', height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${syncStatus?.progressPercent || 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: (syncStatus?.filters?.fromDate || syncStatus?.filters?.toDate) ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Records Upserted</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
                {syncStatus?.totalRecordsSynced || 0}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Mode</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#c084fc', marginTop: '0.2rem' }}>
                {syncStatus?.mode ? syncStatus.mode.toUpperCase() : 'DELTA'}
              </div>
            </div>
            {(syncStatus?.filters?.fromDate || syncStatus?.filters?.toDate) && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Query Window</span>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#38bdf8', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${syncStatus?.filters?.fromDate || 'Delta'} → ${syncStatus?.filters?.toDate || 'Today'}`}>
                  {syncStatus?.filters?.fromDate ? syncStatus.filters.fromDate : 'Delta'} → {syncStatus?.filters?.toDate ? syncStatus.filters.toDate : 'Today'}
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Note when 0 records synced */}
          {syncStatus?.status === 'completed' && syncStatus?.totalRecordsSynced === 0 && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              fontSize: '0.8rem',
              color: '#fef08a',
              display: 'flex',
              gap: '0.65rem',
              alignItems: 'flex-start'
            }}>
              <AlertCircle size={18} style={{ color: '#facc15', flexShrink: 0, marginTop: '1px' }} />
              <div style={{ lineHeight: 1.45 }}>
                <strong style={{ color: '#fff' }}>0 records synced from Salesforce.</strong>
                {syncStatus?.filters?.nameContains ? (
                  <div style={{ marginTop: '0.2rem', color: '#fef08a' }}>
                    A name filter was active: <code>Name LIKE '%{syncStatus.filters.nameContains}%'</code>.
                  </div>
                ) : null}
                {(syncStatus?.filters?.fromDate || syncStatus?.filters?.toDate) ? (
                  <div style={{ marginTop: '0.2rem', color: '#fef08a' }}>
                    Query date range: <code>{syncStatus.filters.fromDate || 'Delta'}</code> to <code>{syncStatus.filters.toDate || 'Latest'}</code>.
                  </div>
                ) : null}
                <div style={{ marginTop: '0.35rem', color: '#cbd5e1', fontSize: '0.75rem' }}>
                  Mock Sandbox records use standard sample names (Acme Corporation, Global Cloud Innovations, Sarah Connor, etc.). Clear the "Name contains" filter to sync all records.
                </div>
              </div>
            </div>
          )}

          {/* Object Health Pills */}
          <div style={{ marginBottom: '1.25rem', flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Processed Objects
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {['Account', 'Contact', 'Opportunity', 'Lead'].map((obj) => {
                const detail = syncStatus?.details ? syncStatus.details[obj] : null;
                const isErr = detail?.status === 'error' || detail?.error;
                const isDone = detail && !isErr;

                return (
                  <div
                    key={obj}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isErr ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isErr ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                      fontSize: '0.78rem'
                    }}
                  >
                    <span style={{ fontWeight: 500, color: isErr ? '#f87171' : 'var(--text-primary)' }}>{obj}</span>
                    {isErr ? (
                      <XCircle size={14} color="#f87171" title={detail?.error || 'Failed'} />
                    ) : isDone ? (
                      <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
                        ✓ {detail?.recordsSynced ?? detail?.recordsUpserted ?? 0}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Idle</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Jump to Sync Logs Tab Banner */}
          {onNavigateToLogs && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Detailed execution logs & historical exports moved to dedicated tab.
              </div>
              <button
                onClick={onNavigateToLogs}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
              >
                <span>Sync Logs</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sync History Table with Auto-Refresh & Manual Refresh */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', margin: 0 }}>
              Recent Sync History
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Auto-refreshed upon sync completion
            </span>
          </div>

          <button
            onClick={fetchHistory}
            className="btn btn-secondary btn-sm"
            title="Refresh history table"
          >
            <RefreshCw size={13} className={loadingHistory ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Object</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Fetched</th>
                <th>Upserted</th>
                <th>Duration</th>
                <th>Synced By</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No sync history yet. Start a sync above to record executions.
                  </td>
                </tr>
              ) : (
                history.slice(0, 10).map((h) => {
                  const isErr = h.status === 'FAILED' || Boolean(h.errorMessage || h.error_message);
                  return (
                    <tr key={h.id}>
                      <td><strong>{h.objectName || h.object_name}</strong></td>
                      <td><span className="badge badge-info">{h.syncMode || h.sync_mode}</span></td>
                      <td>
                        <span className={`badge ${isErr ? 'badge-danger' : 'badge-success'}`}>
                          {h.status}
                        </span>
                      </td>
                      <td>{h.recordsFetched ?? h.records_fetched ?? 0}</td>
                      <td><strong style={{ color: '#34d399' }}>{h.recordsUpserted ?? h.records_upserted ?? 0}</strong></td>
                      <td>{h.durationMs ?? h.duration_ms ? `${h.durationMs ?? h.duration_ms} ms` : '-'}</td>
                      <td style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{h.userEmail || h.user_email || 'System'}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {(h.startTime || h.start_time) ? new Date(h.startTime || h.start_time).toLocaleString() : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
