"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ValidatePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [mlGoal, setMlGoal] = useState<string>('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationResult(null);
    }
  };

  const handleValidation = async () => {
    if (!file || !mlGoal.trim()) {
      alert('Please provide both a file and ML goal');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('goal', mlGoal);

    try {
      const response = await fetch('http://localhost:8000/ml-assistant/validate', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({ 
        error: 'Validation failed', 
        details: String(error),
        status: 'REJECT'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/ml/machine-learning')}
            className="text-white/80 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to ML Studio
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">🤖 ML Validation</h1>
          <p className="text-white/70">AI-powered dataset and goal validation for machine learning</p>
        </div>

        {/* Input Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Dataset & Goal</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">Upload Dataset:</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-white border border-white/20 rounded-lg cursor-pointer bg-white/10 focus:outline-none p-2"
              />
              {file && <p className="text-sm text-white/70 mt-2">Selected: {file.name}</p>}
            </div>

            <div>
              <label className="block text-white mb-2">ML Goal:</label>
              <textarea
                value={mlGoal}
                onChange={(e) => setMlGoal(e.target.value)}
                placeholder="e.g., Predict customer churn based on usage patterns"
                className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
              />
            </div>

            <button
              onClick={handleValidation}
              disabled={!file || !mlGoal.trim() || loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Validating...' : '🚀 Validate with AI'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
              <p className="text-white text-center">AI is analyzing your dataset and goal...</p>
            </div>
          </div>
        )}

        {/* Validation Results */}
        {validationResult && !loading && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border-l-4 ${
              validationResult.status === 'PROCEED' ? 'border-green-500' :
              validationResult.status === 'PAUSE' ? 'border-yellow-500' :
              'border-red-500'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  validationResult.status === 'PROCEED' ? 'bg-green-500/20' :
                  validationResult.status === 'PAUSE' ? 'bg-yellow-500/20' :
                  'bg-red-500/20'
                }`}>
                  {validationResult.status === 'PROCEED' ? '✅' : 
                   validationResult.status === 'PAUSE' ? '⚠️' : '❌'}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {validationResult.status === 'PROCEED' ? 'Ready to Proceed!' :
                     validationResult.status === 'PAUSE' ? 'Needs Attention' :
                     'Not Suitable'}
                  </h3>
                  <p className="text-white/70">
                    Score: {validationResult.satisfaction_score || 0}/100
                  </p>
                </div>
              </div>

              {validationResult.agent_answer && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">🤖 AI Analysis:</h4>
                  <div className="text-white/80 whitespace-pre-wrap">
                    {validationResult.agent_answer}
                  </div>
                </div>
              )}
            </div>

            {/* Dataset Summary */}
            {validationResult.dataset_summary && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">📊 Dataset Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded">
                    <p className="text-white/70 text-sm">Rows</p>
                    <p className="text-2xl font-bold text-white">{validationResult.dataset_summary.rows}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded">
                    <p className="text-white/70 text-sm">Columns</p>
                    <p className="text-2xl font-bold text-white">{validationResult.dataset_summary.columns}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded">
                    <p className="text-white/70 text-sm">File Size</p>
                    <p className="text-2xl font-bold text-white">
                      {validationResult.dataset_summary.file_size_mb?.toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Goal Understanding */}
            {validationResult.goal_understanding && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">🎯 Goal Understanding</h3>
                <div className="space-y-3 text-white/80">
                  <p><span className="font-semibold">Task:</span> {validationResult.goal_understanding.interpreted_task}</p>
                  {validationResult.goal_understanding.target_column_guess && (
                    <p><span className="font-semibold">Target Column:</span> {validationResult.goal_understanding.target_column_guess}</p>
                  )}
                  <p><span className="font-semibold">Confidence:</span> {((validationResult.goal_understanding.confidence || 0) * 100).toFixed(1)}%</p>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {validationResult.optional_questions && validationResult.optional_questions.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">💡 Recommendations</h3>
                <ul className="space-y-2">
                  {validationResult.optional_questions.map((question: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-white/80">
                      <span className="text-white font-bold">•</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {validationResult.status === 'PROCEED' && (
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/ml/machine-learning/configure')}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-teal-700 font-semibold"
                >
                  Next: Configure Model →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
