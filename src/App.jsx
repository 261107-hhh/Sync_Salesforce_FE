import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import SyncCenter from './components/SyncCenter';
import SyncLogsTab from './components/SyncLogsTab';
import DataExplorer from './components/DataExplorer';
import UserAccountTab from './components/UserAccountTab';
import CreateRecordModal from './components/CreateRecordModal';
import EditRecordModal from './components/EditRecordModal';
import RecordDetailModal from './components/RecordDetailModal';
import CreateOrgModal from './components/CreateOrgModal';
import AcceptInviteModal from './components/AcceptInviteModal';
import ApiErrorHighlight from './components/ApiErrorHighlight';
import ErrorBoundary from './components/ErrorBoundary';
import api from './api/client';

function MainApp() {
  const { user, loading, activeOrgId, activeOrgName, activeOrgRole } = useAuth();
  const [activeTab, setActiveTab] = useState('explorer');
  const [sfStatus, setSfStatus] = useState(null);

  // Invite acceptance flow from URL query params
  const [inviteToken, setInviteToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || params.get('inviteToken') || null;
  });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTargetObject, setCreateTargetObject] = useState('Contact');
  const [prefillAccountId, setPrefillAccountId] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTargetObject, setEditTargetObject] = useState('Account');
  const [editTargetRecord, setEditTargetRecord] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTargetObject, setDetailTargetObject] = useState('Account');
  const [detailTargetId, setDetailTargetId] = useState(null);

  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  useEffect(() => {
    if (user && activeOrgId) {
      fetchSfStatus();
    }
  }, [user, activeOrgId]);

  const fetchSfStatus = async (overrideStatus = null) => {
    if (overrideStatus !== null && typeof overrideStatus === 'object') {
      setSfStatus(overrideStatus);
      return;
    }

    try {
      if (activeOrgId) {
        // Multi-tenant check: Fetch active organization connection profile
        try {
          const orgRes = await api.get(`/api/orgs/${activeOrgId}`);
          if (orgRes.data.success && orgRes.data.data) {
            const org = orgRes.data.data;
            const isConnected = Boolean(org.salesforceConnected) && org.sfAuthMode !== 'disconnected';
            setSfStatus({
              connected: isConnected,
              isMock: org.sfAuthMode === 'mock',
              mode: org.sfAuthMode || (isConnected ? 'eca' : 'disconnected'),
              instanceUrl: org.sfInstanceUrl,
              username: org.sfUsername,
              organizationId: org.id,
              organizationName: org.name
            });
            return;
          }
        } catch (orgErr) {
          console.warn('Could not query organization status, falling back to auth status:', orgErr);
        }
      }

      const res = await api.get('/api/auth/status');
      if (res.data.success) {
        setSfStatus(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch Salesforce status', err);
    }
  };

  const handleOpenCreate = (objectName = 'Contact', accId = null) => {
    setCreateTargetObject(objectName);
    setPrefillAccountId(accId);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (objectName, record) => {
    setEditTargetObject(objectName);
    setEditTargetRecord(record);
    setEditModalOpen(true);
  };

  const handleOpenDetails = (objectName, id) => {
    setDetailTargetObject(objectName);
    setDetailTargetId(id);
    setDetailModalOpen(true);
  };

  const handleAddChildFromAccount = (childObject, accountId) => {
    setDetailModalOpen(false);
    handleOpenCreate(childObject, accountId);
  };

  const triggerDataRefresh = () => {
    setDataRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading platform session...
      </div>
    );
  }

  // If user opened an invitation link, render Accept Invite Screen
  if (inviteToken) {
    return (
      <AcceptInviteModal
        token={inviteToken}
        onJoined={() => {
          setInviteToken(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
        onCancel={() => {
          setInviteToken(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Global Highlighting Toast for API Errors */}
      <ApiErrorHighlight />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sfStatus={sfStatus}
      />

      <main className="app-main-container">
        {activeTab === 'explorer' && (
          <DataExplorer
            refreshSignal={dataRefreshKey}
            onOpenDetails={handleOpenDetails}
            onOpenCreate={handleOpenCreate}
            onOpenEdit={handleOpenEdit}
            sfStatus={sfStatus}
          />
        )}

        {activeTab === 'sync' && (
          <SyncCenter
            sfStatus={sfStatus}
            onNavigateToConnection={() => setActiveTab('account')}
            onNavigateToLogs={() => setActiveTab('sync-logs')}
          />
        )}

        {activeTab === 'sync-logs' && (
          <SyncLogsTab
            sfStatus={sfStatus}
            onNavigateToConnection={() => setActiveTab('account')}
            onTriggerSync={() => setActiveTab('sync')}
          />
        )}

        {/* User Account Master Tab (Workspaces, Team, SF Setup, Profile) */}
        {activeTab === 'account' && (
          <UserAccountTab
            sfStatus={sfStatus}
            onStatusChange={fetchSfStatus}
            onOpenCreateOrg={() => setCreateOrgModalOpen(true)}
          />
        )}
      </main>

      {/* Create Record Modal with Account Lookup & Quick Account Creation */}
      <CreateRecordModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialObject={createTargetObject}
        prefillAccountId={prefillAccountId}
        onCreated={() => {
          triggerDataRefresh();
        }}
      />

      {/* Edit Record Modal with Live SF Patch & Audit Updates */}
      <EditRecordModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditTargetRecord(null);
        }}
        objectName={editTargetObject}
        record={editTargetRecord}
        onUpdated={() => {
          triggerDataRefresh();
        }}
      />

      {/* Record Details Modal with Relationships & Edit Action */}
      <RecordDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        objectName={detailTargetObject}
        recordId={detailTargetId}
        onOpenCreateWithAccount={activeOrgRole === 'READONLY' ? null : handleAddChildFromAccount}
        onEditRecord={activeOrgRole === 'READONLY' ? null : handleOpenEdit}
        onOpenRecordDetails={handleOpenDetails}
      />

      {/* Create Organization Modal */}
      <CreateOrgModal
        isOpen={createOrgModalOpen}
        onClose={() => setCreateOrgModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
