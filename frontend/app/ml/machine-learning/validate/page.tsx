"use client";

import React, { useState } from 'react';
import ValidationAgentWidget from '../ValidationAgentWidget';

type ChatMessage = { type: 'user' | 'ai'; text: string; timestamp: string };

const ValidatePage: React.FC = () => {
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [userQuery, setUserQuery] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [edaResults, setEdaResults] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setActualFile(f);
  };

  const onStartEDA = async () => {
    if (!actualFile) throw new Error('No file uploaded');
    const text = await actualFile.text();
    const payload = { csv_text: text, goal: userQuery || undefined };
    const res = await fetch('http://localhost:8000/validation/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`EDA failed: ${res.status}`);
    const j = await res.json();
    const result = j.result || j;
    setEdaResults(result);
    setChatMessages(prev => [...prev, { type: 'ai', text: 'EDA completed.', timestamp: new Date().toLocaleTimeString() }]);
    return result;
  };

  const onStartValidation = async () => {
    if (!actualFile) throw new Error('No file uploaded');
    const form = new FormData();
    form.append('file', actualFile);
    if (userQuery) form.append('goal', JSON.stringify({ description: userQuery }));

    const res = await fetch('http://localhost:8000/validation/validate', {
      method: 'POST', body: form
    });
    if (!res.ok) throw new Error(`Validation failed: ${res.status}`);
    const j = await res.json();
    const result = j.result || j;
    setValidationResult(result);
    setChatMessages(prev => [...prev, { type: 'ai', text: 'ML validation completed.', timestamp: new Date().toLocaleTimeString() }]);
    return result;
  };

  return (
    <div style={{ minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, background: 'white', padding: 20, borderRadius: 12 }}>
          <h2 style={{ marginBottom: 12 }}>Define Your Goal</h2>
          <textarea value={userQuery} onChange={e => setUserQuery(e.target.value)} placeholder="e.g., I want to predict package based on the cgpa" style={{ width: '100%', height: 120, padding: 8 }} />

          <h2 style={{ marginTop: 16 }}>Upload Dataset</h2>
          <input type="file" accept=".csv" onChange={onFileChange} />

          <div style={{ marginTop: 16 }}>
            <button onClick={async () => {
              setChatMessages(prev => [...prev, { type: 'ai', text: 'Starting EDA...', timestamp: new Date().toLocaleTimeString() }]);
              try { await onStartEDA(); } catch (e: any) { setChatMessages(prev => [...prev, { type: 'ai', text: `EDA error: ${e.message}`, timestamp: new Date().toLocaleTimeString() }]); }
            }} style={{ marginRight: 8 }}>Run EDA</button>

            <button onClick={async () => {
              setChatMessages(prev => [...prev, { type: 'ai', text: 'Starting ML Validation...', timestamp: new Date().toLocaleTimeString() }]);
              try { await onStartValidation(); } catch (e: any) { setChatMessages(prev => [...prev, { type: 'ai', text: `Validation error: ${e.message}`, timestamp: new Date().toLocaleTimeString() }]); }
            }}>Start ML Validation</button>
          </div>
        </div>

        <div style={{ width: 520 }}>
          <ValidationAgentWidget
            actualFile={actualFile}
            userQuery={userQuery}
            onStartValidation={onStartValidation}
            onStartEDA={onStartEDA}
            edaResults={edaResults}
            validationResult={validationResult}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
          />
        </div>
      </div>
    </div>
  );
};

export default ValidatePage;
