"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Send, Code, FileText, Loader2, Brain, BarChart3, MessageCircle, Lightbulb, AlertCircle } from 'lucide-react';

type Props = {
  onResult?: (res: any) => void;
  onAgentMessage?: (text: string) => void;
};

const ValidationAgenticAI: React.FC<Props> = ({ onResult, onAgentMessage }) => {
  const [messages, setMessages] = useState<any[]>([
    { type: 'agent', content: "👋 Hello! I'm your **Intelligent Validation Agent**. Upload a CSV dataset and I'll provide comprehensive analysis and answer all your questions!" }
  ]);
  const [input, setInput] = useState('');
  const [dataset, setDataset] = useState<any | null>(null);
  const [edaResults, setEdaResults] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [awaitingGoal, setAwaitingGoal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showFullPageResults, setShowFullPageResults] = useState(false);
  const [quickQuestions] = useState([
    "What's the data quality?",
    "Are there any outliers?", 
    "Show me missing data analysis",
    "What model should I use?",
    "How should I preprocess this data?"
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, edaResults]);

  const parseCSV = (text: string) => {
    try {
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV must have at least header and one data row');
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: any = {};
        headers.forEach((h, i) => (row[h] = values[i] ?? ''));
        return row;
      });
      
      return { headers, rows };
    } catch (error) {
      throw new Error(`Invalid CSV format: ${error}`);
    }
  };

  const datasetToCSV = (data: any) => {
    const { headers, rows } = data;
    const lines = [headers.join(',')];
    rows.forEach((r: any) => {
      const vals = headers.map((h: string) => {
        const v = r[h] ?? '';
        const s = String(v).replace(/"/g, '""');
        return s.includes(',') || s.includes('\n') ? `"${s}"` : s;
      });
      lines.push(vals.join(','));
    });
    return lines.join('\n');
  };

  const typeMessage = async (message: string, delay = 30) => {
    setIsTyping(true);
    const words = message.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + ' ';
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.isTyping) {
          newMessages[newMessages.length - 1] = { type: 'agent', content: currentText.trim(), isTyping: true };
        } else {
          newMessages.push({ type: 'agent', content: currentText.trim(), isTyping: true });
        }
        return newMessages;
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages[newMessages.length - 1]?.isTyping) {
        newMessages[newMessages.length - 1] = { type: 'agent', content: message };
      }
      return newMessages;
    });
    setIsTyping(false);
  };

  const askAgentQuestion = async (question: string) => {
    if (!edaResults) return "Please upload and analyze a dataset first.";
    
    try {
      const response = await fetch('http://127.0.0.1:8000/validation/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: question,
          eda_results: edaResults 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.answer || "I couldn't generate an answer for that question.";
      }
    } catch (error) {
      console.log('Agent offline, using local analysis');
    }
    
    // Fallback local analysis
    return generateLocalAnswer(question);
  };

  const generateLocalAnswer = (question: string) => {
    const q = question.toLowerCase().trim();
    
    if (q.includes('quality') || q.includes('good')) {
      const checks = edaResults?.validationChecks || {};
      return `📊 **Data Quality**: ${checks.dataQuality || 'Unknown'} • **Missing Data**: ${checks.missingDataLevel || 'Unknown'} • **Samples**: ${checks.sufficientSamples || 'Unknown'}`;
    }
    
    if (q.includes('missing') || q.includes('null')) {
      const missing = edaResults?.missingValues || {};
      const highMissing = Object.entries(missing).filter(([_, info]: [string, any]) => info.percentage > 10);
      return highMissing.length > 0 
        ? `⚠️ **Missing Data Issues**: ${highMissing.map(([col, info]: [string, any]) => `${col} (${info.percentage}%)`).join(', ')}`
        : "✅ **Missing Data**: Minimal missing values detected. Good data quality!";
    }
    
    if (q.includes('outlier')) {
      const numeric = edaResults?.numericalSummary || {};
      const withOutliers = Object.entries(numeric).filter(([_, info]: [string, any]) => (info.outliers || 0) > 0);
      return withOutliers.length > 0
        ? `📈 **Outliers Detected**: ${withOutliers.map(([col, info]: [string, any]) => `${col} (${info.outliers} outliers)`).join(', ')}`
        : "✅ **Outliers**: No significant outliers detected using IQR method.";
    }
    
    return "🤔 I can help with data quality, missing values, outliers, correlations, model recommendations, and more. Try being more specific!";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    if (!f.name.endsWith('.csv')) {
      setMessages(prev => [...prev, { 
        type: 'agent', 
        content: '❌ **File Type Error**: Please upload a CSV file. Other formats are not supported yet.' 
      }]);
      return;
    }

    // File size check (10MB limit)
    if (f.size > 10 * 1024 * 1024) {
      setMessages(prev => [...prev, { 
        type: 'agent', 
        content: '❌ **File Too Large**: Please upload a CSV file smaller than 10MB for optimal processing.' 
      }]);
      return;
    }

    setMessages(prev => [...prev, { type: 'user', content: `📁 Uploaded: **${f.name}** (${(f.size/1024).toFixed(1)} KB)` }]);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const parsed = parseCSV(text);
        setDataset(parsed);
        
        typeMessage(`✅ **Dataset Successfully Loaded!**
        
📊 **Quick Stats:**
• **Rows**: ${parsed.rows.length.toLocaleString()} samples
• **Columns**: ${parsed.headers.length} features  
• **Size**: ${(f.size/1024).toFixed(1)} KB

🎯 **What's your analysis goal?** 
*例如: "I want to predict customer churn" or "Clustering analysis" or just "analyze the data"*`);
        
        setAwaitingGoal(true);
        setIsProcessing(false);
      } catch (error) {
        setMessages(prev => [...prev, { 
          type: 'agent', 
          content: `❌ **Parsing Error**: ${error}. Please check your CSV format and try again.` 
        }]);
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setMessages(prev => [...prev, { 
        type: 'agent', 
        content: '❌ **File Reading Error**: Could not read the file. Please try uploading again.' 
      }]);
      setIsProcessing(false);
    };
    
    reader.readAsText(f);
  };

  const detectGoal = (text: string) => {
    const t = text.toLowerCase().trim();
    
    // Supervised learning keywords
    if (t.includes('predict') || t.includes('forecast') || t.includes('classification') || 
        t.includes('regression') || t.includes('target') || t.includes('label') ||
        t.includes('churn') || t.includes('price') || t.includes('sales') ||
        t.includes('outcome') || t.includes('supervised')) {
      return { 
        type: 'supervised', 
        description: 'Supervised Learning (Prediction)', 
        details: 'Predicting target variables using labeled data' 
      };
    }
    
    // Unsupervised learning keywords
    if (t.includes('cluster') || t.includes('segment') || t.includes('group') || 
        t.includes('pattern') || t.includes('unsupervised') || t.includes('anomaly') ||
        t.includes('outlier') || t.includes('similarity') || t.includes('discover')) {
      return { 
        type: 'unsupervised', 
        description: 'Unsupervised Learning (Clustering)', 
        details: 'Finding hidden patterns and structures in data' 
      };
    }
    
    // Time series keywords
    if (t.includes('time') || t.includes('series') || t.includes('trend') || 
        t.includes('seasonal') || t.includes('forecast') || t.includes('temporal')) {
      return { 
        type: 'timeseries', 
        description: 'Time Series Analysis', 
        details: 'Analyzing temporal patterns and trends' 
      };
    }
    
    // Default to EDA
    return { 
      type: 'eda', 
      description: 'Exploratory Data Analysis', 
      details: 'Understanding data structure and characteristics' 
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const text = input.trim();
    setMessages(prev => [...prev, { type: 'user', content: text }]);
    setInput('');

    // If waiting for goal after dataset upload
    if (awaitingGoal && dataset) {
      setAwaitingGoal(false);
      const goal = detectGoal(text);
      
      await typeMessage(`🎯 **Goal Detected**: ${goal.description}
      
🔍 **Analysis Type**: ${goal.details}
      
⚡ **Starting Comprehensive Analysis...**`, 50);
      
      await performAdvancedAnalysis(dataset, goal);
      return;
    }

    // If we have analysis results, answer questions intelligently
    if (edaResults) {
      setIsProcessing(true);
      try {
        const answer = await askAgentQuestion(text);
        await typeMessage(answer);
        
        // Suggest related questions
        const suggestions = getQuestionSuggestions(text);
        if (suggestions.length > 0) {
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              type: 'system', 
              content: `💡 **You might also ask**: ${suggestions.slice(0, 3).map(q => `"${q}"`).join(', ')}`,
              suggestions: suggestions.slice(0, 3)
            }]);
          }, 1000);
        }
        
      } catch (error) {
        await typeMessage("❌ Sorry, I encountered an error processing your question. Please try rephrasing it.");
      }
      setIsProcessing(false);
      return;
    }

    // No dataset uploaded yet
    await typeMessage("📁 **Please upload a CSV dataset first** so I can analyze it and answer your questions! Click the Upload button above to get started.");
  };

  const getQuestionSuggestions = (currentQuestion: string) => {
    const q = currentQuestion.toLowerCase();
    const suggestions = [];
    
    if (q.includes('quality')) {
      suggestions.push("What are the biggest data issues?", "How should I clean this data?", "Is this data ready for ML?");
    } else if (q.includes('outlier')) {
      suggestions.push("How should I handle these outliers?", "Are outliers affecting data quality?", "Which features have the most outliers?");
    } else if (q.includes('missing')) {
      suggestions.push("Which columns have the most missing data?", "How should I handle missing values?", "Can I still use this data with missing values?");
    } else if (q.includes('model')) {
      suggestions.push("What's the best algorithm for this data?", "How should I preprocess for modeling?", "What features are most important?");
    } else {
      suggestions.push("What's the data quality like?", "Are there any outliers?", "What model should I use?");
    }
    
    return suggestions;
  };

  const performAdvancedAnalysis = async (data: any, goal: any) => {
    setIsProcessing(true);
    
    try {
      // Try backend analysis first
      const csv = datasetToCSV(data);
      const res = await fetch('http://127.0.0.1:8000/validation/analyze', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ csv_text: csv, goal })
      });
      
      if (res.ok) {
        const json = await res.json();
        setEdaResults(json.result);
        if (onResult) onResult(json.result);
        if (onAgentMessage) onAgentMessage('✅ Advanced analysis complete with intelligent insights!');
        
        // Generate summary message
        const result = json.result;
        const summary = generateAnalysisSummary(result, goal);
        await typeMessage(summary);
        
        setIsProcessing(false);
        return;
      }
    } catch (error) {
      console.log('Backend unavailable, using enhanced local analysis');
    }

    // Enhanced local fallback
    await performEnhancedLocalEDA(data, goal);
  };

  const generateAnalysisSummary = (results: any, goal: any) => {
    const shape = results.shape || {};
    const quality = results.validationChecks?.dataQuality || 'Unknown';
    const missing = results.validationChecks?.missingDataLevel || 'Unknown';
    const readiness = results.validationChecks?.readinessScore || 0;
    
    let emoji = readiness > 80 ? '🎉' : readiness > 60 ? '✅' : readiness > 40 ? '⚠️' : '❌';
    
    return `${emoji} **Analysis Complete!**

📊 **Dataset Overview:**
• **Size**: ${shape.rows?.toLocaleString()} rows × ${shape.columns} features
• **Quality Score**: ${quality} (${readiness}/100)
• **Missing Data**: ${missing}

🎯 **For ${goal.description}:**
${results.recommendations?.slice(0, 3).map((rec: string) => `• ${rec}`).join('\n') || '• Data appears suitable for analysis'}

❓ **Ask me anything!** Try: *"What's the data quality?"* or *"Are there outliers?"*`;
  };

  const performEnhancedLocalEDA = async (data: any, goal: any) => {
    // Enhanced local analysis with basic statistics
    await new Promise(r => setTimeout(r, 1000)); // Simulate processing
    
    const { headers, rows } = data;
    const shape = { rows: rows.length, columns: headers.length };
    
    const analysis = {
      shape,
      headers,
      goal,
      isValid: rows.length > 0 && headers.length > 0,
      validationChecks: {
        dataQuality: rows.length > 100 ? 'Good' : rows.length > 30 ? 'Fair' : 'Limited',
        missingDataLevel: 'Analyzing...',
        readinessScore: Math.max(60, 100 - (headers.length > rows.length ? 30 : 0))
      },
      recommendations: [
        'Validate data types and handle missing values',
        'Check for outliers in numeric features', 
        'Consider feature scaling before modeling'
      ]
    };
    
    setEdaResults(analysis);
    if (onResult) onResult(analysis);
    
    await typeMessage(`✅ **Basic Analysis Complete!**

📊 **Dataset**: ${rows.length.toLocaleString()} rows × ${headers.length} features
🎯 **Goal**: ${goal.description}

💡 **Next Steps**: Ask me specific questions about your data for deeper insights!`);
    
    setIsProcessing(false);
  };

  const handleQuickQuestion = async (question: string) => {
    setMessages(prev => [...prev, { type: 'user', content: question }]);
    if (edaResults) {
      setIsProcessing(true);
      const answer = await askAgentQuestion(question);
      await typeMessage(answer);
      setIsProcessing(false);
    } else {
      await typeMessage("📁 Please upload and analyze a dataset first to ask questions about it!");
    }
  };

  return (
    <div className="relative h-full">
      <div className="pr-0 lg:pr-96 h-full">
        <div className="w-full bg-neutral-900 p-6 overflow-y-auto text-white">
          <div className="bg-gradient-to-r from-indigo-700 to-purple-600 text-white p-4 rounded-lg flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} />
              <div>
                <h4 className="font-semibold text-sm">Dataset Analysis Dashboard</h4>
                <p className="text-xs text-indigo-100">
                  {edaResults ? `${edaResults.shape?.rows?.toLocaleString() || 'N/A'} rows • ${edaResults.shape?.columns || 'N/A'} features` : 'Ready for analysis'}
                </p>
              </div>
            </div>
            {edaResults?.validationChecks?.readinessScore && (
              <div className="text-right">
                <div className="text-xs text-indigo-100">Quality Score</div>
                <div className="text-lg font-bold">{edaResults.validationChecks.readinessScore}/100</div>
              </div>
            )}
          </div>

          <div className="mt-6">
            {!edaResults ? (
                <div className="text-center text-gray-300 py-12">
                <Brain size={48} className="mx-auto mb-4 text-purple-400" />
                <h3 className="font-semibold text-lg text-white mb-2">Ready for Intelligent Analysis</h3>
                <p className="font-medium">Upload a CSV dataset to begin comprehensive analysis</p>
                <p className="text-sm mt-2">I'll provide insights, answer questions, and recommend best practices</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-indigo-300" />
                      <span className="font-semibold text-sm text-white">Dataset Size</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {edaResults.shape?.rows?.toLocaleString() || '0'} rows
                    </p>
                    <p className="text-sm text-white">{edaResults.shape?.columns || 0} features</p>
                  </div>
                  
                  <div className="bg-neutral-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-purple-600" />
                      <span className="font-semibold text-sm text-white">Data Quality</span>
                    </div>
                    <p className="text-lg font-bold text-purple-700">
                      {edaResults.validationChecks?.dataQuality || 'Unknown'}
                    </p>
                    <p className="text-sm text-white">
                      Missing: {edaResults.validationChecks?.missingDataLevel || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Feature Breakdown */}
                {(edaResults.numericColumns?.length > 0 || edaResults.objectColumns?.length > 0) && (
                  <div className="bg-neutral-800 p-4 rounded-lg border border-gray-700">
                    <h5 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                      <Code size={16} className="text-indigo-300" />
                      Feature Types
                    </h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-indigo-600 font-medium">Numeric: </span>
                        <span className="text-white">{edaResults.numericColumns?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-indigo-600 font-medium">Categorical: </span>
                        <span className="text-white">{edaResults.objectColumns?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {edaResults.recommendations?.length > 0 && (
                  <div className="bg-neutral-800 p-4 rounded-lg border border-gray-700">
                    <h5 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                      <Lightbulb size={16} className="text-purple-600" />
                      Key Recommendations
                    </h5>
                    <ul className="text-sm text-white space-y-1">
                      {edaResults.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick Questions */}
                {edaResults && (
                  <div className="bg-neutral-800 p-4 rounded-lg border border-gray-700">
                    <h5 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                      <MessageCircle size={16} className="text-purple-600" />
                      Quick Questions
                    </h5>
                    <div className="flex flex-wrap gap-2">
                        {quickQuestions.slice(0, 3).map((question, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickQuestion(question)}
                            className="px-3 py-1 text-xs bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors"
                          >
                            {question}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {collapsed ? (
                <button 
          aria-label="Open Validation Chat" 
          onClick={() => setCollapsed(false)} 
                  className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-700 to-purple-600 text-white rounded-l-xl px-4 py-3 z-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center gap-2">
            <Brain size={20} />
            <span className="font-medium">AI Assistant</span>
          </div>
        </button>
      ) : (
        <div className="fixed right-4 top-16 bottom-6 w-96 bg-neutral-900 shadow-2xl rounded-xl z-50 flex flex-col overflow-hidden border border-gray-700 text-white">
          <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain size={22} className="animate-pulse" />
              <div>
                <div className="font-bold text-sm">Intelligent Validation Agent</div>
                <div className="text-xs text-indigo-100">Chat • Ask • Analyze • Learn</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(isProcessing || isTyping) && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
              <button 
                onClick={() => setCollapsed(true)} 
                className="text-white opacity-80 hover:opacity-100 p-1 rounded hover:bg-white/20 transition-all"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-neutral-800 to-neutral-900">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.type === 'user' 
                    ? 'bg-gradient-to-r from-indigo-700 to-purple-600 text-white' 
                    : msg.type === 'system'
                    ? 'bg-neutral-800 border border-gray-700 text-white'
                    : 'bg-neutral-900 shadow-md border border-gray-700 text-white'
                }`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content.split('**').map((part: string, i: number) => 
                      i % 2 === 0 ? part : <strong key={i} className={msg.type === 'user' ? 'text-white' : 'text-white'}>{part}</strong>
                    )}
                  </div>
                  
                  {msg.suggestions && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex flex-wrap gap-1">
                          {msg.suggestions.map((suggestion: string, i: number) => (
                            <button
                              key={i}
                              onClick={() => handleQuickQuestion(suggestion)}
                              className="px-2 py-1 text-xs bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-neutral-900 shadow-md border border-gray-700 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-sm text-gray-300 ml-2">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick action buttons when dataset is loaded */}
          {edaResults && (
            <div className="px-4 py-2 bg-neutral-800 border-t border-gray-700">
              <div className="flex gap-1 overflow-x-auto">
                {quickQuestions.slice(0, 3).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(question)}
                    disabled={isTyping || isProcessing}
                    className="flex-shrink-0 px-2 py-1 text-xs bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-700 p-3 bg-neutral-800 text-white">
            <div className="flex gap-2 mb-3 justify-between items-center">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-700 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-800 hover:to-purple-700 transition-all disabled:opacity-50 shadow-sm"
                >
                  <Upload size={14} /> 
                  Upload CSV
                </button>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </div>
              
              {edaResults && (
                <div className="text-xs text-gray-300 flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  Dataset loaded
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} 
                placeholder={edaResults ? "Ask about your data..." : "Upload CSV first, then ask questions..."} 
                disabled={isTyping || isProcessing}
                className="flex-1 px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 text-sm text-white placeholder-gray-400 bg-neutral-800" 
              />
              <button 
                onClick={handleSendMessage} 
                disabled={!input.trim() || isTyping || isProcessing}
                className="px-3 py-2 bg-gradient-to-r from-indigo-700 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
            
            <div className="text-xs text-gray-300 mt-2 text-center">
              {awaitingGoal ? "Describe your analysis goal..." : "Press Enter to send, Shift+Enter for new line"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationAgenticAI;
