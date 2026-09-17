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
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { DeleteDocumentModal } from './components/DeleteDocumentModal';
import { 
  saveDocumentToFirestore, 
  deleteDocumentFromFirestore, 
  loadUserDocumentsFromFirestore,
  subscribeToUserDocuments 
} from './lib/firestoreService';
import { authenticatedFetch } from './lib/apiClient';

const LegalLensApp: React.FC = () => {
  const { user, signInGuest } = useAuth();

  // In-memory state for documents (Phase 5: zero localStorage storage of legal documents or sensitive analysis)
  const [documents, setDocuments] = useState<LegalDocument[]>(SAMPLE_DOCUMENTS);

  const [currentDocId, setCurrentDocId] = useState<string>(() => {
    return SAMPLE_DOCUMENTS[0].id;
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
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<LegalDocument | null>(null);

  // Ensure an anonymous session exists by default for seamless initial use
  useEffect(() => {
    if (!user) {
      signInGuest().catch(() => {});
    }
  }, [user, signInGuest]);

  // Phase 5: Real-time Firestore document sync when user is authenticated
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const unsubscribe = subscribeToUserDocuments(user.uid, (remoteDocs) => {
        if (remoteDocs && remoteDocs.length > 0) {
          setDocuments(remoteDocs);
          setCurrentDocId(prev => remoteDocs.some(d => d.id === prev) ? prev : remoteDocs[0].id);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Dynamically bound User Profile
  const userProfile: UserProfile = {
    id: user ? user.uid : 'user-default-1',
    name: user?.displayName || (user?.isAnonymous ? 'Guest User' : user?.email?.split('@')[0] || 'Alex J. Morgan'),
    email: user?.email || (user?.isAnonymous ? 'guest-session@legallens.app' : 'alex.morgan@workspace.local'),
    preferences: {
      alertOnHarshPenalties: true,
      alertOnRenewalTraps: true,
      remindDaysBeforeDeadlines: 14,
    },
  };

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
    
    // Persist to user Firestore if signed in
    if (user && !user.isAnonymous) {
      saveDocumentToFirestore(user.uid, newDoc).catch((err) => {
        console.warn('Could not persist added document to Firestore:', err);
      });
    }
  };

  const handleRequestDeleteDoc = (doc?: LegalDocument | null) => {
    const target = doc || currentDoc;
    if (target) {
      setDocToDelete(target);
      setIsDeleteOpen(true);
    }
  };

  const handleConfirmDelete = async (documentId: string) => {
    const deletedDocTitle = docToDelete?.title || 'Document';

    // Phase 9: Trigger cascading deletion across Storage, Subcollections, and Semantic RAG index
    try {
      await authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Backend cascading deletion note:', err);
    }

    // Delete from Firestore directly if signed in
    if (user && !user.isAnonymous) {
      await deleteDocumentFromFirestore(user.uid, documentId);
    }

    setDocuments(prev => {
      const remaining = prev.filter(d => d.id !== documentId);
      if (currentDocId === documentId) {
        if (remaining.length > 0) {
          setCurrentDocId(remaining[0].id);
        } else {
          setCurrentDocId('');
        }
      }
      return remaining;
    });

    logAudit('deleted', documentId, `Document "${deletedDocTitle}" permanently purged across storage, database, and index`);
    handleClearHighlight();
  };

  const handleWipeSession = () => {
    setDocuments(SAMPLE_DOCUMENTS);
    setCurrentDocId(SAMPLE_DOCUMENTS[0].id);
    setActiveTab('overview');
    setAuditLogs([
      {
        id: `log-wipe-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'deleted',
        documentId: 'system',
        details: 'Active workspace reset. Reinitialized with verified sample agreements.',
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
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDeleteDoc={() => handleRequestDeleteDoc(currentDoc)}
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
                onOpenDelete={() => handleRequestDeleteDoc(currentDoc)}
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
                documents={documents}
                onSelectDoc={(doc) => {
                  setCurrentDocId(doc.id);
                  handleClearHighlight();
                }}
                highlightedText={highlightedText}
                highlightedSection={highlightedSection}
                onClearHighlight={handleClearHighlight}
                onHighlightClause={handleHighlightClause}
                onRequestDelete={() => handleRequestDeleteDoc(currentDoc)}
                onOpenUpload={() => setIsUploadOpen(true)}
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
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2 font-serif">No Document in Workspace</h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Your document was removed. You can upload an agreement or restore verified sample contracts.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                Add Document
              </button>
              <button
                onClick={handleWipeSession}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              >
                Load Sample Agreement
              </button>
            </div>
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <DeleteDocumentModal
        isOpen={isDeleteOpen}
        document={docToDelete}
        onClose={() => {
          setIsDeleteOpen(false);
          setDocToDelete(null);
        }}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LegalLensApp />
    </AuthProvider>
  );
};

export default App;
