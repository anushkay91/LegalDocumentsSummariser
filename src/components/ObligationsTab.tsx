import React, { useState } from 'react';
import { LegalDocument, Obligation } from '../types';
import { 
  CheckSquare, 
  Square, 
  User, 
  Building2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface ObligationsTabProps {
  document: LegalDocument;
  onToggleObligation: (obligationId: string) => void;
  onHighlightClause: (textSnippet: string, sectionNumber?: string) => void;
}

export const ObligationsTab: React.FC<ObligationsTabProps> = ({
  document,
  onToggleObligation,
  onHighlightClause,
}) => {
  const [partyFilter, setPartyFilter] = useState<'all' | 'user' | 'counterparty'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'moderate' | 'standard'>('all');

  const filteredObligations = document.obligations.filter((ob) => {
    if (partyFilter !== 'all' && ob.party !== partyFilter) return false;
    if (severityFilter !== 'all' && ob.severity !== severityFilter) return false;
    return true;
  });

  const userObs = document.obligations.filter(o => o.party === 'user');
  const userCompleted = userObs.filter(o => o.completed).length;
  const completionPercentage = userObs.length > 0 ? Math.round((userCompleted / userObs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Progress Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-serif">
              Contractual Obligations Tracker
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified commitments and duties extracted directly from your document provisions.
            </p>
          </div>

          {/* Progress widget */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-w-[220px]">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Your Obligations Acknowledged</span>
              <span>{userCompleted} of {userObs.length} ({completionPercentage}%)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Party:
            </span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
              <button
                onClick={() => setPartyFilter('all')}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  partyFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                All Parties ({document.obligations.length})
              </button>
              <button
                onClick={() => setPartyFilter('user')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  partyFilter === 'user' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Your Obligations ({userObs.length})
              </button>
              <button
                onClick={() => setPartyFilter('counterparty')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  partyFilter === 'counterparty' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Counterparty ({document.obligations.filter(o => o.party === 'counterparty').length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">Severity:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
              {(['all', 'critical', 'moderate', 'standard'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                    severityFilter === sev ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Obligations Grid */}
      <div className="space-y-3">
        {filteredObligations.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No obligations match your current filter.</p>
          </div>
        ) : (
          filteredObligations.map((ob) => {
            const isUser = ob.party === 'user';
            const isCritical = ob.severity === 'critical';
            const isModerate = ob.severity === 'moderate';

            return (
              <div 
                key={ob.id}
                className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
                  ob.completed 
                    ? 'border-slate-200 bg-slate-50/50 opacity-80' 
                    : isCritical
                    ? 'border-rose-200/80 hover:border-rose-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox */}
                    <button
                      onClick={() => onToggleObligation(ob.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 focus:outline-none shrink-0 transition-colors"
                      title={ob.completed ? 'Mark as pending' : 'Mark as acknowledged/completed'}
                    >
                      {ob.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Party Badge */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isUser 
                            ? 'bg-blue-50 text-blue-800 border-blue-200' 
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}>
                          {isUser ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          {ob.partyName}
                        </span>

                        {/* Severity Badge */}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : isModerate
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {ob.severity}
                        </span>

                        {/* Frequency */}
                        <span className="text-[10px] text-slate-500 font-medium capitalize bg-slate-100 px-2 py-0.5 rounded">
                          {ob.frequency}
                        </span>

                        {/* Source Reference */}
                        <span className="text-xs font-mono text-slate-500">
                          {ob.sourceSection}
                        </span>
                      </div>

                      <h3 className={`text-sm font-bold text-slate-900 ${ob.completed ? 'line-through text-slate-500' : ''}`}>
                        {ob.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {ob.description}
                      </p>

                      {/* Verbatim quote snippet */}
                      <div className="mt-2 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-150 flex items-center justify-between gap-2">
                        <span className="italic truncate">"{ob.sourceQuote}"</span>
                        <button
                          onClick={() => onHighlightClause(ob.sourceQuote, ob.sourceSection)}
                          className="shrink-0 text-emerald-700 hover:text-emerald-900 font-sans font-semibold text-[11px] flex items-center gap-0.5"
                        >
                          <span>Locate</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
