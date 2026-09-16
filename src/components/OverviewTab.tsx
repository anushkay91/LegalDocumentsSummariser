import React from 'react';
import { 
  LegalDocument, 
  ExtractedSection 
} from '../types';
import { 
  FileText, 
  Users, 
  Globe, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Scale, 
  BookOpen,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface OverviewTabProps {
  document: LegalDocument;
  onNavigateTab: (tab: 'attention' | 'obligations' | 'deadlines' | 'financial' | 'chat' | 'viewer') => void;
  onHighlightClause: (textSnippet: string, sectionNumber?: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  document,
  onNavigateTab,
  onHighlightClause,
}) => {
  const highAttentionCount = document.attentionItems.filter(a => a.priority === 'high').length;
  const totalAttentionCount = document.attentionItems.length;
  const userObligations = document.obligations.filter(o => o.party === 'user').length;
  const counterpartyObligations = document.obligations.filter(o => o.party === 'counterparty').length;
  const urgentDeadlines = document.deadlines.filter(d => d.urgency === 'urgent').length;
  const inconsistencyCount = document.inconsistencies.length;

  return (
    <div className="space-y-6">
      {/* Top Document Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                {document.category} Agreement
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {document.fileName}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">
                Last Analyzed: {new Date(document.lastAnalyzed).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif">
              {document.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
              {document.metadata.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start">
            <button
              id="start-chat-btn"
              onClick={() => onNavigateTab('chat')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span>Ask Document Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Contractual Vital Signals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Parties Identified</span>
            </div>
            <div className="space-y-1">
              {document.metadata.parties.map((party, idx) => (
                <div key={idx} className="text-xs font-medium text-slate-800 truncate" title={`${party.name} (${party.role})`}>
                  {party.name} <span className="text-[10px] text-slate-500 font-normal">({party.role})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Term & Effective Date</span>
            </div>
            <div className="text-xs font-semibold text-slate-800">
              {document.metadata.effectiveDate || 'Not explicitly stated'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={document.metadata.termLength}>
              {document.metadata.termLength || 'Indefinite'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Governing Law</span>
            </div>
            <div className="text-xs font-semibold text-slate-800 truncate" title={document.metadata.governingLaw}>
              {document.metadata.governingLaw || 'General Jurisdiction'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={document.metadata.jurisdiction}>
              Venue: {document.metadata.jurisdiction || 'Unspecified'}
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/60">
            <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Review Priority</span>
            </div>
            <div className="text-base font-bold text-amber-900">
              {highAttentionCount} High Priority
            </div>
            <div className="text-[11px] text-amber-700">
              {totalAttentionCount} total attention items
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attention Priority Card */}
        <div 
          onClick={() => onNavigateTab('attention')}
          className="bg-white p-5 rounded-xl border border-amber-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Attention Areas</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalAttentionCount}</div>
          <p className="text-xs text-slate-500 mt-1">
            {highAttentionCount} item{highAttentionCount === 1 ? '' : 's'} may warrant counsel discussion
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-amber-700 group-hover:text-amber-800">
            <span>Explore Review Items</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Obligations Card */}
        <div 
          onClick={() => onNavigateTab('obligations')}
          className="bg-white p-5 rounded-xl border border-blue-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">Your Obligations</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{userObligations}</div>
          <p className="text-xs text-slate-500 mt-1">
            Plus {counterpartyObligations} counterparty commitments
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-blue-700 group-hover:text-blue-800">
            <span>Track Obligations</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Deadlines Card */}
        <div 
          onClick={() => onNavigateTab('deadlines')}
          className="bg-white p-5 rounded-xl border border-rose-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">Key Deadlines</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{document.deadlines.length}</div>
          <p className="text-xs text-slate-500 mt-1">
            {urgentDeadlines} time-critical triggers identified
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-rose-700 group-hover:text-rose-800">
            <span>View Timeline</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Inconsistencies Card */}
        <div 
          onClick={() => onNavigateTab('attention')}
          className="bg-white p-5 rounded-xl border border-purple-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-800">Clause Conflicts</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{inconsistencyCount}</div>
          <p className="text-xs text-slate-500 mt-1">
            Cross-clause tensions identified
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-purple-700 group-hover:text-purple-800">
            <span>Inspect Conflicts</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Extracted Core Clauses Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-serif">Extracted Key Sections & Plain-English Synthesis</h2>
            <p className="text-xs text-slate-500">Key clauses automatically segmented with verbatim source grounding</p>
          </div>
          <button
            onClick={() => onNavigateTab('viewer')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Open in Dual-Pane Viewer</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {document.extractedSections.map((sec) => (
            <div 
              key={sec.id}
              className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {sec.sectionNumber}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">{sec.title}</h3>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  {sec.category}
                </span>
              </div>

              {/* Plain English Translation */}
              <div className="mb-2">
                <div className="text-xs font-semibold text-slate-700 mb-0.5">Plain-English Understanding:</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {sec.plainEnglish}
                </p>
              </div>

              {/* Verbatim Quote Quote Box */}
              <div className="p-2.5 rounded bg-amber-50/60 border-l-2 border-amber-400 text-xs font-mono text-slate-700 leading-relaxed flex items-start justify-between gap-3">
                <p className="italic line-clamp-2">
                  "{sec.verbatimQuote}"
                </p>
                <button
                  onClick={() => onHighlightClause(sec.verbatimQuote, sec.sectionNumber)}
                  className="shrink-0 text-[11px] font-sans font-medium text-amber-800 hover:text-amber-950 underline flex items-center gap-0.5"
                  title="Highlight and view in context"
                >
                  <span>Locate</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
