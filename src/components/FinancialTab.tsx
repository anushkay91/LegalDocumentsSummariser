import React from 'react';
import { LegalDocument, FinancialCommitment } from '../types';
import { 
  DollarSign, 
  Scale, 
  TrendingUp, 
  AlertOctagon, 
  ExternalLink,
  CreditCard,
  Lock
} from 'lucide-react';

interface FinancialTabProps {
  document: LegalDocument;
  onHighlightClause: (textSnippet: string, sectionNumber?: string) => void;
}

export const FinancialTab: React.FC<FinancialTabProps> = ({
  document,
  onHighlightClause,
}) => {
  const commitments = document.financialCommitments || [];

  const getTypeIcon = (type: FinancialCommitment['type']) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'deposit':
        return <Lock className="w-4 h-4 text-blue-600" />;
      case 'penalty':
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      case 'escalation':
        return <TrendingUp className="w-4 h-4 text-amber-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeBadge = (type: FinancialCommitment['type']) => {
    switch (type) {
      case 'payment':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'deposit':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'penalty':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'escalation':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-600" />
          <span>Financial Commitments & Exposure Breakdown</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Detailed catalog of regular payments, deposits, penalties, late charges, and escalation formulas identified in the agreement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {commitments.length === 0 ? (
          <div className="col-span-2 bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No explicit financial commitments logged for this document.</p>
          </div>
        ) : (
          commitments.map((fin) => (
            <div 
              key={fin.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getTypeBadge(fin.type)}`}>
                    {getTypeIcon(fin.type)}
                    {fin.type}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{fin.sourceSection}</span>
                </div>

                <div>
                  <div className="text-xl font-bold text-slate-900 font-mono">
                    {fin.amount}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">
                    Schedule: {fin.schedule}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {fin.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-200/60">
                  <span className="italic truncate">"{fin.sourceQuote}"</span>
                  <button
                    onClick={() => onHighlightClause(fin.sourceQuote, fin.sourceSection)}
                    className="shrink-0 text-emerald-700 hover:text-emerald-900 font-sans font-semibold text-[11px] flex items-center gap-0.5"
                  >
                    <span>Locate</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
