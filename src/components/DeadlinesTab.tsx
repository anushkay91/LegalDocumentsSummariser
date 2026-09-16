import React, { useState } from 'react';
import { LegalDocument, Deadline } from '../types';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Copy, 
  ExternalLink,
  Check,
  CalendarCheck
} from 'lucide-react';

interface DeadlinesTabProps {
  document: LegalDocument;
  onToggleDeadline: (deadlineId: string) => void;
  onHighlightClause: (textSnippet: string, sectionNumber?: string) => void;
}

export const DeadlinesTab: React.FC<DeadlinesTabProps> = ({
  document,
  onToggleDeadline,
  onHighlightClause,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate .ics calendar file for single deadline
  const handleDownloadIcs = (deadline: Deadline) => {
    let startDate = new Date();
    // Try parsing dueDate as valid date
    const parsed = Date.parse(deadline.dueDate);
    if (!isNaN(parsed)) {
      startDate = new Date(parsed);
    } else {
      // Default to 14 days from now if relative string
      startDate.setDate(startDate.getDate() + 14);
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const startStr = `${startDate.getUTCFullYear()}${pad(startDate.getUTCMonth() + 1)}${pad(startDate.getUTCDate())}T090000Z`;
    const endStr = `${startDate.getUTCFullYear()}${pad(startDate.getUTCMonth() + 1)}${pad(startDate.getUTCDate())}T100000Z`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LegalLens//Personal Document Intelligence//EN',
      'BEGIN:VEVENT',
      `UID:legallens-${deadline.id}-${Date.now()}@legallens.app`,
      `DTSTAMP:${startStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:LegalLens Deadline: ${deadline.title}`,
      `DESCRIPTION:Action Required: ${deadline.actionRequired}\\nConsequence if missed: ${deadline.consequenceIfMissed}\\nSource: ${deadline.sourceSection} in ${document.title}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `deadline-${deadline.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyReminder = (deadline: Deadline) => {
    const text = `[LegalLens Reminder] ${deadline.title}\nDue: ${deadline.dueDate}\nAction Required: ${deadline.actionRequired}\nConsequence if missed: ${deadline.consequenceIfMissed}\nFrom document: ${document.title} (${deadline.sourceSection})`;
    navigator.clipboard.writeText(text);
    setCopiedId(deadline.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-600" />
            <span>Deadlines & Notice Windows</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Crucial notice dates, renewal cutoffs, and performance triggers identified from your document provisions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
            {document.deadlines.filter(d => d.urgency === 'urgent').length} Urgent
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            {document.deadlines.filter(d => d.urgency === 'upcoming').length} Upcoming
          </span>
        </div>
      </div>

      {/* Deadlines Timeline */}
      <div className="space-y-4">
        {document.deadlines.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No specific deadlines detected in this document.</p>
          </div>
        ) : (
          document.deadlines.map((dl, idx) => {
            const isUrgent = dl.urgency === 'urgent';
            const isUpcoming = dl.urgency === 'upcoming';
            const urgencyBadge = isUrgent
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : isUpcoming
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div
                key={dl.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition-all relative overflow-hidden ${
                  dl.completed
                    ? 'border-slate-200 bg-slate-50/60 opacity-80'
                    : isUrgent
                    ? 'border-rose-300 hover:border-rose-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left urgency colored stripe */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isUrgent ? 'bg-rose-500' : isUpcoming ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                />

                <div className="pl-2 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${urgencyBadge}`}>
                          {dl.urgency}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {dl.sourceSection}
                        </span>
                        {dl.isRelative && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                            Relative Trigger
                          </span>
                        )}
                      </div>

                      <h3 className={`text-base font-bold text-slate-900 font-serif ${dl.completed ? 'line-through text-slate-500' : ''}`}>
                        {dl.title}
                      </h3>
                    </div>

                    {/* Date Callout Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-right shrink-0">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Due / Target Date</div>
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        {dl.dueDate}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Consequences Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                      <div className="text-xs font-semibold text-slate-700 mb-1">
                        Action Required:
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {dl.actionRequired}
                      </p>
                    </div>

                    <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200/60">
                      <div className="text-xs font-semibold text-rose-900 mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Consequence if Missed:</span>
                      </div>
                      <p className="text-xs text-rose-800 leading-relaxed">
                        {dl.consequenceIfMissed}
                      </p>
                    </div>
                  </div>

                  {/* Verbatim quote */}
                  <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200/60 flex items-center justify-between gap-3">
                    <span className="italic truncate">"{dl.sourceQuote}"</span>
                    <button
                      onClick={() => onHighlightClause(dl.sourceQuote, dl.sourceSection)}
                      className="shrink-0 text-emerald-700 hover:text-emerald-900 font-sans font-semibold text-[11px] flex items-center gap-0.5"
                    >
                      <span>Locate</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                    <button
                      onClick={() => onToggleDeadline(dl.id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                        dl.completed
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {dl.completed ? '✓ Acknowledged' : 'Mark as Acknowledged'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyReminder(dl)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50"
                      >
                        {copiedId === dl.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === dl.id ? 'Copied' : 'Copy Reminder'}</span>
                      </button>

                      <button
                        onClick={() => handleDownloadIcs(dl)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50"
                        title="Download .ics event to import into Apple, Google, or Outlook Calendar"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export to Calendar (.ics)</span>
                      </button>
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
