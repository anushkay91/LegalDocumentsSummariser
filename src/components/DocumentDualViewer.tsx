import React, { useState, useEffect, useRef } from 'react';
import { LegalDocument, ExtractedSection } from '../types';
import { 
  Search, 
  Copy, 
  Check, 
  BookOpen, 
  FileText, 
  Printer, 
  Trash2, 
  List, 
  Eye, 
  Info, 
  X, 
  ChevronRight, 
  ArrowUp,
  Layers,
  Split,
  Users,
  Scale,
  Calendar,
  Clock,
  ShieldAlert,
  Sparkles,
  Plus,
  ArrowRight,
  ExternalLink,
  HelpCircle
} from 'lucide-react';

interface DocumentDualViewerProps {
  document: LegalDocument;
  documents?: LegalDocument[];
  onSelectDoc?: (doc: LegalDocument) => void;
  highlightedText: string | null;
  highlightedSection: string | null;
  onClearHighlight: () => void;
  onHighlightClause?: (textSnippet: string, sectionNumber?: string) => void;
  onRequestDelete?: () => void;
  onOpenUpload?: () => void;
}

export const DocumentDualViewer: React.FC<DocumentDualViewerProps> = ({
  document,
  documents = [],
  onSelectDoc,
  highlightedText,
  highlightedSection,
  onClearHighlight,
  onHighlightClause,
  onRequestDelete,
  onOpenUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'text-sm' | 'text-base' | 'text-lg'>('text-base');
  const [showTableOfContents, setShowTableOfContents] = useState(true);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [viewMode, setViewMode] = useState<'reader' | 'complete' | 'split'>('reader');
  const [hoveredSection, setHoveredSection] = useState<ExtractedSection | null>(null);
  const [selectedClauseDetail, setSelectedClauseDetail] = useState<ExtractedSection | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to highlight when highlightedText changes
  useEffect(() => {
    if (highlightedText) {
      setTimeout(() => {
        const activeContainer = viewMode === 'split' ? splitContainerRef.current : containerRef.current;
        const highlightElem = activeContainer?.querySelector('.legal-active-highlight');
        if (highlightElem) {
          highlightElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [highlightedText, viewMode]);

  const handleCopyFullText = () => {
    navigator.clipboard.writeText(document.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to and highlight a specific clause in the document
  const scrollToSection = (sec: ExtractedSection) => {
    if (onHighlightClause && sec.verbatimQuote) {
      onHighlightClause(sec.verbatimQuote, sec.sectionNumber);
    }
    setSelectedClauseDetail(sec);

    const activeContainer = viewMode === 'split' ? splitContainerRef.current : containerRef.current;
    if (!activeContainer) return;

    // Search by exact section marker ID or section number or keywords
    const directElement = activeContainer.querySelector<HTMLElement>(`#sec-item-${sec.id}`);
    if (directElement) {
      directElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const markers = activeContainer.querySelectorAll<HTMLElement>('[data-section-marker]');
    for (let i = 0; i < markers.length; i++) {
      const el = markers[i];
      const text = el.textContent?.toLowerCase() || '';
      if (
        (sec.sectionNumber && text.includes(sec.sectionNumber.toLowerCase())) ||
        (sec.title && text.includes(sec.title.toLowerCase().slice(0, 20)))
      ) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
  };

  // Extract navigation sections for easy jumping
  const sectionsList: ExtractedSection[] = document.extractedSections && document.extractedSections.length > 0
    ? document.extractedSections
    : [
        { 
          id: 'sec-all', 
          sectionNumber: '1', 
          title: 'Entire Agreement Text', 
          verbatimQuote: document.rawText.slice(0, 150),
          plainEnglish: 'The complete unedited contract text as drafted.'
        }
      ];

  // Count search matches
  const matchCount = searchQuery.trim().length > 1
    ? (document.rawText.match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    : 0;

  // Render raw document text with dynamic highlighting and section anchors
  const renderDocumentContent = (isSplit = false) => {
    const raw = document.rawText;
    const lines = raw.split('\n');

    return (
      <div className="space-y-3 font-serif leading-relaxed text-slate-900">
        {lines.map((line, idx) => {
          const isSectionHeader = /^(SECTION|ARTICLE|CLAUSE|\d+\.\d+)/i.test(line.trim());
          
          // Check if this line corresponds to any extracted section
          const matchingSec = sectionsList.find(s => {
            if (s.sectionNumber && line.trim().startsWith(s.sectionNumber)) return true;
            if (s.title && line.toLowerCase().includes(s.title.toLowerCase().slice(0, 25))) return true;
            if (s.verbatimQuote && line.toLowerCase().includes(s.verbatimQuote.toLowerCase().slice(0, 30))) return true;
            return false;
          });

          const isHoveredMatch = hoveredSection && matchingSec && hoveredSection.id === matchingSec.id;
          const isHighlightMatch = highlightedText && line.toLowerCase().includes(highlightedText.toLowerCase().slice(0, 30));

          let lineContent: React.ReactNode = line;

          if (highlightedText && highlightedText.length > 5) {
            const cleanQuery = highlightedText.trim();
            const lowerLine = line.toLowerCase();
            const lowerQuery = cleanQuery.toLowerCase();
            const pos = lowerLine.indexOf(lowerQuery.slice(0, 40));

            if (pos !== -1) {
              lineContent = (
                <mark className="legal-active-highlight bg-amber-200 text-amber-950 font-semibold px-1 py-0.5 rounded-xs ring-2 ring-amber-400 shadow-xs">
                  {line}
                </mark>
              );
            }
          } else if (searchQuery.trim().length > 1) {
            const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            const parts = line.split(regex);
            lineContent = parts.map((part, pIdx) => 
              regex.test(part) ? (
                <mark key={pIdx} className="bg-yellow-200 text-yellow-950 px-1 rounded-xs font-semibold">
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
                data-section-marker="true"
                id={matchingSec ? `sec-item-${matchingSec.id}` : `doc-section-${idx}`}
                className={`pt-5 pb-2 font-serif font-bold text-base sm:text-lg text-slate-950 border-b border-slate-300 transition-colors ${
                  isHighlightMatch 
                    ? 'bg-amber-100/90 text-amber-950 px-3 py-2 rounded-lg' 
                    : isHoveredMatch 
                      ? 'bg-emerald-50 text-emerald-950 px-3 py-2 rounded-lg border-emerald-400' 
                      : ''
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
              id={matchingSec ? `sec-item-${matchingSec.id}` : undefined}
              className={`transition-all ${
                isHighlightMatch 
                  ? 'legal-active-highlight bg-amber-50 text-amber-950 p-3 rounded-lg border-l-4 border-amber-500 font-medium shadow-xs' 
                  : isHoveredMatch
                    ? 'bg-emerald-50 text-emerald-950 p-2.5 rounded-lg border-l-4 border-emerald-500 font-medium ring-1 ring-emerald-300'
                    : 'text-slate-800'
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
    <div className="space-y-5" role="region" aria-label="Original Legal Document Reader & Complete View">
      {/* 1. Complete View of Workspace Documents Strip */}
      {documents.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                All Documents in Workspace ({documents.length}):
              </span>
            </div>

            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Another Document</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pt-2.5 pb-1 scrollbar-thin">
            {documents.map((doc) => {
              const isActive = doc.id === document.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => onSelectDoc && onSelectDoc(doc)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all text-left shrink-0 ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs ring-1 ring-emerald-500/30'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                  title={`Switch view to ${doc.title}`}
                >
                  <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-semibold truncate max-w-[180px] sm:max-w-[220px]">
                      {doc.title}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize flex items-center gap-1.5">
                      <span>{doc.category}</span>
                      <span>•</span>
                      <span>{doc.extractedSections?.length || 0} clauses</span>
                      {isActive && (
                        <span className="ml-1 text-emerald-700 font-bold">• Active</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Top Purpose Header & View Mode Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                  Document Reader & Complete Analysis
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {document.category.toUpperCase()}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  ({sectionsList.length} clauses detected)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Review the full unedited agreement. Hover over any clause in the table of contents to preview its plain-English meaning and verbatim text, or switch between view modes below.
              </p>
            </div>
          </div>

          {/* View Mode Switcher: Reader vs Complete View vs Split Companion */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs items-center gap-1" role="tablist" aria-label="Viewer layout modes">
              <button
                role="tab"
                aria-selected={viewMode === 'reader'}
                onClick={() => setViewMode('reader')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'reader'
                    ? 'bg-white shadow-xs text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Full Reader</span>
              </button>

              <button
                role="tab"
                aria-selected={viewMode === 'complete'}
                onClick={() => setViewMode('complete')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'complete'
                    ? 'bg-white shadow-xs text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Complete view of all clauses, summaries, and parties"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Complete View</span>
              </button>

              <button
                role="tab"
                aria-selected={viewMode === 'split'}
                onClick={() => setViewMode('split')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'split'
                    ? 'bg-white shadow-xs text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Split view with original text and plain-English translation side by side"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Split Companion</span>
              </button>
            </div>

            <button
              onClick={() => setShowHelpGuide(!showHelpGuide)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
              aria-expanded={showHelpGuide}
            >
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>{showHelpGuide ? 'Hide Guide' : 'How It Works'}</span>
            </button>

            {onRequestDelete && (
              <button
                id="delete-doc-viewer-btn"
                onClick={onRequestDelete}
                title="Permanently remove this document from database"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-colors focus:ring-2 focus:ring-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Delete Document</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Friendly Help Guide */}
        {showHelpGuide && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Hover Over Any Clause</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Hovering over any item in "Jump to Section" immediately reveals a preview card with plain-English meaning and verbatim text.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Complete Document View</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Click "Complete View" to see every clause side-by-side with its plain-English translation, key parties, and governing law in one comprehensive layout.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                <span>One-Click Verification</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Clicking any clause in the list smoothly jumps directly to that line in the contract and highlights it for review.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Controls Toolbar (Search, Sizing, Actions) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search within document */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search keywords or clause names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search within document text"
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchQuery.trim().length > 1 && (
            <span className="text-[11px] font-semibold text-slate-600 shrink-0 bg-slate-100 px-2 py-1 rounded-md">
              {matchCount} match{matchCount === 1 ? '' : 'es'}
            </span>
          )}
        </div>

        {/* Highlight notification badge */}
        {highlightedText && (
          <div className="flex items-center gap-2 bg-amber-100 text-amber-950 text-xs px-3 py-1.5 rounded-lg border border-amber-300 font-medium">
            <span className="font-semibold">Viewing Highlighted Clause</span>
            {highlightedSection && <span className="text-amber-800">({highlightedSection})</span>}
            <button
              onClick={onClearHighlight}
              className="ml-1 text-amber-950 font-bold hover:underline text-[11px] underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Controls: Table of Contents toggle, font size, copy, print */}
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'reader' && (
            <button
              onClick={() => setShowTableOfContents(!showTableOfContents)}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                showTableOfContents 
                  ? 'bg-slate-100 text-slate-900 border-slate-300' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <List className="w-3.5 h-3.5 text-slate-600" />
              <span>Clauses List</span>
            </button>
          )}

          {/* Accessible font size selector */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs items-center" role="group" aria-label="Text size">
            <button
              onClick={() => setFontSize('text-sm')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                fontSize === 'text-sm' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setFontSize('text-base')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                fontSize === 'text-base' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Large
            </button>
            <button
              onClick={() => setFontSize('text-lg')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                fontSize === 'text-lg' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Extra Large
            </button>
          </div>

          <button
            onClick={handleCopyFullText}
            aria-label="Copy full text to clipboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handlePrint}
            aria-label="Print or save as PDF"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA BASED ON ACTIVE VIEW MODE */}

      {/* MODE A: FULL READER WITH HOVER PREVIEWS */}
      {viewMode === 'reader' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Table of Contents / Section Jumper Sidebar */}
          {showTableOfContents && (
            <div className="md:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs p-4 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <List className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Jump to Section</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {sectionsList.length} clauses
                </span>
              </div>

              {/* Notice explaining hover */}
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Hover over any clause below to preview its plain-English meaning.</span>
              </div>

              {/* Sections List with Interactive Hover Cards */}
              <div className="space-y-1.5 relative">
                {sectionsList.map((sec, sIdx) => {
                  const isHovered = hoveredSection?.id === sec.id;
                  const isSelected = selectedClauseDetail?.id === sec.id;

                  return (
                    <div 
                      key={sec.id || sIdx}
                      className="relative group"
                      onMouseEnter={() => setHoveredSection(sec)}
                      onMouseLeave={() => setHoveredSection(null)}
                      onFocus={() => setHoveredSection(sec)}
                      onBlur={() => setHoveredSection(null)}
                    >
                      <button
                        onClick={() => scrollToSection(sec)}
                        className={`w-full text-left px-2.5 py-2.5 rounded-lg text-xs transition-all flex items-start gap-2 border ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                            : isHovered
                              ? 'bg-slate-100 border-slate-300 text-slate-950 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-transparent text-slate-700'
                        }`}
                        title={`${sec.sectionNumber ? `Section ${sec.sectionNumber}: ` : ''}${sec.title} - ${sec.plainEnglish || 'Click to jump to this clause'}`}
                      >
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-colors ${
                          isHovered ? 'text-emerald-600' : 'text-slate-400'
                        }`} />
                        <div className="truncate flex-1">
                          <div className="font-semibold text-slate-900 truncate">
                            {sec.sectionNumber ? `Sec ${sec.sectionNumber}: ` : ''}{sec.title}
                          </div>
                          {sec.plainEnglish && (
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {sec.plainEnglish}
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Desktop Floating Hover Preview Card (Fixed / Anchored to Item) */}
                      {isHovered && (
                        <div 
                          className="hidden lg:block absolute left-full top-0 ml-3 w-80 bg-white rounded-xl border border-slate-300 shadow-xl p-3.5 z-40 animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
                          role="tooltip"
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {sec.category || 'Contract Clause'}
                            </span>
                            {sec.sectionNumber && (
                              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                                Section {sec.sectionNumber}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 font-serif leading-snug mb-1.5">
                            {sec.title}
                          </h4>

                          {sec.plainEnglish && (
                            <div className="mb-2 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-700 leading-relaxed">
                              <span className="font-bold text-slate-900 block mb-0.5">Plain-English Meaning:</span>
                              {sec.plainEnglish}
                            </div>
                          )}

                          {sec.verbatimQuote && (
                            <div className="text-[10px] text-slate-500 italic border-l-2 border-slate-300 pl-2 line-clamp-3">
                              "{sec.verbatimQuote}"
                            </div>
                          )}

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-emerald-700 font-semibold">
                            <span>Click to jump in document</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active / Hovered Clause Preview Box (Always visible at bottom of sidebar on mobile & desktop) */}
              {(hoveredSection || selectedClauseDetail) && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 mt-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-emerald-900 uppercase">
                      {hoveredSection ? 'Hovered Clause Preview' : 'Selected Clause'}
                    </span>
                    <span className="text-emerald-700 font-medium">
                      {(hoveredSection || selectedClauseDetail)?.sectionNumber ? `Sec ${(hoveredSection || selectedClauseDetail)?.sectionNumber}` : ''}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-serif">
                    {(hoveredSection || selectedClauseDetail)?.title}
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {(hoveredSection || selectedClauseDetail)?.plainEnglish}
                  </p>
                  <button
                    onClick={() => scrollToSection(hoveredSection || selectedClauseDetail!)}
                    className="w-full mt-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 shadow-xs transition-colors"
                  >
                    <span>Jump & Highlight in Text</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                onClick={scrollToTop}
                className="pt-3 w-full border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Scroll to Top</span>
              </button>
            </div>
          )}

          {/* Clean Paper Document Viewer */}
          <div className={`${showTableOfContents ? 'md:col-span-3' : 'md:col-span-4'} flex justify-center`}>
            <div 
              ref={containerRef}
              tabIndex={0}
              aria-label="Document text representation"
              className={`w-full bg-white rounded-xl border border-slate-300 shadow-sm p-6 sm:p-12 ${fontSize} selection:bg-amber-200 selection:text-amber-950 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
            >
              {/* Document Title Header */}
              <div className="text-center pb-6 mb-8 border-b border-slate-200">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 uppercase tracking-wider mb-2">
                  {document.category} Agreement
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-serif">
                  {document.title}
                </h2>
                <div className="text-xs text-slate-600 font-sans mt-2 flex items-center justify-center gap-3 flex-wrap">
                  <span>File: {document.fileName}</span>
                  <span>•</span>
                  <span>Governing Law: {document.metadata.governingLaw || 'Standard Jurisdiction'}</span>
                  <span>•</span>
                  <span>Effective Date: {document.metadata.effectiveDate || 'As specified'}</span>
                </div>
              </div>

              {/* Document Content */}
              {renderDocumentContent()}
            </div>
          </div>
        </div>
      )}

      {/* MODE B: COMPLETE VIEW OF DOCUMENTS & INTELLIGENCE MAP */}
      {viewMode === 'complete' && (
        <div className="space-y-6">
          {/* Document Summary Card & Parties Overview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
                  Complete Document Overview & Clause Directory
                </h2>
                <p className="text-xs text-slate-500">
                  Full intelligence map of {document.title} with verified clauses and plain-English translations
                </p>
              </div>
              <button
                onClick={() => setViewMode('reader')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>Switch to Paper Reader</span>
              </button>
            </div>

            {/* Document Vital Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
              <div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Key Parties</span>
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {document.metadata.parties?.map(p => p.name).join(' & ') || 'Identified in agreement'}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
                  <Scale className="w-3.5 h-3.5 text-slate-400" />
                  <span>Governing Law</span>
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {document.metadata.governingLaw || 'Standard jurisdiction'}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Effective Dates</span>
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {document.metadata.effectiveDate || 'N/A'} {document.metadata.expirationDate ? `to ${document.metadata.expirationDate}` : ''}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
                  <List className="w-3.5 h-3.5 text-slate-400" />
                  <span>Total Clauses</span>
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {sectionsList.length} clauses cataloged
                </div>
              </div>
            </div>

            {/* Complete Plain-English Executive Summary */}
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 mb-6">
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Executive Plain-English Summary</span>
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {document.metadata.summary}
              </p>
            </div>

            {/* Complete Clause-by-Clause Translation Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                All Extracted Clauses & Plain-English Translations
              </h3>
              
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {sectionsList.map((sec, idx) => (
                  <div key={sec.id || idx} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                            {sec.category || 'General'}
                          </span>
                          {sec.sectionNumber && (
                            <span className="text-xs font-mono font-semibold text-emerald-800">
                              Section {sec.sectionNumber}
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-slate-900 font-serif">
                            {sec.title}
                          </h4>
                        </div>

                        {/* Plain English Translation */}
                        {sec.plainEnglish && (
                          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 text-xs text-emerald-950 leading-relaxed">
                            <span className="font-bold text-emerald-900 block mb-0.5">Plain-English Meaning:</span>
                            {sec.plainEnglish}
                          </div>
                        )}

                        {/* Original Contract Excerpt */}
                        {sec.verbatimQuote && (
                          <div className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-serif">
                            <span className="font-sans font-semibold text-[10px] text-slate-400 uppercase tracking-wider block not-italic mb-1">
                              Original Contract Language:
                            </span>
                            "{sec.verbatimQuote}"
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setViewMode('reader');
                          setTimeout(() => scrollToSection(sec), 100);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-xs font-semibold text-slate-700 hover:text-emerald-800 shrink-0 self-start transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View in Paper</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE C: SPLIT COMPANION VIEW */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Original Contract Paper */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 max-h-[calc(100vh-140px)] overflow-y-auto" ref={splitContainerRef}>
            <div className="pb-3 mb-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Original Agreement Text</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {document.fileName}
              </span>
            </div>
            {renderDocumentContent(true)}
          </div>

          {/* Right: Interactive Clause Companion */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-h-[calc(100vh-140px)] overflow-y-auto space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Plain-English Clause Companion
                </h3>
                <p className="text-[11px] text-slate-500">
                  Click any clause to locate it in the document
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {sectionsList.length} Clauses
              </span>
            </div>

            <div className="space-y-3">
              {sectionsList.map((sec, idx) => (
                <div 
                  key={sec.id || idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 font-serif">
                      {sec.sectionNumber ? `Sec ${sec.sectionNumber}: ` : ''}{sec.title}
                    </span>
                    <button
                      onClick={() => scrollToSection(sec)}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-emerald-300 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shadow-2xs"
                    >
                      <span>Highlight</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {sec.plainEnglish && (
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {sec.plainEnglish}
                    </p>
                  )}

                  {sec.verbatimQuote && (
                    <div className="text-[11px] text-slate-500 italic border-l-2 border-slate-300 pl-2 line-clamp-2">
                      "{sec.verbatimQuote}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
