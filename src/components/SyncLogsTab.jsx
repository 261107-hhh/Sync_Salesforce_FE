import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  FileText,
  RefreshCw,
  Download,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ArrowRight,
  RotateCw,
  Building2,
  FileCode,
  FileSpreadsheet,
  Copy,
  Check,
  X,
  Activity,
  Trash2
} from 'lucide-react';

export default function SyncLogsTab({ sfStatus, onNavigateToConnection, onTriggerSync }) {
  const { activeOrgId, activeOrgName } = useAuth();

  const [syncStatus, setSyncStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('all'); // 'all' | 'error' | 'success' | 'info'
  const [retryingObject, setRetryingObject] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [clearedLogIndex, setClearedLogIndex] = useState(0);
  const [lastJobId, setLastJobId] = useState(null);

  const prevStatusRef = useRef(null);

  // When a new job begins, reset clearedLogIndex so user sees fresh logs
  useEffect(() => {
    if (syncStatus?.id && syncStatus.id !== lastJobId) {
      setLastJobId(syncStatus.id);
      setClearedLogIndex(0);
    }
  }, [syncStatus?.id, lastJobId]);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [activeOrgId]);

  // When status transitions from running to completed/failed, auto-refresh history immediately
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
    setLoading(true);
    try {
      const res = await api.get('/api/sync/history');
      if (res.data.success) {
        setHistory(res.data.data || []);
      }
    } catch (err) {
      console.warn('Could not fetch sync history');
    } finally {
      setLoading(false);
    }
  };

  // Identify failed objects in current job
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

  // Retry specific object or all failed objects
  const handleRetry = async (objectNames) => {
    const list = Array.isArray(objectNames) ? objectNames : [objectNames];
    if (list.length === 0) return;
    setRetryingObject(list.join(', '));
    try {
      await api.post('/api/sync/run', {
        objects: list,
        mode: syncStatus?.mode || 'incremental'
      });
      fetchStatus();
      if (onTriggerSync) onTriggerSync();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to retry sync');
    } finally {
      setRetryingObject(null);
    }
  };

  // Export current terminal execution logs as JSON
  const handleExportLogsJson = () => {
    const logs = syncStatus?.logs || [];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `sync_execution_logs_${activeOrgName || 'org'}_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Export current terminal execution logs as TXT
  const handleExportLogsTxt = () => {
    const logs = syncStatus?.logs || [];
    const txtContent = logs
      .map((l) => `[${new Date(l.timestamp).toISOString()}] [${(l.level || 'info').toUpperCase()}] ${l.message}`)
      .join('\n');
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txtContent);
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `sync_execution_logs_${activeOrgName || 'org'}_${Date.now()}.txt`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Export historical sync audit table as CSV
  const handleExportHistoryCsv = () => {
    if (history.length === 0) {
      alert('No sync history to export.');
      return;
    }
    const headers = ['ID', 'Object', 'Mode', 'Status', 'Records Fetched', 'Records Upserted', 'Duration (ms)', 'Synced By', 'Start Time', 'End Time', 'Error Message'];
    const rows = history.map((h) => [
      h.id,
      h.objectName || h.object_name,
      h.syncMode || h.sync_mode,
      h.status,
      h.recordsFetched || h.records_fetched || 0,
      h.recordsUpserted || h.records_upserted || 0,
      h.durationMs || h.duration_ms || 0,
      `"${h.userEmail || h.user_email || ''}"`,
      h.startTime || h.start_time || '',
      h.endTime || h.end_time || '',
      `"${(h.errorMessage || h.error_message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `sync_audit_history_${activeOrgName || 'org'}_${Date.now()}.csv`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const formatLogDisplayTime = (ts) => {
    if (!ts) return new Date().toLocaleTimeString();
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString();
    return String(ts);
  };

  // Copy current filtered logs to clipboard
  const handleCopyLogs = () => {
    const logs = filteredLogs.map((l) => `[${formatLogDisplayTime(l.timestamp)}] [${(l.level || 'info').toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear current log messages from terminal view
  const handleClearLogs = () => {
    setClearedLogIndex((syncStatus?.logs || []).length);
  };

  // Restore cleared logs
  const handleRestoreLogs = () => {
    setClearedLogIndex(0);
  };

  const rawLogs = useMemo(() => syncStatus?.logs || [], [syncStatus?.logs]);
  const allLogs = useMemo(() => {
    if (clearedLogIndex > 0) {
      return rawLogs.slice(clearedLogIndex);
    }
    return rawLogs;
  }, [rawLogs, clearedLogIndex]);

  const errorCount = useMemo(() => allLogs.filter((l) => l.level === 'error').length, [allLogs]);
  const successCount = useMemo(() => allLogs.filter((l) => l.level === 'success').length, [allLogs]);
  const infoCount = useMemo(() => allLogs.filter((l) => l.level === 'info' || !l.level).length, [allLogs]);

  // Filter logs with memoization
  const filteredLogs = useMemo(() => {
    return allLogs.filter((l) => {
      if (logFilter !== 'all' && l.level !== logFilter) return false;
      if (logSearch.trim()) {
        return l.message.toLowerCase().includes(logSearch.toLowerCase());
      }
      return true;
    });
  }, [allLogs, logFilter, logSearch]);

  // Filter history
  const filteredHistory = history.filter((h) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    const obj = (h.objectName || h.object_name || '').toLowerCase();
    const st = (h.status || '').toLowerCase();
    const email = (h.userEmail || h.user_email || '').toLowerCase();
    return obj.includes(q) || st.includes(q) || email.includes(q);
  });

  const isRunning = syncStatus?.status === 'running';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileText size={22} color="var(--oodles-primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Sync Logs & Audit Center
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
              Live execution telemetry, partial sync diagnostic breakdown, and full historical export
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="sync-logs-header-actions">
            <button
              onClick={handleExportLogsJson}
              className="btn btn-secondary btn-sm"
              title="Download execution logs in JSON format"
            >
              <FileCode size={14} color="#38bdf8" />
              Export Logs (JSON)
            </button>

            <button
              onClick={handleExportLogsTxt}
              className="btn btn-secondary btn-sm"
              title="Download execution logs as text file"
            >
              <Download size={14} color="#34d399" />
              Export Logs (TXT)
            </button>

            <button
              onClick={handleExportHistoryCsv}
              className="btn btn-secondary btn-sm"
              title="Export all sync audit history as CSV"
            >
              <FileSpreadsheet size={14} color="#c084fc" />
              Export History (CSV)
            </button>

            <button
              onClick={() => { fetchStatus(); fetchHistory(); }}
              className="btn btn-secondary btn-sm"
              title="Refresh logs and history"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Partial Failure Alert Banner */}
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
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                Partial Sync Failure Detected:
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

          <button
            onClick={() => handleRetry(failedObjects.map((f) => f.object))}
            disabled={isRunning || retryingObject !== null}
            className="btn btn-primary btn-sm"
            style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', borderColor: '#ef4444' }}
          >
            <RotateCw size={14} className={retryingObject ? 'spin' : ''} />
            {retryingObject ? `Retrying ${retryingObject}...` : `Retry Failed Objects (${failedObjects.map((f) => f.object).join(', ')})`}
          </button>
        </div>
      )}

      {/* Current Job Status & Execution Breakdown Overview Card */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Activity size={18} color="var(--oodles-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Current Job Execution Status
            </h3>
            {syncStatus?.startTime && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Started: {new Date(syncStatus.startTime).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className={`badge ${isRunning ? 'badge-info' : (failedObjects.length > 0 ? 'badge-danger' : 'badge-success')}`} style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem' }}>
              {isRunning && <RefreshCw size={12} className="spin" style={{ marginRight: '0.35rem' }} />}
              {syncStatus?.status ? syncStatus.status.toUpperCase() : 'IDLE'}
            </span>
            {failedObjects.length > 0 && (
              <button
                onClick={() => handleRetry(failedObjects.map(f => f.object))}
                disabled={isRunning || retryingObject !== null}
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', borderColor: '#ef4444', fontSize: '0.75rem' }}
              >
                <RotateCw size={12} className={retryingObject ? 'spin' : ''} />
                Retry Failed
              </button>
            )}
          </div>
        </div>

        {/* 4 Stat Cards in a responsive grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{ background: 'var(--table-header-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Sync Mode</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc', marginTop: '0.2rem' }}>
              {syncStatus?.mode ? syncStatus.mode.toUpperCase() : 'DELTA'}
            </div>
          </div>

          <div style={{ background: 'var(--table-header-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Records Upserted</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
              {syncStatus?.totalRecordsSynced || 0}
            </div>
          </div>

          <div style={{ background: 'var(--table-header-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Execution Progress</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
              {syncStatus?.progressPercent || 0}%
            </div>
          </div>

          <div style={{ background: 'var(--table-header-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Objects Status</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: failedObjects.length > 0 ? '#f87171' : '#34d399', marginTop: '0.2rem' }}>
              {failedObjects.length > 0 ? `${failedObjects.length} Failed` : (isRunning ? 'Processing...' : 'All Healthy')}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{
            width: `${syncStatus?.progressPercent || 0}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Object Execution Breakdown Pills */}
        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>
            Target Object Status Breakdown
          </span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.65rem'
          }}>
            {['Account', 'Contact', 'Opportunity', 'Lead'].map((obj) => {
              const detail = syncStatus?.details ? syncStatus.details[obj] : null;
              const isObjError = detail?.status === 'error' || detail?.error;
              const isObjSuccess = detail?.status === 'success' || (detail && !detail.error && detail.recordsUpserted !== undefined);

              return (
                <div
                  key={obj}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: isObjError ? 'rgba(239, 68, 68, 0.08)' : (isObjSuccess ? 'rgba(52, 211, 153, 0.06)' : 'var(--table-header-bg)'),
                    border: `1px solid ${isObjError ? 'rgba(239, 68, 68, 0.35)' : (isObjSuccess ? 'rgba(52, 211, 153, 0.25)' : 'var(--border-color)')}`,
                    fontSize: '0.82rem',
                    minWidth: 0,
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, overflow: 'hidden' }}>
                    {isObjError ? (
                      <XCircle size={15} color="#f87171" style={{ flexShrink: 0 }} />
                    ) : isObjSuccess ? (
                      <CheckCircle2 size={15} color="#34d399" style={{ flexShrink: 0 }} />
                    ) : (
                      <Clock size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    )}
                    <span style={{ fontWeight: 600, color: isObjError ? '#f87171' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>{obj}</span>
                    {isObjError && (
                      <span style={{ fontSize: '0.72rem', color: '#fca5a5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={detail?.error}>
                        ({detail?.error || 'Failed'})
                      </span>
                    )}
                    {isObjSuccess && (
                      <span style={{ fontSize: '0.72rem', color: '#34d399', whiteSpace: 'nowrap' }}>
                        ({detail?.recordsUpserted ?? 0} upserted)
                      </span>
                    )}
                  </div>

                  {isObjError && (
                    <button
                      onClick={() => handleRetry(obj)}
                      disabled={isRunning || retryingObject === obj}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)', flexShrink: 0 }}
                    >
                      <RotateCw size={11} className={retryingObject === obj ? 'spin' : ''} />
                      Retry
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Execution Logs Terminal Card (Full width, prominent, responsive) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem 1.5rem', minHeight: 440 }}>
        {/* Terminal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={18} color="var(--oodles-primary)" />
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Terminal Execution Logs
              </span>
            </div>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              fontWeight: 600,
              background: isRunning ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: isRunning ? '#38bdf8' : 'var(--text-muted)',
              border: `1px solid ${isRunning ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-subtle)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isRunning ? '#38bdf8' : '#94a3b8',
                display: 'inline-block',
                boxShadow: isRunning ? '0 0 8px #38bdf8' : 'none'
              }} />
              {isRunning ? 'STREAMING' : 'IDLE'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({allLogs.length} total)
            </span>
          </div>

          {/* Level Filter Pills & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {/* Level Filter Buttons */}
            <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', gap: '0.2rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setLogFilter('all')}
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: logFilter === 'all' ? 'var(--oodles-primary)' : 'transparent',
                  color: logFilter === 'all' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ALL ({allLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('error')}
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: logFilter === 'error' ? '#ef4444' : 'transparent',
                  color: logFilter === 'error' ? '#fff' : (errorCount > 0 ? '#f87171' : 'var(--text-muted)'),
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ERRORS ({errorCount})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('success')}
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: logFilter === 'success' ? '#10b981' : 'transparent',
                  color: logFilter === 'success' ? '#fff' : (successCount > 0 ? '#34d399' : 'var(--text-muted)'),
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                SUCCESS ({successCount})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('info')}
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: logFilter === 'info' ? '#0ea5e9' : 'transparent',
                  color: logFilter === 'info' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                INFO ({infoCount})
              </button>
            </div>

            {/* Copy Logs Button */}
            <button
              type="button"
              onClick={handleCopyLogs}
              disabled={filteredLogs.length === 0}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
              title="Copy visible logs to clipboard"
            >
              {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            {/* Clear Logs Button */}
            <button
              type="button"
              onClick={handleClearLogs}
              disabled={allLogs.length === 0}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.55rem',
                color: allLogs.length > 0 ? '#f87171' : 'var(--text-muted)',
                borderColor: allLogs.length > 0 ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)',
                cursor: allLogs.length === 0 ? 'not-allowed' : 'pointer'
              }}
              title={allLogs.length === 0 ? "Terminal logs are already empty" : "Clear all logs from terminal view"}
            >
              <Trash2 size={12} />
              <span>Clear Logs</span>
            </button>

            {/* Restore Logs Button if cleared */}
            {clearedLogIndex > 0 && (
              <button
                type="button"
                onClick={handleRestoreLogs}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)' }}
                title="Restore cleared logs"
              >
                <RotateCw size={12} />
                <span>Restore ({clearedLogIndex})</span>
              </button>
            )}
          </div>
        </div>

        {/* Terminal Search Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200, maxWidth: 440 }}>
            <input
              type="text"
              placeholder="Search terminal logs (e.g. Account, ERROR, WHERE)..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.8rem', padding: '0.4rem 2rem 0.4rem 2.1rem', height: 34 }}
            />
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
            {logSearch && (
              <button
                type="button"
                onClick={() => setLogSearch('')}
                style={{
                  position: 'absolute',
                  right: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredLogs.length}</strong> of {allLogs.length} logs
            {logSearch && <span> matching "{logSearch}"</span>}
          </div>
        </div>

        {/* Console / Terminal Stream Window */}
        <div style={{
          flex: 1,
          background: '#040711',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          overflowY: 'auto',
          minHeight: 320,
          maxHeight: 460,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.6)'
        }}>
          {filteredLogs.length === 0 ? (
            <div style={{
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '3rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Terminal size={24} style={{ opacity: 0.3 }} />
              <div>No log entries match your active filter.</div>
              {allLogs.length === 0 && (
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Execute a sync job from the Sync Center to view live terminal streaming.
                </div>
              )}
            </div>
          ) : (
            filteredLogs.map((l, i) => {
              const isErr = l.level === 'error';
              const isSucc = l.level === 'success';
              return (
                <div
                  key={i}
                  style={{
                    color: isErr ? '#fca5a5' : (isSucc ? '#86efac' : '#cbd5e1'),
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                  }}
                >
                  <span style={{ color: '#475569', flexShrink: 0, userSelect: 'none', fontSize: '0.75rem' }}>
                    [{formatLogDisplayTime(l.timestamp)}]
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 3,
                    flexShrink: 0,
                    background: isErr ? 'rgba(239, 68, 68, 0.25)' : (isSucc ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.15)'),
                    color: isErr ? '#f87171' : (isSucc ? '#34d399' : '#38bdf8'),
                    border: `1px solid ${isErr ? 'rgba(239, 68, 68, 0.4)' : (isSucc ? 'rgba(52, 211, 153, 0.3)' : 'rgba(56, 189, 248, 0.25)')}`,
                    textTransform: 'uppercase',
                    userSelect: 'none'
                  }}>
                    {l.level || 'info'}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>{l.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Historical Sync Audit Runs Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Sync Audit History
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Showing {filteredHistory.length} recorded synchronization executions
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by object or user..."
              className="form-input"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem 0.4rem 2rem', width: 220 }}
            />
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Object</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Fetched</th>
                <th>Upserted</th>
                <th>Duration</th>
                <th>Synced By</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No sync history matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredHistory.slice(0, 30).map((h) => {
                  const isErr = h.status === 'FAILED' || Boolean(h.errorMessage || h.error_message);
                  const isExpanded = expandedHistoryId === h.id;
                  const errMsg = h.errorMessage || h.error_message;
                  const objName = h.objectName || h.object_name;

                  return (
                    <React.Fragment key={h.id}>
                      <tr>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#94a3b8' }}>#{h.id}</td>
                        <td><strong>{objName}</strong></td>
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
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            {isErr && (
                              <button
                                onClick={() => handleRetry(objName)}
                                disabled={isRunning || retryingObject === objName}
                                className="btn btn-secondary btn-sm"
                                title={`Retry ${objName} sync now`}
                                style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', color: '#f87171' }}
                              >
                                <RotateCw size={12} className={retryingObject === objName ? 'spin' : ''} />
                                Retry
                              </button>
                            )}
                            {errMsg && (
                              <button
                                onClick={() => setExpandedHistoryId(isExpanded ? null : h.id)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                              >
                                {isExpanded ? 'Hide Error' : 'View Error'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Error Trace Row */}
                      {isExpanded && errMsg && (
                        <tr style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                          <td colSpan="10" style={{ padding: '0.75rem 1.25rem', borderLeft: '3px solid #ef4444' }}>
                            <div style={{ color: '#fca5a5', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>
                              ⚠️ <strong>Failure Cause:</strong> {errMsg}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
