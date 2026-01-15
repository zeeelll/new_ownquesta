"use client";

import React, { useState, useRef, useEffect } from 'react';

interface DataFile {
  name: string;
  size: number;
  type: string;
  uploadTime: string;
}

interface DataPreview {
  columns: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
  fileSize: string;
}

interface ChatMessage {
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const MLStudioAdvanced: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'setup' | 'validate' | 'configure'>('setup');
  const [uploadedFile, setUploadedFile] = useState<DataFile | null>(null);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [userQuery, setUserQuery] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const processFile = (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/)) {
      alert('Please upload a valid CSV or Excel file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size should be less than 50MB');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const fileData: DataFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadTime: new Date().toLocaleTimeString()
      };

      setUploadedFile(fileData);

      const mockPreview: DataPreview = {
        columns: ['Customer_ID', 'Age', 'Purchase_Amount', 'Frequency', 'Satisfaction', 'Status'],
        rows: [
          ['C001', '35', '1250.50', '12', '4.5', 'Active'],
          ['C002', '42', '2100.75', '18', '4.8', 'Active'],
          ['C003', '28', '890.25', '8', '3.9', 'Inactive'],
          ['C004', '55', '3450.00', '25', '4.7', 'Active'],
          ['C005', '31', '1670.80', '14', '4.3', 'Active'],
        ],
        rowCount: 5000,
        columnCount: 6,
        fileSize: (file.size / 1024).toFixed(2) + ' KB'
      };

      setDataPreview(mockPreview);
      setCurrentStep('validate');
      setIsProcessing(false);

      setChatMessages([{
        type: 'ai',
        text: `Excellent! I've loaded "${file.name}" with ${mockPreview.columnCount} columns and ${mockPreview.rowCount.toLocaleString()} rows. What insights are you looking for?`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!userQuery.trim()) return;

    setChatMessages(prev => [...prev, {
      type: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString()
    }]);
    
    const query = userQuery;
    setUserQuery('');

    setTimeout(() => {
      let aiResponse = 'Interesting! Let me analyze your data patterns and suggest the best approach for your use case.';
      
      if (query.toLowerCase().includes('predict') || query.toLowerCase().includes('forecast')) {
        aiResponse = 'Perfect! I\'ll help you build a predictive model with high accuracy. Let me analyze the patterns in your data.';
      } else if (query.toLowerCase().includes('classification')) {
        aiResponse = 'Great choice! I\'ve identified this as a classification problem. The data quality looks excellent.';
      }

      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 text-white relative overflow-hidden">
      <style>{`
        @keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(50px, -50px); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); } 50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); } }
        @keyframes shimmer { from { background-position: -1000px 0; } to { background-position: 1000px 0; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        .animate-slide { animation: slideIn 0.5s ease-out; }
        .text-gradient { background: linear-gradient(135deg, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .text-gradient-rainbow { background: linear-gradient(135deg, #6366f1, #ec4899, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>

      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[120px] -top-48 -left-48" style={{ animation: 'float 20s ease-in-out infinite' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-pink-500/20 blur-[120px] -bottom-32 -right-32" style={{ animation: 'float 25s ease-in-out infinite reverse' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-purple-500/20 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'float 30s ease-in-out infinite' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-slate-950/80 border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center animate-glow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" /><path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">ML Studio</h1>
                <p className="text-xs text-indigo-300 uppercase tracking-wider">AI-Powered Analytics</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {[{ step: 1, label: 'Setup', key: 'setup' }, { step: 2, label: 'Validate', key: 'validate' }, { step: 3, label: 'Configure', key: 'configure' }].map((item, idx) => (
                <React.Fragment key={item.key}>
                  <button
                    onClick={() => {
                      if (item.key === 'setup' || (item.key === 'validate' && uploadedFile) || (item.key === 'configure' && dataPreview)) {
                        setCurrentStep(item.key as any);
                      }
                    }}
                    disabled={item.key === 'validate' && !uploadedFile || item.key === 'configure' && !dataPreview}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      currentStep === item.key
                        ? 'bg-gradient-to-r from-indigo-500 to-pink-500 shadow-lg shadow-indigo-500/50'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white/20">{item.step}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </button>
                  {idx < 2 && <div className={`w-8 h-0.5 transition-all ${(idx === 0 && uploadedFile) || (idx === 1 && dataPreview) ? 'bg-gradient-to-r from-indigo-500 to-pink-500' : 'bg-white/10'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {currentStep === 'setup' && (
          <div className="animate-slide space-y-8">
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-sm text-indigo-300 font-medium">AI-Powered Machine Learning</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-gradient-rainbow">Build Intelligent Models</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">Describe your goal and upload your data. Let AI guide you through the entire pipeline.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Query Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center"><span className="text-xl">🎯</span></div>
                  <div><h3 className="text-xl font-bold">Define Your Goal</h3><p className="text-sm text-gray-400">What do you want to predict or analyze?</p></div>
                </div>

                <div className="group backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6 hover:border-indigo-500/40 transition-all">
                  <textarea placeholder="Example: I want to predict which customers are likely to churn in the next 3 months..." value={userQuery} onChange={(e) => setUserQuery(e.target.value)} className="w-full h-48 bg-transparent border-none outline-none text-white placeholder-gray-500 resize-none" />
                  <div className="flex flex-wrap gap-2 mt-4">
                    {['Predict customer churn', 'Forecast sales', 'Classify transactions'].map((p) => (
                      <button key={p} onClick={() => setUserQuery(p)} className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all">{p}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[{ icon: '🎯', title: 'Classification', example: 'Yes/No' }, { icon: '📈', title: 'Regression', example: '$100+' }, { icon: '🔗', title: 'Clustering', example: 'A, B, C' }].map((item) => (
                    <div key={item.title} className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-xl p-4 hover:border-indigo-500/40 hover:-translate-y-1 transition-all cursor-pointer group">
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
                      <h4 className="text-sm font-semibold mb-1">{item.title}</h4>
                      <code className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">{item.example}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center"><span className="text-xl">📤</span></div>
                  <div><h3 className="text-xl font-bold">Upload Dataset</h3><p className="text-sm text-gray-400">CSV or Excel (Max 50MB)</p></div>
                </div>

                <div className={`backdrop-blur-2xl bg-slate-900/60 border rounded-2xl p-12 text-center cursor-pointer transition-all ${dragActive ? 'border-indigo-500 bg-indigo-500/10 scale-105' : 'border-indigo-500/20 hover:border-indigo-500/40'} ${isProcessing ? 'pointer-events-none' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => !isProcessing && fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
                  {isProcessing ? (
                    <div className="space-y-4">
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500" style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                      <p className="text-gray-400 font-medium">Processing...</p>
                    </div>
                  ) : (
                    <>
                      <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-50" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
                        <svg className="w-16 h-16 text-indigo-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      </div>
                      <h4 className="text-lg font-semibold mb-2">Drop your file here</h4>
                      <p className="text-sm text-gray-400 mb-4">or click to browse</p>
                      <div className="flex gap-2 justify-center">{['CSV', 'XLSX', 'XLS'].map((f) => <span key={f} className="px-3 py-1 text-xs rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium">{f}</span>)}</div>
                    </>
                  )}
                </div>

                {uploadedFile && (
                  <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/50 rounded-xl p-4 animate-slide">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-400">{(uploadedFile.size / 1024).toFixed(2)} KB • {uploadedFile.uploadTime}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setDataPreview(null); setChatMessages([]); }} className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 transition-all">Change</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-xl p-4 hover:border-indigo-500/40 hover:-translate-y-1 transition-all">
                    <svg className="w-5 h-5 text-indigo-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h4 className="text-sm font-semibold mb-1">Supported</h4>
                    <p className="text-xs text-gray-400">CSV, Excel formats</p>
                  </div>
                  <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-xl p-4 hover:border-indigo-500/40 hover:-translate-y-1 transition-all">
                    <svg className="w-5 h-5 text-pink-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <h4 className="text-sm font-semibold mb-1">Secure</h4>
                    <p className="text-xs text-gray-400">Never stored</p>
                  </div>
                </div>

                {uploadedFile && dataPreview && (
                  <button onClick={() => setCurrentStep('validate')} className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                    <span>Next: Validate Data</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'validate' && dataPreview && (
          <div className="animate-slide space-y-8">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div><h2 className="text-3xl font-bold text-gradient mb-2">Dataset Preview</h2><p className="text-gray-400">File: {uploadedFile?.name}</p></div>
              <button onClick={() => { setCurrentStep('setup'); setUploadedFile(null); setDataPreview(null); setChatMessages([]); setUserQuery(''); }} className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 text-red-400 font-medium transition-all hover:-translate-y-1">↻ Start Over</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{ icon: '📊', label: 'Rows', value: dataPreview.rowCount.toLocaleString(), color: 'indigo' }, { icon: '📋', label: 'Columns', value: dataPreview.columnCount, color: 'pink' }, { icon: '💾', label: 'Size', value: dataPreview.fileSize, color: 'cyan' }, { icon: '✓', label: 'Quality', value: '98%', color: 'green' }].map((stat) => (
                <div key={stat.label} className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6 hover:border-indigo-500/40 hover:-translate-y-1 transition-all group">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Data Sample</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/10">{dataPreview.columns.map((col, i) => <th key={i} className="text-left p-3 font-semibold text-indigo-300">{col}</th>)}</tr></thead>
                  <tbody>{dataPreview.rows.map((row, i) => <tr key={i} className="border-b border-white/5 hover:bg-white/5">{row.map((cell, j) => <td key={j} className="p-3 text-gray-300">{cell}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-4">Showing 5 of {dataPreview.rowCount.toLocaleString()} rows</p>
            </div>

            <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span>🤖</span> ML Agent Assistant</h3>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                    {msg.type === 'ai' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center flex-shrink-0">🤖</div>}
                    <div className={`max-w-2xl p-4 rounded-xl ${msg.type === 'user' ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white/5 border border-white/10'}`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{msg.timestamp}</p>
                    </div>
                    {msg.type === 'user' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">👤</div>}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Ask: What would you like to predict?" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/50 outline-none transition-all" />
                <button onClick={handleSendMessage} disabled={!userQuery.trim()} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 disabled:opacity-40 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center py-6 text-gray-400 text-sm">💡 Pro Tip: The more details you provide, the better the AI can assist you!</footer>
    </div>
  );
};

export default MLStudioAdvanced;