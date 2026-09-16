import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { LegalDocument } from '../types';

interface DeleteDocumentModalProps {
  isOpen: boolean;
  document: LegalDocument | null;
  onClose: () => void;
  onConfirmDelete: (documentId: string) => Promise<void> | void;
}

export const DeleteDocumentModal: React.FC<DeleteDocumentModalProps> = ({
  isOpen,
  document,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !document) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(document.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-desc"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-xs">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="delete-dialog-title" className="text-base font-bold text-rose-950 font-serif">
                Delete Document
              </h2>
              <p className="text-xs text-rose-700">Permanent database removal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-100/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="text-slate-500 font-medium">Selected Document:</div>
            <div className="text-sm font-bold text-slate-900 font-serif truncate">
              {document.title}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="capitalize px-2 py-0.5 rounded bg-slate-200 text-[10px] font-semibold">
                {document.category}
              </span>
              <span>•</span>
              <span className="truncate">{document.fileName}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p id="delete-dialog-desc">
              Are you sure you want to permanently remove this document from your database and workspace? All extracted clauses, review flags, obligations, and chat history for this document will be deleted.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors focus:ring-2 focus:ring-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Document'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
