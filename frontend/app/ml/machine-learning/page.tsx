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

const GradualBlur: React.FC<{ position?: 'top' | 'bottom'; height?: string; strength?: number }> = ({ 
  position = 'bottom', 
  height = '12rem',
  strength = 3
}) => {
  const divCount = 8;
  const blurDivs = [];
  
  for (let i = 1; i <= divCount; i++) {
    const progress = i / divCount;
    const blurValue = Math.pow(progress, 1.5) * strength;
    const increment = 100 / divCount;
    const p1 = (increment * i - increment).toFixed(1);
    const p2 = (increment * i).toFixed(1);
    
    const direction = position === 'top' ? 'to top' : 'to bottom';
    const gradient = `transparent ${p1}%, black ${p2}%`;
    
    blurDivs.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          inset: 0,
          maskImage: `linear-gradient(${direction}, ${gradient})`,
          WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
          backdropFilter: `blur(${blurValue.toFixed(2)}rem)`,
          WebkitBackdropFilter: `blur(${blurValue.toFixed(2)}rem)`,
        }}
      />
    );
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        [position]: 0,
        left: 0,
        right: 0,
        height,
        pointerEvents: 'none',
        zIndex: 10,
        isolation: 'isolate',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {blurDivs}
      </div>
    </div>
  );
};

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
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult = {
        status: 'Ready for Configuration',
        satisfaction_score: 87,
        agent_answer: 'Based on your dataset, I recommend using a **Classification** model to predict customer churn. The data quality is excellent with minimal missing values.',
        optional_questions: [
          'Would you like to include feature engineering steps?',
          'Should we perform data balancing for the target variable?',
          'Do you want to use cross-validation?'
        ],
        goal_understanding: {
          interpreted_task: 'Classification',
          target_column_guess: 'churn',
          confidence: 0.87
        },
        dataset_summary: {
          rows: dataPreview?.rowCount || 0,
          columns: dataPreview?.columnCount || 0,
          file_size_mb: (actualFile.size / (1024 * 1024)).toFixed(2),
          column_types: dataPreview?.columns.reduce((acc, col) => ({ ...acc, [col]: 'string' }), {}) || {}
        },
        user_view_report: '# Validation Report\n\n## Dataset Quality: ✅ Excellent\n\nYour dataset is well-structured and ready for machine learning.\n\n**Key Findings:**\n- No missing values detected\n- Balanced class distribution\n- Sufficient samples for training\n\n## Recommended Next Steps:\n1. Feature engineering\n2. Train-test split\n3. Model selection'
      };
      
      setValidationResult(mockResult);
      
      if (mockResult.agent_answer) {
        setChatMessages(prev => [...prev, {
          type: 'ai',
          text: mockResult.agent_answer,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }

      if (mockResult.optional_questions && mockResult.optional_questions.length > 0) {
        const questionsText = "📋 **Optional Questions:**\n" + 
          mockResult.optional_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
        
        setChatMessages(prev => [...prev, {
          type: 'ai',
          text: questionsText,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: `❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #6968A6 0%, #7C6BA4 25%, #9B7FA8 50%, #CF9893 75%, #E5B8A8 100%)'
    }}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.2); } 50% { box-shadow: 0 0 50px rgba(255, 255, 255, 0.4); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        .animate-slide { animation: slideIn 0.6s ease-out; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .glass-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .glass-card-strong {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
        }
        .text-gradient {
          background: linear-gradient(135deg, #ffffff 0%, #f0e7ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .number-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
        }
      `}</style>

      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full opacity-30 animate-float" 
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            top: '10%',
            left: '10%',
            animationDelay: '0s'
          }} 
        />
        <div className="absolute w-64 h-64 rounded-full opacity-20 animate-float" 
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
            top: '60%',
            right: '15%',
            animationDelay: '2s'
          }} 
        />
        <div className="absolute w-80 h-80 rounded-full opacity-25 animate-float" 
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            bottom: '10%',
            left: '50%',
            animationDelay: '4s'
          }} 
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card">
        <GradualBlur position="bottom" height="8rem" strength={2} />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl glass-card-strong flex items-center justify-center animate-glow">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                  <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">ML Studio</h1>
                <p className="text-sm text-white/70 uppercase tracking-widest font-light">AI-Powered Analytics</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {[
                { step: 1, label: 'Setup', key: 'setup' }, 
                { step: 2, label: 'Validate', key: 'validate' }, 
                { step: 3, label: 'Configure', key: 'configure' }
              ].map((item, idx) => (
                <React.Fragment key={item.key}>
                  <button
                    onClick={() => {
                      if (item.key === 'setup' || (item.key === 'validate' && uploadedFile) || (item.key === 'configure' && dataPreview)) {
                        setCurrentStep(item.key as any);
                      }
                    }}
                    disabled={item.key === 'validate' && !uploadedFile || item.key === 'configure' && !dataPreview}
                    className={`px-5 py-3 rounded-xl transition-all duration-300 ${
                      currentStep === item.key
                        ? 'glass-card-strong shadow-lg'
                        : 'glass-card opacity-60 hover:opacity-100'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold number-badge text-white">
                        {item.step}
                      </span>
                      <span className="text-sm font-medium text-white">{item.label}</span>
                    </div>
                  </button>
                  {idx < 2 && (
                    <div className={`w-10 h-0.5 transition-all ${
                      (idx === 0 && uploadedFile) || (idx === 1 && dataPreview) 
                        ? 'bg-white/40' 
                        : 'bg-white/15'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {currentStep === 'setup' && (
          <div className="animate-slide space-y-12">
            <div className="text-center space-y-6 mb-16">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-card">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <span className="text-sm text-white font-medium tracking-wide">AI-Powered Machine Learning</span>
              </div>
              <h2 className="text-6xl md:text-7xl font-bold text-white tracking-tight">
                Build Intelligent Models
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
                Describe your goal and upload your data. Let AI guide you through the entire pipeline.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
              {/* Query Section */}
              <div className="space-y-6 animate-slide" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl glass-card-strong flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Define Your Goal</h3>
                    <p className="text-sm text-white/70">What do you want to predict or analyze?</p>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-8 hover:shadow-2xl transition-all duration-300">
                  <textarea 
                    placeholder="Example: I want to predict which customers are likely to churn in the next 3 months..." 
                    value={userQuery} 
                    onChange={(e) => setUserQuery(e.target.value)} 
                    className="w-full h-56 bg-transparent border-none outline-none text-white placeholder-white/50 resize-none text-base leading-relaxed" 
                  />
                  <div className="flex flex-wrap gap-2 mt-6">
                    {['Predict customer churn', 'Forecast sales', 'Classify transactions'].map((p) => (
                      <button 
                        key={p} 
                        onClick={() => setUserQuery(p)} 
                        className="px-4 py-2 text-sm rounded-full glass-card hover:glass-card-strong transition-all text-white/90 hover:text-white"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: '🎯', title: 'Classification', example: 'Yes/No' }, 
                    { icon: '📈', title: 'Regression', example: '$100+' }, 
                    { icon: '🔗', title: 'Clustering', example: 'A, B, C' }
                  ].map((item) => (
                    <div 
                      key={item.title} 
                      className="glass-card rounded-xl p-5 hover:glass-card-strong hover:-translate-y-1 transition-all cursor-pointer group"
                    >
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                      <h4 className="text-sm font-semibold mb-2 text-white">{item.title}</h4>
                      <code className="text-xs text-white/70 px-3 py-1 rounded-full glass-card inline-block">
                        {item.example}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Section */}
              <div className="space-y-6 animate-slide" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl glass-card-strong flex items-center justify-center">
                    <span className="text-2xl">📤</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Upload Dataset</h3>
                    <p className="text-sm text-white/70">CSV or Excel (Max 50MB)</p>
                  </div>
                </div>

                <div 
                  className={`glass-card rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
                    dragActive ? 'glass-card-strong scale-105' : 'hover:glass-card-strong'
                  } ${isProcessing ? 'pointer-events-none' : ''}`} 
                  onDragEnter={handleDrag} 
                  onDragLeave={handleDrag} 
                  onDragOver={handleDrag} 
                  onDrop={handleDrop} 
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept=".csv,.xlsx,.xls" 
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} 
                    className="hidden" 
                  />
                  {isProcessing ? (
                    <div className="space-y-6">
                      <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-white/20" />
                        <div 
                          className="absolute inset-0 rounded-full border-4 border-transparent border-t-white" 
                          style={{ animation: 'spin 1s linear infinite' }} 
                        />
                      </div>
                      <p className="text-white/80 font-medium text-lg">Processing...</p>
                    </div>
                  ) : (
                    <>
                      <div className="relative inline-block mb-8">
                        <div 
                          className="absolute inset-0 bg-white rounded-full blur-2xl opacity-30" 
                          style={{ animation: 'pulse-ring 2s ease-out infinite' }} 
                        />
                        <svg className="w-20 h-20 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-semibold mb-3 text-white">Drop your file here</h4>
                      <p className="text-sm text-white/60 mb-6">or click to browse</p>
                      <div className="flex gap-3 justify-center">
                        {['CSV', 'XLSX', 'XLS'].map((f) => (
                          <span 
                            key={f} 
                            className="px-4 py-2 text-sm rounded-full glass-card text-white font-medium"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {uploadedFile && (
                  <div className="glass-card-strong rounded-xl p-5 animate-slide">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl glass-card-strong flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-white">{uploadedFile.name}</p>
                        <p className="text-sm text-white/60">
                          {(uploadedFile.size / 1024).toFixed(2)} KB • {uploadedFile.uploadTime}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setUploadedFile(null); 
                          setDataPreview(null); 
                          setChatMessages([]); 
                          setActualFile(null); 
                          setValidationResult(null); 
                        }} 
                        className="px-5 py-2.5 text-sm rounded-xl glass-card hover:glass-card-strong transition-all text-white"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card rounded-xl p-5 hover:glass-card-strong hover:-translate-y-1 transition-all">
                    <svg className="w-6 h-6 text-white/80 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-sm font-semibold mb-1 text-white">Supported</h4>
                    <p className="text-xs text-white/60">CSV, Excel formats</p>
                  </div>
                  <div className="glass-card rounded-xl p-5 hover:glass-card-strong hover:-translate-y-1 transition-all">
                    <svg className="w-6 h-6 text-white/80 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h4 className="text-sm font-semibold mb-1 text-white">Secure</h4>
                    <p className="text-xs text-white/60">Never stored</p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!canProceedFromSetup || isProcessing || isValidating) return;
                    setCurrentStep('validate');
                    await validateWithAPI();
                  }}
                  disabled={!canProceedFromSetup || isProcessing || isValidating}
                  className="w-full py-5 rounded-xl glass-card-strong hover:shadow-2xl font-semibold transition-all flex items-center justify-center gap-3 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-1"
                >
                  <span className="text-lg">Proceed & Validate</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'validate' && dataPreview && (
          <div className="animate-slide space-y-10">
            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-6">
              <div>
                <h2 className="text-5xl font-bold text-white mb-3">Dataset Validation</h2>
                <p className="text-white/70 text-lg">File: {uploadedFile?.name}</p>
              </div>
              <button 
                onClick={() => { 
                  setCurrentStep('setup'); 
                  setUploadedFile(null); 
                  setDataPreview(null); 
                  setChatMessages([]); 
                  setUserQuery(''); 
                  setActualFile(null); 
                  setValidationResult(null); 
                }} 
                className="px-8 py-4 rounded-xl glass-card hover:glass-card-strong text-white font-medium transition-all hover:-translate-y-1"
              >
                ↻ Start Over
              </button>
            </div>

            {/* Status & Score Card */}
            {validationResult && (
              <div className="glass-card-strong rounded-3xl p-10">
                <div className="grid md:grid-cols-2 gap-10">
                  {/* Status Section */}
                  <div className="flex flex-col items-center justify-center space-y-6 p-8 rounded-2xl glass-card">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                        <circle 
                          cx="80" 
                          cy="80" 
                          r="70" 
                          fill="none" 
                          stroke="white" 
                          strokeWidth="10"
                          strokeDasharray={`${(validationResult.satisfaction_score / 100) * 439.82} 439.82`}
                          style={{ 
                            transition: 'stroke-dasharray 1.5s ease-out',
                            filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.6))'
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold text-white">{validationResult.satisfaction_score}</span>
                        <span className="text-sm text-white/60 uppercase tracking-wider">Quality</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-card">
                        <span className="text-2xl">✓</span>
                        <span className="text-white font-semibold text-lg">{validationResult.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Goal Understanding */}
                  <div className="space-y-5 p-8 rounded-2xl glass-card">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="text-3xl">🎯</span> Goal Understanding
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 rounded-xl glass-card">
                        <span className="text-sm text-white/70">Interpreted Task</span>
                        <span className="font-semibold text-white">{validationResult.goal_understanding?.interpreted_task || 'Not yet identified'}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-xl glass-card">
                        <span className="text-sm text-white/70">Target Column</span>
                        <span className="font-semibold text-white">{validationResult.goal_understanding?.target_column_guess || 'Pending'}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-xl glass-card">
                        <span className="text-sm text-white/70">Confidence</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-3 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white" 
                              style={{ 
                                width: `${(validationResult.goal_understanding?.confidence || 0) * 100}%`, 
                                transition: 'width 1s ease-out',
                                boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-white">{Math.round((validationResult.goal_understanding?.confidence || 0) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dataset Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span className="text-sm">Analyzing...</span>
                    </div>
                  ) : (
                    validationResult?.satisfaction_score ? `${validationResult.satisfaction_score}%` : 'Pending'
                  ),
                }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass-card rounded-2xl p-8 hover:glass-card-strong hover:-translate-y-2 transition-all group"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{stat.icon}</div>
                  <p className="text-sm text-white/60 mb-2 uppercase tracking-wider font-light">{stat.label}</p>
                  <div className="text-3xl font-bold text-white">
                    {typeof stat.value === 'string' || typeof stat.value === 'number' ? stat.value : stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Column Types Explorer */}
            {validationResult?.dataset_summary?.column_types && (
              <div className="glass-card rounded-3xl p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                  <span className="text-3xl">🔬</span> Column Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(validationResult.dataset_summary.column_types).map(([col, type]: [string, any]) => (
                    <div 
                      key={col} 
                      className="group p-5 rounded-xl glass-card hover:glass-card-strong transition-all hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="font-semibold text-white truncate group-hover:text-white transition-colors">{col}</span>
                        <span className="text-xs px-3 py-1 rounded-full glass-card text-white/80 whitespace-nowrap ml-2">
                          {type}
                        </span>
                      </div>
                      <div className="text-xs text-white/60">
                        {type === 'string' && '📝 Text data'}
                        {type === 'int' && '🔢 Integer'}
                        {type === 'float' && '📊 Decimal'}
                        {type === 'category' && '🏷️ Category'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Sample with View Modes */}
            <div className="glass-card rounded-3xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold flex items-center gap-3 text-white">
                  <span className="text-3xl">📊</span> Data Sample Preview
                </h3>
                <div className="flex gap-3">
                  {['first', 'last', 'all'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as any)}
                      className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                        viewMode === mode
                          ? 'glass-card-strong text-white shadow-lg'
                          : 'glass-card text-white/70 hover:text-white'
                      }`}
                    >
                      {mode === 'first' && 'First 5'}
                      {mode === 'last' && 'Last 5'}
                      {mode === 'all' && 'View All'}
                    </button>
                  ))}
                </div>
              </div>
              <div className={`overflow-x-auto rounded-2xl ${viewMode === 'all' ? 'max-h-96 overflow-y-auto' : ''}`}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 glass-card-strong backdrop-blur-xl z-10">
                    <tr className="border-b border-white/20">
                      {dataPreview.columns.map((col, i) => (
                        <th key={i} className="text-left p-5 font-bold text-white whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataPreview.rows.map((row, i) => (
                      <tr key={i} className="border-b border-white/10 hover:bg-white/5 transition-colors group">
                        {row.map((cell, j) => (
                          <td key={j} className="p-5 text-white/80 group-hover:text-white transition-colors whitespace-nowrap">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-white/50 mt-6 flex items-center gap-2">
                <span>📌</span>
                Showing {viewMode === 'all' ? 'all' : viewMode === 'last' ? 'last' : 'first'} {viewMode === 'all' ? dataPreview.rowCount.toLocaleString() : Math.min(5, dataPreview.rowCount)} of {dataPreview.rowCount.toLocaleString()} rows
              </p>
            </div>

            {/* ML Agent Assistant */}
            <div className="glass-card-strong rounded-3xl p-10">
              <h3 className="text-3xl font-bold mb-8 flex items-center gap-4 text-white">
                <span className="text-4xl animate-bounce">🤖</span>
                <span>ML Agent Assistant</span>
              </h3>
              
              {/* Chat Messages */}
              <div className="space-y-5 mb-8 max-h-96 overflow-y-auto p-6 rounded-2xl glass-card">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-6xl mb-6 animate-pulse">💬</div>
                    <p className="text-white/60 text-lg">Agent insights will appear here...</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.type === 'ai' && (
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full glass-card-strong flex items-center justify-center">
                            <span className="text-lg">🤖</span>
                          </div>
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl animate-slide ${
                        msg.type === 'user'
                          ? 'glass-card-strong text-white rounded-br-none'
                          : 'glass-card text-white rounded-bl-none'
                      }`}>
                        {msg.type === 'ai' ? renderMessage(msg.text) : msg.text}
                        <div className={`text-xs mt-3 ${msg.type === 'user' ? 'text-white/60' : 'text-white/50'}`}>
                          {msg.timestamp}
                        </div>
                      </div>
                      {msg.type === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full glass-card-strong flex items-center justify-center">
                            <span className="text-lg">👤</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Section */}
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Ask: What would you like to predict?" 
                  value={userQuery} 
                  onChange={(e) => setUserQuery(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
                  className="flex-1 px-6 py-4 rounded-xl glass-card text-white placeholder-white/50 outline-none transition-all focus:glass-card-strong" 
                />
                <button 
                  onClick={handleSendMessage} 
                  disabled={!userQuery.trim()} 
                  className="px-8 py-4 rounded-xl glass-card-strong hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-white"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Validation Results */}
            {validationResult && (
              <div className="space-y-8">
                {/* Clarification Questions */}
                {validationResult.clarification_questions && validationResult.clarification_questions.length > 0 && (
                  <div className="glass-card rounded-3xl p-10">
                    <h3 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white">
                      <span className="text-4xl">❓</span> Clarification Questions
                    </h3>
                    <div className="space-y-4">
                      {validationResult.clarification_questions.map((q: string, i: number) => (
                        <div key={i} className="p-6 rounded-xl glass-card hover:glass-card-strong transition-all cursor-pointer hover:-translate-y-1">
                          <div className="flex gap-4">
                            <span className="text-2xl font-bold text-white min-w-fit">{i + 1}.</span>
                            <p className="text-white text-lg">{q}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional Questions */}
                {validationResult.optional_questions && validationResult.optional_questions.length > 0 && (
                  <div className="glass-card rounded-3xl p-10">
                    <h3 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white">
                      <span className="text-4xl">💡</span> Optional Questions
                    </h3>
                    <div className="space-y-4">
                      {validationResult.optional_questions.map((q: string, i: number) => (
                        <div key={i} className="p-6 rounded-xl glass-card hover:glass-card-strong transition-all cursor-pointer hover:-translate-y-1">
                          <div className="flex gap-4">
                            <span className="text-2xl font-bold text-white min-w-fit">{i + 1}.</span>
                            <p className="text-white text-lg">{q}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full API Response */}
                <details className="glass-card rounded-3xl p-10 group cursor-pointer">
                  <summary className="text-2xl font-bold flex items-center gap-3 transition-colors text-white hover:text-white/80">
                    <span className="text-3xl">📊</span> 
                    <span>Full API Response</span>
                    <svg className="w-7 h-7 ml-auto transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </summary>
                  <div className="mt-8 p-8 rounded-2xl glass-card">
                    <div className="font-mono text-sm text-white/80 overflow-x-auto max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap break-words">{JSON.stringify(validationResult, null, 2)}</pre>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Configure Button */}
            {validationResult && (
              <button 
                onClick={() => setCurrentStep('configure')} 
                className="w-full py-5 px-6 rounded-xl glass-card-strong hover:shadow-2xl font-semibold transition-all flex items-center justify-center gap-3 text-white text-lg hover:-translate-y-1"
              >
                <span>✨ Next: Configure Model</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            )}
          </div>
        )}

        {currentStep === 'configure' && (
          <div className="animate-slide space-y-10">
            <div className="text-center space-y-6">
              <h2 className="text-5xl font-bold text-white">Model Configuration</h2>
              <p className="text-white/70 text-xl">Your model is being configured based on the validation results</p>
            </div>
            
            {validationResult && (
              <div className="space-y-8">
                {/* User View Report */}
                {validationResult.user_view_report && (
                  <div className="glass-card rounded-3xl p-10">
                    <div className="prose prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-base leading-relaxed">
                        {validationResult.user_view_report.split('\n').map((line: string, i: number) => {
                          if (line.startsWith('# ')) {
                            return <h1 key={i} className="text-4xl font-bold text-white mb-6">{line.substring(2)}</h1>;
                          } else if (line.startsWith('## ')) {
                            return <h2 key={i} className="text-3xl font-bold text-white mt-8 mb-4">{line.substring(3)}</h2>;
                          } else if (line.startsWith('- ')) {
                            return <li key={i} className="ml-6 text-white/80 text-lg">{line.substring(2)}</li>;
                          } else if (line.match(/^\d+\./)) {
                            return <li key={i} className="ml-6 text-white/80 text-lg">{line}</li>;
                          } else if (line.includes('**')) {
                            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
                            return <p key={i} className="text-white/80 mb-3 text-lg" dangerouslySetInnerHTML={{ __html: formatted }} />;
                          } else if (line.trim()) {
                            return <p key={i} className="text-white/70 mb-3 text-lg">{line}</p>;
                          } else {
                            return <br key={i} />;
                          }
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dataset Summary */}
                {validationResult.dataset_summary && (
                  <div className="glass-card rounded-3xl p-8">
                    <h3 className="text-3xl font-bold mb-6 text-white">📊 Dataset Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="glass-card rounded-2xl p-6">
                        <p className="text-sm text-white/60 mb-2">Rows</p>
                        <p className="text-3xl font-bold text-white">{validationResult.dataset_summary.rows?.toLocaleString()}</p>
                      </div>
                      <div className="glass-card rounded-2xl p-6">
                        <p className="text-sm text-white/60 mb-2">Columns</p>
                        <p className="text-3xl font-bold text-white">{validationResult.dataset_summary.columns}</p>
                      </div>
                      <div className="glass-card rounded-2xl p-6">
                        <p className="text-sm text-white/60 mb-2">File Size</p>
                        <p className="text-3xl font-bold text-white">{validationResult.dataset_summary.file_size_mb} MB</p>
                      </div>
                      <div className="glass-card rounded-2xl p-6">
                        <p className="text-sm text-white/60 mb-2">Score</p>
                        <p className="text-3xl font-bold text-white">{validationResult.satisfaction_score}/100</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Goal Understanding */}
                {validationResult.goal_understanding && (
                  <div className="glass-card rounded-3xl p-8">
                    <h3 className="text-3xl font-bold mb-6 flex items-center gap-3 text-white">
                      <span>🎯</span> Goal Understanding
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-lg">Task Type:</span>
                        <span className="font-semibold text-white text-lg">{validationResult.goal_understanding.interpreted_task}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-lg">Target Column:</span>
                        <span className="font-semibold text-white text-lg">{validationResult.goal_understanding.target_column_guess}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-lg">Confidence:</span>
                        <span className="font-semibold text-white text-lg">{(validationResult.goal_understanding.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full JSON Response */}
                <details className="glass-card rounded-3xl p-8">
                  <summary className="text-2xl font-bold cursor-pointer text-white hover:text-white/80 transition-colors">
                    🔍 View Full API Response
                  </summary>
                  <div className="mt-6 glass-card rounded-2xl p-6 font-mono text-sm overflow-x-auto">
                    <pre className="text-white/80">{JSON.stringify(validationResult, null, 2)}</pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center py-8 text-white/60 text-sm">
        <GradualBlur position="top" height="8rem" strength={2} />
        💡 Pro Tip: The more details you provide, the better the AI can assist you!
      </footer>
    </div>
  );
};

export default MLStudioAdvanced;