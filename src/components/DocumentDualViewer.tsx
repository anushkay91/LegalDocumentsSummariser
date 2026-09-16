import React, { useState, useEffect, useRef } from 'react';
import { LegalDocument } from '../types';
import { 
  Search, 
  Copy, 
  Check, 
  BookOpen, 
  ExternalLink, 
  FileText, 
  CornerDownRight,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface DocumentDualViewerProps {
  document: LegalDocument;
  highlightedText: string | null;
  highlightedSection: string | null;
  onClearHighlight: () => void;
}

export const DocumentDualViewer: React.FC<DocumentDualViewerProps> = ({
  document,
  highlightedText,
  highlightedSection,
  onClearHighlight,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'text-xs' | 'text-sm' | 'text-base'>('text-sm');
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to highlight when highlightedText changes
  useEffect(() => {
    if (highlightedText && containerRef.current) {
      setTimeout(() => {
        const highlightElem = containerRef.current?.querySelector('.legal-active-highlight');
        if (highlightElem) {
          highlightElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightedText]);

  const handleCopyFullText = () => {
    navigator.clipboard.writeText(document.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render raw document text with dynamic highlighting
  const renderDocumentContent = () => {
    const raw = document.rawText;
    const lines = raw.split('\n');

    return (
      <div className="space-y-2">
        {lines.map((line, idx) => {
          const isSectionHeader = /^(SECTION|ARTICLE|CLAUSE|\d+\.\d+)/i.test(line.trim());
          const isHighlightMatch = highlightedText && line.toLowerCase().includes(highlightedText.toLowerCase().slice(0, 30));

          let lineContent: React.ReactNode = line;

          // If there's an active highlight query
          if (highlightedText && highlightedText.length > 5) {
            const cleanQuery = highlightedText.trim();
            const lowerLine = line.toLowerCase();
            const lowerQuery = cleanQuery.toLowerCase();
            const pos = lowerLine.indexOf(lowerQuery.slice(0, 40));

            if (pos !== -1) {
              const matchedPart = line.slice(pos, pos + Math.min(cleanQuery.length, line.length - pos));
              lineContent = (
                <span className="legal-active-highlight bg-amber-200 text-amber-950 font-semibold px-1 py-0.5 rounded shadow-xs ring-2 ring-amber-400">
                  {line}
                </span>
              );
            }
          } else if (searchQuery.trim().length > 1) {
            const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            const parts = line.split(regex);
            lineContent = parts.map((part, pIdx) => 
              regex.test(part) ? (
                <mark key={pIdx} className="bg-yellow-200 text-yellow-950 px-0.5 rounded">
                  {part}
                </mark>
              ) : (
                part
              )
            );
          }

          if (isSectionHeader) {
            return (
              <div 
                key={idx} 
                className={`pt-3 pb-1 font-serif font-bold text-slate-900 border-b border-slate-200 ${
                  isHighlightMatch ? 'bg-amber-100/70 text-amber-950 px-2 rounded' : ''
                }`}
              >
                {lineContent}
              </div>
            );
          }

          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }

          return (
            <p 
              key={idx} 
              className={`leading-relaxed text-slate-800 ${
                isHighlightMatch ? 'legal-active-highlight bg-amber-100/80 text-amber-950 p-1.5 rounded border-l-4 border-amber-500 font-medium' : ''
              }`}
            >
              {lineContent}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search terms or clause numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {highlightedText && (
            <div className="flex items-center gap-2 bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded-lg border border-amber-300">
              <span>Clause Highlighted ({highlightedSection || 'Selected'})</span>
              <button
                onClick={onClearHighlight}
                className="text-amber-950 font-bold hover:underline text-[11px]"
              >
                Clear
              </button>
            </div>
          )}

          {/* Font scale buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setFontSize('text-xs')}
              className={`px-2 py-1 rounded font-medium ${fontSize === 'text-xs' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-500'}`}
              title="Small text"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('text-sm')}
              className={`px-2 py-1 rounded font-medium ${fontSize === 'text-sm' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-500'}`}
              title="Default text"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('text-base')}
              className={`px-2 py-1 rounded font-medium ${fontSize === 'text-base' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-500'}`}
              title="Large text"
            >
              A+
            </button>
          </div>

          <button
            onClick={handleCopyFullText}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
        </div>
      </div>

      {/* Raw Document Paper Viewer */}
      <div className="bg-slate-100 rounded-xl p-4 sm:p-8 border border-slate-200 shadow-inner flex justify-center">
        <div 
          ref={containerRef}
          className={`w-full max-w-4xl bg-white rounded-lg border border-slate-300 shadow-md p-6 sm:p-12 font-serif ${fontSize} text-slate-800 selection:bg-amber-100 selection:text-amber-950 transition-all`}
        >
          {/* Header watermark */}
          <div className="text-center pb-6 mb-6 border-b border-slate-200">
            <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mb-1">
              Document Archive • Verified Text Representation
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {document.title}
            </h1>
            <div className="text-xs text-slate-500 font-sans mt-1">
              File: {document.fileName} • Jurisdiction: {document.metadata.governingLaw || 'General'}
            </div>
          </div>

          {/* Actual content with highlights */}
          {renderDocumentContent()}
        </div>
      </div>
    </div>
  );
};
