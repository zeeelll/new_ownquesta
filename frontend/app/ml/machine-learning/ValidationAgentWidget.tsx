"use client";

import React, { useState } from 'react';

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

const ValidationAgentWidget: React.FC<Props> = ({ actualFile, userQuery, onStartValidation, onStartEDA, edaResults, validationResult, chatMessages, setChatMessages }) => {
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const startFlow = async () => {
    if (!actualFile) {
      setChatMessages(prev => [...prev, { type: 'ai', text: 'Please upload a dataset first to begin validation.', timestamp: new Date().toLocaleTimeString() }]);
      return;
    }

    setIsBusy(true);
    setChatMessages(prev => [...prev, { type: 'ai', text: `Hi — I'll start the ML validation now based on your goal: "${userQuery || 'Auto-detect'}". Running advanced EDA and model suggestions...`, timestamp: new Date().toLocaleTimeString() }]);
    try {
      await onStartEDA();
      await onStartValidation();
      setChatMessages(prev => [...prev, { type: 'ai', text: 'Validation complete — results are available on the right panel. Ask me anything about the dataset.', timestamp: new Date().toLocaleTimeString() }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { type: 'ai', text: `Validation failed: ${e?.message || String(e)}`, timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setIsBusy(false);
    }
  };

  const sendQuestion = async () => {
    const q = input.trim();
    if (!q || !edaResults) return;
    setInput('');
    setChatMessages(prev => [...prev, { type: 'user', text: q, timestamp: new Date().toLocaleTimeString() }]);

    try {
      const res = await fetch('http://localhost:8000/validation/question', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, eda_results: edaResults })
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const j = await res.json();
      setChatMessages(prev => [...prev, { type: 'ai', text: j.answer || 'No answer', timestamp: new Date().toLocaleTimeString() }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { type: 'ai', text: `Error answering question: ${err?.message || String(err)}`, timestamp: new Date().toLocaleTimeString() }]);
    }
  };

  const showCode = () => {
    if (validationResult && validationResult.implementationCode) {
      const code = validationResult.implementationCode;
      const msg = `Python code is available. Click 'Open Code' to view in the right panel.`;
      setChatMessages(prev => [...prev, { type: 'ai', text: msg, timestamp: new Date().toLocaleTimeString() }]);
      // open in new window as raw code preview
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

  return (
    <div className="fixed right-8 top-24 w-96 bg-slate-900/80 backdrop-blur rounded-xl border border-slate-700/40 p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-semibold">Validation Agent</h4>
        <div className="text-xs text-slate-400">Chat</div>
      </div>

      <div className="h-64 overflow-y-auto mb-3 space-y-2">
        {chatMessages.slice(-8).map((m, i) => (
          <div key={i} className={`p-2 rounded ${m.type === 'user' ? 'bg-indigo-700 text-white ml-6' : 'bg-slate-800 text-slate-200'}`}>
            <div className="text-xs text-slate-400 mb-1">{m.timestamp}</div>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <button onClick={startFlow} disabled={isBusy} className="w-full py-2 bg-indigo-600 text-white rounded-lg">{isBusy ? 'Running...' : 'Start ML Validation'}</button>
        <button onClick={onStartEDA} disabled={isBusy} className="w-full py-2 bg-emerald-600 text-white rounded-lg">Run EDA Only</button>
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={edaResults ? 'Ask about your dataset...' : 'Run EDA first to ask questions'} className="flex-1 px-3 py-2 rounded bg-slate-800 text-white text-sm" />
          <button onClick={sendQuestion} disabled={!edaResults || input.trim().length===0} className="px-3 py-2 bg-indigo-500 text-white rounded">Ask</button>
        </div>
        <div className="flex gap-2">
          <button onClick={showCode} className="flex-1 py-2 bg-slate-700 text-white rounded">Show Code</button>
        </div>
      </div>
    </div>
  );
};

export default ValidationAgentWidget;
