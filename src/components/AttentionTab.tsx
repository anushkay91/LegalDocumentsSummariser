import React, { useState } from 'react';
import { 
  LegalDocument, 
  AttentionItem, 
  Inconsistency 
} from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Scale, 
  ExternalLink, 
  Filter, 
  Check, 
  Bookmark, 
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AttentionTabProps {
  document: LegalDocument;
  onUpdateAttentionStatus: (itemId: string, status: 'unreviewed' | 'reviewed' | 'discuss_with_counsel') => void;
  onHighlightClause: (textSnippet: string, sectionNumber?: string) => void;
}

export const AttentionTab: React.FC<AttentionTabProps> = ({
  document,
  onUpdateAttentionStatus,
  onHighlightClause,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unreviewed' | 'discuss_with_counsel' | 'reviewed'>('all');

  const filteredItems = document.attentionItems.filter((item) => {
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  const highCount = document.attentionItems.filter(i => i.priority === 'high').length;
  const discussCount = document.attentionItems.filter(i => i.status === 'discuss_with_counsel').length;

  return (
    <div className="space-y-6">
      {/* Banner / Principles Reminder */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-amber-900 font-serif">
              Document Attention & Review-Priority Analysis
            </h2>
            <p className="text-xs text-amber-800 leading-relaxed">
              These items were automatically surfaced because they contain unusual obligations, asymmetric rights, strict deadlines, or provisions where legal advice or counterparty clarification is typically beneficial. <em>LegalLens does not evaluate enforceability or legal validity.</em>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Priority:
          </span>
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            {(['all', 'high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  priorityFilter === p
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p} {p === 'high' && `(${highCount})`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Review Status:</span>
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            {(['all', 'unreviewed', 'discuss_with_counsel', 'reviewed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'discuss_with_counsel' ? 'For Counsel' : s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attention Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No attention items match your filter criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the priority or review status filter above.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isHigh = item.priority === 'high';
            const isMed = item.priority === 'medium';
            const priorityBadge = isHigh
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : isMed
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div 
                key={item.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                  isHigh 
                    ? 'border-rose-200 hover:border-rose-300' 
                    : isMed
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                        {item.priority} Priority
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {item.sourceSection} {item.pageNumber ? `(Page ${item.pageNumber})` : ''}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-serif">
                      {item.headline}
                    </h3>
                  </div>

                  {/* Status Selection Pill */}
                  <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => onUpdateAttentionStatus(item.id, 'unreviewed')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        item.status === 'unreviewed'
                          ? 'bg-slate-700 text-white font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Mark as unreviewed"
                    >
                      Unreviewed
                    </button>
                    <button
                      onClick={() => onUpdateAttentionStatus(item.id, 'discuss_with_counsel')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        item.status === 'discuss_with_counsel'
                          ? 'bg-amber-600 text-white font-semibold'
                          : 'text-amber-800 hover:text-amber-950'
                      }`}
                      title="Flag for discussion with legal professional"
                    >
                      Discuss with Counsel
                    </button>
                    <button
                      onClick={() => onUpdateAttentionStatus(item.id, 'reviewed')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        item.status === 'reviewed'
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Mark as reviewed and acknowledged"
                    >
                      Reviewed
                    </button>
                  </div>
                </div>

                {/* Why Attention */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Why this item may deserve your attention:</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4 border-l-2 border-slate-200">
                    {item.whyAttention}
                  </p>
                </div>

                {/* Verbatim Quote Box */}
                <div className="mb-4 bg-slate-50 rounded-lg p-3 border border-slate-200/80">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                    <span>Verbatim Document Language:</span>
                    <button
                      onClick={() => onHighlightClause(item.verbatimQuote, item.sourceSection)}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span>Locate in Raw Text</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="font-mono text-xs text-slate-800 italic leading-relaxed">
                    "{item.verbatimQuote}"
                  </p>
                </div>

                {/* Suggested Questions for Counterparty or Counsel */}
                {item.suggestedQuestions && item.suggestedQuestions.length > 0 && (
                  <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                    <div className="text-xs font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Suggested questions to clarify or discuss:</span>
                    </div>
                    <ul className="space-y-1 pl-5 list-disc text-xs text-emerald-900">
                      {item.suggestedQuestions.map((q, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cross-Clause Inconsistencies Card */}
      {document.inconsistencies && document.inconsistencies.length > 0 && (
        <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-xs mt-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Identified Inconsistencies & Cross-Clause Contradictions ({document.inconsistencies.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Provisions within this document that appear contradictory, ambiguous, or in tension with one another.
          </p>

          <div className="space-y-4">
            {document.inconsistencies.map((inc) => (
              <div key={inc.id} className="p-4 rounded-lg bg-purple-50/50 border border-purple-200/80">
                <h4 className="text-sm font-bold text-purple-950 mb-1">{inc.title}</h4>
                <p className="text-xs text-slate-700 mb-3">{inc.description}</p>

                {/* Conflicting Sections Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {inc.conflictingSections.map((cs, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border border-purple-200 text-xs">
                      <div className="font-semibold text-purple-900 mb-1 font-mono">{cs.section}:</div>
                      <p className="font-mono text-[11px] text-slate-700 italic">"{cs.quote}"</p>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-purple-900 font-medium">
                  <strong>Notes to discuss:</strong> {inc.notesForDiscussion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
