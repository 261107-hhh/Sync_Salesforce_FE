import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { RefreshCw, CheckSquare, Square, Filter, ChevronDown, ChevronUp, Terminal, Clock, Play } from 'lucide-react';

export default function SyncCenter() {
  const [selectedObjects, setSelectedObjects] = useState(['Account', 'Contact', 'Opportunity', 'Lead']);
  const [syncMode, setSyncMode] = useState('incremental');
  const [showFilters, setShowFilters] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

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
    try {
      const res = await api.get('/api/sync/history');
      if (res.data.success) {
        setHistory(res.data.data || []);
      }
    } catch (err) {
      console.warn('Could not fetch sync history');
    }
  };

  const toggleObject = (obj) => {
    if (selectedObjects.includes(obj)) {
      setSelectedObjects(selectedObjects.filter((o) => o !== obj));
    } else {
      setSelectedObjects([...selectedObjects, obj]);
    }
  };

  const handleStartSync = async () => {
    if (selectedObjects.length === 0) return;
    setLoading(true);
    try {
      const filters = {};
      if (nameFilter.trim()) filters.nameContains = nameFilter.trim();

      await api.post('/api/sync/run', {
        objects: selectedObjects,
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

  const isRunning = syncStatus?.status === 'running';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Grid: Controls + Live Progress */}
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

          {/* Query Filters Collapsible */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                padding: '0.4rem 0'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Filter size={14} /> Query Filters (SOQL WHERE)
              </span>
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showFilters && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Name contains</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme, John..."
                    className="form-input"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Trigger Button */}
          <button
            onClick={handleStartSync}
            disabled={isRunning || selectedObjects.length === 0 || loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            <Play size={16} />
            {isRunning ? 'Syncing in background...' : 'Start Synchronization Now'}
          </button>
        </div>

        {/* Live Status & Progress Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Live Execution</h2>
            <span className={`badge ${isRunning ? 'badge-info' : 'badge-success'}`}>
              {syncStatus?.status?.toUpperCase() || 'IDLE'}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {syncStatus?.currentObject ? `Syncing ${syncStatus.currentObject}...` : (isRunning ? 'Processing...' : 'Ready')}
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

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
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
          </div>

          {/* Live Terminal Log */}
          <div style={{
            flex: 1,
            background: '#060910',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            overflowY: 'auto',
            maxHeight: 220
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
              <Terminal size={14} /> Execution Logs
            </div>
            {(!syncStatus?.logs || syncStatus.logs.length === 0) ? (
              <div style={{ color: 'var(--text-muted)' }}>Ready to sync. Click 'Start Synchronization Now'.</div>
            ) : (
              syncStatus.logs.map((l, i) => (
                <div key={i} style={{ color: l.level === 'error' ? '#f87171' : (l.level === 'success' ? '#34d399' : '#94a3b8'), marginBottom: '0.25rem' }}>
                  <span style={{ color: '#475569' }}>[{new Date(l.timestamp).toLocaleTimeString()}]</span> {l.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sync History Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', color: '#fff' }}>
          Recent Sync Logs
        </h3>
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
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No sync history yet.</td></tr>
              ) : (
                history.slice(0, 10).map((h) => (
                  <tr key={h.id}>
                    <td><strong>{h.objectName}</strong></td>
                    <td><span className="badge badge-info">{h.syncMode}</span></td>
                    <td>
                      <span className={`badge ${h.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td>{h.recordsFetched}</td>
                    <td>{h.recordsUpserted}</td>
                    <td>{h.durationMs ? `${h.durationMs} ms` : '-'}</td>
                    <td>{h.startTime ? new Date(h.startTime).toLocaleString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
