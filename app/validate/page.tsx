'use client';

import { useState } from 'react';

export default function ValidatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [mlGoal, setMlGoal] = useState<string>('');
  const [mlValidationResult, setMlValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMlValidationResult(null);
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

    setLoading(true);
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
      setLoading(false);
    }
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
              disabled={!file || loading}
            />
          </div>
          
          <button
            onClick={handleMlValidation}
            disabled={!file || !mlGoal.trim() || loading}
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

      {/* ML Validation Results - Simplified */}
      {mlValidationResult && !loading && (
        <div className="space-y-6 mb-6">
          {/* Status Summary */}
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
                  Quality Score: {mlValidationResult.satisfaction_score || 0}/100
                </p>
              </div>
            </div>
            
            {/* AI Analysis */}
            {mlValidationResult.agent_answer && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
                <h4 className="font-semibold text-gray-800 mb-2">🤖 AI Agent Analysis:</h4>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {mlValidationResult.agent_answer}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dataset Summary */}
          {mlValidationResult.dataset_summary && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-blue-900">📊 Dataset Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Rows</p>
                  <p className="text-2xl font-bold text-blue-900">{mlValidationResult.dataset_summary.rows}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Columns</p>
                  <p className="text-2xl font-bold text-blue-900">{mlValidationResult.dataset_summary.columns}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">File Size</p>
                  <p className="text-lg font-bold text-blue-900">
                    {mlValidationResult.dataset_summary.file_size_mb?.toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Goal Understanding */}
          {mlValidationResult.goal_understanding && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-purple-900">🎯 Goal Analysis</h3>
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-teal-900">💡 Recommendations</h3>
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

          {/* Detailed Report */}
          {mlValidationResult.user_view_report && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900">📋 Detailed Report</h3>
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {mlValidationResult.user_view_report}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
