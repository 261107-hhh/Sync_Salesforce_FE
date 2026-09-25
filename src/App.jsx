import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import SyncCenter from './components/SyncCenter';
import DataExplorer from './components/DataExplorer';
import ConnectionTab from './components/ConnectionTab';
import CreateRecordModal from './components/CreateRecordModal';
import RecordDetailModal from './components/RecordDetailModal';
import ErrorBoundary from './components/ErrorBoundary';
import api from './api/client';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('explorer');
  const [sfStatus, setSfStatus] = useState(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTargetObject, setCreateTargetObject] = useState('Contact');
  const [prefillAccountId, setPrefillAccountId] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTargetObject, setDetailTargetObject] = useState('Account');
  const [detailTargetId, setDetailTargetId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSfStatus();
    }
  }, [user]);

  const fetchSfStatus = async () => {
    try {
      const res = await api.get('/api/auth/status');
      if (res.data.success) {
        setSfStatus(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch Salesforce status');
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

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} sfStatus={sfStatus} />

      <main style={{ flex: 1, maxWidth: 1300, width: '100%', margin: '0 auto', padding: '1.5rem' }}>
        {activeTab === 'sync' && <SyncCenter />}
        {activeTab === 'explorer' && (
          <DataExplorer
            onOpenDetails={handleOpenDetails}
            onOpenCreate={handleOpenCreate}
            sfStatus={sfStatus}
          />
        )}
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
          // Trigger refresh if needed
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
