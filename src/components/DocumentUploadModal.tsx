import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  Layers 
} from 'lucide-react';
import { DocumentCategory, LegalDocument } from '../types';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { authenticatedFetch } from '../lib/apiClient';
import { auth, uploadPrivateDocumentFile } from '../lib/firebase';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentAdded: (newDoc: LegalDocument) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onDocumentAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('rental');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    if (!title) {
      // Auto-populate title from file name
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content || '');
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read selected file.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAnalyzeAndAdd = async () => {
    const textToAnalyze = activeTab === 'paste' ? pastedText : fileContent;
    if (!textToAnalyze.trim()) {
      setErrorMessage('Please provide document text or select a file to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    const docId = `doc-${Date.now()}`;
    const docTitle = title.trim() || 'Untitled Legal Document';
    const fileName = selectedFile?.name || `${docTitle.toLowerCase().replace(/\s+/g, '_')}.txt`;
    const fileSize = selectedFile?.size || textToAnalyze.length;
    const mimeType = selectedFile?.type || 'text/plain';

    try {
      // Phase 4: Direct upload to private Firebase Storage if user is signed in
      if (auth.currentUser) {
        try {
          const blobToUpload = selectedFile || new Blob([textToAnalyze], { type: mimeType });
          await uploadPrivateDocumentFile(auth.currentUser.uid, docId, blobToUpload);
        } catch (storageErr) {
          console.warn('Storage upload note (proceeding with secure API processing):', storageErr);
        }
      }

      // Phase 6: Direct-to-storage processing API call
      const response = await authenticatedFetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docId,
          title: docTitle,
          category,
          fileName,
          fileSize,
          mimeType,
          fileContent: textToAnalyze,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned ${response.status}`);
      }

      const result = await response.json();
      const newDocument: LegalDocument = result.document || {
        id: docId,
        title: docTitle,
        category,
        fileName,
        fileSize,
        uploadDate: new Date().toISOString(),
        lastAnalyzed: new Date().toISOString(),
        rawText: textToAnalyze,
        metadata: {
          parties: [],
          summary: 'Uploaded legal agreement.',
        },
        extractedSections: [],
        obligations: [],
        deadlines: [],
        financialCommitments: [],
        attentionItems: [],
        inconsistencies: [],
        status: result.status || 'ready',
      };

      onDocumentAdded(newDocument);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setErrorMessage(`Analysis error: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSample = (sample: LegalDocument) => {
    // Clone with fresh ID
    const cloned: LegalDocument = {
      ...sample,
      id: `doc-sample-${Date.now()}`,
      uploadDate: new Date().toISOString(),
      lastAnalyzed: new Date().toISOString(),
    };
    onDocumentAdded(cloned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">Add Legal Document</h2>
              <p className="text-xs text-slate-500">Securely ingest, extract clauses, and analyze attention items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 border-b border-slate-200 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'upload' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Upload File (PDF / TXT)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'paste' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Paste Text Directly
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'samples' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Pre-Loaded Legal Samples
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab !== 'samples' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026 Apartment Lease, Consulting Agreement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="rental">Rental / Lease Agreement</option>
                  <option value="employment">Employment Agreement</option>
                  <option value="nda">Non-Disclosure Agreement (NDA)</option>
                  <option value="service">Service / SaaS Agreement</option>
                  <option value="insurance">Insurance Policy</option>
                  <option value="loan">Loan / Financial Agreement</option>
                  <option value="notice">Notice / Addendum</option>
                  <option value="other">Other Legal Document</option>
                </select>
              </div>
            </div>
          )}

          {/* Tab 1: Upload File */}
          {activeTab === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-8 text-center cursor-pointer bg-slate-50/60 hover:bg-slate-50 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.md,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-800">
                {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Supports TXT, PDF, MD, or DOC documents
              </p>
              {selectedFile && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
                  <Check className="w-3.5 h-3.5" /> File Loaded ({Math.round(selectedFile.size / 1024)} KB)
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Paste Text */}
          {activeTab === 'paste' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paste Full Agreement Text
              </label>
              <textarea
                rows={8}
                placeholder="Paste the text of your contract, clauses, notice, or lease terms here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {/* Tab 3: Preloaded Samples */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Test LegalLens immediately with pre-configured legal agreements featuring realistic clauses, traps, and notice periods:
              </p>

              {SAMPLE_DOCUMENTS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleLoadSample(sample)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {sample.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{sample.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{sample.metadata.summary}</p>
                  </div>

                  <span className="text-xs font-semibold text-emerald-700 hover:underline shrink-0">
                    Load & Scan →
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Privacy Note */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Private & Confidential:</span> All document processing is contained within your secure sandbox session. Your documents are never used for public AI training or shared with third parties.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        {activeTab !== 'samples' && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={isAnalyzing}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleAnalyzeAndAdd}
              disabled={isAnalyzing || (activeTab === 'upload' && !fileContent) || (activeTab === 'paste' && !pastedText.trim())}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Extracting Clauses & Attention Areas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze with LegalLens</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
