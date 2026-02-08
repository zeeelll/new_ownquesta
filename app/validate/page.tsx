'use client';

import { useState } from 'react';

export default function ValidatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [edaResult, setEdaResult] = useState<any>(null);
  const [fullEdaResponse, setFullEdaResponse] = useState<string>('');
  const [mlValidationResult, setMlValidationResult] = useState<any>(null);
  const [mlGoal, setMlGoal] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [edaLoading, setEdaLoading] = useState(false);
  const [mlLoading, setMlLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationResult(null);
      setEdaResult(null);
      setFullEdaResponse('');
      setMlValidationResult(null);
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    setLoading(true);
    setValidationResult(null);
    setEdaResult(null);
    setFullEdaResponse('');
    setMlValidationResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setValidationResult(result);

      if (result.is_valid) {
        await performEDA();
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({ error: 'Validation failed', details: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const performEDA = async () => {
    if (!file) return;

    setEdaLoading(true);
    setEdaResult(null);
    setFullEdaResponse('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/agents/eda', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      setFullEdaResponse(JSON.stringify(result, null, 2));
      setEdaResult(result);
    } catch (error) {
      console.error('EDA error:', error);
      setEdaResult({ error: 'Failed to perform EDA analysis', details: String(error) });
    } finally {
      setEdaLoading(false);
    }
  };

  const handleMlValidation = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }
    
    if (!mlGoal.trim()) {
      alert('Please enter your machine learning goal');
      return;
    }

    setMlLoading(true);
    setMlValidationResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('goal', mlGoal.trim());

    try {
      const response = await fetch('/api/ml/validate', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setMlValidationResult(result);
    } catch (error) {
      console.error('ML Validation error:', error);
      setMlValidationResult({ 
        error: 'ML validation failed', 
        details: String(error),
        status: 'REJECT',
        agent_answer: 'Failed to connect to ML validation service. Please try again.',
        user_view_report: '# Validation Failed\n\nUnable to process your request. Please check your connection and try again.'
      });
    } finally {
      setMlLoading(false);
    }
  };

  const renderDetailedValue = (value: any, key: string = ''): JSX.Element => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">Not available</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className={`font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>{value ? '✓ Yes' : '✗ No'}</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="font-mono text-blue-600">{value.toLocaleString()}</span>;
    }
    
    if (typeof value === 'string') {
      if (value.length > 100) {
        return (
          <details className="inline">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
              {value.substring(0, 100)}... (click to expand)
            </summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm whitespace-pre-wrap">
              {value}
            </div>
          </details>
        );
      }
      return <span className="text-gray-800">{value}</span>;
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          {value.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-blue-500 text-sm">•</span>
              <span className="text-sm">{renderDetailedValue(item, `${key}_${idx}`)}</span>
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <div className="mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={subKey} className="flex flex-col sm:flex-row sm:gap-4">
              <span className="text-sm font-medium text-gray-600 min-w-0 sm:min-w-[120px]">{subKey}:</span>
              <span className="min-w-0">{renderDetailedValue(subValue, subKey)}</span>
            </div>
          ))}
        </div>
      );
    }
    
    return <span className="text-gray-600">{String(value)}</span>;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Data Validation & EDA</h1>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Dataset</h2>
        <div className="space-y-4">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
          />
          {file && <p className="text-sm text-gray-600">Selected: {file.name}</p>}
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleValidate}
              disabled={!file || loading || edaLoading || mlLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold flex-1"
            >
              {loading ? 'Validating...' : edaLoading ? 'Analyzing...' : 'Basic Validate & EDA Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* ML Validation Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">🤖 AI-Powered ML Validation</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="ml-goal" className="block text-sm font-medium text-gray-700 mb-2">
              Describe your machine learning goal:
            </label>
            <textarea
              id="ml-goal"
              value={mlGoal}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMlGoal(e.target.value)}
              placeholder="e.g., I want to predict customer churn based on usage patterns, or I want to classify customer satisfaction from survey responses"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={!file || loading || edaLoading || mlLoading}
            />
          </div>
          
          <button
            onClick={handleMlValidation}
            disabled={!file || !mlGoal.trim() || loading || edaLoading || mlLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center gap-2 shadow-lg"
          >
            {mlLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing with AI...
              </>
            ) : (
              <>
                🚀 Process & Validate with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Validation Results</h2>
          <div className={`p-4 rounded-lg ${validationResult.is_valid ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
            <p className="font-semibold text-lg">
              Status: <span className={validationResult.is_valid ? 'text-green-700' : 'text-red-700'}>
                {validationResult.is_valid ? '✓ Valid' : '✗ Invalid'}
              </span>
            </p>
            {validationResult.message && <p className="mt-2">{validationResult.message}</p>}
            {validationResult.errors && validationResult.errors.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold">Errors:</p>
                <ul className="list-disc list-inside mt-2">
                  {validationResult.errors.map((error: string, idx: number) => (
                    <li key={idx} className="text-red-700">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDA Loading */}
      {edaLoading && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Performing EDA Analysis...</h2>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          </div>
        </div>
      )}

      {/* ML Validation Loading */}
      {mlLoading && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🤖 AI is analyzing your dataset...</h2>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
            <p className="text-gray-600 text-center">
              Our AI agent is examining your data and goal to determine ML feasibility.<br/>
              This may take a few moments...
            </p>
          </div>
        </div>
      )}

      {/* ML Validation Results */}
      {mlValidationResult && !mlLoading && (
        <div className="space-y-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-800">🤖 AI Validation Results</h2>
          
          {/* Agent Response Summary */}
          <div className={`rounded-lg shadow-lg p-6 border-l-4 ${
            mlValidationResult.status === 'PROCEED' ? 'bg-green-50 border-green-500' :
            mlValidationResult.status === 'PAUSE' ? 'bg-yellow-50 border-yellow-500' :
            'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                mlValidationResult.status === 'PROCEED' ? 'bg-green-100 text-green-700' :
                mlValidationResult.status === 'PAUSE' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {mlValidationResult.status === 'PROCEED' ? '✅' : 
                 mlValidationResult.status === 'PAUSE' ? '⚠️' : '❌'}
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${
                  mlValidationResult.status === 'PROCEED' ? 'text-green-800' :
                  mlValidationResult.status === 'PAUSE' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  {mlValidationResult.status === 'PROCEED' ? 'Ready to Proceed!' :
                   mlValidationResult.status === 'PAUSE' ? 'Needs Attention' :
                   'Not Suitable for ML'}
                </h3>
                <p className="text-lg font-medium text-gray-600">
                  Confidence Score: {mlValidationResult.satisfaction_score || 0}/100
                </p>
              </div>
            </div>
            
            {/* Agent Answer */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2">🤖 AI Agent Analysis:</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {mlValidationResult.agent_answer || 'No analysis available.'}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Response Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dataset Summary */}
            {mlValidationResult.dataset_summary && (
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <h3 className="text-xl font-bold mb-4 text-blue-900">📊 Dataset Summary</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Rows</p>
                      <p className="text-2xl font-bold text-blue-900">{mlValidationResult.dataset_summary.rows}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Columns</p>
                      <p className="text-2xl font-bold text-blue-900">{mlValidationResult.dataset_summary.columns}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-gray-600">File Size</p>
                    <p className="text-lg font-bold text-blue-900">{mlValidationResult.dataset_summary.file_size_mb?.toFixed(2)} MB</p>
                  </div>
                  
                  {/* Column Types */}
                  {mlValidationResult.dataset_summary.column_types && Object.keys(mlValidationResult.dataset_summary.column_types).length > 0 && (
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Column Types:</p>
                      <div className="space-y-1">
                        {Object.entries(mlValidationResult.dataset_summary.column_types).map(([type, count]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="text-gray-600 capitalize">{type}:</span>
                            <span className="font-medium">{String(count)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Goal Understanding */}
            {mlValidationResult.goal_understanding && (
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                <h3 className="text-xl font-bold mb-4 text-purple-900">🎯 Goal Understanding</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Interpreted Task:</p>
                    <p className="font-medium text-gray-800 capitalize">{mlValidationResult.goal_understanding.interpreted_task}</p>
                  </div>
                  
                  {mlValidationResult.goal_understanding.target_column_guess && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Suggested Target Column:</p>
                      <p className="font-medium text-purple-700">{mlValidationResult.goal_understanding.target_column_guess}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Confidence:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{width: `${(mlValidationResult.goal_understanding.confidence || 0) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{((mlValidationResult.goal_understanding.confidence || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Questions and Recommendations */}
          <div className="space-y-4">
            {/* Clarification Questions */}
            {mlValidationResult.clarification_questions && mlValidationResult.clarification_questions.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                <h3 className="text-xl font-bold mb-4 text-orange-900">❓ Clarification Needed</h3>
                <ul className="space-y-2">
                  {mlValidationResult.clarification_questions.map((question: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 bg-orange-50 p-3 rounded">
                      <span className="text-orange-600 font-bold text-lg">•</span>
                      <span className="text-gray-800">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Optional Questions */}
            {mlValidationResult.optional_questions && mlValidationResult.optional_questions.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-teal-500">
                <h3 className="text-xl font-bold mb-4 text-teal-900">💡 Additional Considerations</h3>
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

          {/* Detailed Report */}
          {mlValidationResult.user_view_report && (
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-500">
              <h3 className="text-xl font-bold mb-4 text-gray-900">📋 Detailed Report</h3>
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {mlValidationResult.user_view_report}
                </div>
              </div>
            </div>
          )}

          {/* Complete Agent Response Details */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-500">
            <h3 className="text-xl font-bold mb-4 text-indigo-900">🔍 Complete Response Analysis</h3>
            
            {/* Response Status & Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-indigo-800 mb-2">Validation Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Decision:</span>
                    <span className={`font-bold ${
                      mlValidationResult.status === 'PROCEED' ? 'text-green-600' :
                      mlValidationResult.status === 'PAUSE' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{mlValidationResult.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Satisfaction Score:</span>
                    <span className="font-bold text-indigo-600">{mlValidationResult.satisfaction_score}/100</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">Task Classification</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Task Type:</span>
                    <span className="font-bold text-purple-600 capitalize">
                      {mlValidationResult.goal_understanding?.interpreted_task || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Confidence:</span>
                    <span className="font-bold text-purple-600">
                      {((mlValidationResult.goal_understanding?.confidence || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Quality Metrics */}
            {mlValidationResult.dataset_summary && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">📊 Data Quality Overview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 text-center">
                    <p className="text-xs text-gray-600">Total Records</p>
                    <p className="text-lg font-bold text-blue-700">{mlValidationResult.dataset_summary.rows?.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded border border-green-200 text-center">
                    <p className="text-xs text-gray-600">Features</p>
                    <p className="text-lg font-bold text-green-700">{mlValidationResult.dataset_summary.columns}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-center">
                    <p className="text-xs text-gray-600">File Size</p>
                    <p className="text-lg font-bold text-yellow-700">{mlValidationResult.dataset_summary.file_size_mb?.toFixed(1)} MB</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border border-purple-200 text-center">
                    <p className="text-xs text-gray-600">Data Density</p>
                    <p className="text-lg font-bold text-purple-700">
                      {((mlValidationResult.dataset_summary.file_size_mb || 0) / (mlValidationResult.dataset_summary.rows || 1) * 1000).toFixed(2)} KB/row
                    </p>
                  </div>
                </div>

                {/* Column Type Distribution */}
                {mlValidationResult.dataset_summary.column_types && Object.keys(mlValidationResult.dataset_summary.column_types).length > 0 && (
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h5 className="font-medium text-gray-800 mb-2">Column Type Distribution:</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(mlValidationResult.dataset_summary.column_types).map(([type, count], idx) => (
                        <span key={type} className={`px-3 py-1 rounded-full text-sm font-medium ${
                          idx % 4 === 0 ? 'bg-blue-100 text-blue-800' :
                          idx % 4 === 1 ? 'bg-green-100 text-green-800' :
                          idx % 4 === 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {type}: {String(count)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Data Analysis */}
                {mlValidationResult.dataset_summary.missing_percent && Object.keys(mlValidationResult.dataset_summary.missing_percent).length > 0 && (
                  <div className="mt-4 bg-red-50 p-4 rounded border border-red-200">
                    <h5 className="font-medium text-red-800 mb-2">Missing Data Analysis:</h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(mlValidationResult.dataset_summary.missing_percent)
                        .filter(([_, percent]) => (percent as number) > 0)
                        .slice(0, 10)
                        .map(([column, percent]) => (
                        <div key={column} className="flex justify-between text-sm">
                          <span className="text-gray-700 truncate mr-2">{column}:</span>
                          <span className={`font-medium ${
                            (percent as number) > 50 ? 'text-red-600' :
                            (percent as number) > 20 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>{(percent as number).toFixed(1)}%</span>
                        </div>
                      ))}
                      {Object.entries(mlValidationResult.dataset_summary.missing_percent).filter(([_, percent]) => (percent as number) > 0).length > 10 && (
                        <p className="text-xs text-gray-500 italic">... and {Object.entries(mlValidationResult.dataset_summary.missing_percent).filter(([_, percent]) => (percent as number) > 0).length - 10} more columns with missing data</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Skewness Alert Section - Prominent Display */}
            {(mlValidationResult.response?.distribution_analysis?.skewness || mlValidationResult.response?.skewness) && (
              <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-6">
                <h4 className="font-bold text-orange-800 mb-4 text-xl">⚖️ Data Skewness Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(mlValidationResult.response?.distribution_analysis?.skewness || mlValidationResult.response?.skewness || {}).map(([column, skewness]) => {
                    const skewValue = Number(skewness);
                    const isHighSkew = Math.abs(skewValue) > 1;
                    const isModerateSkew = Math.abs(skewValue) > 0.5;
                    
                    return (
                      <div key={column} className={`p-4 rounded-lg border-2 ${
                        isHighSkew ? 'bg-red-100 border-red-500' :
                        isModerateSkew ? 'bg-yellow-100 border-yellow-500' :
                        'bg-green-100 border-green-500'
                      }`}>
                        <h5 className={`font-medium mb-2 text-sm ${
                          isHighSkew ? 'text-red-800' :
                          isModerateSkew ? 'text-yellow-800' :
                          'text-green-800'
                        }`}>{column}</h5>
                        <div className={`text-2xl font-bold mb-2 ${
                          isHighSkew ? 'text-red-600' :
                          isModerateSkew ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>{skewValue.toFixed(3)}</div>
                        <div className={`text-xs ${
                          isHighSkew ? 'text-red-700' :
                          isModerateSkew ? 'text-yellow-700' :
                          'text-green-700'
                        }`}>
                          {isHighSkew ? 'High Skewness - Consider transformation' :
                           isModerateSkew ? 'Moderate Skewness - Monitor' :
                           'Normal Distribution - Good'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Correlation Insights Section - Prominent Display */}
            {(mlValidationResult.response?.correlation_analysis || mlValidationResult.response?.correlation_matrix) && (
              <div className="mb-6 bg-gradient-to-r from-teal-50 to-blue-50 border-l-4 border-teal-500 rounded-lg p-6">
                <h4 className="font-bold text-teal-800 mb-4 text-xl">🔗 Correlation Insights</h4>
                
                {/* Quick Correlation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-teal-300">
                    <h5 className="font-medium text-teal-700 mb-2">Strong Correlations</h5>
                    <div className="text-2xl font-bold text-red-600">
                      {mlValidationResult.response?.correlation_analysis?.high_correlations ? 
                        (Array.isArray(mlValidationResult.response.correlation_analysis.high_correlations) ? 
                         mlValidationResult.response.correlation_analysis.high_correlations.length :
                         Object.keys(mlValidationResult.response.correlation_analysis.high_correlations).length
                        ) : 0}
                    </div>
                    <div className="text-xs text-gray-600">|r| > 0.7</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-teal-300">
                    <h5 className="font-medium text-teal-700 mb-2">Target Correlations</h5>
                    <div className="text-2xl font-bold text-blue-600">
                      {mlValidationResult.response?.correlation_analysis?.target_correlations ? 
                        Object.keys(mlValidationResult.response.correlation_analysis.target_correlations).length : 0}
                    </div>
                    <div className="text-xs text-gray-600">Features analyzed</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-teal-300">
                    <h5 className="font-medium text-teal-700 mb-2">Matrix Size</h5>
                    <div className="text-2xl font-bold text-green-600">
                      {mlValidationResult.response?.correlation_analysis?.correlation_matrix ? 
                        Object.keys(mlValidationResult.response.correlation_analysis.correlation_matrix).length : 0}
                    </div>
                    <div className="text-xs text-gray-600">Features analyzed</div>
                  </div>
                </div>
              </div>
            )}

            {/* Distribution Analysis Section */}
            {mlValidationResult.response?.distribution_analysis && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">📊 Distribution Analysis</h4>
                <div className="space-y-4">
                  {/* Numerical Distributions */}
                  {mlValidationResult.response.distribution_analysis.numerical_distributions && (
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-3">📈 Numerical Column Distributions</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(mlValidationResult.response.distribution_analysis.numerical_distributions).map(([column, stats]) => (
                          <div key={column} className="bg-white p-3 rounded border border-blue-300">
                            <h6 className="font-medium text-blue-700 text-sm mb-2 truncate">{column}</h6>
                            <div className="space-y-1 text-xs">
                              {typeof stats === 'object' && stats !== null && Object.entries(stats).map(([statName, value]) => (
                                <div key={statName} className="flex justify-between">
                                  <span className="text-gray-600 capitalize">{statName.replace(/_/g, ' ')}:</span>
                                  <span className="font-mono font-medium text-blue-800">
                                    {typeof value === 'number' ? value.toFixed(3) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categorical Distributions */}
                  {mlValidationResult.response.distribution_analysis.categorical_distributions && (
                    <div className="bg-green-50 p-4 rounded border border-green-200">
                      <h5 className="font-medium text-green-800 mb-3">📋 Categorical Column Distributions</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(mlValidationResult.response.distribution_analysis.categorical_distributions).map(([column, distribution]) => (
                          <div key={column} className="bg-white p-3 rounded border border-green-300">
                            <h6 className="font-medium text-green-700 text-sm mb-2 truncate">{column}</h6>
                            <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                              {typeof distribution === 'object' && distribution !== null && Object.entries(distribution).map(([category, count]) => (
                                <div key={category} className="flex justify-between">
                                  <span className="text-gray-600 truncate mr-2">{String(category)}:</span>
                                  <span className="font-mono font-medium text-green-800">{String(count)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Distribution Summary */}
                  {mlValidationResult.response.distribution_analysis.summary && (
                    <div className="bg-purple-50 p-4 rounded border border-purple-200">
                      <h5 className="font-medium text-purple-800 mb-2">📊 Distribution Summary</h5>
                      <div className="bg-white p-3 rounded border border-purple-300">
                        <pre className="text-xs text-purple-700 whitespace-pre-wrap">
                          {typeof mlValidationResult.response.distribution_analysis.summary === 'object' 
                            ? JSON.stringify(mlValidationResult.response.distribution_analysis.summary, null, 2)
                            : String(mlValidationResult.response.distribution_analysis.summary)
                          }
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Skewness and Kurtosis */}
                  {(mlValidationResult.response.distribution_analysis.skewness || mlValidationResult.response.distribution_analysis.kurtosis) && (
                    <div className="bg-orange-50 p-4 rounded border border-orange-200">
                      <h5 className="font-medium text-orange-800 mb-3">📐 Distribution Shape Analysis</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mlValidationResult.response.distribution_analysis.skewness && (
                          <div className="bg-white p-3 rounded border border-orange-300">
                            <h6 className="font-medium text-orange-700 text-sm mb-2">Skewness</h6>
                            <div className="space-y-1 text-xs">
                              {Object.entries(mlValidationResult.response.distribution_analysis.skewness).map(([column, skewness]) => (
                                <div key={column} className="flex justify-between">
                                  <span className="text-gray-600 truncate mr-2">{column}:</span>
                                  <span className={`font-mono font-medium ${
                                    Math.abs(Number(skewness)) > 1 ? 'text-red-600' : 
                                    Math.abs(Number(skewness)) > 0.5 ? 'text-yellow-600' : 'text-green-600'
                                  }`}>
                                    {Number(skewness).toFixed(3)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {mlValidationResult.response.distribution_analysis.kurtosis && (
                          <div className="bg-white p-3 rounded border border-orange-300">
                            <h6 className="font-medium text-orange-700 text-sm mb-2">Kurtosis</h6>
                            <div className="space-y-1 text-xs">
                              {Object.entries(mlValidationResult.response.distribution_analysis.kurtosis).map(([column, kurtosis]) => (
                                <div key={column} className="flex justify-between">
                                  <span className="text-gray-600 truncate mr-2">{column}:</span>
                                  <span className={`font-mono font-medium ${
                                    Math.abs(Number(kurtosis)) > 3 ? 'text-red-600' : 
                                    Math.abs(Number(kurtosis)) > 1 ? 'text-yellow-600' : 'text-green-600'
                                  }`}>
                                    {Number(kurtosis).toFixed(3)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Correlation Analysis Section */}
            {mlValidationResult.response?.correlation_analysis && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">🔗 Correlation Analysis</h4>
                <div className="space-y-4">
                  {/* Correlation Matrix */}
                  {mlValidationResult.response.correlation_analysis.correlation_matrix && (
                    <div className="bg-teal-50 p-4 rounded border border-teal-200">
                      <h5 className="font-medium text-teal-800 mb-3">🔢 Correlation Matrix</h5>
                      <div className="bg-white p-3 rounded border border-teal-300 overflow-x-auto">
                        <div className="text-xs font-mono">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="border border-gray-300 p-1 bg-gray-50 text-left">Feature</th>
                                {Object.keys(mlValidationResult.response.correlation_analysis.correlation_matrix).slice(0, 8).map(col => (
                                  <th key={col} className="border border-gray-300 p-1 bg-gray-50 text-center text-xs max-w-16 truncate">
                                    {col.slice(0, 8)}...
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(mlValidationResult.response.correlation_analysis.correlation_matrix).slice(0, 8).map(([row, correlations]) => (
                                <tr key={row}>
                                  <td className="border border-gray-300 p-1 bg-gray-50 font-medium max-w-20 truncate">
                                    {row.slice(0, 12)}...
                                  </td>
                                  {typeof correlations === 'object' && correlations !== null && Object.values(correlations).slice(0, 8).map((corr, idx) => (
                                    <td key={idx} className={`border border-gray-300 p-1 text-center ${
                                      Math.abs(Number(corr)) > 0.7 ? 'bg-red-100 text-red-800' :
                                      Math.abs(Number(corr)) > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                      Math.abs(Number(corr)) > 0.3 ? 'bg-blue-100 text-blue-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {Number(corr).toFixed(2)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* High Correlations */}
                  {mlValidationResult.response.correlation_analysis.high_correlations && (
                    <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                      <h5 className="font-medium text-yellow-800 mb-3">⚠️ High Correlations (|r| > 0.7)</h5>
                      <div className="space-y-2">
                        {Array.isArray(mlValidationResult.response.correlation_analysis.high_correlations) 
                          ? mlValidationResult.response.correlation_analysis.high_correlations.map((corr, idx) => (
                              <div key={idx} className="bg-white p-3 rounded border border-yellow-300 flex justify-between items-center">
                                <span className="text-sm text-gray-700">{String(corr)}</span>
                              </div>
                            ))
                          : Object.entries(mlValidationResult.response.correlation_analysis.high_correlations).map(([pair, corr]) => (
                              <div key={pair} className="bg-white p-3 rounded border border-yellow-300 flex justify-between items-center">
                                <span className="text-sm text-gray-700">{pair}</span>
                                <span className={`text-sm font-mono font-bold ${
                                  Math.abs(Number(corr)) > 0.9 ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {Number(corr).toFixed(3)}
                                </span>
                              </div>
                            ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Target Column Correlations */}
                  {mlValidationResult.response.correlation_analysis.target_correlations && (
                    <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                      <h5 className="font-medium text-indigo-800 mb-3">🎯 Target Variable Correlations</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(mlValidationResult.response.correlation_analysis.target_correlations).map(([feature, corr]) => (
                          <div key={feature} className="bg-white p-3 rounded border border-indigo-300 flex justify-between items-center">
                            <span className="text-sm text-gray-700 truncate mr-2">{feature}</span>
                            <span className={`text-sm font-mono font-bold ${
                              Math.abs(Number(corr)) > 0.7 ? 'text-purple-600' :
                              Math.abs(Number(corr)) > 0.5 ? 'text-blue-600' :
                              Math.abs(Number(corr)) > 0.3 ? 'text-green-600' :
                              'text-gray-600'
                            }`}>
                              {Number(corr).toFixed(3)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correlation Summary */}
                  {mlValidationResult.response.correlation_analysis.summary && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <h5 className="font-medium text-gray-800 mb-2">📊 Correlation Summary</h5>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {typeof mlValidationResult.response.correlation_analysis.summary === 'object' 
                            ? JSON.stringify(mlValidationResult.response.correlation_analysis.summary, null, 2)
                            : String(mlValidationResult.response.correlation_analysis.summary)
                          }
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ML Agent Recommendations Section */}
            {(mlValidationResult.response?.recommendations || mlValidationResult.response?.model_recommendations || 
              mlValidationResult.response?.feature_recommendations || mlValidationResult.recommendations) && (
              <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg p-6">
                <h4 className="font-bold text-purple-800 mb-4 text-xl">💡 AI Agent Recommendations</h4>
                
                {/* Model Recommendations */}
                {(mlValidationResult.response?.model_recommendations || mlValidationResult.response?.recommendations?.models) && (
                  <div className="mb-4 bg-white p-4 rounded-lg border border-purple-300">
                    <h5 className="font-medium text-purple-700 mb-3">🤖 Recommended Models</h5>
                    <div className="space-y-2">
                      {(Array.isArray(mlValidationResult.response?.model_recommendations) ? 
                        mlValidationResult.response.model_recommendations :
                        Array.isArray(mlValidationResult.response?.recommendations?.models) ?
                        mlValidationResult.response.recommendations.models : []
                      ).map((model, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 rounded border border-purple-200">
                          <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-purple-800 font-medium">{String(model)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feature Engineering Recommendations */}
                {(mlValidationResult.response?.feature_recommendations || mlValidationResult.response?.feature_engineering) && (
                  <div className="mb-4 bg-white p-4 rounded-lg border border-purple-300">
                    <h5 className="font-medium text-purple-700 mb-3">🛠️ Feature Engineering Suggestions</h5>
                    <div className="space-y-2">
                      {(Array.isArray(mlValidationResult.response?.feature_recommendations) ?
                        mlValidationResult.response.feature_recommendations :
                        Array.isArray(mlValidationResult.response?.feature_engineering) ?
                        mlValidationResult.response.feature_engineering : []
                      ).map((suggestion, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 rounded border border-purple-200">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
                          <span className="text-sm text-purple-800">{String(suggestion)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Recommendations */}
                {mlValidationResult.response?.recommendations && typeof mlValidationResult.response.recommendations === 'object' && (
                  <div className="bg-white p-4 rounded-lg border border-purple-300">
                    <h5 className="font-medium text-purple-700 mb-3">📋 Additional Recommendations</h5>
                    <div className="space-y-2">
                      {Object.entries(mlValidationResult.response.recommendations).map(([key, value]) => {
                        if (key === 'models') return null; // Already displayed above
                        return (
                          <div key={key} className="p-3 bg-purple-50 rounded border border-purple-200">
                            <h6 className="font-medium text-purple-600 text-sm capitalize mb-1">
                              {key.replace(/_/g, ' ')}
                            </h6>
                            <div className="text-sm text-purple-800">
                              {Array.isArray(value) ? (
                                <ul className="space-y-1">
                                  {value.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="w-1 h-1 bg-purple-500 rounded-full mt-2"></span>
                                      <span>{String(item)}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span>{String(value)}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Data Quality Issues & Warnings */}
            {(mlValidationResult.response?.data_quality_issues || mlValidationResult.response?.warnings || 
              mlValidationResult.response?.issues || mlValidationResult.data_quality_issues) && (
              <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-6">
                <h4 className="font-bold text-red-800 mb-4 text-xl">⚠️ Data Quality Issues & Warnings</h4>
                
                {/* Critical Issues */}
                {(mlValidationResult.response?.data_quality_issues || mlValidationResult.data_quality_issues) && (
                  <div className="mb-4 bg-white p-4 rounded-lg border border-red-300">
                    <h5 className="font-medium text-red-700 mb-3">🚨 Critical Data Quality Issues</h5>
                    <div className="space-y-2">
                      {(Array.isArray(mlValidationResult.response?.data_quality_issues) ?
                        mlValidationResult.response.data_quality_issues :
                        Array.isArray(mlValidationResult.data_quality_issues) ?
                        mlValidationResult.data_quality_issues : []
                      ).map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded border border-red-200">
                          <span className="text-red-500 text-lg">⚠️</span>
                          <span className="text-sm text-red-800">{String(issue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Warnings */}
                {(mlValidationResult.response?.warnings || mlValidationResult.warnings) && (
                  <div className="bg-white p-4 rounded-lg border border-orange-300">
                    <h5 className="font-medium text-orange-700 mb-3">⚠️ Warnings</h5>
                    <div className="space-y-2">
                      {(Array.isArray(mlValidationResult.response?.warnings) ?
                        mlValidationResult.response.warnings :
                        Array.isArray(mlValidationResult.warnings) ?
                        mlValidationResult.warnings : []
                      ).map((warning, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded border border-orange-200">
                          <span className="text-orange-500 text-lg">⚠️</span>
                          <span className="text-sm text-orange-800">{String(warning)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feature Importance & Analysis */}
            {(mlValidationResult.response?.feature_importance || mlValidationResult.response?.feature_analysis) && (
              <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-6">
                <h4 className="font-bold text-green-800 mb-4 text-xl">🎯 Feature Importance Analysis</h4>
                
                {mlValidationResult.response?.feature_importance && (
                  <div className="bg-white p-4 rounded-lg border border-green-300">
                    <h5 className="font-medium text-green-700 mb-3">📊 Feature Importance Ranking</h5>
                    <div className="space-y-2">
                      {Object.entries(mlValidationResult.response.feature_importance)
                        .sort(([,a], [,b]) => Number(b) - Number(a))
                        .slice(0, 10)
                        .map(([feature, importance], idx) => (
                        <div key={feature} className="flex items-center gap-3 p-3 bg-green-50 rounded border border-green-200">
                          <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            #{idx + 1}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-green-800 text-sm">{feature}</div>
                            <div className="text-xs text-green-600">Importance: {Number(importance).toFixed(4)}</div>
                          </div>
                          <div className="w-20 bg-green-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{width: `${Math.min(100, Number(importance) * 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* All Response Fields Display */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">🔬 Complete Response Data</h4>
              <div className="space-y-3">
                {/* Agent Answer */}
                {mlValidationResult.agent_answer && (
                  <div className="bg-green-50 p-4 rounded border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2">🤖 AI Agent Full Analysis:</h5>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto border border-green-300 bg-white p-3 rounded">
                      {mlValidationResult.agent_answer}
                    </div>
                  </div>
                )}

                {/* Target Column Suggestion */}
                {mlValidationResult.goal_understanding?.target_column_guess && (
                  <div className="bg-teal-50 p-4 rounded border border-teal-200">
                    <h5 className="font-medium text-teal-800 mb-2">🎯 Suggested Target Column:</h5>
                    <div className="bg-white p-3 rounded border border-teal-300">
                      <span className="font-mono text-lg text-teal-700">{mlValidationResult.goal_understanding.target_column_guess}</span>
                    </div>
                  </div>
                )}

                {/* Validation Issues (if any) */}
                {mlValidationResult.validation_issues && mlValidationResult.validation_issues.length > 0 && (
                  <div className="bg-red-50 p-4 rounded border border-red-200">
                    <h5 className="font-medium text-red-800 mb-2">⚠️ Validation Issues Found:</h5>
                    <ul className="space-y-1">
                      {mlValidationResult.validation_issues.map((issue: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-red-700">
                          <span className="text-red-500">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Raw Response Data (for debugging/transparency) */}
            <details className="bg-gray-50 p-4 rounded border border-gray-200">
              <summary className="cursor-pointer font-medium text-gray-800 hover:text-gray-600">
                🔍 View Raw Response Data (Technical Details)
              </summary>
              <div className="mt-3 bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-auto max-h-96">
                <pre>{JSON.stringify(mlValidationResult, null, 2)}</pre>
              </div>
            </details>

            {/* Additional Response Fields */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">📋 All Agent Response Attributes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(mlValidationResult).map(([key, value]) => {
                  // Skip already displayed fields in dedicated sections
                  if (['status', 'satisfaction_score', 'dataset_summary', 'goal_understanding', 
                       'agent_answer', 'clarification_questions', 'optional_questions', 
                       'user_view_report', 'error', 'details', 'response'].includes(key)) {
                    return null;
                  }
                  
                  // Also skip response sub-fields that are displayed in dedicated sections
                  if (key === 'distribution_analysis' || key === 'correlation_analysis' ||
                      key === 'recommendations' || key === 'model_recommendations' ||
                      key === 'feature_recommendations' || key === 'data_quality_issues' ||
                      key === 'warnings' || key === 'feature_importance') {
                    return null;
                  }
                  
                  // Check if this field exists in the response object too
                  let displayValue = value;
                  let isResponseField = false;
                  if (mlValidationResult.response?.[key]) {
                    displayValue = mlValidationResult.response[key];
                    isResponseField = true;
                  }
                  
                  return (
                    <div key={key} className={`p-4 rounded-lg border shadow-sm ${
                      isResponseField ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}>
                      <h5 className={`font-medium mb-2 capitalize ${
                        isResponseField ? 'text-blue-800' : 'text-gray-800'
                      }`}>
                        {isResponseField && '🔹 '}{key.replace(/_/g, ' ')}
                      </h5>
                      <div className="text-sm text-gray-600">
                        {displayValue === null || displayValue === undefined ? (
                          <span className="italic text-gray-400">Not available</span>
                        ) : typeof displayValue === 'object' ? (
                          <details>
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                              View details ({Object.keys(displayValue).length} fields)
                            </summary>
                            <div className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                              {/* Try to display object fields in a more readable way */}
                              {Array.isArray(displayValue) ? (
                                <div className="space-y-1">
                                  {displayValue.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="border-b border-gray-200 pb-1">
                                      {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                                    </div>
                                  ))}
                                  {displayValue.length > 5 && (
                                    <div className="text-gray-500 italic">
                                      ... and {displayValue.length - 5} more items
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <pre className="whitespace-pre-wrap">{JSON.stringify(displayValue, null, 2)}</pre>
                              )}
                            </div>
                          </details>
                        ) : typeof displayValue === 'boolean' ? (
                          <span className={`font-medium ${displayValue ? 'text-green-600' : 'text-red-600'}`}>
                            {displayValue ? '✓ Yes' : '✗ No'}
                          </span>
                        ) : typeof displayValue === 'number' ? (
                          <span className="font-mono text-blue-600">{displayValue.toLocaleString()}</span>
                        ) : String(displayValue).length > 100 ? (
                          <details>
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              View full text ({String(displayValue).length} chars)
                            </summary>
                            <div className="mt-2 bg-gray-50 p-2 rounded text-xs max-h-32 overflow-auto">
                              {String(displayValue)}
                            </div>
                          </details>
                        ) : (
                          <span>{String(displayValue)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Show response object fields separately if they exist */}
                {mlValidationResult.response && Object.entries(mlValidationResult.response).map(([key, value]) => {
                  // Skip fields already displayed in dedicated sections
                  if (['distribution_analysis', 'correlation_analysis', 'recommendations', 
                       'model_recommendations', 'feature_recommendations', 'data_quality_issues',
                       'warnings', 'feature_importance', 'skewness', 'correlation_matrix'].includes(key)) {
                    return null;
                  }
                  
                  // Skip if this field is already shown from the root level
                  if (mlValidationResult[key] !== undefined) {
                    return null;
                  }
                  
                  return (
                    <div key={`response_${key}`} className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 shadow-sm">
                      <h5 className="font-medium text-indigo-800 mb-2 capitalize">
                        🔸 {key.replace(/_/g, ' ')} <span className="text-xs font-normal">(from agent response)</span>
                      </h5>
                      <div className="text-sm text-gray-600">
                        {value === null || value === undefined ? (
                          <span className="italic text-gray-400">Not available</span>
                        ) : typeof value === 'object' ? (
                          <details>
                            <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-medium">
                              View details ({Array.isArray(value) ? value.length : Object.keys(value).length} items)
                            </summary>
                            <div className="mt-2 bg-white p-3 rounded border border-indigo-300 text-xs overflow-auto max-h-40">
                              <pre className="whitespace-pre-wrap text-indigo-900">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            </div>
                          </details>
                        ) : typeof value === 'boolean' ? (
                          <span className={`font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                            {value ? '✓ Yes' : '✗ No'}
                          </span>
                        ) : typeof value === 'number' ? (
                          <span className="font-mono text-indigo-600">{value.toLocaleString()}</span>
                        ) : String(value).length > 100 ? (
                          <details>
                            <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                              View full text ({String(value).length} chars)
                            </summary>
                            <div className="mt-2 bg-white p-2 rounded border border-indigo-300 text-xs max-h-32 overflow-auto">
                              {String(value)}
                            </div>
                          </details>
                        ) : (
                          <span className="text-indigo-800">{String(value)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                })}
              </div>
            </div>

            {/* Response Analysis Summary */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">📊 Response Analysis Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700 mb-2">Total Response Fields:</p>
                  <p className="text-2xl font-bold text-blue-600">{Object.keys(mlValidationResult).length}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-2">Response Size:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(JSON.stringify(mlValidationResult).length / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-2">Questions Asked:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(mlValidationResult.clarification_questions?.length || 0) + 
                     (mlValidationResult.optional_questions?.length || 0)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-2">Processing Status:</p>
                  <p className={`text-2xl font-bold ${
                    mlValidationResult.status === 'PROCEED' ? 'text-green-600' :
                    mlValidationResult.status === 'PAUSE' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {mlValidationResult.status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display for ML Validation */}
      {mlValidationResult?.error && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-red-700 mb-2">❌ ML Validation Error</h3>
          <p className="text-red-600">{mlValidationResult.error}</p>
          {mlValidationResult.details && (
            <details className="mt-3">
              <summary className="cursor-pointer text-red-600 hover:text-red-700 font-medium">
                Show Error Details
              </summary>
              <pre className="mt-2 bg-red-100 p-3 rounded text-xs text-red-800 overflow-auto">
                {mlValidationResult.details}
              </pre>
            </details>
          )}
          
          {/* Show all available error response data */}
          <div className="mt-4">
            <h4 className="font-medium text-red-800 mb-2">Complete Error Response:</h4>
            <details>
              <summary className="cursor-pointer text-red-600 hover:text-red-700 text-sm">
                View Full Error Response Data
              </summary>
              <div className="mt-2 bg-red-100 p-3 rounded">
                <pre className="text-xs text-red-800 overflow-auto max-h-48">
                  {JSON.stringify(mlValidationResult, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Full EDA Response */}
      {fullEdaResponse && !edaLoading && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">📄 Full EDA Response</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 font-mono text-sm">
            <pre className="whitespace-pre-wrap">{fullEdaResponse}</pre>
          </div>
        </div>
      )}

      {/* Detailed EDA Results */}
      {edaResult && !edaLoading && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">📊 Comprehensive Data Analysis</h2>

          {edaResult.error ? (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-red-700 mb-2">Error</h3>
              <p className="text-red-600">{edaResult.error}</p>
              {edaResult.details && <p className="text-sm text-red-500 mt-2">{edaResult.details}</p>}
            </div>
          ) : (
            <>
              {/* Dataset Overview */}
              {(edaResult.dataset_overview || edaResult.dataset_shape) && (
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                  <h3 className="text-2xl font-bold mb-4 text-blue-900">📊 Dataset Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {edaResult.dataset_overview ? (
                      <>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 font-medium">Rows</p>
                          <p className="text-2xl font-bold text-blue-900 mt-1">{edaResult.dataset_overview.shape?.rows || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 font-medium">Columns</p>
                          <p className="text-2xl font-bold text-green-900 mt-1">{edaResult.dataset_overview.shape?.columns || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 font-medium">Memory (MB)</p>
                          <p className="text-2xl font-bold text-purple-900 mt-1">{edaResult.dataset_overview.size?.memory_usage_mb || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 font-medium">Missing %</p>
                          <p className="text-2xl font-bold text-red-900 mt-1">{edaResult.dataset_overview.data_quality?.missing_percentage || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 font-medium">Duplicates</p>
                          <p className="text-2xl font-bold text-yellow-900 mt-1">{edaResult.dataset_overview.data_quality?.duplicate_rows || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 font-medium">Numeric Cols</p>
                          <p className="text-2xl font-bold text-indigo-900 mt-1">{edaResult.dataset_overview.column_types?.numeric || 'N/A'}</p>
                        </div>
                      </>
                    ) : (
                      Object.entries(edaResult.dataset_shape || {}).map(([key, value]) => (
                        <div key={key} className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-600 capitalize font-medium">{key}</p>
                          <p className="text-2xl font-bold text-blue-900 mt-1">{String(value)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Comprehensive Statistics */}
              {edaResult.comprehensive_statistics && (
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                  <h3 className="text-2xl font-bold mb-4 text-purple-900">📈 Comprehensive Statistics</h3>
                  
                  {/* Numeric Statistics */}
                  {edaResult.comprehensive_statistics.numeric_statistics && (
                    <div className="mb-6">
                      <h4 className="text-xl font-semibold text-purple-800 mb-3">Numeric Columns</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gradient-to-r from-purple-100 to-purple-200">
                            <tr>
                              <th className="px-4 py-3 text-left font-bold text-purple-900">Column</th>
                              <th className="px-4 py-3 text-left font-bold text-purple-900">Mean</th>
                              <th className="px-4 py-3 text-left font-bold text-purple-900">Median</th>
                              <th className="px-4 py-3 text-left font-bold text-purple-900">Std Dev</th>
                              <th className="px-4 py-3 text-left font-bold text-purple-900">Skewness</th>
                              <th className="px-4 py-3 text-left font-bold text-purple-900">Outliers</th>
                              <th className="px-4 py-3 text-left font-bold text-purple-900">CV</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(edaResult.comprehensive_statistics.numeric_statistics).map(([col, stats], idx) => (
                              <tr key={col} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="px-4 py-3 font-semibold text-gray-900">{col}</td>
                                <td className="px-4 py-3 text-gray-700">{(stats as any).mean?.toFixed(4) || 'N/A'}</td>
                                <td className="px-4 py-3 text-gray-700">{(stats as any).median?.toFixed(4) || 'N/A'}</td>
                                <td className="px-4 py-3 text-gray-700">{(stats as any).std?.toFixed(4) || 'N/A'}</td>
                                <td className="px-4 py-3 text-gray-700">
                                  <span className={(stats as any).skewness > 0 ? 'text-orange-600' : 'text-blue-600'}>
                                    {(stats as any).skewness?.toFixed(3) || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                                    {(stats as any).outliers?.outlier_count || 0}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-700">{(stats as any).coefficient_of_variation?.toFixed(3) || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Categorical Statistics */}
                  {edaResult.comprehensive_statistics.categorical_statistics && Object.keys(edaResult.comprehensive_statistics.categorical_statistics).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xl font-semibold text-purple-800 mb-3">Categorical Columns</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(edaResult.comprehensive_statistics.categorical_statistics).map(([col, stats]) => (
                          <div key={col} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h5 className="font-semibold text-purple-900 mb-2">{col}</h5>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Unique:</span> {(stats as any).unique_count}</p>
                              <p><span className="font-medium">Top Value:</span> {(stats as any).top_value}</p>
                              <p><span className="font-medium">Frequency:</span> {(stats as any).top_frequency}</p>
                              <p><span className="font-medium">Entropy:</span> {(stats as any).entropy?.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Advanced Distribution Analysis */}
              {edaResult.advanced_distribution_analysis && (
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                  <h3 className="text-2xl font-bold mb-4 text-green-900">📊 Distribution Analysis</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(edaResult.advanced_distribution_analysis).map(([col, analysis]) => (
                      <div key={col} className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-3">{col}</h4>
                        <div className="space-y-3">
                          {/* Distribution Shape */}
                          {(analysis as any).distribution_shape && (
                            <div className="bg-white p-3 rounded border">
                              <p className="font-medium text-gray-800 mb-1">Distribution Shape</p>
                              <div className="text-sm space-y-1">
                                <p><span className="font-medium">Skewness:</span> 
                                  <span className={`ml-1 ${Math.abs((analysis as any).distribution_shape.skewness) > 1 ? 'text-red-600' : 'text-green-600'}`}>
                                    {(analysis as any).distribution_shape.skewness?.toFixed(3)} 
                                    ({(analysis as any).distribution_shape.skewness_interpretation})
                                  </span>
                                </p>
                                <p><span className="font-medium">Kurtosis:</span> 
                                  <span className="ml-1">
                                    {(analysis as any).distribution_shape.kurtosis?.toFixed(3)} 
                                    ({(analysis as any).distribution_shape.kurtosis_interpretation})
                                  </span>
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Normality Tests */}
                          {(analysis as any).normality_tests && Object.keys((analysis as any).normality_tests).length > 0 && (
                            <div className="bg-white p-3 rounded border">
                              <p className="font-medium text-gray-800 mb-1">Normality Tests</p>
                              <div className="text-sm space-y-1">
                                {Object.entries((analysis as any).normality_tests).map(([test, result]) => (
                                  <p key={test}>
                                    <span className="font-medium">{test.replace('_', ' ')}:</span>
                                    <span className={`ml-1 ${(result as any).is_normal ? 'text-green-600' : 'text-red-600'}`}>
                                      {(result as any).is_normal ? '✓ Normal' : '✗ Not Normal'} 
                                      (p={(result as any).p_value?.toFixed(4)})
                                    </span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Conclusion */}
                          {(analysis as any).conclusion && (
                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                              <p className="font-medium text-blue-800 mb-1">Conclusion</p>
                              <div className="text-sm">
                                <p><span className="font-medium">Likely Normal:</span> 
                                  <span className={`ml-1 ${(analysis as any).conclusion.likely_normal ? 'text-green-600' : 'text-red-600'}`}>
                                    {(analysis as any).conclusion.likely_normal ? 'Yes' : 'No'}
                                  </span>
                                </p>
                                <p className="mt-1 text-blue-700">{(analysis as any).conclusion.recommendation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advanced Correlation Analysis */}
              {edaResult.advanced_correlation_analysis && (
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
                  <h3 className="text-2xl font-bold mb-4 text-red-900">🔗 Correlation Analysis</h3>
                  
                  {/* Strong Correlations */}
                  {edaResult.advanced_correlation_analysis.correlation_insights?.strong_correlations && 
                   edaResult.advanced_correlation_analysis.correlation_insights.strong_correlations.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xl font-semibold text-red-800 mb-3">Strong Correlations (|r| &gt; 0.7)</h4>
                      <div className="space-y-2">
                        {edaResult.advanced_correlation_analysis.correlation_insights.strong_correlations.map((corr: any, idx: number) => (
                          <div key={idx} className={`p-3 rounded-lg border-l-4 ${corr.direction === 'positive' ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{corr.variable_1} ↔ {corr.variable_2}</span>
                              <span className={`font-bold ${corr.direction === 'positive' ? 'text-green-700' : 'text-red-700'}`}>
                                r = {corr.correlation}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correlation Summary */}
                  {edaResult.advanced_correlation_analysis.correlation_insights?.correlation_summary && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="text-lg font-semibold text-red-800 mb-2">Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="font-medium">Max Positive</p>
                          <p className="text-green-600">{edaResult.advanced_correlation_analysis.correlation_insights.correlation_summary.max_positive_correlation?.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Max Negative</p>
                          <p className="text-red-600">{edaResult.advanced_correlation_analysis.correlation_insights.correlation_summary.max_negative_correlation?.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Strong Correlations</p>
                          <p className="text-blue-600">{edaResult.advanced_correlation_analysis.correlation_insights.correlation_summary.number_of_strong_correlations}</p>
                        </div>
                        <div>
                          <p className="font-medium">Moderate Correlations</p>
                          <p className="text-yellow-600">{edaResult.advanced_correlation_analysis.correlation_insights.correlation_summary.number_of_moderate_correlations}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Data Quality Analysis */}
              {edaResult.data_quality_analysis && (
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
                  <h3 className="text-2xl font-bold mb-4 text-yellow-900">🔍 Data Quality Analysis</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Missing Values */}
                    {edaResult.data_quality_analysis.missing_values && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-yellow-800 mb-2">Missing Values</h4>
                        <div className="text-sm space-y-2">
                          <p><span className="font-medium">Total Missing:</span> {edaResult.data_quality_analysis.missing_values.total_missing}</p>
                          <p><span className="font-medium">Percentage:</span> {edaResult.data_quality_analysis.missing_values.percentage_missing}%</p>
                          {Object.keys(edaResult.data_quality_analysis.missing_values.by_column || {}).length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium mb-1">Columns with Missing Values:</p>
                              {Object.entries(edaResult.data_quality_analysis.missing_values.by_column).slice(0, 5).map(([col, info]) => (
                                <p key={col} className="ml-2 text-xs">
                                  {col}: {(info as any).percentage}%
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Duplicates */}
                    {edaResult.data_quality_analysis.duplicate_analysis && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <h4 className="font-semibold text-orange-800 mb-2">Duplicate Analysis</h4>
                        <div className="text-sm space-y-2">
                          <p><span className="font-medium">Total Duplicates:</span> {edaResult.data_quality_analysis.duplicate_analysis.total_duplicates}</p>
                          <p><span className="font-medium">Percentage:</span> {edaResult.data_quality_analysis.duplicate_analysis.percentage_duplicates}%</p>
                          <p><span className="font-medium">Unique Rows:</span> {edaResult.data_quality_analysis.duplicate_analysis.unique_rows}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  {edaResult.data_quality_analysis.recommendations && edaResult.data_quality_analysis.recommendations.length > 0 && (
                    <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
                      <ul className="text-sm space-y-1">
                        {edaResult.data_quality_analysis.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Outlier Detection */}
              {edaResult.outlier_detection && (
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-500">
                  <h3 className="text-2xl font-bold mb-4 text-indigo-900">🎯 Outlier Detection</h3>
                  
                  {/* Summary */}
                  {edaResult.outlier_detection.summary && (
                    <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <h4 className="font-semibold text-indigo-800 mb-2">Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="font-medium">Total Outliers</p>
                          <p className="text-indigo-600">{edaResult.outlier_detection.summary.total_outliers}</p>
                        </div>
                        <div>
                          <p className="font-medium">Outlier Percentage</p>
                          <p className="text-indigo-600">{edaResult.outlier_detection.summary.overall_outlier_percentage}%</p>
                        </div>
                        <div>
                          <p className="font-medium">Affected Columns</p>
                          <p className="text-indigo-600">{edaResult.outlier_detection.summary.columns_with_outliers?.length || 0}</p>
                        </div>
                        <div>
                          <p className="font-medium">Most Outlier-Prone</p>
                          <p className="text-indigo-600 text-xs">{edaResult.outlier_detection.summary.most_outlier_prone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detailed Analysis */}
                  {edaResult.outlier_detection.outlier_analysis && (
                    <div className="space-y-4">
                      {Object.entries(edaResult.outlier_detection.outlier_analysis).slice(0, 5).map(([col, analysis]) => (
                        <div key={col} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h5 className="font-semibold text-gray-800 mb-2">{col}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="font-medium">Data Points</p>
                              <p>{(analysis as any).data_points}</p>
                            </div>
                            <div>
                              <p className="font-medium">Consensus Outliers</p>
                              <p className="text-red-600">{(analysis as any).consensus?.outlier_count || 0}</p>
                            </div>
                            <div>
                              <p className="font-medium">Percentage</p>
                              <p className="text-red-600">{(analysis as any).consensus?.percentage || 0}%</p>
                            </div>
                            <div>
                              <p className="font-medium">Confidence</p>
                              <p className={`${(analysis as any).consensus?.confidence === 'high' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {(analysis as any).consensus?.confidence || 'N/A'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Detection Methods */}
                          {(analysis as any).methods && (
                            <div className="mt-3 text-xs">
                              <p className="font-medium mb-1">Detection Methods:</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries((analysis as any).methods).map(([method, data]) => (
                                  <span key={method} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                    {method}: {(data as any).outlier_count || 0}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Render remaining results dynamically */}
              {Object.entries(edaResult).map(([key, value]) => {
                // Skip keys we've already rendered
                const renderedKeys = [
                  'dataset_overview', 'dataset_shape', 'comprehensive_statistics', 
                  'advanced_distribution_analysis', 'advanced_correlation_analysis', 
                  'data_quality_analysis', 'outlier_detection', 'error'
                ];
                
                if (renderedKeys.includes(key) || value === null || value === undefined) return null;

                // Handle remaining data dynamically
                if (typeof value === 'object' && !Array.isArray(value)) {
                  return (
                    <div key={key} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-500">
                      <h3 className="text-xl font-bold mb-4 text-gray-900 capitalize">
                        {key.replace(/_/g, ' ')}
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 border border-gray-300">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        </pre>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </>
          )}
        </div>
      )}
      
      {/* Additional Response Fields Display */}
      {mlValidationResult && !mlValidationResult.error && mlValidationResult.response && (
        <div className="bg-indigo-50 border-2 border-indigo-500 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-indigo-700 mb-4">🎯 Additional Response Fields</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Performance Metrics */}
            {mlValidationResult.response.performance_metrics && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-indigo-600 mb-2">⚡ Performance Metrics</h4>
                <div className="text-sm space-y-1">
                  {Object.entries(mlValidationResult.response.performance_metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                      <span className="font-medium">{typeof value === 'number' ? value.toFixed(4) : String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model Recommendations */}
            {mlValidationResult.response.model_recommendations && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-indigo-600 mb-2">🤖 Model Recommendations</h4>
                <ul className="text-sm space-y-1">
                  {Array.isArray(mlValidationResult.response.model_recommendations) 
                    ? mlValidationResult.response.model_recommendations.map((model, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                          {model}
                        </li>
                      ))
                    : Object.entries(mlValidationResult.response.model_recommendations).map(([key, value]) => (
                        <li key={key} className="text-xs">
                          <strong>{key}:</strong> {String(value)}
                        </li>
                      ))
                  }
                </ul>
              </div>
            )}

            {/* Feature Engineering Suggestions */}
            {mlValidationResult.response.feature_engineering && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-indigo-600 mb-2">🛠️ Feature Engineering</h4>
                <ul className="text-sm space-y-1">
                  {Array.isArray(mlValidationResult.response.feature_engineering)
                    ? mlValidationResult.response.feature_engineering.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 mt-2"></span>
                          <span>{suggestion}</span>
                        </li>
                      ))
                    : <li className="text-xs">{String(mlValidationResult.response.feature_engineering)}</li>
                  }
                </ul>
              </div>
            )}

            {/* Processing Time */}
            {mlValidationResult.response.processing_time && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-indigo-600 mb-2">⏱️ Processing Time</h4>
                <p className="text-lg font-mono text-indigo-800">
                  {mlValidationResult.response.processing_time}s
                </p>
              </div>
            )}

            {/* Agent Version */}
            {mlValidationResult.response.agent_version && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-indigo-600 mb-2">🏷️ Agent Version</h4>
                <p className="text-sm font-mono text-gray-700">
                  {mlValidationResult.response.agent_version}
                </p>
              </div>
            )}

            {/* Timestamp */}
            {(mlValidationResult.response.timestamp || mlValidationResult.timestamp) && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-indigo-600 mb-2">📅 Timestamp</h4>
                <p className="text-sm font-mono text-gray-700">
                  {mlValidationResult.response.timestamp || mlValidationResult.timestamp}
                </p>
              </div>
            )}
          </div>

          {/* Dynamic Field Display for any additional fields */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-indigo-600 mb-3">🔍 All Response Fields</h4>
            <div className="bg-white p-4 rounded border">
              <details>
                <summary className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium">
                  Explore All Available Fields ({Object.keys(mlValidationResult.response || {}).length} fields)
                </summary>
                <div className="mt-3 space-y-2 max-h-64 overflow-auto">
                  {Object.entries(mlValidationResult.response || {}).map(([key, value]) => (
                    <div key={key} className="border-b pb-2">
                      <h5 className="font-medium text-gray-700 text-sm">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h5>
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1">
                        {typeof value === 'object' && value !== null 
                          ? JSON.stringify(value, null, 2) 
                          : String(value)
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
