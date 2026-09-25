import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, Copy, Check, Link2, Code, Building, UserCheck } from 'lucide-react';

export default function RecordDetailModal({ isOpen, onClose, objectName, recordId, onOpenCreateWithAccount }) {
  const [activeTab, setActiveTab] = useState('relations');
  const [loading, setLoading] = useState(false);
  const [relatedData, setRelatedData] = useState(null);
  const [rawRecord, setRawRecord] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && objectName && recordId) {
      setActiveTab('relations');
      fetchDetails();
    }
  }, [isOpen, objectName, recordId]);

  const fetchDetails = async () => {
    setLoading(true);
    setRelatedData(null);
    setRawRecord(null);

    try {
      const [rawRes, relRes] = await Promise.all([
        api.get(`/api/data/${objectName}/${recordId}`),
        api.get(`/api/data/${objectName}/${recordId}/related`)
      ]);

      if (rawRes.data.success) setRawRecord(rawRes.data.data);
      if (relRes.data.success) setRelatedData(relRes.data.data);
    } catch (err) {
      console.error('Failed to load record details:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyJson = () => {
    if (!rawRecord) return;
    navigator.clipboard.writeText(JSON.stringify(rawRecord, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isOpen) return null;

  const lower = objectName?.toLowerCase();
  const rec = rawRecord || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
              {rec.name || rec.Name || `${objectName} Record`}
            </h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#38bdf8' }}>
              ID: {recordId}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1.5rem 0', background: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('relations')}
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
            Relationships & Overview
          </button>

          <button
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
            Raw JSON Payload
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ minHeight: 320 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading record details...
            </div>
          ) : activeTab === 'relations' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* User Audit Attribution Card */}
              {rec.custom_app_created_by && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  color: '#38bdf8'
                }}>
                  <UserCheck size={16} />
                  <span>
                    Created in Custom App by <strong>{rec.custom_app_created_by}</strong>
                    {rec.custom_app_created_at && ` on ${new Date(rec.custom_app_created_at).toLocaleString()}`}
                  </span>
                </div>
              )}

              {/* Summary Metadata Card */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
                  {lower === 'account' && (
                    <>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.type || '-'}</div></div>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Industry</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.industry || '-'}</div></div>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.phone || '-'}</div></div>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>City</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.billingCity || '-'}</div></div>
                    </>
                  )}
                  {lower === 'contact' && (
                    <>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Title</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.title || '-'}</div></div>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.email || '-'}</div></div>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.phone || '-'}</div></div>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.department || '-'}</div></div>
                    </>
                  )}
                  {lower === 'opportunity' && (
                    <>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stage</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.stageName || '-'}</div></div>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.amount ? '$' + Number(rec.amount).toLocaleString() : '-'}</div></div>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Close Date</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.closeDate || '-'}</div></div>
                      <div><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Probability</span><div style={{ fontSize: '0.85rem', color: '#fff' }}>{rec.probability ? rec.probability + '%' : '-'}</div></div>
                    </>
                  )}
                </div>
              </div>

              {/* Relational Sections */}
              {lower === 'account' && (
                <>
                  {/* Related Contacts */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                        Related Contacts ({relatedData?.contacts?.length || 0})
                      </span>
                      <button
                        onClick={() => onOpenCreateWithAccount('Contact', recordId)}
                        className="btn btn-secondary btn-sm"
                      >
                        + Add Contact for this Account
                      </button>
                    </div>
                    {(!relatedData?.contacts || relatedData.contacts.length === 0) ? (
                      <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No contacts linked to this account.</div>
                    ) : (
                      <table className="data-table">
                        <thead><tr><th>Name</th><th>Title</th><th>Email</th><th>Phone</th></tr></thead>
                        <tbody>
                          {relatedData.contacts.map((c) => (
                            <tr key={c.id}>
                              <td><strong>{c.name}</strong></td>
                              <td>{c.title || '-'}</td>
                              <td>{c.email || '-'}</td>
                              <td>{c.phone || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Related Opportunities */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                        Related Deals ({relatedData?.opportunities?.length || 0})
                      </span>
                      <button
                        onClick={() => onOpenCreateWithAccount('Opportunity', recordId)}
                        className="btn btn-secondary btn-sm"
                      >
                        + Add Deal for this Account
                      </button>
                    </div>
                    {(!relatedData?.opportunities || relatedData.opportunities.length === 0) ? (
                      <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No opportunities linked to this account.</div>
                    ) : (
                      <table className="data-table">
                        <thead><tr><th>Deal Name</th><th>Stage</th><th>Amount</th><th>Close Date</th></tr></thead>
                        <tbody>
                          {relatedData.opportunities.map((o) => (
                            <tr key={o.id}>
                              <td><strong>{o.name}</strong></td>
                              <td><span className="badge badge-info">{o.stageName}</span></td>
                              <td>{o.amount ? '$' + Number(o.amount).toLocaleString() : '-'}</td>
                              <td>{o.closeDate || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}

              {/* Contact / Opportunity Parent Account Card */}
              {(lower === 'contact' || lower === 'opportunity') && (
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Building size={16} color="#c084fc" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Parent Account</span>
                  </div>
                  {relatedData?.account ? (
                    <div>
                      <span className="account-pill" style={{ fontSize: '0.9rem', padding: '0.3rem 0.75rem' }}>
                        🏢 {relatedData.account.name}
                      </span>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Industry: {relatedData.account.industry || '-'} • City: {relatedData.account.billingCity || '-'}
                      </div>
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
