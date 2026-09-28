import React, { useState, useEffect } from 'react';
import { AlertOctagon, X, AlertTriangle } from 'lucide-react';

export default function ApiErrorHighlight() {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const handleApiError = (e) => {
      const { message, status, url, method, timestamp } = e.detail || {};
      const newErr = {
        id: timestamp || Date.now() + Math.random(),
        message: message || 'An unexpected API error occurred.',
        status: status || null,
        url: url || null,
        method: method || 'API',
        timestamp: new Date().toLocaleTimeString()
      };

      setErrors((prev) => [newErr, ...prev.slice(0, 2)]); // Keep maximum 3 recent alerts

      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setErrors((prev) => prev.filter((item) => item.id !== newErr.id));
      }, 8000);
    };

    window.addEventListener('api:error', handleApiError);
    return () => window.removeEventListener('api:error', handleApiError);
  }, []);

  const handleDismiss = (id) => {
    setErrors((prev) => prev.filter((item) => item.id !== id));
  };

  if (errors.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: 480,
      width: 'calc(100vw - 40px)',
      pointerEvents: 'none'
    }}>
      {errors.map((err) => (
        <div
          key={err.id}
          style={{
            pointerEvents: 'auto',
            background: 'linear-gradient(135deg, rgba(24, 7, 7, 0.98), rgba(45, 12, 12, 0.98))',
            border: '2px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 35px rgba(239, 68, 68, 0.4), 0 0 15px rgba(239, 68, 68, 0.25)',
            padding: '1rem 1.25rem',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertOctagon size={16} color="#ef4444" />
              </div>
              <strong style={{ fontSize: '0.9rem', color: '#fca5a5', letterSpacing: '-0.01em' }}>
                API Request Failure
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {err.status && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: '#ef4444',
                  color: '#fff',
                  padding: '2px 7px',
                  borderRadius: 4
                }}>
                  {err.status}
                </span>
              )}
              <button
                onClick={() => handleDismiss(err.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Highlighted Message Box */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderLeft: '4px solid #ef4444',
            padding: '0.6rem 0.85rem',
            borderRadius: '0 6px 6px 0',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#fff',
            wordBreak: 'break-word',
            lineHeight: 1.45
          }}>
            {err.message}
          </div>

          {/* Footnote metadata */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.1rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
              {err.method} {err.url || ''}
            </span>
            <span>{err.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
