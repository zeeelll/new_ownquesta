"use client";

import React, { useState, useEffect, useRef } from 'react';

type ChatMessage = { type: 'user' | 'ai'; text: string; timestamp: string };

interface Props {
  actualFile: File | null;
  userQuery: string;
  onStartValidation: () => Promise<void>;
  onStartEDA: () => Promise<void>;
  edaResults: any;
  validationResult: any;
  chatMessages: ChatMessage[];
  setChatMessages: (m: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
}

const STORAGE_KEY = 'ownquesta_validation_chat_v1';

const ValidationAgentWidget: React.FC<Props> = ({ actualFile, userQuery, onStartValidation, onStartEDA, edaResults, validationResult, chatMessages, setChatMessages }) => {
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'code' | 'insights'>('chat');
  const initialized = useRef(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Persist chat locally so it survives navigation / reloads
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && !initialized.current) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (parsed && parsed.length > 0) {
          setChatMessages(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [setChatMessages]);

  useEffect(() => {
    // Save chat on changes
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatMessages || []));
    } catch (e) {}
  }, [chatMessages]);

  useEffect(() => {
    if (initialized.current) return;
    const filename = actualFile ? actualFile.name : 'no file uploaded';
    const goalText = userQuery || 'Auto-detect task';
    const welcome: ChatMessage = {
      type: 'ai',
      text: `Hello — I am your Validation Agent. I see your goal: "${goalText}" and dataset: "${filename}". Click 'Start ML Validation' to run advanced EDA and ML validation, or 'Run EDA Only' to inspect the data first. You can also ask questions after EDA completes.`,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => {
      const already = prev && prev.length > 0;
      return already ? prev : [welcome];
    });
    initialized.current = true;
  }, [actualFile, userQuery, setChatMessages]);

  const startFlow = async () => {
    if (!actualFile) {
      setChatMessages(prev => [...prev, { type: 'ai', text: 'Please upload a dataset first to begin validation.', timestamp: new Date().toLocaleTimeString() }]);
      return;
    }
    setIsBusy(true);
    setChatMessages(prev => [...prev, { type: 'ai', text: `Starting ML validation for "${userQuery || 'Auto-detect'}"... Running EDA then ML validation.`, timestamp: new Date().toLocaleTimeString() }]);
    try {
      await onStartEDA();
      await onStartValidation();
      setChatMessages(prev => [...prev, { type: 'ai', text: '✅ Validation finished — view results in the right panel. Ask follow-up questions here.', timestamp: new Date().toLocaleTimeString() }]);
      setActiveTab('chat');
    } catch (e: any) {
      setChatMessages(prev => [...prev, { type: 'ai', text: `Validation error: ${e?.message || String(e)}`, timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setIsBusy(false);
    }
  };

  const sendQuestion = async () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    const userMsg: ChatMessage = { type: 'user', text: q, timestamp: new Date().toLocaleTimeString() };
    setChatMessages(prev => [...prev, userMsg]);

    // If EDA results are not available, respond with guidance
    if (!edaResults) {
      setChatMessages(prev => [...prev, { type: 'ai', text: 'Please run EDA first — click "Run EDA Only" to analyze the dataset.', timestamp: new Date().toLocaleTimeString() }]);
      return;
    }

    setIsBusy(true);
    try {
      const res = await fetch('http://localhost:8000/validation/question', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, eda_results: edaResults })
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const j = await res.json();
      setChatMessages(prev => [...prev, { type: 'ai', text: j.answer || 'No answer', timestamp: new Date().toLocaleTimeString() }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { type: 'ai', text: `Error: ${err?.message || String(err)}`, timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setIsBusy(false);
    }
  };

  const openCodeWindow = () => {
    if (validationResult && validationResult.implementationCode) {
      const code = validationResult.implementationCode;
      const w = window.open('', '_blank');
      if (w) {
        w.document.title = 'Validation Agent - Implementation Code';
        w.document.body.style.background = '#0b1220';
        w.document.body.style.color = '#d1fae5';
        const pre = w.document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
        pre.style.padding = '20px';
        pre.textContent = code.full_pipeline || code.eda_code || JSON.stringify(code, null, 2);
        w.document.body.appendChild(pre);
      }
    } else {
      setChatMessages(prev => [...prev, { type: 'ai', text: 'No implementation code available yet. Run validation to generate code.', timestamp: new Date().toLocaleTimeString() }]);
    }
  };

  const quickReplies = validationResult?.optional_questions || ['Show dataset summary', 'Any missing values?', 'Which features are important?'];

  return (
    <div ref={panelRef} className={`fixed right-6 bottom-8 z-[60] transition-transform ${collapsed ? 'translate-x-80' : 'translate-x-0'}`} style={{width: 520}}>
      <div className="flex flex-col bg-[#0f1724] border border-slate-700/40 rounded-xl shadow-lg overflow-hidden" style={{height: '85vh'}}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#071029] border-b border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-indigo-600 flex items-center justify-center text-white font-bold">VA</div>
            <div>
              <div className="text-sm font-semibold text-white">Validation Agent</div>
              <div className="text-xs text-slate-400">AI Data Scientist</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('chat')} className={`px-2 py-1 text-xs rounded ${activeTab === 'chat' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>Chat</button>
            <button onClick={() => setActiveTab('code')} className={`px-2 py-1 text-xs rounded ${activeTab === 'code' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>Code</button>
            <button onClick={() => setActiveTab('insights')} className={`px-2 py-1 text-xs rounded ${activeTab === 'insights' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>Insights</button>
            <button onClick={() => setCollapsed(s => !s)} title={collapsed ? 'Open' : 'Collapse'} className="p-1 rounded text-slate-300 hover:bg-slate-800/40">{collapsed ? '▸' : '▾'}</button>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 h-full overflow-hidden">
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-2" style={{maxHeight: 'calc(85vh - 260px)'}}>
                {(chatMessages || []).slice(-50).map((m, i) => (
                  <div key={i} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.type === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center mr-2 shrink-0">A</div>
                    )}
                    <div className={`${m.type === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'} max-w-[78%] rounded-lg p-2 text-sm`}>
                      <div className="text-xs text-slate-400 mb-1">{m.timestamp}</div>
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    </div>
                    {m.type === 'user' && (
                      <div className="w-6" />
                    )}
                  </div>
                ))}
                {isBusy && (
                  <div className="flex items-center gap-2 text-sm text-slate-400"> <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" /> Agent is thinking...</div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.slice(0,4).map((q: string, idx: number) => (
                    <button key={idx} onClick={() => { setInput(q); }} className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-200">{q}</button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendQuestion()} placeholder={edaResults ? 'Ask about your dataset...' : 'Run EDA to enable questions'} className="flex-1 px-3 py-2 rounded bg-[#071029] text-white text-sm outline-none" />
                  <button onClick={sendQuestion} disabled={!input.trim() || isBusy} className="px-3 py-2 bg-indigo-600 text-white rounded">Ask</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={startFlow} disabled={isBusy} className="flex-1 py-2 bg-indigo-600 text-white rounded">{isBusy ? 'Running...' : 'Start ML Validation'}</button>
                  <button onClick={async () => { setIsBusy(true); await onStartEDA(); setIsBusy(false); }} disabled={isBusy} className="py-2 px-3 bg-emerald-600 text-white rounded">Run EDA</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-auto mb-3 text-xs text-slate-200 bg-[#071029] p-3 rounded" style={{maxHeight: 'calc(85vh - 220px)'}}>
                {validationResult?.implementationCode ? (
                  <pre className="whitespace-pre-wrap text-[12px]">{validationResult.implementationCode.full_pipeline || validationResult.implementationCode.eda_code}</pre>
                ) : (
                  <div className="text-slate-400">No code generated yet. Run validation to generate implementation code.</div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={openCodeWindow} className="flex-1 py-2 bg-slate-700 text-white rounded">Open Full Code</button>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="h-full overflow-auto text-sm text-slate-200 space-y-3">
              {edaResults?.insights ? (
                <div>
                  <h4 className="text-xs text-slate-400 mb-2">Key Insights</h4>
                  <div className="space-y-1">
                    {(edaResults.insights.dataQuality || []).slice(0,3).map((s: string, i: number) => (<div key={i} className="text-xs bg-slate-800 p-2 rounded">{s}</div>))}
                    {(edaResults.insights.featureInsights || []).slice(0,3).map((s: string, i: number) => (<div key={`f${i}`} className="text-xs bg-slate-800 p-2 rounded">{s}</div>))}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400">No insights available. Run EDA to generate insights.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationAgentWidget;
