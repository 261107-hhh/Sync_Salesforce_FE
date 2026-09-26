import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import SyncCenter from './components/SyncCenter';
import DataExplorer from './components/DataExplorer';
import ConnectionTab from './components/ConnectionTab';
import TeamManagement from './components/TeamManagement';
import CreateRecordModal from './components/CreateRecordModal';
import RecordDetailModal from './components/RecordDetailModal';
import CreateOrgModal from './components/CreateOrgModal';
import AcceptInviteModal from './components/AcceptInviteModal';
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

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTargetObject, setDetailTargetObject] = useState('Account');
  const [detailTargetId, setDetailTargetId] = useState(null);

  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);

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

  const handleOpenDetails = (objectName, id) => {
    setDetailTargetObject(objectName);
    setDetailTargetId(id);
    setDetailModalOpen(true);
  };

  const handleAddChildFromAccount = (childObject, accountId) => {
    setDetailModalOpen(false);
    handleOpenCreate(childObject, accountId);
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
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sfStatus={sfStatus}
        onOpenCreateOrg={() => setCreateOrgModalOpen(true)}
      />

      <main style={{ flex: 1, maxWidth: 1300, width: '100%', margin: '0 auto', padding: '1.5rem' }}>
        {activeTab === 'explorer' && (
          <DataExplorer
            onOpenDetails={handleOpenDetails}
            onOpenCreate={handleOpenCreate}
            sfStatus={sfStatus}
          />
        )}
        {activeTab === 'sync' && (
          <SyncCenter
            sfStatus={sfStatus}
            onNavigateToConnection={() => setActiveTab('connection')}
          />
        )}
        {activeTab === 'team' && <TeamManagement />}
        {activeTab === 'connection' && (
          <ConnectionTab sfStatus={sfStatus} onStatusChange={fetchSfStatus} />
        )}
      </main>

      {/* Create Record Modal with Account Lookup */}
      <CreateRecordModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialObject={createTargetObject}
        prefillAccountId={prefillAccountId}
        onCreated={() => {
          // Triggers refresh in DataExplorer
        }}
      />

      {/* Record Details Modal with Relationships */}
      <RecordDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        objectName={detailTargetObject}
        recordId={detailTargetId}
        onOpenCreateWithAccount={handleAddChildFromAccount}
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
