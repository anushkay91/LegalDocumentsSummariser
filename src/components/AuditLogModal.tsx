import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Trash2, 
  Lock, 
  Check, 
  Clock, 
  Database,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { AuditLogEntry, LegalDocument, UserProfile } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
  documents: LegalDocument[];
  userProfile: UserProfile;
  onWipeSession: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  documents,
  userProfile,
  onWipeSession,
}) => {
  const [confirmWipe, setConfirmWipe] = useState(false);

  if (!isOpen) return null;

  const handleExportAuditLogs = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      userProfile,
      documentCount: documents.length,
      auditLogs,
      documents: documents.map(d => ({
        id: d.id,
        title: d.title,
        category: d.category,
        uploadDate: d.uploadDate,
        attentionCount: d.attentionItems.length,
        obligationsCount: d.obligations.length,
        deadlinesCount: d.deadlines.length,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `legallens-audit-export-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">Security, Privacy & Audit Trail</h2>
              <p className="text-xs text-slate-500">Transparent log of all operations and private data residency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Privacy posture card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-emerald-900">
              <h4 className="font-bold">Zero-Retention Private Session Guarantee</h4>
              <p className="leading-relaxed">
                Your legal documents are stored only within your private browser workspace and secure backend runtime. AI models are accessed via server-side API with enterprise privacy isolation. No client data is ever used for model training or public indexing.
              </p>
            </div>
          </div>

          {/* Audit events list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Session Audit Trail ({auditLogs.length} events)</span>
              </h3>
              <button
                onClick={handleExportAuditLogs}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit JSON</span>
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2 bg-slate-50">
              {auditLogs.slice(-20).reverse().map((log) => (
                <div key={log.id} className="p-2 bg-white rounded border border-slate-200 text-xs flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 mr-2">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="text-slate-500 ml-1.5 text-[11px]">
                      {log.details}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    doc: {log.documentId.slice(0, 8)}...
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Session Wipe & Privacy Reset */}
          <div className="pt-4 border-t border-slate-200">
            {!confirmWipe ? (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Reset Local Session</h4>
                  <p className="text-[11px] text-slate-500">Permanently wipe all locally ingested documents and audit logs.</p>
                </div>
                <button
                  onClick={() => setConfirmWipe(true)}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe Session</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between gap-2">
                <div className="text-xs text-rose-900 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Are you sure? This will delete all documents from memory.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmWipe(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onWipeSession();
                      setConfirmWipe(false);
                      onClose();
                    }}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-xs"
                  >
                    Confirm Wipe
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
