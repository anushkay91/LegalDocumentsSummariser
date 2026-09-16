import React, { useState, useRef, useEffect } from 'react';
import { LegalDocument, ChatMessage, Citation } from '../types';
import { authenticatedFetch } from '../lib/apiClient';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  BookOpen, 
  ExternalLink, 
  ShieldAlert, 
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface DocumentGroundedChatProps {
  document: LegalDocument;
  onHighlightClause: (textSnippet: string, sectionNumber?: string) => void;
  onSwitchToViewer: () => void;
}

export const DocumentGroundedChat: React.FC<DocumentGroundedChatProps> = ({
  document,
  onHighlightClause,
  onSwitchToViewer,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `Hello! I have indexed **${document.title}**. You can ask any question about obligations, deadlines, renewal conditions, or fees. I will ground every answer strictly in the document text and provide exact Section citations.`,
      disclaimer: 'LegalLens is an information assistant, not an attorney or legal counsel. No output constitutes legal advice.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Document-specific suggested questions
  const getSuggestedQuestions = () => {
    switch (document.category) {
      case 'rental':
        return [
          'What are the notice requirements if I decide not to renew?',
          'What repair costs or maintenance am I responsible for?',
          'Can the landlord enter my apartment without advance notice?',
          'What are the conditions for getting my full security deposit back?',
        ];
      case 'employment':
        return [
          'Does the company own side projects I build on weekends?',
          'What are the non-compete terms and geographical restrictions?',
          'What notice must I give if I decide to resign?',
          'Do I forfeit accrued vacation days or bonuses upon departure?',
        ];
      case 'nda':
        return [
          'Is the confidentiality period symmetrical for both parties?',
          'Are there restrictions on hiring or soliciting employees?',
          'What happens if I receive a subpoena or court order to disclose info?',
        ];
      default:
        return [
          'What are my primary obligations under this agreement?',
          'What are the key deadlines and termination conditions?',
          'Are there automatic renewal or price increase clauses?',
        ];
    }
  };

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toISOString(),
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await authenticatedFetch('/api/documents/rag-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend.trim(),
          documentTitle: document.title,
          documentCategory: document.category,
          documentText: document.rawText,
          history: messages.slice(-4),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: data.answer || "I could not locate specific provisions regarding that question in your document.",
        citations: data.citations || [],
        disclaimer: data.disclaimer || "LegalLens provides document comprehension assistance only and does not provide legal advice.",
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          text: `I encountered an issue processing your query against the document: ${message}. You can continue reviewing extracted clauses directly in the Attention, Obligations, or Viewer tabs.`,
          disclaimer: 'LegalLens is an information assistant, not an attorney.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] min-h-[550px] bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Chat Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-serif">Document-Grounded Assistant</h2>
            <p className="text-[11px] text-slate-500">
              Grounded exclusively in <span className="font-semibold text-slate-700">{document.title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xs flex items-center gap-1"
            title="Clear chat history"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Clear</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-2xl space-y-2.5 ${msg.sender === 'user' ? 'order-1' : 'order-2'}`}>
              <div 
                className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white shadow-xs rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line">
                  {msg.text}
                </div>
              </div>

              {/* Citations Block */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="space-y-1.5 pl-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-emerald-600" />
                    <span>Document Evidence & Exact Citations:</span>
                  </div>
                  {msg.citations.map((cite, idx) => (
                    <div 
                      key={idx}
                      className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-2.5 text-xs text-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-amber-900 text-[11px]">
                          {cite.section} {cite.page && cite.page !== 'N/A' ? `(Page ${cite.page})` : ''}
                        </span>
                        <button
                          onClick={() => {
                            onHighlightClause(cite.quote, cite.section);
                            onSwitchToViewer();
                          }}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 hover:underline"
                        >
                          <span>View in Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-mono text-[11px] text-slate-700 italic border-l-2 border-amber-400 pl-2">
                        "{cite.quote}"
                      </p>
                      {cite.relevance && (
                        <p className="text-[10px] text-slate-500 pt-0.5">
                          <strong>Note:</strong> {cite.relevance}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Legal Disclaimer Tag */}
              {msg.disclaimer && (
                <div className="text-[10px] text-slate-400 italic pl-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{msg.disclaimer}</span>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 mt-0.5 order-2">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-500 italic py-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-slate-600">Retrieving document sections & checking clauses...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts pills */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          <span>Ask:</span>
        </span>
        {getSuggestedQuestions().map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="text-[11px] text-slate-600 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-slate-200 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="chat-query-input"
            type="text"
            placeholder={`Ask a grounded question about ${document.title}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!input.trim() || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all shrink-0"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
