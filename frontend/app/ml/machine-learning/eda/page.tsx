"use client";

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function EDAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [edaResults, setEdaResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setEdaResults(null);
    }
  };

  const performEDA = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/ml-assistant/eda', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setEdaResults(result);
    } catch (error) {
      console.error('EDA error:', error);
      setEdaResults({ error: 'Failed to perform EDA', details: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/ml/machine-learning')}
            className="text-white/80 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to ML Studio
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">📊 Exploratory Data Analysis (EDA)</h1>
          <p className="text-white/70">Comprehensive statistical analysis and data visualization</p>
        </div>

        {/* File Upload */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Upload Dataset</h2>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-white border border-white/20 rounded-lg cursor-pointer bg-white/10 focus:outline-none p-2"
          />
          {file && <p className="text-sm text-white/70 mt-2">Selected: {file.name}</p>}
          
          <button
            onClick={performEDA}
            disabled={!file || loading}
            className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Analyzing...' : '🔍 Perform EDA Analysis'}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
              <p className="text-white text-center">Analyzing your dataset...</p>
            </div>
          </div>
        )}

        {/* EDA Results */}
        {edaResults && !loading && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Analysis Results</h2>
              
              {edaResults.error ? (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-200">{edaResults.error}</p>
                  {edaResults.details && <p className="text-red-300 text-sm mt-2">{edaResults.details}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Dataset Summary */}
                  {edaResults.summary && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">📋 Dataset Summary</h3>
                      <pre className="text-white/80 text-sm whitespace-pre-wrap overflow-x-auto">
                        {typeof edaResults.summary === 'object' 
                          ? JSON.stringify(edaResults.summary, null, 2)
                          : edaResults.summary}
                      </pre>
                    </div>
                  )}

                  {/* Column Analysis */}
                  {edaResults.columns && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">📊 Column Analysis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(edaResults.columns).map(([col, info]: [string, any]) => (
                          <div key={col} className="bg-white/10 rounded p-3">
                            <h4 className="font-medium text-white mb-2">{col}</h4>
                            <div className="text-sm text-white/70 space-y-1">
                              {Object.entries(info).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span>{key}:</span>
                                  <span className="font-mono">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Response */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">🔍 Complete Analysis</h3>
                    <pre className="text-white/80 text-xs whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                      {JSON.stringify(edaResults, null, 2)}
                    </pre>
                  </div>

                  {/* Next Steps */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => router.push('/ml/machine-learning/validate')}
                      className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-teal-700 font-semibold"
                    >
                      Next: Validate Dataset →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
