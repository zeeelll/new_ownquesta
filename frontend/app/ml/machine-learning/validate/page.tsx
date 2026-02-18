'use client';

import { useState, useEffect } from 'react';

export default function ValidatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [mlGoal, setMlGoal] = useState<string>('');
  const [mlValidationResult, setMlValidationResult] = useState<any>(null);
  const [edaResults, setEdaResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionCsv, setSessionCsv] = useState<string | null>(null);
  const [sessionFileName, setSessionFileName] = useState<string | null>(null);
  const [sessionPreview, setSessionPreview] = useState<{ columns: string[]; rows: string[][] } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [detectedGoal, setDetectedGoal] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [showCode, setShowCode] = useState(false);

  const detectGoal = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    const supervisedKeywords = ['predict', 'classification', 'regression', 'forecast', 'supervised',
                                'target', 'label', 'outcome', 'predict price', 'predict sales',
                                'classify', 'categorize', 'model', 'train', 'credit score', 'churn',
                                'sales prediction', 'price prediction'];
    const unsupervisedKeywords = ['cluster', 'segment', 'pattern', 'group', 'unsupervised',
                                  'anomaly', 'outlier', 'similarity', 'discover', 'grouping'];
    const edaKeywords = ['analyze', 'explore', 'understand', 'insights', 'statistics',
                         'visualize', 'eda', 'exploratory', 'summary'];

    const supervisedScore = supervisedKeywords.filter(kw => input.includes(kw)).length;
    const unsupervisedScore = unsupervisedKeywords.filter(kw => input.includes(kw)).length;
    const edaScore = edaKeywords.filter(kw => input.includes(kw)).length;

    if (supervisedScore > unsupervisedScore && supervisedScore > edaScore) {
      // Detect specific supervised type
      if (input.includes('classification') || input.includes('classify') || input.includes('categorize') || input.includes('churn')) {
        return {
          type: 'classification',
          description: 'Classification (Predicting Categories)',
          modelSuggestion: 'Best models: Random Forest, XGBoost, Logistic Regression',
          focus: ['Target variable identification', 'Class balance check', 'Feature importance',
                  'Categorical encoding', 'Missing value handling']
        };
      } else if (input.includes('regression') || input.includes('predict price') || input.includes('forecast') || input.includes('credit score')) {
        return {
          type: 'regression',
          description: 'Regression (Predicting Continuous Values)',
          modelSuggestion: 'Best models: Random Forest, XGBoost, Linear Regression',
          focus: ['Target variable distribution', 'Feature correlations', 'Outlier detection',
                  'Feature scaling', 'Linearity assessment']
        };
      } else {
        return {
          type: 'supervised',
          description: 'Supervised Learning (Auto-Detect)',
          modelSuggestion: 'Will auto-detect classification vs regression',
          focus: ['Target variable identification', 'Feature importance', 'Missing value impact',
                  'Data quality assessment', 'Feature correlations']
        };
      }
    } else if (unsupervisedScore > supervisedScore && unsupervisedScore > edaScore) {
      return {
        type: 'unsupervised',
        description: 'Unsupervised Learning (Clustering/Pattern Discovery)',
        modelSuggestion: 'Best models: K-means, DBSCAN, Hierarchical Clustering',
        focus: ['Feature scaling requirements', 'Outlier detection', 'Feature variance',
                'Correlation patterns', 'Dimensionality considerations']
      };
    } else {
      return {
        type: 'eda',
        description: 'Exploratory Data Analysis',
        modelSuggestion: 'Focus on data understanding before modeling',
        focus: ['Data quality assessment', 'Statistical summaries', 'Distribution analysis',
                'Correlation insights', 'Missing data patterns']
      };
    }
  };

  // Listen for widget requests (localStorage signal) to open code/insights
  useEffect(() => {
    const handleRequest = (raw: string | null) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.what === 'code') {
          setShowCode(true);
          setActiveTab('insights');
        } else if (parsed.what === 'insights') {
          setShowCode(false);
          setActiveTab('insights');
        }
      } catch (e) {}
    };

    // Check existing value at mount
    try {
      const v = localStorage.getItem('ownquesta_request_show');
      if (v) {
        handleRequest(v);
        localStorage.removeItem('ownquesta_request_show');
      }
    } catch (e) {}

    // Also listen for storage events (other tabs)
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'ownquesta_request_show' && ev.newValue) {
        handleRequest(ev.newValue);
        try { localStorage.removeItem('ownquesta_request_show'); } catch (e) {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMlValidationResult(null);
      setEdaResults(null);
      setActiveTab('overview');
    }
  };

  useEffect(() => {
    // Load currentMLSession (small preview) or fallback to latest saved project with full file content
    try {
      const raw = localStorage.getItem('currentMLSession');
      if (raw) {
        const session = JSON.parse(raw);
        if (session.uploadedFile) setSessionFileName(session.uploadedFile.name || null);
        if (session.dataPreview && Array.isArray(session.dataPreview.rows)) {
          const headers = (session.dataPreview.columns || []).join(',');
          const rows = (session.dataPreview.rows || []).map((r: any[]) => r.join(','));
          const csv = [headers, ...rows].join('\\n');
          setSessionCsv(csv);
          // lightweight preview
          setSessionPreview({ columns: session.dataPreview.columns || [], rows: session.dataPreview.rows || [] });
        }
        if (session.userQuery) setMlGoal(session.userQuery);
        return;
      }

      const rawProjects = localStorage.getItem('userProjects');
      if (rawProjects) {
        const projects = JSON.parse(rawProjects);
        if (Array.isArray(projects) && projects.length > 0) {
          const recent = projects[0];
          const saved = recent.savedState;
          if (saved) {
            if (saved.actualFile && saved.actualFile.content) {
              setSessionCsv(saved.actualFile.content);
              setSessionFileName(saved.actualFile.name || recent.dataset || recent.name || null);
              // parse preview from saved content: take header + first 5 rows
              try {
                const lines = String(saved.actualFile.content).split('\\n').filter((l: string) => l.trim());
                const cols = lines[0]?.split(',').map((c: string) => c.trim()) || [];
                const rows = lines.slice(1, 6).map((r: string) => r.split(',').map((c: string) => c.trim()));
                setSessionPreview({ columns: cols, rows });
              } catch (e) {
                // ignore parse errors
              }
            }
            if (saved.userQuery) setMlGoal(saved.userQuery);
            else if (recent.taskType) setMlGoal(recent.taskType || '');
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleMlValidation = async () => {
    if (!file && !sessionCsv) {
      alert('Please select a file first');
      return;
    }

    if (!mlGoal.trim()) {
      alert('Please enter your machine learning goal');
      return;
    }

    setLoading(true);
    setMlValidationResult(null);
    setEdaResults(null);

    // Detect and set goal
    const goal = detectGoal(mlGoal);
    setDetectedGoal(goal);

    try {
        // Use direct validation agent URL (runtime-configurable)
        const VALIDATION_BASE = (process.env.NEXT_PUBLIC_ML_VALIDATION_URL || '').replace(/\/ml-validation\/validate\/?$/, '') || 'http://localhost:8000';
        const VALIDATION_VALIDATE_URL = `${VALIDATION_BASE.replace(/\/$/, '')}/validation/validate`;

        let result: any = null;
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('goal', mlGoal.trim());

          const response = await fetch(VALIDATION_VALIDATE_URL, {
            method: 'POST',
            body: formData,
          });

          result = await response.json();
        } else if (sessionCsv) {
          const payload = { csv_text: sessionCsv, goal: { type: goal.type, target: mlGoal.trim() } };
          const response = await fetch(VALIDATION_VALIDATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          result = await response.json();
        }

      // Normalize different response shapes from agent
      // Possible shapes: { eda_result, ml_result } OR { result: <eda>, ml_result } OR { result: <eda>, ml_result: <ml> }
      let eda: any = null;
      let ml: any = null;

      if (result) {
        if (result.eda_result) eda = result.eda_result;
        else if (result.result) eda = result.result;
        else if (result.result && result.result.eda) eda = result.result.eda;
        else if (result.eda) eda = result.eda;

        if (result.ml_result) ml = result.ml_result;
        else if (result.ml) ml = result.ml;
        else if (result.result && result.result.ml_result) ml = result.result.ml_result;
      }

      // Fallback: if top-level response seems to be the ML result itself
      if (!eda && result && result.shape) eda = result;
      if (!ml && result && result.goal_understanding) ml = result;

      if (eda) {
        setEdaResults(eda);
        setActiveTab('insights');
      }
      if (ml) {
        setMlValidationResult(ml);
      } else {
        // If no ml block, keep any top-level textual agent answer
        setMlValidationResult(result ?? null);
      }
    } catch (error) {
      console.error('ML Validation error:', error);
      setMlValidationResult({ 
        error: 'ML validation failed', 
        details: String(error),
        status: 'REJECT',
        agent_answer: 'Failed to connect to ML validation service. Please try again.',
        user_view_report: '# Validation Failed\\n\\nUnable to process your request. Please check your connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!currentQuestion.trim() || !edaResults) return;

    const question = currentQuestion.trim();
    setCurrentQuestion('');

    try {
      const VALIDATION_BASE = (process.env.NEXT_PUBLIC_ML_VALIDATION_URL || '').replace(/\/ml-validation\/validate\/?$/, '') || 'http://localhost:8000';
      const VALIDATION_QUESTION_URL = `${VALIDATION_BASE.replace(/\/$/, '')}/validation/question`;

      const response = await fetch(VALIDATION_QUESTION_URL, {
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

  const renderOverview = () => {
    if (!edaResults && !mlValidationResult) return <div className="text-gray-500">No analysis data available</div>;

    return (
      <div className="space-y-6">
        {edaResults && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Dataset Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{edaResults.shape?.rows || 'N/A'}</div>
                <div className="text-sm text-gray-600">Rows</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{edaResults.shape?.columns || 'N/A'}</div>
                <div className="text-sm text-gray-600">Columns</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded">
                <div className="text-2xl font-bold text-purple-600">{edaResults.numericColumns?.length || 0}</div>
                <div className="text-sm text-gray-600">Numeric</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded">
                <div className="text-2xl font-bold text-orange-600">{edaResults.objectColumns?.length || 0}</div>
                <div className="text-sm text-gray-600">Categorical</div>
              </div>
            </div>
          </div>
        )}

        {edaResults?.insights && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">📈</span>
              Data Quality Assessment
            </h3>
            <div className="space-y-3">
              {edaResults.insights.dataQuality?.map((insight: string, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded text-sm border-l-4 border-blue-400">
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {mlValidationResult && (
          <div className="space-y-4">
            {/* Goal Understanding */}
            {mlValidationResult.goal_understanding && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 text-purple-900">🎯 Goal Analysis</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Task Type:</p>
                    <p className="font-medium text-gray-800 capitalize text-lg">
                      {mlValidationResult.goal_understanding.interpreted_task}
                    </p>
                  </div>
                  
                  {mlValidationResult.goal_understanding.target_column_guess && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Suggested Target:</p>
                      <p className="font-medium text-purple-700 text-lg">
                        {mlValidationResult.goal_understanding.target_column_guess}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Confidence:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{width: `${(mlValidationResult.goal_understanding.confidence || 0) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {((mlValidationResult.goal_understanding.confidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {mlValidationResult.optional_questions && mlValidationResult.optional_questions.length > 0 && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 text-teal-900">💡 Recommendations</h3>
                <ul className="space-y-2">
                  {mlValidationResult.optional_questions.map((question: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 bg-teal-50 p-3 rounded">
                      <span className="text-teal-600 font-bold text-lg">•</span>
                      <span className="text-gray-800">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );  };

  const renderEDAResults = () => {
    if (!edaResults) return <div className="text-gray-500 text-center py-8">No EDA results available. Please run the validation analysis first.</div>;

    return (
      <div className="space-y-8">
        {/* Dataset Shape & Basic Info */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Dataset Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">{edaResults.shape?.rows?.toLocaleString() || 'N/A'}</div>
              <div className="text-sm text-gray-600 font-medium">Total Rows</div>
              <div className="text-xs text-blue-500 mt-1">Records</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">{edaResults.shape?.columns || 'N/A'}</div>
              <div className="text-sm text-gray-600 font-medium">Total Columns</div>
              <div className="text-xs text-green-500 mt-1">Features</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">{edaResults.numericColumns?.length || 0}</div>
              <div className="text-sm text-gray-600 font-medium">Numeric</div>
              <div className="text-xs text-purple-500 mt-1">Quantitative</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <div className="text-3xl font-bold text-orange-600 mb-2">{edaResults.objectColumns?.length || 0}</div>
              <div className="text-sm text-gray-600 font-medium">Categorical</div>
              <div className="text-xs text-orange-500 mt-1">Qualitative</div>
            </div>
          </div>
        </div>

        {/* Missing Values & Data Quality */}
        {edaResults.missingValues && Object.keys(edaResults.missingValues).length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <span className="mr-3">⚠️</span>
              Missing Values Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(edaResults.missingValues).map(([col, info]: [string, any]) => (
                <div key={col} className={`p-4 rounded-lg border ${
                  info.percentage > 50 ? 'bg-red-50 border-red-300' :
                  info.percentage > 20 ? 'bg-yellow-50 border-yellow-300' :
                  info.percentage > 0 ? 'bg-orange-50 border-orange-300' :
                  'bg-green-50 border-green-300'
                }`}>
                  <h4 className="font-semibold text-gray-800 mb-2">{col}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Missing:</span>
                      <span className="font-medium">{info.count?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Percentage:</span>
                      <span className={`font-medium ${
                        info.percentage > 50 ? 'text-red-600' :
                        info.percentage > 20 ? 'text-yellow-600' :
                        info.percentage > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>{info.percentage?.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${
                          info.percentage > 50 ? 'bg-red-500' :
                          info.percentage > 20 ? 'bg-yellow-500' :
                          info.percentage > 0 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{width: `${Math.min(info.percentage, 100)}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comprehensive Numerical Features Analysis */}
        {edaResults.numericalSummary && Object.keys(edaResults.numericalSummary).length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <span className="mr-3">📈</span>
              Comprehensive Numerical Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold border-b">Feature</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Count</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Mean</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Median</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Mode</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Std Dev</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Variance</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Skewness</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Min</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Q1</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Q3</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Max</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Range</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">IQR</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(edaResults.numericalSummary).map(([col, stats]: [string, any]) => {
                    const range = (stats.max && stats.min) ? (stats.max - stats.min) : null;
                    const iqr = (stats.q75 && stats.q25) ? (stats.q75 - stats.q25) : null;
                    return (
                      <tr key={col} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{col}</td>
                        <td className="px-4 py-3 text-gray-700">{stats.count?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-700">{typeof stats.mean === 'number' ? stats.mean.toFixed(2) : stats.mean || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{typeof stats.median === 'number' ? stats.median.toFixed(2) : stats.median || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{typeof stats.mode === 'number' ? stats.mode.toFixed(2) : stats.mode || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{typeof stats.std === 'number' ? stats.std.toFixed(2) : stats.std || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{typeof stats.variance === 'number' ? stats.variance.toFixed(2) : stats.variance || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            !stats.skewness ? 'bg-gray-100 text-gray-600' :
                            Math.abs(stats.skewness) < 0.5 ? 'bg-green-100 text-green-800' :
                            Math.abs(stats.skewness) < 1 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {typeof stats.skewness === 'number' ? stats.skewness.toFixed(2) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{typeof stats.min === 'number' ? stats.min.toFixed(2) : stats.min || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{typeof stats.q25 === 'number' ? stats.q25.toFixed(2) : stats.q25 || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{typeof stats.q75 === 'number' ? stats.q75.toFixed(2) : stats.q75 || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{typeof stats.max === 'number' ? stats.max.toFixed(2) : stats.max || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{typeof range === 'number' ? range.toFixed(2) : 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{typeof iqr === 'number' ? iqr.toFixed(2) : 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categorical Features Analysis */}
        {edaResults.objectSummary && Object.keys(edaResults.objectSummary).length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <span className="mr-3">🏷️</span>
              Categorical Features Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(edaResults.objectSummary).map(([col, stats]: [string, any]) => (
                <div key={col} className="border rounded-lg p-6 bg-gray-50">
                  <h4 className="font-semibold text-lg text-gray-800 mb-4">{col}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="bg-white p-3 rounded">
                      <div className="text-gray-600">Unique Values</div>
                      <div className="text-xl font-bold text-blue-600">{stats.unique || 'N/A'}</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <div className="text-gray-600">Entropy</div>
                      <div className="text-xl font-bold text-purple-600">
                        {typeof stats.entropy === 'number' ? stats.entropy.toFixed(2) : 'N/A'}
                      </div>
                    </div>
                  </div>
                  {stats.topValues && stats.topValues.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Top Values</h5>
                      <div className="space-y-2">
                        {stats.topValues.slice(0, 5).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-2 rounded">
                            <span className="font-medium text-gray-800 truncate">{item.value}</span>
                            <span className="text-sm font-semibold text-green-600">{item.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correlation Analysis */}
        {edaResults.correlation && Object.keys(edaResults.correlation).length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <span className="mr-3">🔗</span>
              Feature Correlations
            </h3>
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-4">Strong correlations (|r| > 0.7):</div>
              <div className="space-y-3">
                {Object.entries(edaResults.correlation).flatMap(([col, correlations]: [string, any]) => 
                  Object.entries(correlations).filter(([_, corr]: [string, any]) => 
                    Math.abs(corr) > 0.7 && Math.abs(corr) < 1
                  ).map(([otherCol, corr]: [string, any]) => {
                    if (col < otherCol) { // Avoid duplicates
                      return (
                        <div key={`${col}-${otherCol}`} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                          <div>
                            <span className="font-medium text-gray-800">{col}</span>
                            <span className="text-gray-500 mx-2">↔</span>
                            <span className="font-medium text-gray-800">{otherCol}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                              corr > 0.8 ? 'bg-green-100 text-green-800' :
                              corr > 0.7 ? 'bg-green-100 text-green-700' :
                              corr < -0.8 ? 'bg-red-100 text-red-800' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {(corr as number).toFixed(3)}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              Math.abs(corr) > 0.9 ? 'bg-red-100 text-red-800' :
                              Math.abs(corr) > 0.8 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {Math.abs(corr) > 0.9 ? 'Very Strong' :
                               Math.abs(corr) > 0.8 ? 'Strong' : 'Moderate'}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })
                ).filter(Boolean)}
              </div>
              {Object.entries(edaResults.correlation).flatMap(([col, correlations]: [string, any]) => 
                Object.entries(correlations).filter(([otherCol, corr]: [string, any]) => 
                  Math.abs(corr) > 0.7 && Math.abs(corr) < 1 && col < otherCol
                )
              ).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No strong correlations found (|r| > 0.7)</p>
                  <p className="text-sm mt-1">Features appear relatively independent</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Distribution Insights */}
        {edaResults.insights && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <span className="mr-3">📊</span>
              Data Distribution & Insights
            </h3>
            <div className="space-y-4">
              {edaResults.insights.dataQuality && edaResults.insights.dataQuality.map((insight: string, index: number) => (
                <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-l-4 border-green-400">
                  <div className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-800">{insight}</span>
                  </div>
                </div>
              ))}
              {edaResults.insights.recommendations && edaResults.insights.recommendations.map((rec: string, index: number) => (
                <div key={index} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-400">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-0.5">⚡</span>
                    <span className="text-gray-800">{rec}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCodeInsights = () => {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center">
              <span className="mr-3">💻</span>
              Python Documentation & Implementation Guide
            </h3>
            <button
              onClick={() => setShowCode(!showCode)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
            >
              {showCode ? 'Hide Code' : 'Show Python Code'}
            </button>
          </div>
          
          {showCode && (
            <div className="space-y-6">
              {/* Essential Libraries Section */}
              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg">
                <h4 className="text-green-400 mb-4 text-lg font-semibold"># Step 1: Essential Python Libraries</h4>
                <div className="mb-4 text-sm text-gray-300">
                  <p>These are the core libraries you'll need for data analysis and machine learning:</p>
                </div>
                <pre className="text-sm bg-gray-800 p-4 rounded overflow-x-auto">
{`# Data manipulation and analysis
import pandas as pd           # For working with datasets (CSV, Excel)
import numpy as np            # For numerical operations and arrays

# Data visualization
import matplotlib.pyplot as plt  # For creating plots and charts
import seaborn as sns            # For beautiful statistical visualizations

# Machine Learning
from sklearn.model_selection import train_test_split  # Split data for training/testing
from sklearn.ensemble import RandomForestClassifier   # Powerful ML algorithm
from sklearn.metrics import accuracy_score, classification_report

# Data preprocessing
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer  # Handle missing values`}
                </pre>
              </div>

              {/* EDA Code Section */}
              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg">
                <h4 className="text-blue-400 mb-4 text-lg font-semibold"># Step 2: Exploratory Data Analysis (EDA)</h4>
                <div className="mb-4 text-sm text-gray-300">
                  <p>This code will help you understand your dataset - its structure, quality, and patterns:</p>
                </div>
                <pre className="text-sm bg-gray-800 p-4 rounded overflow-x-auto">
{`# Load your dataset
df = pd.read_csv('${sessionFileName || 'your_dataset.csv'}')
print("Dataset loaded successfully!")

# Basic dataset information
print(f"Dataset Shape: {edaResults?.shape?.rows || 'X'} rows × {edaResults?.shape?.columns || 'Y'} columns")
print(f"Memory usage: {df.memory_usage(deep=True).sum() / 1024**2:.1f} MB")

# Display first few rows
print("\nFirst 5 rows:")
print(df.head())

# Data types and missing values
print("\nData Types and Missing Values:")
print(df.info())
print("\nMissing values per column:")
print(df.isnull().sum())

# Statistical summary for numerical columns
print("\nNumerical Features Summary:")
print(df.describe())

# Unique values for categorical columns
print("\nCategorical Features Summary:")
for col in df.select_dtypes(include=['object']).columns:
    print(f"{col}: {df[col].nunique()} unique values")
    print(f"Top values: {df[col].value_counts().head(3).to_dict()}")
    print("-" * 40)`}
                </pre>
              </div>

              {/* Data Cleaning Section */}
              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg">
                <h4 className="text-yellow-400 mb-4 text-lg font-semibold"># Step 3: Data Cleaning & Preprocessing</h4>
                <div className="mb-4 text-sm text-gray-300">
                  <p>Clean and prepare your data for machine learning:</p>
                </div>
                <pre className="text-sm bg-gray-800 p-4 rounded overflow-x-auto">
{`# Handle missing values
print("Handling missing values...")

# For numerical columns: fill with mean/median
numerical_cols = df.select_dtypes(include=[np.number]).columns
for col in numerical_cols:
    if df[col].isnull().sum() > 0:
        df[col] = df[col].fillna(df[col].median())  # Use median for outliers
        print(f"Filled missing values in {col} with median")

# For categorical columns: fill with mode
categorical_cols = df.select_dtypes(include=['object']).columns
for col in categorical_cols:
    if df[col].isnull().sum() > 0:
        df[col] = df[col].fillna(df[col].mode()[0])  # Most frequent value
        print(f"Filled missing values in {col} with mode")

# Remove duplicates
initial_rows = len(df)
df = df.drop_duplicates()
print(f"Removed {initial_rows - len(df)} duplicate rows")

# Handle outliers (optional)
def remove_outliers_iqr(df, column):
    """Remove outliers using IQR method"""
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    return df[(df[column] >= lower) & (df[column] <= upper)]

# Apply outlier removal to numerical columns (if needed)
for col in numerical_cols:
    outlier_count = len(df) - len(remove_outliers_iqr(df, col))
    if outlier_count > 0:
        print(f"{col} has {outlier_count} outliers")`}
                </pre>
              </div>

              {/* Visualization Section */}
              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg">
                <h4 className="text-purple-400 mb-4 text-lg font-semibold"># Step 4: Data Visualization</h4>
                <div className="mb-4 text-sm text-gray-300">
                  <p>Create beautiful visualizations to understand your data patterns:</p>
                </div>
                <pre className="text-sm bg-gray-800 p-4 rounded overflow-x-auto">
{`# Set up plotting style
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

# Create correlation heatmap for numerical features
numerical_data = df.select_dtypes(include=[np.number])
if len(numerical_data.columns) > 1:
    plt.figure(figsize=(12, 8))
    correlation_matrix = numerical_data.corr()
    sns.heatmap(correlation_matrix, 
                annot=True, 
                cmap='RdYlBu_r', 
                center=0,
                square=True,
                fmt='.2f')
    plt.title('Feature Correlation Matrix', size=16, fontweight='bold')
    plt.tight_layout()
    plt.show()

# Distribution plots for numerical features
for col in numerical_data.columns[:4]:  # Show first 4 numerical columns
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    # Histogram
    ax1.hist(df[col], bins=30, alpha=0.7, color='skyblue', edgecolor='black')
    ax1.set_title(f'{col} Distribution', fontweight='bold')
    ax1.set_xlabel(col)
    ax1.set_ylabel('Frequency')
    
    # Box plot
    ax2.boxplot(df[col], patch_artist=True, 
                boxprops=dict(facecolor='lightgreen', alpha=0.7))
    ax2.set_title(f'{col} Box Plot', fontweight='bold')
    ax2.set_ylabel(col)
    
    plt.tight_layout()
    plt.show()

# Count plots for categorical features
for col in categorical_cols[:3]:  # Show first 3 categorical columns
    plt.figure(figsize=(10, 6))
    value_counts = df[col].value_counts().head(10)
    sns.countplot(data=df, x=col, order=value_counts.index)
    plt.title(f'{col} Distribution', fontweight='bold', size=14)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()`}
                </pre>
              </div>

              {/* Machine Learning Section */}
              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg">
                <h4 className="text-red-400 mb-4 text-lg font-semibold"># Step 5: Machine Learning Model Training</h4>
                <div className="mb-4 text-sm text-gray-300">
                  <p>Train your first machine learning model with this easy template:</p>
                </div>
                <pre className="text-sm bg-gray-800 p-4 rounded overflow-x-auto">
{`# Prepare features and target variable
# Replace 'your_target_column' with your actual target column name
target_column = '${mlGoal.toLowerCase().includes('predict') ? mlGoal.split(' ').pop() || 'target' : 'target'}'

# Features (X) and target (y)
X = df.drop(columns=[target_column])  # All columns except target
y = df[target_column]                 # Target column only

print(f"Features shape: {X.shape}")
print(f"Target shape: {y.shape}")

# Handle categorical features
from sklearn.preprocessing import LabelEncoder
le = LabelEncoder()

for col in X.select_dtypes(include=['object']).columns:
    X[col] = le.fit_transform(X[col].astype(str))
    print(f"Encoded categorical feature: {col}")

# Split data into training and testing sets (80-20 split)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, 
    test_size=0.2,      # 20% for testing
    random_state=42,    # For reproducible results
    stratify=y          # Maintain class distribution
)

print(f"Training set: {X_train.shape[0]} samples")
print(f"Testing set: {X_test.shape[0]} samples")

# Train Random Forest model (great for beginners!)
print("Training Random Forest model...")
rf_model = RandomForestClassifier(
    n_estimators=100,    # Number of trees
    random_state=42,     # For reproducible results
    max_depth=10,        # Prevent overfitting
    min_samples_split=5  # Minimum samples to split a node
)

# Fit the model
rf_model.fit(X_train, y_train)
print("Model training completed!")

# Make predictions
y_pred = rf_model.predict(X_test)

# Evaluate model performance
accuracy = accuracy_score(y_test, y_pred)
print(f"\nModel Accuracy: {accuracy:.3f} ({accuracy*100:.1f}%)")

# Detailed classification report
print("\nDetailed Performance Report:")
print(classification_report(y_test, y_pred))

# Feature importance (which features are most important?)
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': rf_model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nTop 10 Most Important Features:")
print(feature_importance.head(10))

# Visualize feature importance
plt.figure(figsize=(10, 6))
top_features = feature_importance.head(10)
sns.barplot(data=top_features, x='importance', y='feature', palette='viridis')
plt.title('Top 10 Feature Importances', fontweight='bold', size=14)
plt.xlabel('Importance Score')
plt.tight_layout()
plt.show()`}
                </pre>
              </div>

              {/* Model Improvement Section */}
              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg">
                <h4 className="text-cyan-400 mb-4 text-lg font-semibold"># Step 6: Model Improvement & Validation</h4>
                <div className="mb-4 text-sm text-gray-300">
                  <p>Advanced techniques to improve and validate your model:</p>
                </div>
                <pre className="text-sm bg-gray-800 p-4 rounded overflow-x-auto">
{`# Cross-validation for better performance estimation
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.svm import SVC

# Compare multiple algorithms
models = {
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
    'SVM': SVC(random_state=42)
}

print("Comparing different algorithms...")
results = {}

for name, model in models.items():
    # 5-fold cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
    results[name] = {
        'mean_accuracy': cv_scores.mean(),
        'std_accuracy': cv_scores.std()
    }
    print(f"{name}: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

# Select best model
best_model_name = max(results.keys(), key=lambda k: results[k]['mean_accuracy'])
print(f"\nBest Model: {best_model_name}")

# Hyperparameter tuning for the best model
from sklearn.model_selection import GridSearchCV

if best_model_name == 'Random Forest':
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [5, 10, None],
        'min_samples_split': [2, 5, 10]
    }
    best_model = RandomForestClassifier(random_state=42)
else:
    # Add parameter grids for other models as needed
    best_model = models[best_model_name]
    param_grid = {}  # Use default parameters

if param_grid:
    print("Optimizing hyperparameters...")
    grid_search = GridSearchCV(
        best_model, 
        param_grid, 
        cv=3, 
        scoring='accuracy',
        n_jobs=-1  # Use all CPU cores
    )
    grid_search.fit(X_train, y_train)
    
    print(f"Best parameters: {grid_search.best_params_}")
    print(f"Best cross-validation score: {grid_search.best_score_:.3f}")
    
    # Use the best model
    final_model = grid_search.best_estimator_
else:
    final_model = best_model.fit(X_train, y_train)

# Final model evaluation
final_predictions = final_model.predict(X_test)
final_accuracy = accuracy_score(y_test, final_predictions)

print(f"\nFinal Model Performance:")
print(f"Test Accuracy: {final_accuracy:.3f} ({final_accuracy*100:.1f}%)")
print("\nFinal Classification Report:")
print(classification_report(y_test, final_predictions))`}
                </pre>
              </div>

              {/* Save Model Section */}
              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg">
                <h4 className="text-green-400 mb-4 text-lg font-semibold"># Step 7: Save Your Model</h4>
                <div className="mb-4 text-sm text-gray-300">
                  <p>Save your trained model for future use:</p>
                </div>
                <pre className="text-sm bg-gray-800 p-4 rounded overflow-x-auto">
{`import joblib
from datetime import datetime

# Save the trained model
model_filename = f"{best_model_name.lower().replace(' ', '_')}_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
joblib.dump(final_model, model_filename)
print(f"Model saved as: {model_filename}")

# Save feature names for future predictions
feature_names = X.columns.tolist()
features_filename = f"feature_names_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
joblib.dump(feature_names, features_filename)
print(f"Feature names saved as: {features_filename}")

# Example: Load and use the saved model
# loaded_model = joblib.load(model_filename)
# loaded_features = joblib.load(features_filename)
# new_predictions = loaded_model.predict(new_data)

print("\n🎉 Congratulations! Your model is ready for production use!")`}
                </pre>
              </div>
            </div>
          )}

          {/* AI Insights Section */}
          {(edaResults?.aiInsights || mlValidationResult?.aiInsights) && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">🧠 AI-Powered Insights</h4>
              
              {edaResults?.aiInsights && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200 mb-4">
                  <h5 className="font-semibold text-purple-800 mb-3 flex items-center">
                    <span className="mr-2">📊</span>
                    EDA Analysis Insights
                  </h5>
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {edaResults.aiInsights}
                  </div>
                </div>
              )}

              {mlValidationResult?.aiInsights && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-orange-200">
                  <h5 className="font-semibold text-orange-800 mb-3 flex items-center">
                    <span className="mr-2">🎯</span>
                    ML Strategy Insights
                  </h5>
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {mlValidationResult.aiInsights}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Key Findings Summary */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">📋 Key Implementation Findings</h4>
            <div className="space-y-3">
              {edaResults?.insights?.keyFindings?.map((finding: string, index: number) => (
                <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 mt-0.5">✅</span>
                    <span className="text-gray-800">{finding}</span>
                  </div>
                </div>
              )) || (
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-500 mt-0.5">📊</span>
                      <span className="text-gray-800">
                        Dataset contains {edaResults?.shape?.rows?.toLocaleString() || 'unknown'} rows and {edaResults?.shape?.columns || 'unknown'} columns
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-400">
                    <div className="flex items-start gap-3">
                      <span className="text-green-500 mt-0.5">🔧</span>
                      <span className="text-gray-800">
                        Identified {edaResults?.numericColumns?.length || 0} numerical and {edaResults?.objectColumns?.length || 0} categorical features for analysis
                      </span>
                    </div>
                  </div>
                  {mlValidationResult?.status === 'PROCEED' && (
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-l-4 border-emerald-400">
                      <div className="flex items-start gap-3">
                        <span className="text-emerald-500 mt-0.5">🚀</span>
                        <span className="text-gray-800">
                          ✅ Dataset is ready for machine learning with quality score: {mlValidationResult.satisfaction_score}/100
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border-l-4 border-purple-400">
                    <div className="flex items-start gap-3">
                      <span className="text-purple-500 mt-0.5">💡</span>
                      <span className="text-gray-800">
                        Follow the Python code above to implement your ML pipeline step by step. All code is production-ready and well-documented!
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed ML Validation Report */}
        {mlValidationResult?.user_view_report && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
              <span className="mr-3">📋</span>
              Complete Analysis Report
            </h3>
            <div className="prose prose-gray max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-lg border">
                {mlValidationResult.user_view_report}
              </div>
            </div>
          </div>
        )}

        {/* ML Validation Detailed Sections */}
        {mlValidationResult && (
          <div className="space-y-6">
            {mlValidationResult.preprocessingSteps && mlValidationResult.preprocessingSteps.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-3">🧩</span>
                  Recommended Preprocessing Steps
                </h3>
                <ul className="list-none space-y-3">
                  {mlValidationResult.preprocessingSteps.map((s: any, i: number) => (
                    <li key={i} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-start gap-3">
                        <span className="text-blue-500 mt-0.5 text-lg">{i + 1}.</span>
                        <div>
                          <strong className="text-gray-800">{s.step || s.type || 'Processing Step'}:</strong>
                          <p className="text-gray-700 mt-1">{s.description || s.reason || JSON.stringify(s)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {mlValidationResult.modelRecommendations && mlValidationResult.modelRecommendations.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-3">🤖</span>
                  AI Model Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mlValidationResult.modelRecommendations.map((m: any, i: number) => (
                    <div key={i} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-500 text-lg">🎯</span>
                        <h4 className="font-semibold text-green-800">{m.algorithm || m.type || 'ML Model'}</h4>
                      </div>
                      <p className="text-gray-700 text-sm">{m.use_case || m.description || 'Recommended for this dataset'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mlValidationResult.performanceEstimates && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-3">📈</span>
                  Performance Estimates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {mlValidationResult.performanceEstimates.confidence || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Confidence Level</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {mlValidationResult.performanceEstimates.expected_accuracy || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Expected Accuracy</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {mlValidationResult.performanceEstimates.data_sufficiency || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Data Sufficiency</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderQAInterface = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">💬</span>
            Ask Questions About Your Data
          </h3>
          
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Ask about your dataset... (e.g., What are the main patterns in this data?)"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
              disabled={!edaResults}
            />
            <button
              onClick={askQuestion}
              disabled={!currentQuestion.trim() || !edaResults}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Ask
            </button>
          </div>

          {!edaResults && (
            <div className="text-gray-500 text-center py-8">
              Please run the validation analysis first to enable the Q&A feature.
            </div>
          )}

          {/* Questions and Answers */}
          {questions.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Conversation History:</h4>
              {questions.map((qa, index) => (
                <div key={index} className="space-y-2">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-800">Question:</span>
                      <span className="text-xs text-gray-500">{qa.timestamp}</span>
                    </div>
                    <p className="text-gray-700 mt-1">{qa.question}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg ml-4">
                    <span className="font-medium text-green-800">Answer:</span>
                    <div className="text-gray-700 mt-1 whitespace-pre-wrap">{qa.answer}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-xl p-6 mb-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-3xl">🤖</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AI-Powered ML Validation</h1>
            <p className="text-blue-100">Intelligent dataset analysis and model recommendation system</p>
          </div>
        </div>
      </div>

      {/* Current Session Info */}
      {(sessionFileName || mlGoal) && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
            <span className="mr-2">📊</span>
            Current ML Session
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessionFileName && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Dataset</h4>
                <p className="text-gray-700 font-medium">{sessionFileName}</p>
              </div>
            )}
            {mlGoal && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-1">Goal</h4>
                <p className="text-gray-700 font-medium">{mlGoal}</p>
              </div>
            )}
          </div>
          {detectedGoal && (
            <div className="mt-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                <span className="mr-2">🎯</span>
                Auto-Detected Task: {detectedGoal.description}
              </h4>
              <p className="text-sm text-purple-700">{detectedGoal.modelSuggestion}</p>
            </div>
          )}
        </div>
      )}

      {/* Dataset Upload & Goal Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">📁</span>
          Upload Dataset & Define Goal
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dataset:</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
            />
            {file && <p className="text-sm text-gray-600 mt-2">Selected: {file.name}</p>}
            {!file && sessionFileName && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Using dataset from Setup: <strong>{sessionFileName}</strong></p>
                {sessionPreview && (
                  <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700">
                    <div className="font-medium mb-2">Preview (first {sessionPreview.rows.length} rows)</div>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto text-left text-xs">
                        <thead>
                          <tr>
                            {sessionPreview.columns.map((c, i) => (
                              <th key={i} className="px-2 py-1 font-medium border-b">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sessionPreview.rows.map((r, ri) => (
                            <tr key={ri} className="border-b">
                              {r.map((cell, ci) => (
                                <td key={ci} className="px-2 py-2">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="ml-goal" className="block text-sm font-medium text-gray-700 mb-2">
              Machine Learning Goal:
            </label>
            <textarea
              id="ml-goal"
                value={mlGoal}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMlGoal(e.target.value)}
                placeholder="e.g., I want to predict customer churn based on usage patterns"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={(!file && !sessionCsv) || loading}
            />
          </div>
          
          <button
            onClick={handleMlValidation}
              disabled={(!file && !sessionCsv) || !mlGoal.trim() || loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing with AI...
              </>
            ) : (
              <>
                🚀 Validate with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
            <p className="text-gray-600 text-center">
              AI is analyzing your dataset and goal...<br/>
              This may take a few moments...
            </p>
          </div>
        </div>
      )}

      {/* ML Validation Results - Enhanced with Tabs */}
      {(mlValidationResult || edaResults) && !loading && (
        <div className="space-y-6 mb-6">
          {/* Status Summary */}
          <div className={`rounded-lg shadow-lg p-6 border-l-4 ${
            mlValidationResult?.status === 'PROCEED' ? 'bg-green-50 border-green-500' :
            mlValidationResult?.status === 'PAUSE' ? 'bg-yellow-50 border-yellow-500' :
            'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                mlValidationResult?.status === 'PROCEED' ? 'bg-green-100 text-green-700' :
                mlValidationResult?.status === 'PAUSE' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {mlValidationResult?.status === 'PROCEED' ? '✅' : 
                 mlValidationResult?.status === 'PAUSE' ? '⚠️' : '❌'}
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${
                  mlValidationResult?.status === 'PROCEED' ? 'text-green-800' :
                  mlValidationResult?.status === 'PAUSE' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  {mlValidationResult?.status === 'PROCEED' ? 'Ready to Proceed!' :
                   mlValidationResult?.status === 'PAUSE' ? 'Needs Attention' :
                   'Analysis Complete'}
                </h3>
                <p className="text-lg font-medium text-gray-600">
                  Quality Score: {mlValidationResult?.satisfaction_score || 0}/100
                </p>
              </div>
            </div>

            {/* Detected Goal */}
            {detectedGoal && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">🎯 Detected Goal: {detectedGoal.description}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {detectedGoal.focus.map((item: string, index: number) => (
                    <div key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {mlValidationResult?.agent_answer && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">🤖 AI Agent Analysis:</h4>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {mlValidationResult.agent_answer}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabbed Interface */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'overview', name: 'Overview', icon: '📊' },
                  { id: 'eda', name: 'Detailed Analysis', icon: '📈' },
                  { id: 'insights', name: 'Code & Insights', icon: '💡' },
                  { id: 'qa', name: 'Ask Questions', icon: '💬' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'eda' && renderEDAResults()}
              {activeTab === 'insights' && renderCodeInsights()}
              {activeTab === 'qa' && renderQAInterface()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


