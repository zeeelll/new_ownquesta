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
  const [detectedGoal, setDetectedGoal] = useState<any>(null);
  const [showCode, setShowCode] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [resultsView, setResultsView] = useState<'overview' | 'detailed' | 'insights' | 'qa'>('overview');
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

  // Detect goal when userQuery changes
  useEffect(() => {
    if (userQuery) {
      const goal = detectGoal(userQuery);
      setDetectedGoal(goal);
    }
  }, [userQuery]);

  const detectGoal = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    const supervisedKeywords = ['predict', 'classification', 'regression', 'forecast', 'supervised',
                                'target', 'label', 'outcome', 'predict price', 'predict sales',
                                'classify', 'categorize', 'model', 'train'];
    const unsupervisedKeywords = ['cluster', 'segment', 'pattern', 'group', 'unsupervised',
                                  'anomaly', 'outlier', 'similarity', 'discover', 'grouping'];
    const edaKeywords = ['analyze', 'explore', 'understand', 'insights', 'statistics',
                         'visualize', 'eda', 'exploratory', 'summary'];

    const supervisedScore = supervisedKeywords.filter(kw => input.includes(kw)).length;
    const unsupervisedScore = unsupervisedKeywords.filter(kw => input.includes(kw)).length;
    const edaScore = edaKeywords.filter(kw => input.includes(kw)).length;

    if (supervisedScore > unsupervisedScore && supervisedScore > edaScore) {
      return {
        type: 'supervised',
        description: 'Supervised Learning (Prediction/Classification)',
        focus: ['Target variable identification', 'Feature importance', 'Missing value impact',
                'Class balance (if classification)', 'Feature correlations with target']
      };
    } else if (unsupervisedScore > supervisedScore && unsupervisedScore > edaScore) {
      return {
        type: 'unsupervised',
        description: 'Unsupervised Learning (Clustering/Pattern Discovery)',
        focus: ['Feature scaling requirements', 'Outlier detection', 'Feature variance',
                'Correlation patterns', 'Dimensionality considerations']
      };
    } else {
      return {
        type: 'eda',
        description: 'Exploratory Data Analysis',
        focus: ['Data quality assessment', 'Statistical summaries', 'Distribution analysis',
                'Correlation insights', 'Missing data patterns']
      };
    }
  };

  const askQuestion = async () => {
    if (!currentQuestion.trim() || !edaResults) return;

    const question = currentQuestion.trim();
    setCurrentQuestion('');

    try {
      const response = await fetch('/api/validation/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          eda_results: edaResults
        })
      });

      if (response.ok) {
        const result = await response.json();
        setQuestions(prev => [...prev, {
          question: question,
          answer: result.answer,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } else {
        setQuestions(prev => [...prev, {
          question: question,
          answer: 'Sorry, I couldn\'t process your question. Please try rephrasing.',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error) {
      setQuestions(prev => [...prev, {
        question: question,
        answer: 'Error connecting to analysis service. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

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
      const res = await fetch('/api/validation/question', {
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

  const generateCode = () => {
    if (!edaResults) return 'No EDA results available';
    
    return `# Generated EDA and ML Pipeline Code
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Load your dataset
df = pd.read_csv('your_dataset.csv')

# Dataset Overview
print("Dataset Shape:", df.shape)
print("\nColumn Types:")
print(df.dtypes)

# Basic Statistics
print("\nStatistical Summary:")
print(df.describe())

# Missing Values Analysis
print("\nMissing Values:")
print(df.isnull().sum())

# Correlation Analysis
numerical_cols = df.select_dtypes(include=[np.number]).columns
if len(numerical_cols) > 1:
    plt.figure(figsize=(12, 8))
    sns.heatmap(df[numerical_cols].corr(), annot=True, cmap='coolwarm', center=0)
    plt.title('Feature Correlation Matrix')
    plt.tight_layout()
    plt.show()

# Feature Distribution Analysis
for col in numerical_cols:
    plt.figure(figsize=(15, 6))
    
    plt.subplot(1, 3, 1)
    df[col].hist(bins=30, alpha=0.7, color='skyblue')
    plt.title(f'{col} - Distribution')
    plt.xlabel(col)
    plt.ylabel('Frequency')
    
    plt.subplot(1, 3, 2)
    df.boxplot(column=col, ax=plt.gca())
    plt.title(f'{col} - Boxplot')
    
    plt.subplot(1, 3, 3)
    from scipy import stats
    stats.probplot(df[col].dropna(), dist="norm", plot=plt)
    plt.title(f'{col} - Q-Q Plot')
    
    plt.tight_layout()
    plt.show()

# Categorical Features Analysis
categorical_cols = df.select_dtypes(include=['object']).columns
for col in categorical_cols:
    plt.figure(figsize=(10, 6))
    value_counts = df[col].value_counts().head(10)
    value_counts.plot(kind='bar')
    plt.title(f'{col} - Top 10 Values')
    plt.xlabel(col)
    plt.ylabel('Count')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

print("\nEDA Analysis Complete!")
`;
  };

  const openCodeWindow = () => {
    const code = validationResult?.implementationCode?.full_pipeline || 
                 validationResult?.implementationCode?.eda_code || 
                 generateCode();
    
    const w = window.open('', '_blank');
    if (w) {
      w.document.title = 'Validation Agent - Implementation Code';
      w.document.body.style.background = '#0b1220';
      w.document.body.style.color = '#d1fae5';
      w.document.body.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
      w.document.body.style.padding = '20px';
      w.document.body.style.margin = '0';
      
      const pre = w.document.createElement('pre');
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.fontSize = '14px';
      pre.style.lineHeight = '1.5';
      pre.textContent = code;
      w.document.body.appendChild(pre);
    }
  };

  const quickReplies = validationResult?.optional_questions || ['Show dataset summary', 'Any missing values?', 'Which features are important?'];

  const renderOverview = () => {
    if (!edaResults && !validationResult) return <div className="text-gray-400 p-4">No analysis data available</div>;

    return (
      <div className="space-y-4 p-4 max-h-96 overflow-y-auto">
        {edaResults && (
          <div className="bg-slate-800/40 rounded-lg border border-slate-700/30 p-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center text-blue-300">
              <span className="mr-2">📊</span>
              Dataset Overview
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-blue-500/10 rounded">
                <div className="text-lg font-bold text-blue-400">{edaResults.shape?.rows || 'N/A'}</div>
                <div className="text-xs text-gray-400">Rows</div>
              </div>
              <div className="text-center p-2 bg-green-500/10 rounded">
                <div className="text-lg font-bold text-green-400">{edaResults.shape?.columns || 'N/A'}</div>
                <div className="text-xs text-gray-400">Columns</div>
              </div>
            </div>
          </div>
        )}

        {detectedGoal && (
          <div className="bg-slate-800/40 rounded-lg border border-slate-700/30 p-4">
            <h4 className="text-sm font-semibold text-purple-300 mb-2">🎯 Detected Goal</h4>
            <p className="text-sm text-gray-300 mb-2">{detectedGoal.description}</p>
            <div className="space-y-1">
              {detectedGoal.focus.slice(0, 3).map((item: string, index: number) => (
                <div key={index} className="flex items-center text-xs text-gray-400">
                  <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {validationResult && (
          <div className="bg-slate-800/40 rounded-lg border border-slate-700/30 p-4">
            <h4 className="text-sm font-semibold text-yellow-300 mb-2">🤖 AI Analysis</h4>
            <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${
              validationResult.status === 'PROCEED' ? 'bg-green-500/20 text-green-300' :
              validationResult.status === 'PAUSE' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }`}>
              {validationResult.status === 'PROCEED' ? '✅ Ready' : 
               validationResult.status === 'PAUSE' ? '⚠️ Needs Review' : '❌ Issues Found'}
            </div>
            <p className="text-xs text-gray-400 mt-2">Quality Score: {validationResult.satisfaction_score || 0}/100</p>
          </div>
        )}
      </div>
    );
  };

  const renderInsights = () => {
    return (
      <div className="space-y-4 p-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-purple-300">💡 Code & Insights</h4>
          <button
            onClick={() => setShowCode(!showCode)}
            className="px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded border border-blue-500/30 hover:bg-blue-600/30"
          >
            {showCode ? 'Hide' : 'Show'} Code
          </button>
        </div>
        
        {showCode && edaResults && (
          <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
            <div className="text-green-400 mb-2"># Generated EDA Code</div>
            <pre className="whitespace-pre-wrap">{`import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load dataset
df = pd.read_csv('${actualFile?.name || 'dataset.csv'}')

# Basic info
print("Shape:", df.shape)
print("\\nData Types:")
print(df.dtypes)

# Statistical summary
print("\\nSummary:")
print(df.describe())

# Missing values
print("\\nMissing Values:")
print(df.isnull().sum())

# Correlation matrix
numeric_cols = df.select_dtypes(include=[np.number]).columns
if len(numeric_cols) > 1:
    plt.figure(figsize=(8, 6))
    plt.imshow(df[numeric_cols].corr(), cmap='coolwarm')
    plt.colorbar()
    plt.title('Correlation Matrix')
    plt.show()`}</pre>
          </div>
        )}

        {edaResults?.insights && (
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-gray-300">📋 Key Findings:</h5>
            {edaResults.insights.dataQuality?.slice(0, 3).map((insight: string, index: number) => (
              <div key={index} className="p-2 bg-blue-500/10 rounded text-xs border-l-2 border-blue-400 text-gray-300">
                {insight}
              </div>
            )) || (
              <div className="text-xs text-gray-400">
                • Dataset contains {edaResults?.shape?.rows || 'unknown'} rows and {edaResults?.shape?.columns || 'unknown'} columns<br/>
                • {edaResults?.numericColumns?.length || 0} numerical and {edaResults?.objectColumns?.length || 0} categorical features
              </div>
            )}
          </div>
        )}

        {validationResult?.user_view_report && (
          <div className="bg-slate-800/40 rounded-lg border border-slate-700/30 p-3">
            <h5 className="text-xs font-semibold text-gray-300 mb-2">📄 Analysis Report</h5>
            <div className="text-xs text-gray-400 max-h-32 overflow-y-auto whitespace-pre-wrap">
              {validationResult.user_view_report.substring(0, 300)}...
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQA = () => {
    return (
      <div className="space-y-4 p-4 max-h-96 overflow-y-auto">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Ask about your data..."
              className="flex-1 px-2 py-1 text-xs bg-slate-800/40 border border-slate-700/30 rounded text-white placeholder-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
              disabled={!edaResults}
            />
            <button
              onClick={askQuestion}
              disabled={!currentQuestion.trim() || !edaResults}
              className="px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded border border-blue-500/30 hover:bg-blue-600/30 disabled:opacity-50"
            >
              Ask
            </button>
          </div>
          
          {!edaResults && (
            <div className="text-xs text-gray-500 text-center py-4">
              Run EDA first to enable Q&A
            </div>
          )}
        </div>

        {questions.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-xs font-semibold text-gray-300">💬 Q&A History:</h5>
            {questions.slice(-3).map((qa, index) => (
              <div key={index} className="space-y-1">
                <div className="bg-blue-500/10 p-2 rounded text-xs">
                  <span className="font-medium text-blue-300">Q:</span> {qa.question}
                </div>
                <div className="bg-green-500/10 p-2 rounded text-xs ml-2">
                  <span className="font-medium text-green-300">A:</span> {qa.answer.substring(0, 150)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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

          {activeTab === 'code' && renderInsights()}

          {activeTab === 'insights' && (
            <div className="h-full">
              {/* Enhanced Results View */}
              {(edaResults || validationResult) && (
                <div className="mb-3">
                  <div className="flex gap-1 border-b border-slate-700 mb-3">
                    <button onClick={() => setResultsView('overview')} className={`px-2 py-1 text-xs ${resultsView === 'overview' ? 'text-blue-300 border-b border-blue-300' : 'text-slate-400'}`}>Overview</button>
                    <button onClick={() => setResultsView('detailed')} className={`px-2 py-1 text-xs ${resultsView === 'detailed' ? 'text-blue-300 border-b border-blue-300' : 'text-slate-400'}`}>Detailed</button>
                    <button onClick={() => setResultsView('insights')} className={`px-2 py-1 text-xs ${resultsView === 'insights' ? 'text-blue-300 border-b border-blue-300' : 'text-slate-400'}`}>Code</button>
                    <button onClick={() => setResultsView('qa')} className={`px-2 py-1 text-xs ${resultsView === 'qa' ? 'text-blue-300 border-b border-blue-300' : 'text-slate-400'}`}>Q&A</button>
                  </div>
                  
                  {resultsView === 'overview' && renderOverview()}
                  {resultsView === 'detailed' && (
                    <div className="p-4 max-h-96 overflow-y-auto">
                      {edaResults?.numericalSummary && Object.keys(edaResults.numericalSummary).length > 0 && (
                        <div className="space-y-2 mb-4">
                          <h5 className="text-xs font-semibold text-blue-300">📊 Numerical Features</h5>
                          {Object.entries(edaResults.numericalSummary).slice(0, 3).map(([col, stats]: [string, any]) => (
                            <div key={col} className="bg-slate-800/40 rounded p-2 text-xs">
                              <div className="font-medium text-gray-300 mb-1">{col}</div>
                              <div className="grid grid-cols-3 gap-2 text-gray-400">
                                <div>Mean: {typeof stats.mean === 'number' ? stats.mean.toFixed(2) : 'N/A'}</div>
                                <div>Std: {typeof stats.std === 'number' ? stats.std.toFixed(2) : 'N/A'}</div>
                                <div>Count: {stats.count}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {edaResults?.objectSummary && Object.keys(edaResults.objectSummary).length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-semibold text-green-300">📝 Categorical Features</h5>
                          {Object.entries(edaResults.objectSummary).slice(0, 3).map(([col, stats]: [string, any]) => (
                            <div key={col} className="bg-slate-800/40 rounded p-2 text-xs">
                              <div className="font-medium text-gray-300 mb-1">{col}</div>
                              <div className="grid grid-cols-2 gap-2 text-gray-400">
                                <div>Unique: {stats.unique}</div>
                                <div>Top: {stats.topValues?.[0]?.value || 'N/A'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {resultsView === 'insights' && renderInsights()}
                  {resultsView === 'qa' && renderQA()}
                </div>
              )}
              
              {/* Fallback when no results */}
              {!edaResults && !validationResult && (
                <div className="text-xs text-slate-400 text-center p-8">
                  Run EDA or ML Validation to see insights and analysis
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationAgentWidget;
