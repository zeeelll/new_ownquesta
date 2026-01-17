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
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showLastRows, setShowLastRows] = useState(false);
  const [viewMode, setViewMode] = useState<'first' | 'last' | 'all'>('first');
  const hasGoal = userQuery.trim().length > 0;
  const hasDataset = Boolean(uploadedFile && actualFile && dataPreview);
  const canProceedFromSetup = hasGoal && hasDataset;

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

  const validateWithAPI = async () => {
    if (!actualFile) {
      alert('Please upload a file before validating');
      return;
    }

    setIsValidating(true);
    
    try {
      const formData = new FormData();
      const resolvedGoal = userQuery.trim() || 'Auto-detect the most suitable target and task based on the dataset.';
      formData.append('goal', resolvedGoal);
      formData.append('file', actualFile);

      const response = await fetch('https://ownquestaagents-production.up.railway.app/ml-validation/validate', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setValidationResult(result);
      
      // Display agent_answer in chat
      if (result.agent_answer) {
        setChatMessages(prev => [...prev, {
          type: 'ai',
          text: result.agent_answer,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }

      // Display optional_questions if available
      if (result.optional_questions && result.optional_questions.length > 0) {
        const questionsText = "📋 **Optional Questions:**\n" + 
          result.optional_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
        
        setChatMessages(prev => [...prev, {
          type: 'ai',
          text: questionsText,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }

      // Keep on validate step; user will proceed manually
    } catch (error) {
      console.error('Validation error:', error);
      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: `❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsValidating(false);
    }
  };

  const parseCSV = (text: string): { columns: string[], allRows: string[][] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { columns: [], allRows: [] };
    
    const columns = lines[0].split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
    const allRows = lines.slice(1).map(line => {
      return line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
    });
    
    return { columns, allRows };
  };
  const updatePreviewRows = (mode: 'first' | 'last' | 'all') => {
    if (!actualFile || !dataPreview) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { columns, allRows } = parseCSV(text);
      
      let displayRows;
      if (mode === 'all') {
        displayRows = allRows;
      } else if (mode === 'last') {
        displayRows = allRows.slice(-5);
      } else {
        displayRows = allRows.slice(0, 5);
      }

      setDataPreview({
        ...dataPreview,
        rows: displayRows
      });
    };
    reader.readAsText(actualFile);
  };

  useEffect(() => {
    if (actualFile && dataPreview) {
      updatePreviewRows(viewMode);
    }
  }, [viewMode]);

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
    setActualFile(file);

    // Read and parse CSV file
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { columns, allRows } = parseCSV(text);

      if (columns.length === 0) {
        alert('Could not parse CSV file');
        setIsProcessing(false);
        return;
      }

      const fileData: DataFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadTime: new Date().toLocaleTimeString()
      };

      setUploadedFile(fileData);

      // Get first 5 rows for preview
      const previewRows = allRows.slice(0, 5);

      const preview: DataPreview = {
        columns: columns,
        rows: previewRows,
        rowCount: allRows.length,
        columnCount: columns.length,
        fileSize: file.size < 1024 ? `${file.size} B` : 
                  file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(2)} KB` : 
                  `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      };

      setDataPreview(preview);
      setIsProcessing(false);
    };

    reader.onerror = () => {
      alert('Error reading file');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleSendMessage = () => {
    if (!userQuery.trim()) return;

    setChatMessages(prev => [...prev, {
      type: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString()
    }]);
    
    setUserQuery('');
  };

  const renderMessage = (text: string) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
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
                  <textarea 
                    placeholder="Example: I want to predict which customers are likely to churn in the next 3 months..." 
                    value={userQuery} 
                    onChange={(e) => setUserQuery(e.target.value)} 
                    className="w-full h-48 bg-transparent border-none outline-none text-white placeholder-gray-500 resize-none" 
                  />
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
                      <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setDataPreview(null); setChatMessages([]); setActualFile(null); setValidationResult(null); }} className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 transition-all">Change</button>
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

                <button
                  onClick={async () => {
                    if (!canProceedFromSetup || isProcessing || isValidating) return;
                    setCurrentStep('validate');
                    await validateWithAPI();
                  }}
                  disabled={!canProceedFromSetup || isProcessing || isValidating}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-semibold shadow-lg shadow-emerald-500/40 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Proceed & Validate</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'validate' && dataPreview && (
          <div className="animate-slide space-y-8">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div><h2 className="text-3xl font-bold text-gradient mb-2">Dataset Preview</h2><p className="text-gray-400">File: {uploadedFile?.name}</p></div>
              <button onClick={() => { setCurrentStep('setup'); setUploadedFile(null); setDataPreview(null); setChatMessages([]); setUserQuery(''); setActualFile(null); setValidationResult(null); }} className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 text-red-400 font-medium transition-all hover:-translate-y-1">↻ Start Over</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: '📊',
                  label: 'Rows',
                  value: validationResult?.dataset_summary?.rows?.toLocaleString() || dataPreview.rowCount.toLocaleString(),
                },
                {
                  icon: '📋',
                  label: 'Columns',
                  value: validationResult?.dataset_summary?.columns || dataPreview.columnCount,
                },
                {
                  icon: '💾',
                  label: 'Size',
                  value: validationResult?.dataset_summary?.file_size_mb ? `${validationResult.dataset_summary.file_size_mb} MB` : dataPreview.fileSize,
                },
                {
                  icon: '✓',
                  label: 'Quality',
                  value: isValidating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-sm">Analyzing...</span>
                    </div>
                  ) : (
                    validationResult?.satisfaction_score ? `${validationResult.satisfaction_score}%` : 'Pending'
                  ),
                }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6 hover:border-indigo-500/40 hover:-translate-y-1 transition-all group"
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                  <div className="text-2xl font-bold">
                    {typeof stat.value === 'string' || typeof stat.value === 'number' ? (
                      stat.value
                    ) : (
                      stat.value
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Data Sample</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('first')}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      viewMode === 'first'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    First 5
                  </button>
                  <button
                    onClick={() => setViewMode('last')}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      viewMode === 'last'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Last 5
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      viewMode === 'all'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className={`overflow-x-auto ${viewMode === 'all' ? 'max-h-[500px] overflow-y-auto' : ''}`}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10"><tr className="border-b border-white/10">{dataPreview.columns.map((col, i) => <th key={i} className="text-left p-3 font-semibold text-indigo-300">{col}</th>)}</tr></thead>
                  <tbody>
                    {dataPreview.rows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        {row.map((cell, j) => <td key={j} className="p-3 text-gray-300">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Showing {viewMode === 'all' ? 'all' : viewMode === 'last' ? 'last' : 'first'} {viewMode === 'all' ? dataPreview.rowCount.toLocaleString() : Math.min(5, dataPreview.rowCount)} of {dataPreview.rowCount.toLocaleString()} rows
              </p>
            </div>

            <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span>🤖</span> ML Agent Assistant</h3>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                    {msg.type === 'ai' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center flex-shrink-0">🤖</div>}
                    <div className={`max-w-2xl p-4 rounded-xl ${msg.type === 'user' ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white/5 border border-white/10'}`}>
                      <p className="text-sm leading-relaxed">{renderMessage(msg.text)}</p>
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

            {/* Show configure button only after validation completes */}
            {validationResult && (
              <button 
                onClick={() => setCurrentStep('configure')} 
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <span>Next: Configure Model</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            )}

            {/* Validation Results */}
            {validationResult && (
              <div className="backdrop-blur-2xl bg-slate-900/60 border border-green-500/30 rounded-2xl p-6 animate-slide">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  Validation Results
                </h3>
                <div className="bg-slate-800/50 rounded-xl p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-green-300">{JSON.stringify(validationResult, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'configure' && (
          <div className="animate-slide space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gradient">Model Configuration</h2>
              <p className="text-gray-400">Your model is being configured based on the validation results</p>
            </div>
            
            {validationResult && (
              <div className="space-y-6">
                {/* User View Report - Markdown Display */}
                {validationResult.user_view_report && (
                  <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-8">
                    <div className="prose prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {validationResult.user_view_report.split('\n').map((line: string, i: number) => {
                          if (line.startsWith('# ')) {
                            return <h1 key={i} className="text-3xl font-bold text-gradient mb-4">{line.substring(2)}</h1>;
                          } else if (line.startsWith('## ')) {
                            return <h2 key={i} className="text-2xl font-bold text-indigo-300 mt-6 mb-3">{line.substring(3)}</h2>;
                          } else if (line.startsWith('- ')) {
                            return <li key={i} className="ml-4 text-gray-300">{line.substring(2)}</li>;
                          } else if (line.match(/^\d+\./)) {
                            return <li key={i} className="ml-4 text-gray-300">{line}</li>;
                          } else if (line.includes('**') && line.includes('✅')) {
                            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-green-400">$1</strong>');
                            return <p key={i} className="text-gray-200 mb-2" dangerouslySetInnerHTML={{ __html: formatted }} />;
                          } else if (line.includes('**')) {
                            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
                            return <p key={i} className="text-gray-300 mb-2" dangerouslySetInnerHTML={{ __html: formatted }} />;
                          } else if (line.trim()) {
                            return <p key={i} className="text-gray-400 mb-2">{line}</p>;
                          } else {
                            return <br key={i} />;
                          }
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dataset Summary Card */}
                {validationResult.dataset_summary && (
                  <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6">
                    <h3 className="text-2xl font-bold mb-4">📊 Dataset Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-1">Rows</p>
                        <p className="text-2xl font-bold text-indigo-300">{validationResult.dataset_summary.rows?.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-1">Columns</p>
                        <p className="text-2xl font-bold text-pink-300">{validationResult.dataset_summary.columns}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-1">File Size</p>
                        <p className="text-2xl font-bold text-cyan-300">{validationResult.dataset_summary.file_size_mb} MB</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-1">Score</p>
                        <p className="text-2xl font-bold text-green-300">{validationResult.satisfaction_score}/100</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Goal Understanding */}
                {validationResult.goal_understanding && (
                  <div className="backdrop-blur-2xl bg-slate-900/60 border border-green-500/30 rounded-2xl p-6">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <span>🎯</span>
                      Goal Understanding
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Task Type:</span>
                        <span className="font-semibold text-indigo-300">{validationResult.goal_understanding.interpreted_task}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Target Column:</span>
                        <span className="font-semibold text-pink-300">{validationResult.goal_understanding.target_column_guess}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="font-semibold text-green-300">{(validationResult.goal_understanding.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full JSON Response (Collapsible) */}
                <details className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6">
                  <summary className="text-xl font-bold cursor-pointer hover:text-indigo-300 transition-colors">
                    🔍 View Full API Response
                  </summary>
                  <div className="mt-4 bg-slate-800/50 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-green-300">{JSON.stringify(validationResult, null, 2)}</pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center py-6 text-gray-400 text-sm">💡 Pro Tip: The more details you provide, the better the AI can assist you!</footer>
    </div>
  );
};

export default MLStudioAdvanced;