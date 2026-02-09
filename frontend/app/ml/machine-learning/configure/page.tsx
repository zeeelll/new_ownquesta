"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfigurePage() {
  const router = useRouter();
  const [modelType, setModelType] = useState<string>('classification');
  const [algorithm, setAlgorithm] = useState<string>('random_forest');
  const [parameters, setParameters] = useState({
    test_size: 0.2,
    random_state: 42,
    max_depth: 10,
    n_estimators: 100,
  });

  const algorithms = {
    classification: [
      { value: 'random_forest', label: 'Random Forest' },
      { value: 'logistic_regression', label: 'Logistic Regression' },
      { value: 'svm', label: 'Support Vector Machine' },
      { value: 'xgboost', label: 'XGBoost' },
    ],
    regression: [
      { value: 'linear_regression', label: 'Linear Regression' },
      { value: 'random_forest', label: 'Random Forest Regressor' },
      { value: 'xgboost', label: 'XGBoost Regressor' },
      { value: 'svr', label: 'Support Vector Regression' },
    ],
    clustering: [
      { value: 'kmeans', label: 'K-Means' },
      { value: 'dbscan', label: 'DBSCAN' },
      { value: 'hierarchical', label: 'Hierarchical Clustering' },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-teal-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/ml/machine-learning')}
            className="text-white/80 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to ML Studio
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ Configure Model</h1>
          <p className="text-white/70">Set up your machine learning model parameters and training configuration</p>
        </div>

        {/* Model Configuration */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Model Selection</h2>
          
          <div className="space-y-4">
            {/* Model Type */}
            <div>
              <label className="block text-white mb-2">Task Type:</label>
              <select
                value={modelType}
                onChange={(e) => {
                  setModelType(e.target.value);
                  setAlgorithm(algorithms[e.target.value as keyof typeof algorithms][0].value);
                }}
                className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="classification">Classification</option>
                <option value="regression">Regression</option>
                <option value="clustering">Clustering</option>
              </select>
            </div>

            {/* Algorithm Selection */}
            <div>
              <label className="block text-white mb-2">Algorithm:</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {algorithms[modelType as keyof typeof algorithms].map((algo) => (
                  <option key={algo.value} value={algo.value}>
                    {algo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Hyperparameters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Hyperparameters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">Test Size:</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="0.5"
                value={parameters.test_size}
                onChange={(e) => setParameters({...parameters, test_size: parseFloat(e.target.value)})}
                className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Random State:</label>
              <input
                type="number"
                value={parameters.random_state}
                onChange={(e) => setParameters({...parameters, random_state: parseInt(e.target.value)})}
                className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {(algorithm === 'random_forest' || algorithm === 'xgboost') && (
              <>
                <div>
                  <label className="block text-white mb-2">Max Depth:</label>
                  <input
                    type="number"
                    min="1"
                    value={parameters.max_depth}
                    onChange={(e) => setParameters({...parameters, max_depth: parseInt(e.target.value)})}
                    className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">N Estimators:</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={parameters.n_estimators}
                    onChange={(e) => setParameters({...parameters, n_estimators: parseInt(e.target.value)})}
                    className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Configuration Summary</h2>
          <div className="bg-white/5 rounded-lg p-4">
            <pre className="text-white/80 text-sm whitespace-pre-wrap">
              {JSON.stringify({ modelType, algorithm, parameters }, null, 2)}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/ml/machine-learning/validate')}
            className="flex-1 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 font-semibold"
          >
            ← Back to Validation
          </button>
          <button
            onClick={() => alert('Model training will be implemented soon!')}
            className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-teal-700 font-semibold"
          >
            🚀 Start Training
          </button>
        </div>
      </div>
    </div>
  );
}
