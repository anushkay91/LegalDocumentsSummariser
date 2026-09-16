import React from 'react';
import { 
  FileText, 
  Upload, 
  ShieldAlert, 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  Scale, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  Trash2,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { LegalDocument, UserProfile } from '../types';

interface NavbarProps {
  documents: LegalDocument[];
  currentDoc: LegalDocument | null;
  onSelectDoc: (doc: LegalDocument) => void;
  onOpenUpload: () => void;
  onOpenAudit: () => void;
  activeTab: 'overview' | 'attention' | 'obligations' | 'deadlines' | 'financial' | 'chat' | 'viewer';
  onChangeTab: (tab: 'overview' | 'attention' | 'obligations' | 'deadlines' | 'financial' | 'chat' | 'viewer') => void;
  userProfile: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  documents,
  currentDoc,
  onSelectDoc,
  onOpenUpload,
  onOpenAudit,
  activeTab,
  onChangeTab,
  userProfile,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Count high priority attention items
  const highPriorityCount = currentDoc?.attentionItems.filter(a => a.priority === 'high').length || 0;
  const pendingObligations = currentDoc?.obligations.filter(o => !o.completed && o.party === 'user').length || 0;
  const urgentDeadlines = currentDoc?.deadlines.filter(d => !d.completed && d.urgency === 'urgent').length || 0;

  const navItems = [
    { id: 'overview', label: 'Summary & Context', icon: FileText },
    { 
      id: 'attention', 
      label: 'Attention Areas', 
      icon: ShieldAlert, 
      badge: highPriorityCount > 0 ? highPriorityCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' 
    },
    { 
      id: 'obligations', 
      label: 'Obligations', 
      icon: CheckSquare,
      badge: pendingObligations > 0 ? pendingObligations : undefined,
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300' 
    },
    { 
      id: 'deadlines', 
      label: 'Deadlines', 
      icon: Calendar,
      badge: urgentDeadlines > 0 ? urgentDeadlines : undefined,
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300'
    },
    { id: 'financial', label: 'Financials', icon: Scale },
    { id: 'viewer', label: 'Document Viewer', icon: FileText },
    { id: 'chat', label: 'Grounded Assistant', icon: MessageSquare, highlight: true },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md">
      {/* Top Banner: Mandatory Legal Disclaimer */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 px-4 py-1.5 text-xs text-amber-200/90 border-b border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-5xl mx-auto text-center justify-center w-full">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong>Legal Notice:</strong> LegalLens is an information and document-understanding assistant, <em>not an attorney or legal counsel</em>. Nothing herein constitutes legal advice or decision-making.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-inner ring-1 ring-emerald-400/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-serif">LegalLens</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 tracking-wide uppercase">
                  Doc Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Personal Document Intelligence & Attention Assistant</p>
            </div>
          </div>

          {/* Active Document Selector */}
          <div className="flex-1 max-w-xs md:max-w-sm">
            <div className="relative">
              <select
                id="document-selector"
                value={currentDoc?.id || ''}
                onChange={(e) => {
                  const found = documents.find(d => d.id === e.target.value);
                  if (found) onSelectDoc(found);
                }}
                className="w-full bg-slate-800/90 text-slate-100 text-xs rounded-lg px-3 py-2 pr-8 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate cursor-pointer"
                title="Select active legal document"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id} className="bg-slate-900 text-slate-100 py-1">
                    [{doc.category.toUpperCase()}] {doc.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="upload-doc-btn"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors focus:ring-2 focus:ring-emerald-400"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Document</span>
              <span className="sm:hidden">Upload</span>
            </button>

            <button
              id="security-audit-btn"
              onClick={onOpenAudit}
              title="Privacy, Session Security & Audit Trail"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline text-[11px]">Privacy & Audit</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 border-t border-slate-800/80 pt-1 pb-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-emerald-300 shadow-sm border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                } ${'highlight' in item && item.highlight && !isActive ? 'text-emerald-400' : ''}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {'badge' in item && item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium ${
                  isActive
                    ? 'bg-slate-800 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                {'badge' in item && item.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
