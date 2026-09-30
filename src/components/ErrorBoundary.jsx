import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'radial-gradient(circle at center, #0f172a 0%, #060913 100%)',
          color: '#e2e8f0'
        }}>
          <div className="card" style={{ maxWidth: 540, width: '100%', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
              color: '#ef4444'
            }}>
              <AlertTriangle size={26} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              An error occurred while rendering the interface.
            </p>
            {this.state.error?.message && (
              <pre style={{
                textAlign: 'left',
                background: '#060910',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                color: '#f87171',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                border: '1px solid var(--border-color)'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ margin: '0 auto' }}
            >
              <RefreshCw size={15} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
