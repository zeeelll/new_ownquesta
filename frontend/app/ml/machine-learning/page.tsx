"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../../components/Button';
import Logo from '../../components/Logo';

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
  const [currentStep, setCurrentStep] = useState<'setup' | 'validate' | 'configure'>('validate');
  const [uploadedFile, setUploadedFile] = useState<DataFile | null>({
    name: 'customer_data.csv',
    size: 850,
    type: 'text/csv',
    uploadTime: new Date().toLocaleTimeString()
  });
  const [dataPreview, setDataPreview] = useState<DataPreview | null>({
    columns: ['customer_id', 'age', 'gender', 'income', 'credit_score', 'spending_score', 'purchase_frequency'],
    rows: [
      ['1001', '25', 'Female', '45000', '650', '75', '12'],
      ['1002', '34', 'Male', '78000', '720', '85', '18'],
      ['1003', '28', 'Female', '52000', '680', '70', '8'],
      ['1004', '45', 'Male', '95000', '780', '90', '25'],
      ['1005', '31', 'Female', '62000', '710', '80', '15']
    ],
    rowCount: 20,
    columnCount: 7,
    fileSize: '850 B'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTask, setSelectedTask] = useState<string>('');
  
  const [userQuery, setUserQuery] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      type: 'ai',
      text: '👋 **Welcome to ML Validation!**\n\nI\'ve pre-loaded a sample customer dataset for you. Your data looks great - ready to explore some insights?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>({
    satisfaction_score: 85,
    dataset_summary: {
      rows: 20,
      columns: 7,
      file_size_mb: 0.85
    },
    goal_understanding: {
      interpreted_task: 'Customer Segmentation',
      target_column_guess: 'spending_score',
      confidence: 0.87
    },
    agent_answer: '✅ **Dataset Analysis Complete!**\n\nYour customer dataset looks excellent for machine learning! I\'ve identified this as a perfect candidate for **customer segmentation** analysis.',
    optional_questions: [
      'Would you like to predict customer lifetime value?',
      'Should we focus on churn prediction instead?',
      'Do you want to segment customers by spending behavior?'
    ]
  });
  const [showLastRows, setShowLastRows] = useState(false);
  const [viewMode, setViewMode] = useState<'first' | 'last' | 'all'>('first');
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [columnAnalysis, setColumnAnalysis] = useState<any>(null);
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [showAdvancedStats, setShowAdvancedStats] = useState<boolean>(false);
  const [validationSteps, setValidationSteps] = useState<string[]>([]);
  const router = useRouter();
  const hasGoal = userQuery.trim().length > 0;
  const hasDataset = Boolean(uploadedFile && actualFile && dataPreview);
  const canProceedFromSetup = hasGoal && hasDataset;

  useEffect(() => {
    // Initialize with sample column analysis
    if (dataPreview && !columnAnalysis) {
      const sampleAnalysis = [
        { name: 'customer_id', type: 'numeric', uniqueValues: 20, missingValues: 0, missingPercentage: 0, sampleValues: ['1001', '1002', '1003', '1004', '1005'], min: 1001, max: 1020, mean: 1010.5 },
        { name: 'age', type: 'numeric', uniqueValues: 15, missingValues: 0, missingPercentage: 0, sampleValues: ['25', '34', '28', '45', '31'], min: 22, max: 65, mean: 35.2 },
        { name: 'gender', type: 'categorical', uniqueValues: 2, missingValues: 0, missingPercentage: 0, sampleValues: ['Female', 'Male'] },
        { name: 'income', type: 'numeric', uniqueValues: 18, missingValues: 0, missingPercentage: 0, sampleValues: ['45000', '78000', '52000', '95000', '62000'], min: 35000, max: 120000, mean: 67500 },
        { name: 'credit_score', type: 'numeric', uniqueValues: 16, missingValues: 0, missingPercentage: 0, sampleValues: ['650', '720', '680', '780', '710'], min: 580, max: 850, mean: 705 },
        { name: 'spending_score', type: 'numeric', uniqueValues: 12, missingValues: 0, missingPercentage: 0, sampleValues: ['75', '85', '70', '90', '80'], min: 40, max: 95, mean: 75.5 },
        { name: 'purchase_frequency', type: 'numeric', uniqueValues: 20, missingValues: 0, missingPercentage: 0, sampleValues: ['12', '18', '8', '25', '15'], min: 5, max: 30, mean: 16.2 }
      ];
      setColumnAnalysis(sampleAnalysis);
    }
  }, [dataPreview, columnAnalysis]);

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
    setValidationProgress(0);
    setValidationSteps([]);
    
    // Simulate validation progress
    const progressSteps = [
      'Analyzing dataset structure...',
      'Detecting data types...',
      'Checking data quality...',
      'Identifying missing values...',
      'Computing statistics...',
      'Generating AI insights...',
      'Finalizing validation report...'
    ];

    const progressInterval = setInterval(() => {
      setValidationProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 15, 85);
        const stepIndex = Math.floor((newProgress / 100) * progressSteps.length);
        if (stepIndex < progressSteps.length) {
          setValidationSteps(prev => {
            if (!prev.includes(progressSteps[stepIndex])) {
              return [...prev, progressSteps[stepIndex]];
            }
            return prev;
          });
        }
        return newProgress;
      });
    }, 500);
    
    try {
      // Analyze columns locally first
      const columnStats = await analyzeColumns();
      setColumnAnalysis(columnStats);

      const formData = new FormData();
      const resolvedGoal = userQuery.trim() || 'Auto-detect the most suitable target and task based on the dataset.';
      formData.append('goal', resolvedGoal);
      formData.append('file', actualFile);

      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: '🔍 Starting comprehensive dataset validation...',
        timestamp: new Date().toLocaleTimeString()
      }]);

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
      clearInterval(progressInterval);
      setValidationProgress(100);
      setValidationSteps([...progressSteps]);
      setValidationResult(result);
      
      // Enhanced chat response
      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: '✅ **Validation Complete!** Your dataset has been successfully analyzed.',
        timestamp: new Date().toLocaleTimeString()
      }]);
      
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
        const questionsText = "**💡 Suggested Questions to Improve Your Model:**\n" + 
          result.optional_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n') +
          "\n\n*Click any question above to explore further!*";
        
        setChatMessages(prev => [...prev, {
          type: 'ai',
          text: questionsText,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }

      // Display validation summary
      const summary = `**📊 Validation Summary:**\n` +
        `• Dataset Quality: ${result.satisfaction_score || 'N/A'}%\n` +
        `• Recommended Task: ${result.goal_understanding?.interpreted_task || 'Auto-detected'}\n` +
        `• Target Column: ${result.goal_understanding?.target_column_guess || 'To be determined'}\n` +
        `• Confidence Level: ${result.goal_understanding?.confidence ? Math.round(result.goal_understanding.confidence * 100) : 'N/A'}%`;
      
      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: summary,
        timestamp: new Date().toLocaleTimeString()
      }]);

      // Auto-save project
      try {
        saveProjectToDashboard();
      } catch (e) {
        console.warn('Auto-save to dashboard failed', e);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setValidationProgress(0);
      console.error('Validation error:', error);
      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: `❌ **Validation Failed:** ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\n*Please check your file format and try again. Supported formats: CSV, XLSX, XLS*`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      clearInterval(progressInterval);
      setIsValidating(false);
    }
  };

  const analyzeColumns = async (): Promise<any> => {
    if (!actualFile) return null;
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { columns, allRows } = parseCSV(text);
        
        const analysis = columns.map(col => {
          const colIndex = columns.indexOf(col);
          const values = allRows.map(row => row[colIndex]).filter(val => val && val.trim());
          
          const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
          const isNumeric = numericValues.length > values.length * 0.8;
          
          const uniqueValues = [...new Set(values)];
          const missingCount = allRows.length - values.length;
          
          return {
            name: col,
            type: isNumeric ? 'numeric' : 'categorical',
            uniqueValues: uniqueValues.length,
            missingValues: missingCount,
            missingPercentage: Math.round((missingCount / allRows.length) * 100),
            sampleValues: uniqueValues.slice(0, 5),
            ...(isNumeric && {
              min: Math.min(...numericValues),
              max: Math.max(...numericValues),
              mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length
            })
          };
        });
        
        resolve(analysis);
      };
      reader.readAsText(actualFile);
    });
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
    if (!dataPreview) return;

    // Sample full dataset
    const fullRows = [
      ['1001', '25', 'Female', '45000', '650', '75', '12'],
      ['1002', '34', 'Male', '78000', '720', '85', '18'],
      ['1003', '28', 'Female', '52000', '680', '70', '8'],
      ['1004', '45', 'Male', '95000', '780', '90', '25'],
      ['1005', '31', 'Female', '62000', '710', '80', '15'],
      ['1006', '29', 'Male', '58000', '690', '72', '14'],
      ['1007', '38', 'Female', '82000', '750', '88', '22'],
      ['1008', '42', 'Male', '95000', '780', '85', '20'],
      ['1009', '26', 'Female', '48000', '620', '65', '10'],
      ['1010', '35', 'Male', '72000', '730', '82', '16'],
      ['1011', '33', 'Female', '65000', '700', '78', '18'],
      ['1012', '27', 'Male', '55000', '670', '74', '12'],
      ['1013', '41', 'Female', '88000', '760', '90', '24'],
      ['1014', '39', 'Male', '79000', '740', '86', '19'],
      ['1015', '30', 'Female', '61000', '685', '77', '15'],
      ['1016', '36', 'Male', '74000', '720', '83', '17'],
      ['1017', '32', 'Female', '59000', '695', '75', '13'],
      ['1018', '44', 'Male', '92000', '775', '89', '23'],
      ['1019', '28', 'Female', '53000', '665', '71', '11'],
      ['1020', '37', 'Male', '76000', '735', '84', '18']
    ];
    
    let displayRows;
    if (mode === 'all') {
      displayRows = fullRows;
    } else if (mode === 'last') {
      displayRows = fullRows.slice(-5);
    } else {
      displayRows = fullRows.slice(0, 5);
    }

    setDataPreview({
      ...dataPreview,
      rows: displayRows,
      rowCount: fullRows.length
    });
  };

  useEffect(() => {
    if (actualFile && dataPreview) {
      updatePreviewRows(viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mlSelectedProject');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSelectedProject(parsed);
        // keep the key in storage in case user navigates back; remove if you prefer one-time use
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('userProjects');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedProjects(parsed);
      }
    } catch (e) {}
  }, []);

  const saveProjectToDashboard = (name?: string) => {
    try {
      const projectName = (name && name.trim()) || selectedProject?.name || uploadedFile?.name || `ML Project ${Date.now()}`;

      const fileName = uploadedFile?.name || (actualFile ? actualFile.name : projectName + '.csv');
      const fileType = fileName.split('.').pop() || 'csv';

      const project = {
        id: Date.now().toString(),
        name: projectName,
        dataset: fileName,
        taskType: selectedTask || (validationResult?.taskType) || 'classification',
        status: validationResult ? 'validated' : 'in-progress',
        confidence: validationResult?.confidence || Math.floor(Math.random() * 10) + 85,
        createdDate: new Date().toLocaleDateString(),
        fileUrl: '',
        filePath: '',
        fileType: fileType,
        rowCount: dataPreview?.rowCount || 0
      } as any;

      // Read existing projects
      const raw = localStorage.getItem('userProjects');
      let list = [] as any[];
      if (raw) {
        try { list = JSON.parse(raw); } catch (e) { list = []; }
      }

      // Avoid exact duplicates by name + date
      if (!list.some(p => p.name === project.name && p.dataset === project.dataset)) {
        list.unshift(project);
        localStorage.setItem('userProjects', JSON.stringify(list));
        setSavedProjects(list);

        // Update mlValidationStats
        try {
          const statsRaw = localStorage.getItem('mlValidationStats');
          let stats = { validations: 0, datasets: 0, avgConfidence: 0, totalRows: 0 } as any;
          if (statsRaw) { stats = JSON.parse(statsRaw); }
          const totalConfidence = (stats.avgConfidence || 0) * (stats.validations || 0) + (project.confidence || 0);
          const newValidations = (stats.validations || 0) + (project.status === 'validated' ? 1 : 0);
          const newAvg = newValidations > 0 ? Math.round(totalConfidence / newValidations) : 0;
          const newStats = {
            validations: newValidations,
            datasets: (stats.datasets || 0) + 1,
            avgConfidence: newAvg,
            totalRows: (stats.totalRows || 0) + (project.rowCount || 0)
          };
          localStorage.setItem('mlValidationStats', JSON.stringify(newStats));
        } catch (e) {
          // ignore stats errors
        }

        // Flag for dashboard if desired
        try { localStorage.setItem('returnToDashboard', 'true'); } catch (e) {}

        setChatMessages(prev => [...prev, { type: 'ai', text: `✅ Project "${project.name}" saved to dashboard.`, timestamp: new Date().toLocaleTimeString() }]);
        // keep selectedProject in ML view in sync
        setSelectedProject({ name: project.name });
      } else {
        setChatMessages(prev => [...prev, { type: 'ai', text: `ℹ️ Project "${project.name}" already exists in dashboard.`, timestamp: new Date().toLocaleTimeString() }]);
      }
    } catch (e) {
      console.error('Error saving project:', e);
      setChatMessages(prev => [...prev, { type: 'ai', text: `❌ Failed to save project: ${e instanceof Error ? e.message : 'Unknown'}`, timestamp: new Date().toLocaleTimeString() }]);
    }
  };

  const processFile = (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/)) {
      alert('Please upload a valid CSV or Excel file');
      return;
    }

    // No file size limit enforced here (allow large uploads)

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
    
    // Enhanced AI responses based on query
    const query = userQuery.toLowerCase();
    let aiResponse = '';
    
    if (query.includes('pattern') || query.includes('insight')) {
      aiResponse = `🔍 **Data Patterns Analysis:**\n\n`;
      if (columnAnalysis) {
        const numericCols = columnAnalysis.filter((c: any) => c.type === 'numeric');
        const categoricalCols = columnAnalysis.filter((c: any) => c.type === 'categorical');
        aiResponse += `• Found ${numericCols.length} numeric and ${categoricalCols.length} categorical features\n`;
        aiResponse += `• Missing data ranges from 0-${Math.max(...columnAnalysis.map((c: any) => c.missingPercentage))}%\n`;
        if (validationResult) {
          aiResponse += `• Dataset quality score: ${validationResult.satisfaction_score}%`;
        }
      } else {
        aiResponse += `I'm analyzing your dataset structure. Please wait for validation to complete for detailed insights.`;
      }
    } else if (query.includes('target') || query.includes('column')) {
      aiResponse = `🎯 **Target Column Suggestions:**\n\n`;
      if (validationResult?.goal_understanding) {
        aiResponse += `• Recommended target: **${validationResult.goal_understanding.target_column_guess}**\n`;
        aiResponse += `• Task type: **${validationResult.goal_understanding.interpreted_task}**\n`;
        aiResponse += `• Confidence: ${Math.round(validationResult.goal_understanding.confidence * 100)}%`;
      } else {
        aiResponse += `I'll suggest target columns once validation is complete. Based on your goal, I'll identify the best prediction target.`;
      }
    } else if (query.includes('quality') || query.includes('assessment')) {
      aiResponse = `📊 **Data Quality Assessment:**\n\n`;
      if (validationResult) {
        aiResponse += `• Overall quality score: **${validationResult.satisfaction_score}%**\n`;
        if (columnAnalysis) {
          const missingDataCols = columnAnalysis.filter((c: any) => c.missingValues > 0);
          aiResponse += `• ${missingDataCols.length} columns have missing values\n`;
          aiResponse += `• Total dataset size: ${dataPreview?.rowCount.toLocaleString()} rows\n`;
          aiResponse += `• Feature diversity: ${columnAnalysis.length} columns analyzed`;
        }
      } else {
        aiResponse += `I'll provide a comprehensive quality assessment once validation completes.`;
      }
    } else if (query.includes('improve') || query.includes('suggestion')) {
      aiResponse = `💡 **Improvement Suggestions:**\n\n`;
      if (validationResult?.optional_questions) {
        aiResponse += `Here are some ways to enhance your model:\n\n`;
        validationResult.optional_questions.slice(0, 3).forEach((q: string, i: number) => {
          aiResponse += `${i + 1}. ${q}\n`;
        });
      } else {
        aiResponse += `I'll provide specific improvement suggestions once validation is complete and I can analyze your data patterns.`;
      }
    } else if (query.includes('next') || query.includes('step')) {
      aiResponse = `🚀 **Next Steps:**\n\n`;
      if (validationResult) {
        aiResponse += `1. **Review validation results** - Check the insights above\n`;
        aiResponse += `2. **Configure your model** - Click "Configure Model" to proceed\n`;
        aiResponse += `3. **Fine-tune parameters** - Adjust settings based on your goals\n`;
        aiResponse += `4. **Train and evaluate** - Start the machine learning process`;
      } else {
        aiResponse += `Currently validating your dataset. Once complete, you'll be able to configure and train your model.`;
      }
    } else {
      // Generic helpful response
      aiResponse = `🤖 **I'm here to help!**\n\nI can assist with:\n\n• **Data analysis** - Understanding your dataset structure\n• **Pattern recognition** - Identifying trends and insights\n• **Model recommendations** - Suggesting the best ML approach\n• **Quality assessment** - Evaluating data completeness\n\nWhat specific aspect would you like to explore?`;
    }
    
    // Add AI response after a brief delay for realism
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        type: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }, 500);
    
    setUserQuery('');
  };

  const renderMessage = (text: string) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-sans text-sm relative">
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
        .text-gradient-rainbow { 
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7, #ec4899, #f43f5e, #f97316, #f59e0b); 
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline-block;
          line-height: 1.2;
          padding: 0.1em 0;
          letter-spacing: -0.01em;
          font-weight: 900;
        }
      `}</style>

      {/* Clean Simple Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900" />
      </div>

      {/* Enhanced Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-8 bg-transparent">
        <div className="flex items-center gap-3">
          <Logo href="/home" size="md" />
          <div>
            <h1 className="text-2xl font-black text-gradient tracking-wide">ML Platform</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              router.back();
            }}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm bg-slate-700/60 border border-slate-600/30 backdrop-blur-md hover:bg-slate-600/70 hover:border-slate-500/40 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back
          </button>
        </div>
      </nav>

      {/* Step Navigation - Fixed at Top */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-700/50 p-2">
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
                className={`px-6 py-3 rounded-lg transition-all duration-300 font-medium ${
                  currentStep === item.key
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-gray-300'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">{item.step}</span>
                  <span className="text-sm">{item.label}</span>
                </div>
              </button>
              {idx < 2 && <div className={`w-8 h-0.5 transition-all ${(idx === 0 && uploadedFile) || (idx === 1 && dataPreview) ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/10'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className={`relative z-10 max-w-[1600px] mx-auto px-8 pt-20 pb-12 ${currentStep === 'validate' ? 'lg:pr-[420px]' : ''}`}>
        {selectedProject && (
          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-sm">
            <div className="text-sm text-indigo-100">Opening ML workspace for: <span className="font-semibold text-white">{selectedProject.name}</span></div>
          </div>
        )}
        {currentStep === 'setup' && (
          <div className="animate-slide space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-sm text-indigo-300 font-medium">AI-Powered Machine Learning</span>
              </div>
              
              <div className="mt-2">
                <h2 className="text-5xl md:text-6xl font-bold text-gradient-rainbow leading-relaxed">
                  Build Intelligent Models
                </h2>
              </div>
              
              <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">Describe your goal and upload your data. Let AI guide you through the entire pipeline.</p>
              
              {/* Progress Indicators */}
              <div className="flex justify-center items-center gap-4 mt-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${hasGoal ? 'bg-green-500/20 border border-green-500/40' : 'bg-slate-800/50 border border-slate-600/30'}`}>
                  <div className={`w-3 h-3 rounded-full transition-colors ${hasGoal ? 'bg-green-500' : 'bg-slate-500'}`} />
                  <span className="text-sm font-medium">Goal Defined</span>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${hasDataset ? 'bg-green-500/20 border border-green-500/40' : 'bg-slate-800/50 border border-slate-600/30'}`}>
                  <div className={`w-3 h-3 rounded-full transition-colors ${hasDataset ? 'bg-green-500' : 'bg-slate-500'}`} />
                  <span className="text-sm font-medium">Dataset Ready</span>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Goal Definition Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Define Your Goal</h3>
                    <p className="text-slate-400">What do you want to predict or analyze?</p>
                  </div>
                </div>

                <div className="group relative rounded-2xl p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 hover:border-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300">
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  
                  <div className="relative z-10">
                    <textarea 
                      placeholder="Example: I want to predict which customers are likely to churn in the next 3 months based on their usage patterns and demographics..." 
                      value={userQuery} 
                      onChange={(e) => setUserQuery(e.target.value)} 
                      className="w-full h-40 bg-transparent border-none outline-none text-white placeholder-slate-500 resize-none text-sm leading-relaxed" 
                    />
                    <div className="flex flex-wrap gap-2 mt-4">
                      {['Predict customer churn', 'Forecast sales revenue', 'Classify transactions', 'Detect fraud'].map((p) => (
                        <button 
                          key={p} 
                          onClick={() => setUserQuery(p)} 
                          className="px-3 py-1.5 text-xs rounded-full bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all text-indigo-300 hover:text-indigo-200"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ML Task Types */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { 
                      icon: <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, 
                      title: 'Classification', 
                      example: 'Yes/No'
                    }, 
                    { 
                      icon: <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, 
                      title: 'Regression', 
                      example: '$100+'
                    }, 
                    { 
                      icon: <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>, 
                      title: 'Clustering', 
                      example: 'A, B, C'
                    }
                  ].map((item) => (
                    <div key={item.title} className="group relative rounded-xl p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                      {/* Background glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                      
                      <div className="relative z-10">
                        <div className="mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                        <h4 className="text-sm font-semibold mb-2 text-white">{item.title}</h4>
                        <code className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">{item.example}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dataset Upload Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Upload Dataset</h3>
                    <p className="text-slate-400">CSV or Excel files supported</p>
                  </div>
                </div>

                <div className={`group relative rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 hover:border-pink-400/50 hover:shadow-2xl hover:shadow-pink-500/25 ${dragActive ? 'border-pink-500 bg-pink-500/10 scale-105' : ''} ${isProcessing ? 'pointer-events-none' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => !isProcessing && fileInputRef.current?.click()}>
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  
                  <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
                  
                  <div className="relative z-10">
                    {isProcessing ? (
                      <div className="space-y-4">
                        <div className="relative w-20 h-20 mx-auto">
                          <div className="absolute inset-0 rounded-full border-4 border-pink-500/30" />
                          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                        <p className="text-slate-400 font-medium">Processing your data...</p>
                      </div>
                    ) : (
                      <>
                        <div className="relative inline-block mb-6">
                          <div className="absolute inset-0 bg-pink-500 rounded-full blur-xl opacity-50" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
                          <svg className="w-16 h-16 text-pink-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold mb-2 text-white">Drop your file here</h4>
                        <p className="text-sm text-slate-400 mb-6">or click to browse and select</p>
                        <div className="flex gap-2 justify-center">
                          {['CSV', 'XLSX', 'XLS'].map((f) => (
                            <span key={f} className="px-3 py-1.5 text-xs rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 font-medium">
                              {f}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {uploadedFile && (
                  <div className="group relative rounded-xl p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-green-500/50 hover:border-green-400/60 transition-all duration-300 animate-slide overflow-hidden">
                    {/* Success glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-60 rounded-xl" />
                    
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-white">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-400">{(uploadedFile.size / 1024).toFixed(2)} KB • Uploaded at {uploadedFile.uploadTime}</p>
                      </div>
                      <Button 
                        onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setDataPreview(null); setChatMessages([]); setActualFile(null); setValidationResult(null); }} 
                        variant="outline" 
                        size="sm"
                        className="border-slate-600 hover:border-slate-500 hover:bg-slate-700/50"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}

                {/* Feature Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="group relative rounded-xl p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                    <div className="relative z-10">
                      <svg className="w-5 h-5 text-indigo-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-sm font-semibold mb-1 text-white">Supported Formats</h4>
                      <p className="text-xs text-slate-400">CSV, Excel (XLSX/XLS)</p>
                    </div>
                  </div>
                  <div className="group relative rounded-xl p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 hover:border-pink-400/50 hover:shadow-xl hover:shadow-pink-500/25 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                    <div className="relative z-10">
                      <svg className="w-5 h-5 text-pink-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <h4 className="text-sm font-semibold mb-1 text-white">Privacy First</h4>
                      <p className="text-xs text-slate-400">Data never stored permanently</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-8">
                  <Button
                    onClick={async () => {
                      if (!canProceedFromSetup || isProcessing || isValidating) return;
                      setCurrentStep('validate');
                      await validateWithAPI();
                    }}
                    disabled={!canProceedFromSetup || isProcessing || isValidating}
                    size="lg"
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-4 rounded-2xl shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 border border-indigo-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-xl"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    }
                  >
                    {isValidating ? 'Validating...' : 'Proceed & Validate Dataset'}
                  </Button>
                  {!canProceedFromSetup && (
                    <p className="text-center text-sm text-slate-400 mt-2">
                      {!hasGoal && !hasDataset ? 'Please define your goal and upload a dataset' : 
                       !hasGoal ? 'Please define your ML goal above' : 
                       'Please upload a dataset to continue'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'validate' && dataPreview && (
          <div className="animate-slide space-y-8">
            {/* Header Section */}
            <div className="flex justify-between items-start flex-wrap gap-6">
              <div>
                <h2 className="text-4xl font-bold text-gradient mb-2">Dataset Validation</h2>
                <p className="text-slate-400">Analyzing: <span className="text-white font-medium">{uploadedFile?.name}</span></p>
                {validationResult && !isValidating && (
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-sm font-medium text-green-300">Validation Complete</span>
                    </div>
                    <span className="text-sm text-slate-400">
                      Quality Score: <span className="font-semibold text-white">{validationResult.satisfaction_score}%</span>
                    </span>
                  </div>
                )}
              </div>
              <Button 
                onClick={() => { setCurrentStep('setup'); setUploadedFile(null); setDataPreview(null); setChatMessages([]); setUserQuery(''); setActualFile(null); setValidationResult(null); setColumnAnalysis(null); setValidationProgress(0); setValidationSteps([]); }} 
                variant="outline" 
                size="md"
                className="border-slate-600 hover:border-slate-500 hover:bg-slate-700/50"
                icon={<span>↻</span>}
              >
                Start Over
              </Button>
            </div>

            {/* Enhanced Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-8 mb-8">
              {[
                {
                  icon: <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                  label: 'Rows',
                  value: validationResult?.dataset_summary?.rows?.toLocaleString() || dataPreview.rowCount.toLocaleString(),
                  color: 'blue',
                  subtext: 'Total records'
                },
                {
                  icon: <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
                  label: 'Columns',
                  value: validationResult?.dataset_summary?.columns || dataPreview.columnCount,
                  color: 'green',
                  subtext: columnAnalysis ? `${columnAnalysis.filter((c: any) => c.type === 'numeric').length} numeric, ${columnAnalysis.filter((c: any) => c.type === 'categorical').length} categorical` : 'Features'
                },
                {
                  icon: <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>,
                  label: 'Size',
                  value: validationResult?.dataset_summary?.file_size_mb ? `${validationResult.dataset_summary.file_size_mb} MB` : dataPreview.fileSize,
                  color: 'purple',
                  subtext: 'File size'
                },
                {
                  icon: <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                  label: 'Quality',
                  value: isValidating ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-500"
                          style={{ width: `${validationProgress}%` }}
                        />
                      </div>
                      <span className="text-xs">{Math.round(validationProgress)}%</span>
                    </div>
                  ) : (
                    validationResult?.satisfaction_score ? `${validationResult.satisfaction_score}%` : 'Pending'
                  ),
                  color: 'yellow',
                  subtext: isValidating ? 'Analyzing...' : 'Data quality score'
                }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="group relative rounded-2xl p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-slate-700/30 hover:border-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                >
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  
                  <div className="relative z-10">
                    <div className="mb-4 group-hover:scale-110 transition-transform duration-300">{stat.icon}</div>
                    <p className="text-sm text-slate-400 mb-1 font-medium">{stat.label}</p>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <p className="text-xs text-slate-500">{stat.subtext}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Validation Progress */}
            {isValidating && (
              <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-8 animate-slide">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Validation in Progress</h3>
                  <span className="text-indigo-300 font-medium">{Math.round(validationProgress)}%</span>
                </div>
                
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${validationProgress}%` }}
                  />
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {validationSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-slate-300">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Column Analysis */}
            {columnAnalysis && !isValidating && (
              <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Column Analysis</h3>
                  <button
                    onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                    className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all text-indigo-300 text-sm"
                  >
                    {showAdvancedStats ? 'Hide' : 'Show'} Advanced Stats
                  </button>
                </div>
                
                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {columnAnalysis.map((col: any, index: number) => (
                    <div key={index} className="bg-slate-800/50 rounded-xl p-5 hover:bg-slate-800/70 transition-all border border-slate-700/30 hover:border-slate-600/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{col.name}</h4>
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            col.type === 'numeric' 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}>
                            {col.type}
                          </span>
                        </div>
                        <div className="text-right text-sm text-slate-400">
                          <div>Unique: {col.uniqueValues}</div>
                          {col.missingValues > 0 && (
                            <div className="text-orange-400">Missing: {col.missingPercentage}%</div>
                          )}
                        </div>
                      </div>
                      
                      {showAdvancedStats && (
                        <div className="mt-4 space-y-3 pt-3 border-t border-slate-700/30">
                          {col.type === 'numeric' && (
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div className="bg-slate-700/30 rounded px-3 py-2">
                                <span className="text-slate-400 block">Min:</span>
                                <span className="text-white font-mono">{col.min?.toFixed(2)}</span>
                              </div>
                              <div className="bg-slate-700/30 rounded px-3 py-2">
                                <span className="text-slate-400 block">Max:</span>
                                <span className="text-white font-mono">{col.max?.toFixed(2)}</span>
                              </div>
                              <div className="bg-slate-700/30 rounded px-3 py-2">
                                <span className="text-slate-400 block">Mean:</span>
                                <span className="text-white font-mono">{col.mean?.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-400 text-xs block mb-2">Sample values:</span>
                            <div className="flex flex-wrap gap-2">
                              {col.sampleValues.map((val: string, i: number) => (
                                <span key={i} className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-xs text-slate-300 border border-slate-600/30">
                                  {val}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="backdrop-blur-2xl bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Data Sample Preview</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setViewMode('first');
                      updatePreviewRows('first');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      viewMode === 'first'
                        ? 'bg-indigo-500 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    First 5
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('last');
                      updatePreviewRows('last');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      viewMode === 'last'
                        ? 'bg-indigo-500 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Last 5
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('all');
                      updatePreviewRows('all');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      viewMode === 'all'
                        ? 'bg-indigo-500 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className={`overflow-x-auto rounded-xl border border-slate-700/30 shadow-lg ${viewMode === 'all' ? 'max-h-[500px] overflow-y-auto' : ''}`}>
                <table className="w-full text-sm bg-slate-800/30 min-w-[800px]">
                  <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                    <tr className="border-b border-slate-600/30">
                      {dataPreview.columns.map((col, i) => (
                        <th key={i} className="text-left p-4 font-semibold text-indigo-300 min-w-[120px] border-r border-slate-700/20 last:border-r-0 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{col}</span>
                            {columnAnalysis && columnAnalysis[i] && (
                              <span className={`inline-block px-2 py-0.5 rounded text-xs flex-shrink-0 ${
                                columnAnalysis[i].type === 'numeric' 
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
                              }`}>
                                {columnAnalysis[i].type}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataPreview.rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-800/40 transition-colors">
                        {row.map((cell, j) => (
                          <td key={j} className="p-4 text-gray-300 border-r border-slate-700/10 last:border-r-0 min-w-[120px]">
                            <span className="block truncate max-w-[150px]" title={cell}>
                              {cell}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Showing {viewMode === 'all' ? 'all' : viewMode === 'last' ? 'last' : 'first'} {viewMode === 'all' ? dataPreview.rowCount.toLocaleString() : Math.min(5, dataPreview.rowCount)} of {dataPreview.rowCount.toLocaleString()} rows
                </p>
                <div className="text-sm text-gray-400">
                  {dataPreview.columnCount} columns • {dataPreview.fileSize}
                </div>
              </div>
            </div>

            {/* Enhanced ML Agent Assistant - Vertical Chat Interface */}
            <div className="fixed right-8 top-1/2 transform -translate-y-1/2 w-[400px] h-[760px] backdrop-blur-2xl bg-slate-900/95 border border-indigo-500/30 rounded-2xl p-6 z-50 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {isValidating && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">ML Assistant</h3>
                    <p className="text-xs text-slate-400">{isValidating ? 'Analyzing...' : 'Ready to help'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setChatMessages([])}
                  className="p-2 rounded-lg hover:bg-slate-800/50 transition-all text-slate-400 hover:text-white"
                  title="Clear chat"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col h-full">
                {/* Chat Messages */}
                <div className="flex-1 space-y-4 mb-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-500/30 scrollbar-track-transparent">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-slate-400 mt-8 space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-500/20 to-pink-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Ask me about your dataset!</p>
                        <p className="text-sm text-slate-500 mt-1">I can help with analysis, predictions, and insights</p>
                      </div>
                      
                      {/* Quick suggestions */}
                      <div className="space-y-2">
                        {['What patterns do you see?', 'Suggest target columns', 'Data quality assessment'].map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setUserQuery(suggestion);
                              handleSendMessage();
                            }}
                            className="block w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all text-sm text-slate-300 hover:text-white border border-slate-700/30 hover:border-slate-600/50"
                          >
                            💡 {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide`}>
                      {msg.type === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className={`max-w-[280px] p-4 rounded-2xl text-sm ${msg.type === 'user' ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/40 text-white' : 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50 text-slate-200'}`}>
                        <p className="leading-relaxed">{renderMessage(msg.text)}</p>
                        <p className="text-xs text-slate-400 mt-2 opacity-70">{msg.timestamp}</p>
                      </div>
                      {msg.type === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                
                {/* Input Area */}
                <div className="mt-auto space-y-3">
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    {validationResult && [
                      { text: 'Explain results', icon: '📊' },
                      { text: 'Suggest improvements', icon: '💡' },
                      { text: 'Next steps', icon: '🚀' }
                    ].map((action, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setUserQuery(action.text);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all text-xs text-slate-300 hover:text-white border border-slate-700/30 hover:border-slate-600/50"
                      >
                        {action.icon} {action.text}
                      </button>
                    ))}
                  </div>
                  
                  {/* Input */}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ask me anything about your dataset..." 
                      value={userQuery} 
                      onChange={(e) => setUserQuery(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && !isValidating && handleSendMessage()} 
                      disabled={isValidating}
                      className="flex-1 px-4 py-3 text-sm rounded-xl bg-slate-800/60 border border-slate-600/50 focus:border-indigo-500/50 outline-none transition-all text-white placeholder-slate-400 disabled:opacity-50" 
                    />
                    <button 
                      onClick={handleSendMessage} 
                      disabled={!userQuery.trim() || isValidating} 
                      className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="text-xs text-center text-slate-500">
                    {isValidating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        Processing your request...
                      </span>
                    ) : (
                      'AI assistant ready'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Re-validate Button */}
                {!isValidating && (
                  <button 
                    onClick={() => {
                      // Simulate validation with sample data
                      setIsValidating(true);
                      setValidationProgress(0);
                      
                      const progressInterval = setInterval(() => {
                        setValidationProgress(prev => {
                          const newProgress = Math.min(prev + 10, 100);
                          if (newProgress >= 100) {
                            clearInterval(progressInterval);
                            setIsValidating(false);
                            
                            // Set sample validation result
                            setValidationResult({
                              satisfaction_score: 85,
                              dataset_summary: {
                                rows: 20,
                                columns: 7,
                                file_size_mb: 0.85
                              },
                              goal_understanding: {
                                interpreted_task: 'Customer Segmentation',
                                target_column_guess: 'spending_score',
                                confidence: 0.87
                              },
                              agent_answer: '✅ **Dataset Analysis Complete!**\n\nYour customer dataset looks excellent for machine learning! I\'ve identified this as a perfect candidate for **customer segmentation** analysis.',
                              optional_questions: [
                                'Would you like to predict customer lifetime value?',
                                'Should we focus on churn prediction instead?',
                                'Do you want to segment customers by spending behavior?'
                              ]
                            });
                            
                            setChatMessages(prev => [...prev, {
                              type: 'ai',
                              text: '🎉 **Validation Complete!** Your customer dataset has been successfully analyzed and is ready for machine learning!',
                              timestamp: new Date().toLocaleTimeString()
                            }]);
                          }
                          return newProgress;
                        });
                      }, 200);
                    }}
                    className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 hover:border-indigo-400/50 hover:bg-indigo-500/30 font-medium transition-all flex items-center justify-center gap-2 text-indigo-300 hover:text-indigo-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Validate Dataset</span>
                  </button>
                )}

              {/* Configure Model Button */}
              {validationResult && !isValidating && (
                <button 
                  onClick={() => setCurrentStep('configure')} 
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Next: Configure Model</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              )}

              {/* Validation in Progress */}
              {isValidating && (
                <button 
                  disabled
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-slate-500/50 to-slate-600/50 border border-slate-500/30 font-semibold opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validation in Progress...</span>
                </button>
              )}
            </div>

            {/* Enhanced Validation Results */}
            {validationResult && !isValidating && (
              <div className="backdrop-blur-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-2xl p-8 animate-slide">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Validation Complete
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30">
                      <span className="text-sm font-medium text-green-300">
                        Score: {validationResult.satisfaction_score || 'N/A'}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Key Insights */}
                <div className="grid md:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Task Type</h4>
                    <p className="text-lg font-bold text-indigo-300">
                      {validationResult.goal_understanding?.interpreted_task || 'Auto-detected'}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Target Column</h4>
                    <p className="text-lg font-bold text-pink-300">
                      {validationResult.goal_understanding?.target_column_guess || 'TBD'}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Confidence</h4>
                    <p className="text-lg font-bold text-green-300">
                      {validationResult.goal_understanding?.confidence ? 
                        `${Math.round(validationResult.goal_understanding.confidence * 100)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {/* Expandable JSON Details */}
                <details className="group">
                  <summary className="cursor-pointer p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-all border border-slate-700/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">View Technical Details</span>
                      <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </summary>
                  <div className="mt-4 bg-slate-900/60 rounded-xl p-4 font-mono text-xs overflow-x-auto border border-slate-700/30">
                    <pre className="text-green-300 whitespace-pre-wrap">{JSON.stringify(validationResult, null, 2)}</pre>
                  </div>
                </details>
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
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Dataset Summary
                    </h3>
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
                      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
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
                  <summary className="text-xl font-bold cursor-pointer hover:text-indigo-300 transition-colors flex items-center gap-2">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    View Full API Response
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