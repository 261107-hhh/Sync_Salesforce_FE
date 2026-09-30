import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, RefreshCw, UserCheck } from 'lucide-react';

const AVATAR_COLORS = [
  { bg: 'rgba(56, 189, 248, 0.18)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)' },
  { bg: 'rgba(168, 85, 247, 0.18)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.35)' },
  { bg: 'rgba(52, 211, 153, 0.18)', text: '#34d399', border: 'rgba(52, 211, 153, 0.35)' },
  { bg: 'rgba(251, 191, 36, 0.18)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.35)' },
  { bg: 'rgba(244, 114, 182, 0.18)', text: '#f472b6', border: 'rgba(244, 114, 182, 0.35)' },
  { bg: 'rgba(99, 102, 241, 0.18)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.35)' }
];

/**
 * Normalizes any format of syncedBy into an array of user objects:
 * e.g. ",admin@acme.com,user1@acme.com," -> [{ raw, username, email, initial }]
 */
export function parseSyncedBy(val) {
  if (!val) return [];
  let list = [];
  if (Array.isArray(val)) {
    list = val.map(String);
  } else if (typeof val === 'string') {
    list = val.split(',');
  } else {
    list = [String(val)];
  }

  const seen = new Set();
  const result = [];
  for (const item of list) {
    const clean = item.trim();
    if (!clean) continue;
    const lower = clean.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      const username = clean.includes('@') ? clean.split('@')[0] : clean;
      const initial = username.charAt(0).toUpperCase() || 'U';
      result.push({
        raw: clean,
        username,
        email: clean.includes('@') ? clean : null,
        initial
      });
    }
  }
  return result;
}

export default function SyncedByBadge({ syncedBy, variant = 'table' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const users = parseSyncedBy(syncedBy);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Case 0: No users recorded
  if (users.length === 0) {
    if (variant === 'modal') {
      return (
        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
          Direct Sync Pipeline
        </span>
      );
    }
    return (
      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
        System
      </span>
    );
  }

  // Case 1: Exactly 1 user
  if (users.length === 1) {
    const u = users[0];
    if (variant === 'modal') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: '0.25rem' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(52, 211, 153, 0.18)',
            color: '#34d399',
            border: '1px solid rgba(52, 211, 153, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.72rem',
            fontWeight: 700,
            flexShrink: 0
          }}>
            {u.initial}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>
              {u.username}
            </div>
            {u.email && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {u.email}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Table variant for 1 user
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '9999px',
          background: 'rgba(52, 211, 153, 0.08)',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          color: '#34d399',
          fontSize: '0.75rem',
          fontWeight: 500,
          maxWidth: '160px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={`Synced by: ${u.raw}`}
      >
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'rgba(52, 211, 153, 0.2)',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.62rem',
          fontWeight: 700,
          flexShrink: 0
        }}>
          {u.initial}
        </div>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.username}</span>
      </div>
    );
  }

  // Case 2+: Multiple users - Render interactive dropdown list!
  if (variant === 'modal') {
    return (
      <div style={{ marginTop: '0.35rem' }} ref={containerRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: isOpen ? 'rgba(52, 211, 153, 0.2)' : 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              color: '#34d399',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={14} />
            <span>Synced by {users.length} members</span>
            <ChevronDown
              size={13}
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          </button>

          {/* Avatar stack preview */}
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.2rem' }}>
            {users.slice(0, 5).map((u, i) => {
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div
                  key={u.raw}
                  title={u.raw}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: color.bg,
                    color: color.text,
                    border: '2px solid #131c31',
                    marginLeft: i > 0 ? '-8px' : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                  }}
                >
                  {u.initial}
                </div>
              );
            })}
            {users.length > 5 && (
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                marginLeft: '0.4rem',
                fontWeight: 600
              }}>
                +{users.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Dropdown list of members */}
        {isOpen && (
          <div style={{
            marginTop: '0.6rem',
            padding: '0.65rem',
            background: 'rgba(11, 17, 32, 0.95)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            maxHeight: '220px',
            overflowY: 'auto'
          }}>
            <div style={{
              fontSize: '0.7rem',
              color: '#38bdf8',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.2rem',
              paddingBottom: '0.3rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              All Contributing Sync Members ({users.length})
            </div>
            {users.map((u, i) => {
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div
                  key={u.raw}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: color.bg,
                      color: color.text,
                      border: `1px solid ${color.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      {u.initial}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                        {u.username}
                      </div>
                      {u.email && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {u.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    color: '#34d399',
                    background: 'rgba(52, 211, 153, 0.12)',
                    padding: '0.12rem 0.5rem',
                    borderRadius: '9999px',
                    fontWeight: 600
                  }}>
                    ✓ Synced
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Table variant for multiple users
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.2rem 0.55rem',
          borderRadius: '9999px',
          background: isOpen ? 'rgba(52, 211, 153, 0.22)' : 'rgba(52, 211, 153, 0.1)',
          border: `1px solid ${isOpen ? 'rgba(52, 211, 153, 0.5)' : 'rgba(52, 211, 153, 0.3)'}`,
          color: '#34d399',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 10px rgba(52, 211, 153, 0.25)' : 'none',
          transition: 'all 0.15s ease'
        }}
        title={`Synced by ${users.length} users: ${users.map(u => u.username).join(', ')}. Click to view dropdown.`}
      >
        <Users size={12} />
        <span>{users[0].username}</span>
        <span style={{
          background: 'rgba(52, 211, 153, 0.25)',
          color: '#6ee7b7',
          padding: '0.05rem 0.35rem',
          borderRadius: '9999px',
          fontSize: '0.68rem',
          fontWeight: 700
        }}>
          +{users.length - 1}
        </span>
        <ChevronDown
          size={11}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </button>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            minWidth: '220px',
            maxWidth: '280px',
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(56, 189, 248, 0.15)',
            padding: '0.5rem',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.3rem 0.5rem 0.45rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '0.4rem',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 700
          }}>
            <span style={{ color: '#38bdf8' }}>Synced by {users.length} members</span>
            <RefreshCw size={11} color="#34d399" />
          </div>

          <div style={{
            maxHeight: '190px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem'
          }}>
            {users.map((u, i) => {
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div
                  key={u.raw}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: color.bg,
                    color: color.text,
                    border: `1px solid ${color.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {u.initial}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {u.username}
                    </div>
                    {u.email && (
                      <div style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {u.email}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    color: '#34d399',
                    background: 'rgba(52, 211, 153, 0.12)',
                    padding: '0.08rem 0.35rem',
                    borderRadius: '4px',
                    flexShrink: 0
                  }}>
                    Synced
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
