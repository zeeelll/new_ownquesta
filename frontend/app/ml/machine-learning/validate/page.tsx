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
      let result: any = null;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('goal', mlGoal.trim());

        const response = await fetch('/api/ml-validation/validate', {
          method: 'POST',
          body: formData,
        });

        result = await response.json();
      } else if (sessionCsv) {
        const payload = { csv_text: sessionCsv, goal: { type: goal.type, target: mlGoal.trim() } };
        const response = await fetch('/api/ml-validation/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        result = await response.json();
      }

      if (result && result.eda_result) {
        setEdaResults(result.eda_result);
      }
      if (result && result.ml_result) {
        setMlValidationResult(result.ml_result);
      } else {
        setMlValidationResult(result);
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
          answer: 'Sorry, I couldn\\'t process your question. Please try rephrasing.',
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
    if (!edaResults) return <div className="text-gray-500">No EDA results available</div>;

    return (
      <div className="space-y-6">
        {/* Numerical Features */}
        {edaResults.numericalSummary && Object.keys(edaResults.numericalSummary).length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Numerical Features Summary</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Feature</th>
                    <th className="px-4 py-2 text-left">Count</th>
                    <th className="px-4 py-2 text-left">Mean</th>
                    <th className="px-4 py-2 text-left">Median</th>
                    <th className="px-4 py-2 text-left">Std</th>
                    <th className="px-4 py-2 text-left">Skewness</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(edaResults.numericalSummary).map(([col, stats]: [string, any]) => (
                    <tr key={col} className="border-t">
                      <td className="px-4 py-2 font-medium">{col}</td>
                      <td className="px-4 py-2">{stats.count}</td>
                      <td className="px-4 py-2">{typeof stats.mean === 'number' ? stats.mean.toFixed(2) : stats.mean}</td>
                      <td className="px-4 py-2">{typeof stats.median === 'number' ? stats.median.toFixed(2) : stats.median}</td>
                      <td className="px-4 py-2">{typeof stats.std === 'number' ? stats.std.toFixed(2) : stats.std}</td>
                      <td className="px-4 py-2">{typeof stats.skewness === 'number' ? stats.skewness.toFixed(2) : stats.skewness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categorical Features */}
        {edaResults.objectSummary && Object.keys(edaResults.objectSummary).length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Categorical Features Summary</h3>
            <div className="space-y-4">
              {Object.entries(edaResults.objectSummary).map(([col, stats]: [string, any]) => (
                <div key={col} className="border rounded p-4">
                  <h4 className="font-medium mb-2">{col}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>Unique: {stats.unique}</div>
                    <div>Entropy: {typeof stats.entropy === 'number' ? stats.entropy.toFixed(2) : stats.entropy}</div>
                    <div>Top Value: {stats.topValues?.[0]?.value || 'N/A'}</div>
                    <div>Top %: {stats.topValues?.[0]?.percentage ? `${stats.topValues[0].percentage}%` : 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correlation Matrix */}
        {edaResults.correlation && Object.keys(edaResults.correlation).length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Feature Correlations</h3>
            <div className="overflow-x-auto">
              <div className="text-sm text-gray-600 mb-3">Strong correlations (>0.7 or <-0.7):</div>
              <div className="space-y-2">
                {Object.entries(edaResults.correlation).map(([col, correlations]: [string, any]) => 
                  Object.entries(correlations).filter(([_, corr]: [string, any]) => 
                    Math.abs(corr) > 0.7 && Math.abs(corr) < 1
                  ).map(([otherCol, corr]: [string, any]) => (
                    <div key={`${col}-${otherCol}`} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{col} ↔ {otherCol}</span>
                      <span className={`font-bold ${corr > 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                        {(corr as number).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCodeInsights = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <span className="mr-2">💻</span>
              Generated Code & Insights
            </h3>
            <button
              onClick={() => setShowCode(!showCode)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showCode ? 'Hide Code' : 'Show Code'}
            </button>
          </div>
          
          {showCode && edaResults && (
            <div className="space-y-4">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <h4 className="text-green-400 mb-2"># EDA Analysis Code</h4>
                <pre className="text-sm">
{`import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Load your dataset
df = pd.read_csv('your_dataset.csv')

# Basic info
print("Dataset Shape:", df.shape)
print("\nData Types:")
print(df.dtypes)

# Statistical summary for numerical columns
print("\nNumerical Summary:")
print(df.describe())

# Check for missing values
print("\nMissing Values:")
print(df.isnull().sum())

# Correlation matrix for numerical features
numerical_cols = df.select_dtypes(include=[np.number]).columns
if len(numerical_cols) > 1:
    plt.figure(figsize=(10, 8))
    sns.heatmap(df[numerical_cols].corr(), annot=True, cmap='coolwarm', center=0)
    plt.title('Feature Correlation Matrix')
    plt.show()

# Distribution plots for numerical features
for col in numerical_cols:
    plt.figure(figsize=(10, 4))
    plt.subplot(1, 2, 1)
    df[col].hist(bins=30, alpha=0.7)
    plt.title(f'{col} Distribution')
    plt.subplot(1, 2, 2)
    df.boxplot(column=col)
    plt.title(f'{col} Boxplot')
    plt.tight_layout()
    plt.show()`}
                </pre>
              </div>

              {/* AI Insights */}
              {edaResults.aiInsights && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-purple-800 mb-2">🧠 AI-Generated Insights</h4>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {edaResults.aiInsights}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Key Insights */}
          <div className="space-y-3 mt-4">
            <h4 className="font-semibold text-gray-800">📋 Key Findings:</h4>
            {edaResults?.insights?.keyFindings?.map((finding: string, index: number) => (
              <div key={index} className="p-3 bg-blue-50 rounded border-l-4 border-blue-400 text-sm">
                {finding}
              </div>
            )) || (
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400 text-sm">
                  Dataset contains {edaResults?.shape?.rows || 'unknown'} rows and {edaResults?.shape?.columns || 'unknown'} columns
                </div>
                <div className="p-3 bg-green-50 rounded border-l-4 border-green-400 text-sm">
                  {edaResults?.numericColumns?.length || 0} numerical and {edaResults?.objectColumns?.length || 0} categorical features identified
                </div>
                {mlValidationResult?.status === 'PROCEED' && (
                  <div className="p-3 bg-green-50 rounded border-l-4 border-green-400 text-sm">
                    ✅ Dataset is suitable for machine learning with quality score: {mlValidationResult.satisfaction_score}/100
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Report */}
        {mlValidationResult?.user_view_report && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">📋 Detailed Analysis Report</h3>
            <div className="prose prose-gray max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {mlValidationResult.user_view_report}
              </div>
            </div>
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
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">🤖 AI-Powered ML Validation</h1>

      {/* File Upload & Goal Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Dataset & Define Goal</h2>
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

export default ValidatePage;
