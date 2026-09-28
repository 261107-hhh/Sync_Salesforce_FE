import React, { useState, useEffect, useRef } from 'react';
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
  FileSpreadsheet
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

  const prevStatusRef = useRef(null);

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

  // Filter logs
  const filteredLogs = (syncStatus?.logs || []).filter((l) => {
    if (logFilter !== 'all' && l.level !== logFilter) return false;
    if (logSearch.trim()) {
      return l.message.toLowerCase().includes(logSearch.toLowerCase());
    }
    return true;
  });

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
              <FileText size={22} color="#38bdf8" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Sync Logs & Audit Center
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
              Live execution telemetry, partial sync diagnostic breakdown, and full historical export
            </p>
          </div>

          {/* Export Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
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

      {/* Current Job Overview & Object Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
        
        {/* Current Job Status Summary */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
              Current / Last Job Details
            </h3>
            <span className={`badge ${isRunning ? 'badge-info' : (failedObjects.length > 0 ? 'badge-danger' : 'badge-success')}`}>
              {syncStatus?.status ? syncStatus.status.toUpperCase() : 'IDLE'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mode</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#c084fc', marginTop: '0.2rem' }}>
                {syncStatus?.mode ? syncStatus.mode.toUpperCase() : 'DELTA'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upserted</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
                {syncStatus?.totalRecordsSynced || 0}
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Progress</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                {syncStatus?.progressPercent || 0}%
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

          {/* Object Status Breakdown List */}
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Object Execution Breakdown
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {['Account', 'Contact', 'Opportunity', 'Lead'].map((obj) => {
              const detail = syncStatus?.details ? syncStatus.details[obj] : null;
              const isObjError = detail?.status === 'error' || detail?.error;
              const isObjSuccess = detail?.status === 'success' || (detail && !detail.error && detail.recordsUpserted !== undefined);
              const isObjPending = !detail;

              return (
                <div
                  key={obj}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isObjError ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {isObjError ? (
                      <XCircle size={15} color="#f87171" />
                    ) : isObjSuccess ? (
                      <CheckCircle2 size={15} color="#34d399" />
                    ) : (
                      <Clock size={15} color="var(--text-muted)" />
                    )}
                    <span style={{ fontWeight: 600, color: isObjError ? '#f87171' : '#fff' }}>{obj}</span>
                    {isObjError && (
                      <span style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                        ({detail?.error || 'Failed'})
                      </span>
                    )}
                    {isObjSuccess && (
                      <span style={{ fontSize: '0.72rem', color: '#34d399' }}>
                        ({detail?.recordsUpserted ?? 0} upserted)
                      </span>
                    )}
                  </div>

                  {isObjError && (
                    <button
                      onClick={() => handleRetry(obj)}
                      disabled={isRunning || retryingObject === obj}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    >
                      <RotateCw size={12} className={retryingObject === obj ? 'spin' : ''} />
                      Retry {obj}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Execution Logs Terminal */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
              <Terminal size={16} color="#38bdf8" />
              <span>Live Terminal Logs</span>
            </div>

            {/* Level Filter Pills */}
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {['all', 'error', 'success', 'info'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLogFilter(lvl)}
                  style={{
                    padding: '0.15rem 0.55rem',
                    borderRadius: 4,
                    border: 'none',
                    background: logFilter === lvl ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)',
                    color: logFilter === lvl ? '#000' : 'var(--text-muted)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Search */}
          <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
            <input
              type="text"
              placeholder="Search terminal logs..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem 0.35rem 2rem' }}
            />
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Log Stream Window */}
          <div style={{
            flex: 1,
            background: '#040711',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.76rem',
            overflowY: 'auto',
            maxHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem'
          }}>
            {filteredLogs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                No log entries match your filter.
              </div>
            ) : (
              filteredLogs.map((l, i) => {
                const isErr = l.level === 'error';
                const isSucc = l.level === 'success';
                return (
                  <div key={i} style={{ color: isErr ? '#f87171' : (isSucc ? '#34d399' : '#94a3b8'), lineHeight: 1.4 }}>
                    <span style={{ color: '#475569', marginRight: '0.4rem' }}>
                      [{new Date(l.timestamp).toLocaleTimeString()}]
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '1px 4px',
                      borderRadius: 3,
                      marginRight: '0.4rem',
                      background: isErr ? 'rgba(239, 68, 68, 0.2)' : (isSucc ? 'rgba(52, 211, 153, 0.2)' : 'rgba(148, 163, 184, 0.1)'),
                      color: isErr ? '#f87171' : (isSucc ? '#34d399' : '#94a3b8')
                    }}>
                      {(l.level || 'info').toUpperCase()}
                    </span>
                    <span>{l.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Historical Sync Audit Runs Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', margin: 0 }}>
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
          <table className="data-table">
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
