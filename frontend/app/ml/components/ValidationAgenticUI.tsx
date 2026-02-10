"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Send, Code, FileText, Loader2, Brain } from 'lucide-react';

const ValidationAgenticAI: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([
    { type: 'agent', content: "Hello! I'm your Validation Agentic AI. Upload a CSV and tell me your goal." }
  ]);
  const [input, setInput] = useState('');
  const [dataset, setDataset] = useState<any | null>(null);
  const [edaResults, setEdaResults] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [awaitingGoal, setAwaitingGoal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, edaResults]);

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((h, i) => (row[h] = values[i] ?? ''));
      return row;
    });
    return { headers, rows };
  };

  const datasetToCSV = (data: any) => {
    const { headers, rows } = data;
    const lines = [headers.join(',')];
    rows.forEach((r: any) => {
      const vals = headers.map((h: string) => {
        const v = r[h] ?? '';
        const s = String(v).replace(/"/g, '""');
        return s.includes(',') ? `"${s}"` : s;
      });
      lines.push(vals.join(','));
    });
    return lines.join('\n');
  };

  const performLocalEDA = async (data: any, goal: any) => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    const { headers, rows } = data;
    const shape = { rows: rows.length, columns: headers.length };
    const missing: any = {};
    const numeric: string[] = [];
    const categorical: string[] = [];
    headers.forEach((h: string) => {
      const vals = rows.map((r: any) => r[h]);
      const miss = vals.filter(v => v === undefined || v === null || v === '').length;
      missing[h] = { count: miss, percentage: ((miss / rows.length) * 100).toFixed(2) };
      const allNum = vals.every(v => v === '' || v === null || !isNaN(parseFloat(v)));
      if (allNum) numeric.push(h); else categorical.push(h);
    });
    const eda = { shape, headers, numeric, categorical, missing, goal, isValid: true };
    setEdaResults(eda);
    setIsProcessing(false);
    return eda;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      setMessages(prev => [...prev, { type: 'agent', content: '❌ Please upload a CSV file.' }]);
      return;
    }
    setMessages(prev => [...prev, { type: 'user', content: `Uploaded: ${f.name}` }]);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const parsed = parseCSV(text);
      setDataset(parsed);
      setMessages(prev => [...prev, { type: 'agent', content: `✅ Dataset loaded — ${parsed.rows.length} rows, ${parsed.headers.length} cols. What's your goal?` }]);
      setAwaitingGoal(true);
    };
    reader.readAsText(f);
  };

  const detectGoal = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('predict') || t.includes('classification') || t.includes('regression')) return { type: 'supervised', description: 'Supervised' };
    if (t.includes('cluster') || t.includes('segment') || t.includes('unsupervised')) return { type: 'unsupervised', description: 'Unsupervised' };
    return { type: 'eda', description: 'Exploratory Data Analysis' };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages(prev => [...prev, { type: 'user', content: text }]);
    setInput('');

    if (awaitingGoal && dataset) {
      setAwaitingGoal(false);
      const goal = detectGoal(text);
      setMessages(prev => [...prev, { type: 'agent', content: `Detected goal: ${goal.description}. Running analysis...` }]);

      // Try backend
      try {
        setIsProcessing(true);
        const csv = datasetToCSV(dataset);
        const res = await fetch('http://127.0.0.1:8000/validation/analyze', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv_text: csv, goal })
        });
        if (res.ok) {
          const json = await res.json();
          setEdaResults(json);
          setMessages(prev => [...prev, { type: 'agent', content: '✅ Analysis complete. Results loaded.' }]);
          setIsProcessing(false);
          return;
        }
        setMessages(prev => [...prev, { type: 'agent', content: 'Agent error — falling back to local analysis.' }]);
        setIsProcessing(false);
      } catch (err) {
        setMessages(prev => [...prev, { type: 'agent', content: 'Could not contact agent — running local analysis.' }]);
      }

      await performLocalEDA(dataset, { type: 'eda', description: 'Local EDA' });
      return;
    }

    // Generic questions when edaResults present
    if (edaResults) {
      const q = text.toLowerCase();
      if (q.includes('insight') || q.includes('summary')) {
        setMessages(prev => [...prev, { type: 'agent', content: `Overview: ${edaResults.shape.rows} rows × ${edaResults.shape.columns || edaResults.headers?.length || ''} cols.` }]);
        return;
      }
    }

    setMessages(prev => [...prev, { type: 'agent', content: "Please upload a dataset and set a goal to start analysis." }]);
  };

  return (
    <div className="relative h-full">
      <div className="pr-0 lg:pr-96 h-full">
        <div className="w-full bg-white p-4 overflow-y-auto">
          <div className="bg-gray-800 text-white p-3 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <h4 className="font-semibold text-sm">{edaResults ? 'EDA Results' : 'EDA Panel'}</h4>
            </div>
          </div>

          <div className="mt-4">
            {!edaResults ? (
              <div className="text-center text-gray-400 py-12">
                <Brain size={48} className="mx-auto mb-3" />
                <p className="font-medium">Upload a dataset to begin</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded">
                  <strong>Rows:</strong> {edaResults?.shape?.rows ?? (edaResults?.rows ? edaResults.rows.length : '')} &nbsp; <strong>Cols:</strong> {edaResults?.shape?.columns ?? edaResults?.headers?.length ?? ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {collapsed ? (
        <button aria-label="Open Validation Chat" onClick={() => setCollapsed(false)} className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white rounded-l-md px-3 py-2 z-50 shadow-lg">Validation</button>
      ) : (
        <div className="fixed right-4 top-16 bottom-6 w-96 bg-white shadow-2xl rounded-lg z-50 flex flex-col overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain size={20} />
              <div>
                <div className="font-semibold text-sm">Validation Agentic AI</div>
                <div className="text-xs text-blue-100">Goal-driven dataset analysis</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isProcessing && <Loader2 className="animate-spin" size={16} />}
              <button onClick={() => setCollapsed(true)} className="text-white opacity-90 hover:opacity-100">Close</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.type === 'user' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white shadow-md border border-gray-200'}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex gap-2 mb-3 justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-2 py-1 bg-green-600 text-white rounded-md text-sm"><Upload size={14} /> Upload</button>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </div>
              <div className="text-xs text-gray-500">{edaResults ? `${edaResults.shape?.rows || ''} rows` : ''}</div>
            </div>
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask or set goal..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
              <button onClick={handleSendMessage} className="px-3 py-2 bg-blue-600 text-white rounded-lg"><Send size={14} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationAgenticAI;
