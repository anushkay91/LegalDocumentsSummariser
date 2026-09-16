import React, { useState, useEffect } from 'react';
import { LegalDocument, UserProfile, AuditLogEntry } from './types';
import { SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { AttentionTab } from './components/AttentionTab';
import { ObligationsTab } from './components/ObligationsTab';
import { DeadlinesTab } from './components/DeadlinesTab';
import { FinancialTab } from './components/FinancialTab';
import { DocumentDualViewer } from './components/DocumentDualViewer';
import { DocumentGroundedChat } from './components/DocumentGroundedChat';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { AuditLogModal } from './components/AuditLogModal';

export const App: React.FC = () => {
  // Local state for documents
  const [documents, setDocuments] = useState<LegalDocument[]>(() => {
    const saved = localStorage.getItem('legallens_documents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved documents', e);
      }
    }
    return SAMPLE_DOCUMENTS;
  });

  const [currentDocId, setCurrentDocId] = useState<string>(() => {
    return documents[0]?.id || SAMPLE_DOCUMENTS[0].id;
  });

  const [activeTab, setActiveTab] = useState<
    'overview' | 'attention' | 'obligations' | 'deadlines' | 'financial' | 'chat' | 'viewer'
  >('overview');

  // Highlight state for locating clauses in the Dual Viewer
  const [highlightedText, setHighlightedText] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // User Profile
  const [userProfile] = useState<UserProfile>({
    id: 'user-default-1',
    name: 'Alex J. Morgan',
    email: 'alex.morgan@workspace.local',
    preferences: {
      alertOnHarshPenalties: true,
      alertOnRenewalTraps: true,
      remindDaysBeforeDeadlines: 14,
    },
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-init-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      action: 'uploaded',
      documentId: SAMPLE_DOCUMENTS[0].id,
      details: 'Beacon Residential Lease Agreement indexed with 6 key sections',
    },
    {
      id: 'log-init-2',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      action: 'status_changed',
      documentId: SAMPLE_DOCUMENTS[0].id,
      details: 'Automatic Renewal Lock-In flagged as High Attention priority',
    },
  ]);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('legallens_documents', JSON.stringify(documents));
  }, [documents]);

  const currentDoc = documents.find(d => d.id === currentDocId) || documents[0] || null;

  const logAudit = (action: AuditLogEntry['action'], docId: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      action,
      documentId: docId,
      details,
    };
    setAuditLogs(prev => [...prev, newEntry]);
  };

  const handleHighlightClause = (textSnippet: string, sectionNumber?: string) => {
    setHighlightedText(textSnippet);
    setHighlightedSection(sectionNumber || null);
    setActiveTab('viewer');
  };

  const handleClearHighlight = () => {
    setHighlightedText(null);
    setHighlightedSection(null);
  };

  const handleToggleObligation = (obligationId: string) => {
    if (!currentDoc) return;
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== currentDoc.id) return doc;
      const updated = doc.obligations.map(ob => {
        if (ob.id === obligationId) {
          const newCompleted = !ob.completed;
          logAudit(
            'obligation_toggled', 
            doc.id, 
            `Obligation "${ob.title}" marked as ${newCompleted ? 'completed' : 'pending'}`
          );
          return { ...ob, completed: newCompleted };
        }
        return ob;
      });
      return { ...doc, obligations: updated };
    }));
  };

  const handleToggleDeadline = (deadlineId: string) => {
    if (!currentDoc) return;
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== currentDoc.id) return doc;
      const updated = doc.deadlines.map(dl => {
        if (dl.id === deadlineId) {
          const newCompleted = !dl.completed;
          logAudit(
            'status_changed', 
            doc.id, 
            `Deadline "${dl.title}" marked as ${newCompleted ? 'acknowledged' : 'pending'}`
          );
          return { ...dl, completed: newCompleted };
        }
        return dl;
      });
      return { ...doc, deadlines: updated };
    }));
  };

  const handleUpdateAttentionStatus = (
    itemId: string, 
    status: 'unreviewed' | 'reviewed' | 'discuss_with_counsel'
  ) => {
    if (!currentDoc) return;
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== currentDoc.id) return doc;
      const updated = doc.attentionItems.map(item => {
        if (item.id === itemId) {
          logAudit(
            'status_changed', 
            doc.id, 
            `Attention item "${item.headline}" review status updated to "${status}"`
          );
          return { ...item, status };
        }
        return item;
      });
      return { ...doc, attentionItems: updated };
    }));
  };

  const handleDocumentAdded = (newDoc: LegalDocument) => {
    setDocuments(prev => [newDoc, ...prev]);
    setCurrentDocId(newDoc.id);
    setActiveTab('overview');
    logAudit('uploaded', newDoc.id, `Document "${newDoc.title}" successfully ingested and extracted`);
  };

  const handleWipeSession = () => {
    localStorage.removeItem('legallens_documents');
    setDocuments(SAMPLE_DOCUMENTS);
    setCurrentDocId(SAMPLE_DOCUMENTS[0].id);
    setActiveTab('overview');
    setAuditLogs([
      {
        id: `log-wipe-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'deleted',
        documentId: 'system',
        details: 'Local workspace reset. Reinitialized with verified sample agreements.',
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-950">
      {/* Top Navbar with Legal Disclaimer */}
      <Navbar
        documents={documents}
        currentDoc={currentDoc}
        onSelectDoc={(doc) => {
          setCurrentDocId(doc.id);
          handleClearHighlight();
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        userProfile={userProfile}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentDoc ? (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                document={currentDoc}
                onNavigateTab={setActiveTab}
                onHighlightClause={handleHighlightClause}
              />
            )}

            {activeTab === 'attention' && (
              <AttentionTab
                document={currentDoc}
                onUpdateAttentionStatus={handleUpdateAttentionStatus}
                onHighlightClause={handleHighlightClause}
              />
            )}

            {activeTab === 'obligations' && (
              <ObligationsTab
                document={currentDoc}
                onToggleObligation={handleToggleObligation}
                onHighlightClause={handleHighlightClause}
              />
            )}

            {activeTab === 'deadlines' && (
              <DeadlinesTab
                document={currentDoc}
                onToggleDeadline={handleToggleDeadline}
                onHighlightClause={handleHighlightClause}
              />
            )}

            {activeTab === 'financial' && (
              <FinancialTab
                document={currentDoc}
                onHighlightClause={handleHighlightClause}
              />
            )}

            {activeTab === 'viewer' && (
              <DocumentDualViewer
                document={currentDoc}
                highlightedText={highlightedText}
                highlightedSection={highlightedSection}
                onClearHighlight={handleClearHighlight}
              />
            )}

            {activeTab === 'chat' && (
              <DocumentGroundedChat
                document={currentDoc}
                onHighlightClause={handleHighlightClause}
                onSwitchToViewer={() => setActiveTab('viewer')}
              />
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12">
            <h2 className="text-lg font-bold text-slate-900 mb-2">No Document Selected</h2>
            <p className="text-xs text-slate-500 mb-4">Please add or select a legal document to begin analysis.</p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Add Document
            </button>
          </div>
        )}
      </main>

      {/* Footer Notice */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>LegalLens</strong> • Personal Legal Document Intelligence & Attention Assistant
          </div>
          <div className="text-[11px] text-slate-400">
            For informational purposes only • Always consult with licensed legal counsel for legal decision-making.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDocumentAdded={handleDocumentAdded}
      />

      <AuditLogModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        auditLogs={auditLogs}
        documents={documents}
        userProfile={userProfile}
        onWipeSession={handleWipeSession}
      />
    </div>
  );
};

export default App;
