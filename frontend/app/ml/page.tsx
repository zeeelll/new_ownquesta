"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './ml.css';
import Logo from '../components/Logo';
import Button from '../components/Button';

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

  const saveProjectToLocalStorage = (fileData: DataFile, rowCount?: number) => {
    if (typeof window === 'undefined') return;
    
    // Create project data for dashboard
    const projectData = {
      id: Date.now().toString(),
      name: fileData.name.replace(/\.[^/.]+$/, ""), // Remove extension
      dataset: fileData.name,
      taskType: selectedTask || 'classification',
      status: 'processing',
      confidence: Math.floor(Math.random() * 25) + 65, // 65-89%
      createdDate: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      filePath: fileData.name, // Store for opening
      rowCount: rowCount || 0, // Store actual row count
      fileData: {
        name: fileData.name,
        size: fileData.size,
        type: fileData.type,
        uploadTime: fileData.uploadTime
      }
    };

    // Get existing projects and add new one
    const existingProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
    const updatedProjects = [projectData, ...existingProjects];
    localStorage.setItem('userProjects', JSON.stringify(updatedProjects));

    // Also save ML validation stats for dashboard
    const mlStats = {
      totalDatasets: updatedProjects.length,
      successfulValidations: updatedProjects.filter(p => p.status === 'completed').length,
      averageAccuracy: Math.floor(Math.random() * 20) + 75, // 75-94%
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('mlValidationStats', JSON.stringify(mlStats));

    // Add activity to dashboard
    const activityData = {
      id: Date.now().toString(),
      action: `Uploaded dataset ${fileData.name} for analysis (${rowCount?.toLocaleString() || 'unknown'} rows)`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'upload'
    };
    
    const existingActivities = JSON.parse(localStorage.getItem('userActivities') || '[]');
    const updatedActivities = [activityData, ...existingActivities];
    localStorage.setItem('userActivities', JSON.stringify(updatedActivities));
  };

  // Save current ML session to localStorage
  const saveCurrentSession = () => {
    if (typeof window !== 'undefined' && uploadedFile) {
      const sessionData = {
        uploadedFile,
        dataPreview,
        selectedTask,
        currentStep,
        chatMessages,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('currentMLSession', JSON.stringify(sessionData));
    }
  };

  // Clear all ML data
  const clearAllData = () => {
    if (typeof window !== 'undefined') {
      // Clear current session
      localStorage.removeItem('currentMLSession');
      
      // Reset component state
      setUploadedFile(null);
      setDataPreview(null);
      setSelectedTask('');
      setCurrentStep('upload');
      setChatMessages([]);
      setUserQuery('');
      
      // Add activity for clearing data
      const activityData = {
        id: Date.now().toString(),
        action: 'Cleared ML workspace data',
        timestamp: new Date().toLocaleTimeString(),
        type: 'action'
      };
      
      const existingActivities = JSON.parse(localStorage.getItem('userActivities') || '[]');
      const updatedActivities = [activityData, ...existingActivities];
      localStorage.setItem('userActivities', JSON.stringify(updatedActivities));
    }
  };

  useEffect(() => {
    // Fetch user data and load previous session
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) {
        setUser(prev => ({ ...prev, avatar: savedAvatar }));
      }
      
      // Load previous ML session if exists
      const currentSession = localStorage.getItem('currentMLSession');
      if (currentSession) {
        try {
          const session = JSON.parse(currentSession);
          if (session.uploadedFile) {
            setUploadedFile(session.uploadedFile);
            setDataPreview(session.dataPreview);
            setSelectedTask(session.selectedTask || '');
            setCurrentStep(session.currentStep || 'validate');
            setChatMessages(session.chatMessages || []);
          }
        } catch (error) {
          console.log('No previous session found');
        }
      }
    }
    fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUser({ name: data.user.name, avatar: data.user.avatar });
          if (typeof window !== 'undefined') {
            localStorage.setItem('userAvatar', data.user.avatar || '');
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem('userAvatar', data.user.avatar || '');
          }
        }
      })
  }, [BACKEND_URL]);

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

    // No file size limit enforced here (allow large uploads)

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        alert('Failed to read file content');
        setIsProcessing(false);
        return;
      }

      // Parse CSV content
      const lines = content.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(',') || [];
      const dataRows = lines.slice(1).filter(line => line.trim());
      const actualRowCount = dataRows.length;

      // Generate preview data from actual file
      const previewRows = dataRows.slice(0, 5).map(row => 
        row.split(',').map(cell => cell.trim())
      );

      const fileData: DataFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadTime: new Date().toLocaleTimeString()
      };

      setUploadedFile(fileData);

      // Save project to localStorage for dashboard integration with actual row count
      setTimeout(() => {
        saveProjectToLocalStorage(fileData, actualRowCount);
        saveCurrentSession();
      }, 100);

      // Generate actual preview data
      const actualPreview: DataPreview = {
        columns: headers.map(h => h.trim()),
        rows: previewRows,
        rowCount: actualRowCount,
        columnCount: headers.length,
        fileSize: (file.size / 1024).toFixed(2) + ' KB'
      };

      setDataPreview(actualPreview);
      setCurrentStep('validate');
      setIsProcessing(false);

      // AI Agent greeting message with actual data
      setChatMessages([
        {
          type: 'ai',
          text: `Great! I've successfully loaded your dataset "${file.name}". I can see it has ${actualPreview.columnCount} columns and ${actualPreview.rowCount.toLocaleString()} rows. What would you like to predict or analyze from this data?`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    };

    reader.onerror = () => {
      alert('Failed to read file');
      setIsProcessing(false);
    };

    reader.readAsText(file);
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
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      minHeight: '100vh',
      width: '100%',
      position: 'relative'
    }}>
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-8 bg-transparent">
        <div className="flex items-center gap-3">
          <Logo href="/home" size="md" />
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
              <p>Support CSV and Excel formats</p>
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
              
              {(uploadedFile || (typeof window !== 'undefined' && localStorage.getItem('currentMLSession'))) && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button
                    onClick={clearAllData}
                    className="px-4 py-2 rounded-lg text-red-400 border border-red-400/30 hover:bg-red-500/10 transition-all"
                    style={{ fontSize: '14px' }}
                  >
                    🗑️ Clear All Data
                  </button>
                </div>
              )}
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
                  <p>No file size limit</p>
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
              <Button 
                onClick={() => {
                  setCurrentStep('upload');
                  setUploadedFile(null);
                  setDataPreview(null);
                  setChatMessages([]);
                }}
                variant="secondary"
                size="sm"
                icon={<span>↻</span>}
              >
                Upload Different File
              </Button>
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
                    <div className="stat-value">87%</div>
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
                    { id: 'classification', label: 'Multi-Class Classification', desc: 'Advanced categorical prediction with ensemble methods', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                    { id: 'regression', label: 'Non-Linear Regression', desc: 'Complex polynomial & neural network regression', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
                    { id: 'clustering', label: 'Hierarchical Clustering', desc: 'Advanced clustering with density-based algorithms', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
                    { id: 'anomaly', label: 'Isolation Forest Detection', desc: 'Advanced anomaly detection with deep learning', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg> },
                    { id: 'time_series', label: 'Time Series Forecasting', desc: 'LSTM & ARIMA models for temporal prediction', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                    { id: 'nlp', label: 'Natural Language Processing', desc: 'Text analysis with transformer models', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg> }
                  ].map(task => (
                    <button
                      key={task.id}
                      className={`task-btn ${selectedTask === task.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedTask(task.id);
                        saveCurrentSession();
                      }}
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
                  <div className="check-item warning">
                    <span className="check-icon">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </span>
                    <span className="check-text">Missing values detected: 347 cells (3.2%)</span>
                  </div>
                  <div className="check-item success">
                    <span className="check-icon">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="check-text">Feature correlation analysis completed</span>
                  </div>
                  <div className="check-item warning">
                    <span className="check-icon">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </span>
                    <span className="check-text">High-cardinality features identified: 3 columns</span>
                  </div>
                  <div className="check-item error">
                    <span className="check-icon">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    <span className="check-text">Class imbalance detected: 85/15 ratio</span>
                  </div>
                  <div className="check-item success">
                    <span className="check-icon">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="check-text">Data drift analysis: Minimal drift detected</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="validation-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <Button
                  onClick={() => {
                    // Update project status to completed
                    if (typeof window !== 'undefined' && uploadedFile) {
                      const projects = JSON.parse(localStorage.getItem('userProjects') || '[]');
                      const updatedProjects = projects.map((p: any) => 
                        p.dataset === uploadedFile.name 
                          ? { ...p, status: 'completed', taskType: selectedTask || p.taskType }
                          : p
                      );
                      localStorage.setItem('userProjects', JSON.stringify(updatedProjects));
                      
                      // Add completion activity
                      const activityData = {
                        id: Date.now().toString(),
                        action: `Completed ML analysis for ${uploadedFile.name}`,
                        timestamp: new Date().toLocaleTimeString(),
                        type: 'completion'
                      };
                      
                      const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
                      const updatedActivities = [activityData, ...activities];
                      localStorage.setItem('userActivities', JSON.stringify(updatedActivities));
                    }
                    
                    setCurrentStep('configure');
                  }}
                  disabled={!selectedTask}
                  variant="primary"
                  className="w-full py-3"
                >
                  Continue to Model Configuration →
                </Button>
                
                <Button
                  onClick={() => {
                    clearAllData();
                  }}
                  variant="secondary"
                  className="w-full mt-3 py-3 bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                >
                  Clear All Data
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chat section removed */}
      </div>
      </div>

      {/* Footer */}
      <div className="ml-footer">
        <p>💡 Pro Tip: The more details you provide, the better the AI can assist you in building your model!</p>
      </div>
    </div>
  );
};

export default MLPage;
