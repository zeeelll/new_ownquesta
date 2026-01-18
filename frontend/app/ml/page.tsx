"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './ml.css';

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

const MLPage: React.FC = () => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const [currentStep, setCurrentStep] = useState<'upload' | 'validate' | 'configure'>('upload');
  const [uploadedFile, setUploadedFile] = useState<DataFile | null>(null);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [userQuery, setUserQuery] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{ name?: string; avatar?: string } | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const router = useRouter();
    
    // Fetch user data
    fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUser({ name: data.user.name, avatar: data.user.avatar });
        }
      })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setUserDropdownOpen(false);
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } finally {
      window.location.href = '/';
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };
    fetchUser();
  }, [BACKEND_URL]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload a valid CSV or Excel file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size should be less than 50MB');
      return;
    }

    setIsProcessing(true);

    // Simulate file processing
    setTimeout(() => {
      const fileData: DataFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadTime: new Date().toLocaleTimeString()
      };

      setUploadedFile(fileData);

      // Generate mock preview data
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

      // AI Agent greeting message
      setChatMessages([
        {
          type: 'ai',
          text: `Great! I've successfully loaded your dataset "${file.name}". I can see it has ${mockPreview.columnCount} columns and ${mockPreview.rowCount.toLocaleString()} rows. What would you like to predict or analyze from this data?`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!userQuery.trim()) return;

    const userMsg: ChatMessage = {
      type: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setUserQuery('');

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = '';
      
      if (userQuery.toLowerCase().includes('predict') || userQuery.toLowerCase().includes('forecast')) {
        aiResponse = `Excellent! I understand you want to build a predictive model. Based on your data, I can see several potential features we can use. The "${selectedTask || 'Status'}" column seems like a good target variable for prediction. Would you like me to suggest some preprocessing steps first?`;
      } else if (userQuery.toLowerCase().includes('classification')) {
        aiResponse = `Classification is a great approach! I've identified that this is a binary classification problem. The data looks clean, but we might want to check for missing values and normalize the numeric columns. Shall we proceed with feature engineering?`;
      } else if (userQuery.toLowerCase().includes('regression')) {
        aiResponse = `Perfect! For regression analysis, I'll help you predict numerical values. Based on your features, we can create several polynomial and interaction terms. The current features show good variance. Ready to start model training?`;
      } else {
        aiResponse = `That's an interesting question! Let me analyze your data further. I notice your dataset has strong patterns in the ${dataPreview?.columns[Math.floor(Math.random() * dataPreview.columns.length)] || 'feature'} column. What specific outcome are you trying to achieve?`;
      }

      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }, 800);
  };

  if (!isHydrated) return null;

  return (
    <>
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-8 bg-slate-900/80 backdrop-blur-xl border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <a href="/home" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6e54c8] to-[#7c49a9] rounded-xl flex items-center justify-center font-bold text-white relative overflow-hidden shadow-[0_4px_12px_rgba(110,84,200,0.4)]">
              <div className="absolute inset-0 w-[150%] h-[150%] bg-gradient-to-br from-transparent via-[rgba(255,255,255,0.3)] to-transparent logo-shine" />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
                <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="white" opacity="0.7"/>
                <path d="M12 12L2 7V12L12 17L22 12V7L12 12Z" fill="white" opacity="0.5"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-white">Ownquesta</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-slate-700/50 border border-slate-600/20 backdrop-blur-md hover:bg-slate-700/80 transition-all"
          >
            Back
          </button>
        </div>
      </nav>

      <div className="ml-container">
      {/* Header */}
      <div className="ml-header">
        <div className="ml-header-content">
          <div className="ml-title">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Machine Learning Studio</span>
          </div>
          <div className="ml-breadcrumb">
            <span className={`breadcrumb-item ${currentStep === 'upload' ? 'active' : ''}`}>
              <span className="breadcrumb-number">1</span>
              <span>Upload Dataset</span>
            </span>
            <span className={`breadcrumb-item ${currentStep === 'validate' ? 'active' : ''}`}>
              <span className="breadcrumb-number">2</span>
              <span>Validate & Preview</span>
            </span>
            <span className={`breadcrumb-item ${currentStep === 'configure' ? 'active' : ''}`}>
              <span className="breadcrumb-number">3</span>
              <span>Configure Model</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-content">
        {currentStep === 'upload' && (
          <div className="ml-section upload-section">
            <div className="section-title">
              <h2>
                <svg className="w-6 h-6 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Your Dataset
              </h2>
              <p>Support CSV and Excel formats (Max 50MB)</p>
            </div>

            <div
              className={`upload-area ${dragActive ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div className="upload-icon">
                {isProcessing ? (
                  <div className="spinner"></div>
                ) : (
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                )}
              </div>

              <div className="upload-text">
                <h3>{isProcessing ? 'Processing...' : 'Drag & Drop Your File Here'}</h3>
                <p>or click to browse</p>
              </div>

              <div className="upload-formats">
                <span className="format-badge">CSV</span>
                <span className="format-badge">XLSX</span>
                <span className="format-badge">XLS</span>
              </div>
            </div>

            <div className="upload-info">
              <div className="info-card">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <div>
                  <h4>What's supported?</h4>
                  <p>CSV, Excel (.xlsx, .xls) formats with structured data</p>
                </div>
              </div>

              <div className="info-card">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
                  <path d="M16.5 12.5l-5.5 3.5-3.5-2.5"></path>
                </svg>
                <div>
                  <h4>Data Privacy</h4>
                  <p>Your data is processed securely and never stored permanently</p>
                </div>
              </div>

              <div className="info-card">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <div>
                  <h4>File Size Limit</h4>
                  <p>Maximum 50MB per file</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'validate' && dataPreview && (
          <div className="ml-section validate-section">
            <div className="section-header">
              <div className="section-title">
                <h2>
                  <svg className="w-6 h-6 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Dataset Preview & Validation
                </h2>
                <p>File: {uploadedFile?.name}</p>
              </div>
              <button className="btn-reset" onClick={() => {
                setCurrentStep('upload');
                setUploadedFile(null);
                setDataPreview(null);
                setChatMessages([]);
              }}>
                ↻ Upload Different File
              </button>
            </div>

            <div className="validate-grid">
              {/* Data Statistics */}
              <div className="data-stats">
                <div className="stat-box">
                  <div className="stat-icon rows">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">Total Rows</div>
                    <div className="stat-value">{dataPreview.rowCount.toLocaleString()}</div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon cols">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">Total Columns</div>
                    <div className="stat-value">{dataPreview.columnCount}</div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon size">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">File Size</div>
                    <div className="stat-value">{dataPreview.fileSize}</div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon health">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">Data Quality</div>
                    <div className="stat-value">98%</div>
                  </div>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="data-preview">
                <h3>Data Sample</h3>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {dataPreview.columns.map((col, idx) => (
                          <th key={idx}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataPreview.rows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="table-note">Showing 5 of {dataPreview.rowCount.toLocaleString()} rows</p>
              </div>

              {/* ML Task Selection */}
              <div className="ml-tasks">
                <h3>Select ML Task</h3>
                <div className="task-options">
                  {[
                    { id: 'classification', label: 'Classification', desc: 'Predict categories (e.g., Yes/No)', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                    { id: 'regression', label: 'Regression', desc: 'Predict numerical values', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
                    { id: 'clustering', label: 'Clustering', desc: 'Group similar data points', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
                    { id: 'anomaly', label: 'Anomaly Detection', desc: 'Find outliers and unusual patterns', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg> }
                  ].map(task => (
                    <button
                      key={task.id}
                      className={`task-btn ${selectedTask === task.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTask(task.id)}
                    >
                      <div className="task-label">
                        {task.icon}
                        <span className="ml-2">{task.label}</span>
                      </div>
                      <div className="task-desc">{task.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Quality Checks */}
              <div className="quality-checks">
                <h3>Data Quality Report</h3>
                <div className="check-list">
                  <div className="check-item success">
                    <span className="check-icon">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="check-text">No missing values detected</span>
                  </div>
                  <div className="check-item success">
                    <span className="check-icon">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="check-text">Data types detected correctly</span>
                  </div>
                  <div className="check-item success">
                    <span className="check-icon">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="check-text">Outliers identified: 2 (&lt; 0.1%)</span>
                  </div>
                  <div className="check-item warning">
                    <span className="check-icon">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </span>
                    <span className="check-text">Some columns may need normalization</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'validate' && (
          <div className="ml-section chat-section">
            <div className="section-title">
              <h2>
                <svg className="w-6 h-6 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                ML Agent Assistant
              </h2>
              <p>Describe what you want to predict or analyze</p>
            </div>

            <div className="chat-container">
              <div className="chat-messages">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`message message-${msg.type}`}>
                    <div className="message-avatar">
                      {msg.type === 'user' ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{msg.text}</div>
                      <div className="message-time">{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="chat-input-area">
                <div className="chat-input-group">
                  <input
                    type="text"
                    placeholder="Ask the AI: What would you like to predict? (e.g., 'Predict customer churn')"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="chat-input"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!userQuery.trim()}
                    className="chat-send-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>

                <div className="quick-prompts">
                  <button
                    className="quick-prompt"
                    onClick={() => {
                      setUserQuery('I want to predict customer churn');
                      handleSendMessage();
                    }}
                  >
                    Predict churn
                  </button>
                  <button
                    className="quick-prompt"
                    onClick={() => {
                      setUserQuery('Build a classification model');
                      handleSendMessage();
                    }}
                  >
                    Classification model
                  </button>
                  <button
                    className="quick-prompt"
                    onClick={() => {
                      setUserQuery('Forecast future values');
                      handleSendMessage();
                    }}
                  >
                    Forecast values
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="ml-footer">
        <p>💡 Pro Tip: The more details you provide, the better the AI can assist you in building your model!</p>
      </div>
    </div>
  </>
);
};

export default MLPage;
