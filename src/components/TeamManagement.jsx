import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Copy,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Ban
} from 'lucide-react';

export default function TeamManagement() {
  const { activeOrgId, activeOrgName, activeOrgRole, user } = useAuth();
  const isManager = activeOrgRole === 'OWNER' || activeOrgRole === 'ADMIN';

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [createdInviteLink, setCreatedInviteLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (activeOrgId) {
      loadTeamData();
    }
  }, [activeOrgId]);

  const loadTeamData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        api.get(`/api/orgs/${activeOrgId}/members`),
        isManager ? api.get(`/api/orgs/${activeOrgId}/invitations`) : Promise.resolve({ data: { data: [] } })
      ]);

      if (membersRes.data.success) {
        setMembers(membersRes.data.data || []);
      }
      if (invitesRes?.data?.success) {
        setInvitations(invitesRes.data.data || []);
      }
    } catch (err) {
      console.warn('Could not load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setFeedback(null);
    setCreatedInviteLink('');

    try {
      const res = await api.post(`/api/orgs/${activeOrgId}/invitations`, {
        email: inviteEmail.trim(),
        role: inviteRole
      });

      if (res.data.success && res.data.data) {
        const inv = res.data.data;
        const link = `${window.location.origin}/invite/accept?token=${inv.token}`;
        setCreatedInviteLink(link);
        setFeedback({
          type: 'success',
          message: `Invitation generated for ${inv.email}! Share the link below to let them register and join.`
        });
        setInviteEmail('');
        loadTeamData();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to send invitation'
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/api/orgs/${activeOrgId}/members/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setMembers((prev) =>
          prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
        );
        setFeedback({ type: 'success', message: 'Member role updated successfully.' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to update role'
      });
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this organization?`)) {
      return;
    }
    try {
      const res = await api.delete(`/api/orgs/${activeOrgId}/members/${userId}`);
      if (res.data.success) {
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
        setFeedback({ type: 'success', message: `${memberName} was removed from the organization.` });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Could not remove member'
      });
    }
  };

  const handleRevokeInvitation = async (invitationId, invEmail) => {
    if (!window.confirm(`Revoke pending invitation for ${invEmail}?`)) return;
    try {
      const res = await api.delete(`/api/orgs/${activeOrgId}/invitations/${invitationId}`);
      if (res.data.success) {
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
        setFeedback({ type: 'success', message: `Invitation for ${invEmail} revoked.` });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to revoke invite'
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'OWNER':
        return 'badge-purple';
      case 'ADMIN':
        return 'badge-info';
      case 'MEMBER':
        return 'badge-success';
      case 'READONLY':
        return 'badge-neutral';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner / Actions */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Users size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Team & Organization Members
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Workspace: <strong style={{ color: 'var(--text-primary)' }}>{activeOrgName || activeOrgId}</strong>
                  {activeOrgRole && (
                    <> • Your Role: <span className={`badge ${getRoleBadgeClass(activeOrgRole)}`}>{activeOrgRole}</span></>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={loadTeamData}
              className="btn btn-secondary btn-sm"
              title="Refresh team members"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>

            {isManager && (
              <button
                onClick={() => { setInviteModalOpen(true); setCreatedInviteLink(''); }}
                className="btn btn-primary btn-sm"
              >
                <UserPlus size={15} /> Invite Teammate
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginTop: '1.25rem',
            fontSize: '0.82rem',
            background: feedback.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
            color: feedback.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Active Members Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Active Members ({members.length})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Users with active permissions and shared Salesforce sync access in this organization
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Status</th>
                <th>Joined</th>
                {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && members.length === 0 ? (
                <tr><td colSpan={isManager ? 6 : 5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>Loading team members...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={isManager ? 6 : 5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No members found in this workspace.</td></tr>
              ) : (
                members.map((m) => {
                  const isSelf = m.userId === user?.id || m.email === user?.email;
                  const canManageThis = isManager && (!isSelf || activeOrgRole === 'OWNER') && m.role !== 'OWNER';

                  return (
                    <tr key={m.id || m.userId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.82rem'
                          }}>
                            {(m.name || m.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {m.name || 'Team Member'} {isSelf && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(You)</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>User ID: #{m.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {m.email}
                        </span>
                      </td>
                      <td>
                        {isSelf ? (
                          <span className={`badge ${getRoleBadgeClass(m.role || activeOrgRole)}`}>
                            {m.role || activeOrgRole} (You)
                          </span>
                        ) : isManager ? (
                          canManageThis ? (
                            <select
                              className="form-select"
                              style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', width: 130 }}
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="MEMBER">MEMBER</option>
                              <option value="READONLY">READONLY</option>
                            </select>
                          ) : (
                            <span className={`badge ${getRoleBadgeClass(m.role)}`}>
                              {m.role}
                            </span>
                          )
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }} title="Visible to Admins only">
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#34d399' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                          {m.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '-'}
                      </td>
                      {isManager && (
                        <td style={{ textAlign: 'right' }}>
                          {canManageThis && (
                            <button
                              onClick={() => handleRemoveMember(m.userId, m.name || m.email)}
                              className="btn btn-secondary btn-sm"
                              title="Remove from organization"
                              style={{ color: '#f87171' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invitations Section (Manager / Owner Tracking) */}
      {isManager && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Track Sent Invitations ({invitations.length})
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Track who has joined, whose invitation is pending, or share direct invitation links
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invitee Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Invited By</th>
                  <th>Sent On</th>
                  <th>Expires</th>
                  <th style={{ textAlign: 'right' }}>Invite Link / Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No invitations currently logged. Click "Invite Teammate" to onboard members.
                    </td>
                  </tr>
                ) : (
                  invitations.map((inv) => {
                    const isPending = inv.status === 'PENDING';
                    const link = `${window.location.origin}/invite/accept?token=${inv.token}`;

                    return (
                      <tr key={inv.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={15} color="var(--text-muted)" />
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{inv.email}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(inv.role)}`}>{inv.role}</span>
                        </td>
                        <td>
                          <span className={`badge ${inv.status === 'ACCEPTED' ? 'badge-success' : (inv.status === 'PENDING' ? 'badge-info' : 'badge-neutral')}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {inv.invitedByEmail || '-'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            {isPending && (
                              <>
                                <button
                                  onClick={() => copyToClipboard(link)}
                                  className="btn btn-secondary btn-sm"
                                  title="Copy invite URL"
                                >
                                  <Copy size={13} /> Copy Link
                                </button>
                                <button
                                  onClick={() => handleRevokeInvitation(inv.id, inv.email)}
                                  className="btn btn-secondary btn-sm"
                                  title="Revoke invitation"
                                  style={{ color: '#f87171' }}
                                >
                                  <Ban size={13} />
                                </button>
                              </>
                            )}
                            {inv.status === 'ACCEPTED' && (
                              <span style={{ fontSize: '0.78rem', color: '#34d399' }}>✓ Joined Team</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="modal-overlay" onClick={() => setInviteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Invite Colleague
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Add members to <strong>{activeOrgName}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setInviteModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite}>
              <div className="modal-body">
                {createdInviteLink ? (
                  <div style={{
                    padding: '1.25rem',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                      <CheckCircle2 size={16} /> Invitation Generated!
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Share this invitation link directly with your colleague to join this workspace:
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        readOnly
                        value={createdInviteLink}
                        className="form-input"
                        style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(createdInviteLink)}
                        className="btn btn-primary"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                        {copiedLink ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="form-group">
                  <label className="form-label">Colleague Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      required
                      placeholder="colleague@yourcompany.com"
                      className="form-input"
                      style={{ paddingLeft: '2.4rem' }}
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Role</label>
                  <select
                    className="form-select"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="MEMBER">MEMBER (Can sync and create records)</option>
                    <option value="ADMIN">ADMIN (Can invite teammates & configure Salesforce)</option>
                    <option value="READONLY">READONLY (View and export records only)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setInviteModalOpen(false)} className="btn btn-secondary">
                  {createdInviteLink ? 'Done' : 'Cancel'}
                </button>
                <button type="submit" disabled={inviteLoading || !inviteEmail.trim()} className="btn btn-primary">
                  {inviteLoading ? 'Creating Invite...' : 'Generate Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
