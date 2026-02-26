'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { keymap } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { Prec } from '@codemirror/state';

const LAB_URL   = 'http://localhost:8010';
const AGENT_URL = 'http://localhost:8020';

// ── Restrictions ──────────────────────────────────────────────────────────────
const BLOCKED: { re: RegExp; msg: string }[] = [
  { re: /(!|%)?pip3?\s+(install|download)/i,     msg: 'pip install is not allowed.' },
  { re: /(conda|apt-get?|brew|npm|yarn)\s+install/i, msg: 'System package installation is not allowed.' },
  { re: /\b(import|from)\s+(tensorflow|tf|torch|keras|jax|mxnet|paddle|caffe|theano|cntk|transformers|diffusers|ultralytics)\b/i, msg: 'Heavy DL libraries are not available.' },
  { re: /__import__\s*\(/i,           msg: '__import__ is not allowed.' },
  { re: /\bos\s*\.\s*system\s*\(/i,  msg: 'os.system() is not allowed.' },
  { re: /\bsubprocess\b/i,            msg: 'subprocess is not allowed.' },
];
const checkCode = (code: string): string | null => { for (const { re, msg } of BLOCKED) if (re.test(code)) return msg; return null; };

// ── Types ─────────────────────────────────────────────────────────────────────
type CellStatus = 'idle' | 'running' | 'done' | 'error';
interface Out { stdout: string; error: string | null; charts: string[] }
interface Cell { id: string; code: string; out: Out | null; status: CellStatus; ms: number | null; execN: number | null; outOpen: boolean; }
const newCell = (): Cell => ({ id: crypto.randomUUID(), code: '', out: null, status: 'idle', ms: null, execN: null, outOpen: true });

interface ModelSuggestion { rank: number; name: string; display_name: string; reasoning: string; pros: string[]; cons: string[]; expected_performance: string; }
interface AnalysisData { problem_type: string; target_column: string; dataset_summary: string; feature_analysis: string; missing_values_note: string; feature_engineering_reasoning: string; }

type MsgType = 'welcome' | 'info' | 'analysis' | 'models' | 'fe' | 'pipeline' | 'user' | 'ai' | 'error' | 'insight' | 'predict_form' | 'guard' | 'eda_summary';
type GuardStep = 'analyzing' | 'searching' | 'fixing' | 'success' | 'failed';
interface ChatMsg { id: string; type: MsgType; text?: string; analysis?: AnalysisData; models?: ModelSuggestion[]; fe?: { code: string; output: string; error: string | null }; reasoning?: string; guardStep?: GuardStep; guardCode?: string; edaSummary?: { summary: string; featureImportance: string; preprocessing: string }; }

// ── Guard helper ──────────────────────────────────────────────────────────────
/** Extract the most informative single line from a Python traceback */
function lastErrLine(preview: unknown): string {
  if (typeof preview !== 'string') return '';
  const lines = preview.split('\n').map(l => l.trim()).filter(Boolean);
  return lines[lines.length - 1] ?? preview.slice(0, 120);
}

// ── SSE reader helper ─────────────────────────────────────────────────────────
async function* readSSE(response: Response): AsyncGenerator<Record<string, unknown>> {
  const reader = response.body!.getReader();
  const dec    = new TextDecoder();
  let   buf    = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop() ?? '';
    for (const part of parts) {
      const dataLine = part.split('\n').find(l => l.startsWith('data: '));
      if (!dataLine) continue;
      try { yield JSON.parse(dataLine.slice(6)); } catch { /* ignore malformed */ }
    }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LabPage() {
  const router = useRouter();

  // Notebook state
  const [sid,     setSid]    = useState<string | null>(null);
  const [cells,   setCells]  = useState<Cell[]>([newCell()]);
  const [connErr, setConnErr] = useState<string | null>(null);
  const sidRef    = useRef<string | null>(null);
  const cellsRef  = useRef<Cell[]>(cells);
  const execCount = useRef(0);
  useEffect(() => { cellsRef.current = cells; }, [cells]);

  // Upload state
  const fileInputRef       = useRef<HTMLInputElement>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploading,        setUploading]         = useState(false);
  const [uploadErr,        setUploadErr]         = useState<string | null>(null);
  const [targetCol,        setTargetCol]         = useState('');

  // Health polling
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [agentUp,   setAgentUp]   = useState<boolean | null>(null);
  useEffect(() => {
    let m = true;
    const check = async () => {
      try { const r = await fetch(`${LAB_URL}/health`,   { signal: AbortSignal.timeout(3000) }); if (m) setBackendUp(r.ok); } catch { if (m) setBackendUp(false); }
      try { const r = await fetch(`${AGENT_URL}/health`, { signal: AbortSignal.timeout(3000) }); if (m) setAgentUp(r.ok);   } catch { if (m) setAgentUp(false);   }
    };
    check(); const id = setInterval(check, 5000); return () => { m = false; clearInterval(id); };
  }, []);

  // Chat state
  const [chatMsgs,      setChatMsgs]      = useState<ChatMsg[]>([{ id: 'w', type: 'welcome', text: 'Upload a CSV or Excel dataset to begin. The AI agent will analyse it, suggest top models, and build a complete ML pipeline for you.' }]);
  const [chatInput,     setChatInput]     = useState('');
  const [chatSending,   setChatSending]   = useState(false);
  const [analyzing,     setAnalyzing]     = useState(false);
  const [buildingPipeline, setBuildingPipeline] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [analysisStage, setAnalysisStage] = useState<'idle' | 'analyzed' | 'pipeline_built'>('idle');
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  const [predictInputs,  setPredictInputs]  = useState<Record<string,string>>({});
  const [predicting,     setPredicting]     = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Panel resize
  const [panelW, setPanelW] = useState(430);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (!dragRef.current) return; const d = dragRef.current.startX - e.clientX; setPanelW(Math.max(280, Math.min(680, dragRef.current.startW + d))); };
    const onUp   = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs]);

  const addMsg = useCallback((msg: Omit<ChatMsg, 'id'>) => setChatMsgs(p => [...p, { ...msg, id: crypto.randomUUID() }]), []);

  // ── Dashboard integration ──────────────────────────────────────────────────
  /** Save a new project entry to localStorage so the dashboard picks it up. */
  const saveLabProjectToDashboard = useCallback((filename: string): string => {
    if (typeof window === 'undefined') return '';
    const projectId = `lab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const projectData = {
      id: projectId,
      name: filename.replace(/\.[^/.]+$/, ''),
      dataset: filename,
      taskType: 'lab-playground',
      status: 'in-progress',
      confidence: 0,
      createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      filePath: filename,
      rowCount: 0,
    };
    const existing = JSON.parse(localStorage.getItem('userProjects') || '[]');
    // Remove previous in-progress entry for same file to avoid duplicates
    const filtered = existing.filter((p: { dataset: string; status: string }) =>
      !(p.dataset === filename && p.status === 'in-progress')
    );
    localStorage.setItem('userProjects', JSON.stringify([projectData, ...filtered]));

    const activityData = { id: Date.now().toString(), action: `Opened ${filename} in Lab Playground`, timestamp: new Date().toLocaleTimeString(), type: 'upload' };
    const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
    localStorage.setItem('userActivities', JSON.stringify([activityData, ...activities]));
    return projectId;
  }, []);

  /** Mark a project as validated once analysis finishes. */
  const markProjectValidated = useCallback((filename: string) => {
    if (typeof window === 'undefined') return;
    const projects = JSON.parse(localStorage.getItem('userProjects') || '[]');
    const updated = projects.map((p: { dataset: string; status: string; confidence: number }) =>
      p.dataset === filename ? { ...p, status: 'validated', confidence: 85 } : p
    );
    localStorage.setItem('userProjects', JSON.stringify(updated));

    const mlStats = { validations: updated.filter((p: { status: string }) => p.status === 'validated').length, datasets: updated.length, avgConfidence: 85, totalRows: 0 };
    localStorage.setItem('mlValidationStats', JSON.stringify(mlStats));

    const activityData = { id: Date.now().toString(), action: `Completed analysis for ${filename} in Lab Playground`, timestamp: new Date().toLocaleTimeString(), type: 'completion' };
    const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
    localStorage.setItem('userActivities', JSON.stringify([activityData, ...activities]));
  }, []);

  const addCellFromSSE = useCallback((code: string, output: string, error: string | null, charts: string[]): Cell => {
    const c = newCell();
    c.code   = code;
    c.out    = { stdout: output, error, charts: charts ?? [] };
    c.status = error ? 'error' : 'done';
    c.ms     = 0;
    c.execN  = ++execCount.current;
    setCells(p => [...p, c]);
    return c;
  }, []);

  // ── Session ─────────────────────────────────────────────────────────────────
  const getSession = useCallback(async (): Promise<string | null> => {
    if (sidRef.current) return sidRef.current;
    try {
      const r = await fetch(`${LAB_URL}/session`, { method: 'POST' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      sidRef.current = d.session_id; setSid(d.session_id); setConnErr(null);
      return d.session_id;
    } catch { setConnErr(`Cannot reach lab-backend at ${LAB_URL}.`); return null; }
  }, []);

  // ── Cell run ─────────────────────────────────────────────────────────────────
  const run = useCallback(async (id: string, attempt = 0) => {
    const cell = cellsRef.current.find(c => c.id === id);
    if (!cell || cell.status === 'running') return;
    const violation = checkCode(cell.code);
    if (violation) { setCells(p => p.map(c => c.id === id ? { ...c, status: 'error', out: { stdout: '', error: `🚫 ${violation}`, charts: [] }, ms: 0, outOpen: true } : c)); return; }
    const session = await getSession(); if (!session) return;
    const n = ++execCount.current, t0 = performance.now();
    setCells(p => p.map(c => c.id === id ? { ...c, status: 'running', out: null, execN: n } : c));
    try {
      const r = await fetch(`${LAB_URL}/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: session, cell_id: id, code: cell.code }) });
      const data = await r.json();
      const ms = Math.round(performance.now() - t0);
      setCells(p => p.map(c => c.id === id ? { ...c, status: data.error ? 'error' : 'done', out: { stdout: data.stdout ?? '', error: data.error ?? null, charts: data.charts ?? [] }, ms, execN: n, outOpen: true } : c));
    } catch (e: any) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 1500)); return run(id, attempt + 1); }
      setCells(p => p.map(c => c.id === id ? { ...c, status: 'error', out: { stdout: '', error: e.message, charts: [] }, ms: Math.round(performance.now() - t0), outOpen: true } : c));
    }
  }, [getSession]);

  // ── Cell mutations ────────────────────────────────────────────────────────────
  const setCode    = (id: string, v: string) => setCells(p => p.map(c => c.id === id ? { ...c, code: v } : c));
  const insertAfter = (id: string) => setCells(p => { const i = p.findIndex(c => c.id === id); const n = [...p]; n.splice(i+1, 0, newCell()); return n; });
  const moveUp     = (id: string) => setCells(p => { const i = p.findIndex(c => c.id === id); if (i===0) return p; const n=[...p]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n; });
  const moveDown   = (id: string) => setCells(p => { const i = p.findIndex(c => c.id === id); if (i===p.length-1) return p; const n=[...p]; [n[i],n[i+1]]=[n[i+1],n[i]]; return n; });
  const deleteCell = (id: string) => setCells(p => p.length===1 ? p : p.filter(c => c.id !== id));
  const toggleOut  = (id: string) => setCells(p => p.map(c => c.id === id ? { ...c, outOpen: !c.outOpen } : c));

  // ── Upload ────────────────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file: File) => {
    const session = await getSession(); if (!session) return;
    setUploading(true); setUploadErr(null);
    const form = new FormData(); form.append('session_id', session); form.append('file', file);
    try {
      const r = await fetch(`${LAB_URL}/upload`, { method: 'POST', body: form });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${r.status}`); }
      const d = await r.json();
      setUploadedFilename(d.filename); setUploadedFilePath(d.file_path);
      addMsg({ type: 'info', text: `📄 **${d.filename}** uploaded (${d.size_kb} KB). Set the target column (optional) then click **Analyse**.` });
      saveLabProjectToDashboard(d.filename);
    } catch (e: any) { setUploadErr(e.message); }
    finally { setUploading(false); }
  }, [getSession, addMsg]);

  // ── Analyse (SSE) ─────────────────────────────────────────────────────────────
  const analyze = useCallback(async () => {
    if (!uploadedFilePath || !uploadedFilename) return;
    const session = await getSession(); if (!session) return;
    setAnalyzing(true);
    addMsg({ type: 'info', text: `🔍 Analysing **${uploadedFilename}**… this may take 20–40 s.` });
    try {
      const r = await fetch(`${AGENT_URL}/v2/analyze-stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session, uploaded_file_path: uploadedFilePath, uploaded_filename: uploadedFilename, target_column: targetCol.trim() || null }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${r.status}`); }
      for await (const ev of readSSE(r)) {
        const type = ev.type as string;
        if (type === 'status')        addMsg({ type: 'info',     text: ev.text as string });
        if (type === 'code_cell')     addCellFromSSE(ev.code as string, ev.output as string, ev.error as string|null, ev.charts as string[]);
        if (type === 'analysis')      addMsg({ type: 'analysis', analysis: ev.data as AnalysisData });
        if (type === 'fe_cell')       { addCellFromSSE(ev.code as string, ev.output as string, ev.error as string|null, ev.charts as string[]); addMsg({ type: 'fe', fe: { code: ev.code as string, output: ev.output as string, error: ev.error as string|null } }); }
        if (type === 'eda_cell')      addCellFromSSE(ev.code as string, ev.output as string, ev.error as string|null, ev.charts as string[]);
        if (type === 'eda_summary')   { const d = ev.data as { summary: string; feature_importance: string; preprocessing: string }; addMsg({ type: 'eda_summary', edaSummary: { summary: d.summary, featureImportance: d.feature_importance, preprocessing: d.preprocessing } }); }
        if (type === 'models')        addMsg({ type: 'models',   models: ev.models as ModelSuggestion[] });
        if (type === 'error')         addMsg({ type: 'error',    text: ev.text as string });
        if (type === 'done')          { setAnalysisStage('analyzed'); if (uploadedFilename) markProjectValidated(uploadedFilename); }
        // Guard events
        if (type === 'guard_analyzing') addMsg({ type: 'guard', guardStep: 'analyzing', text: `**${ev.title}** — ${lastErrLine(ev.error_preview)}` });
        if (type === 'web_searching')   addMsg({ type: 'guard', guardStep: 'searching', text: ev.query as string });
        if (type === 'fix_attempt')     addMsg({ type: 'guard', guardStep: 'fixing',    text: ev.explanation as string, guardCode: ev.code as string });
        if (type === 'fix_success')     addMsg({ type: 'guard', guardStep: 'success',   text: ev.explanation as string });
        if (type === 'guard_give_up')   addMsg({ type: 'guard', guardStep: 'failed',    text: `Retries exhausted for **${ev.title}**` });
      }
    } catch (e: any) { addMsg({ type: 'error', text: e.message }); }
    finally { setAnalyzing(false); }
  }, [uploadedFilePath, uploadedFilename, targetCol, getSession, addMsg, addCellFromSSE]);

  // ── Build pipeline (SSE) ──────────────────────────────────────────────────────
  const buildPipeline = useCallback(async (modelName: string) => {
    const session = await getSession(); if (!session) return;
    setSelectedModel(modelName); setBuildingPipeline(true);
    addMsg({ type: 'info', text: `🏗️ Building ML pipeline with **${modelName}**…` });
    try {
      const r = await fetch(`${AGENT_URL}/v2/build-pipeline-stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session, selected_model: modelName, target_column: targetCol.trim() || null }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${r.status}`); }
      for await (const ev of readSSE(r)) {
        const type = ev.type as string;
        if (type === 'status')    addMsg({ type: 'info',     text: ev.text as string });
        if (type === 'reasoning') addMsg({ type: 'pipeline', reasoning: ev.text as string });
        if (type === 'code_cell') addCellFromSSE(ev.code as string, ev.output as string, ev.error as string|null, ev.charts as string[]);
        if (type === 'insight')   addMsg({ type: 'insight',  text: ev.text as string });
        if (type === 'error')     addMsg({ type: 'error',    text: ev.text as string });
        if (type === 'done') {
          const cols = ev.feature_columns as string[] ?? [];
          setFeatureColumns(cols);
          setPredictInputs(Object.fromEntries(cols.map(c => [c, ''])));
          setAnalysisStage('pipeline_built');
          addMsg({ type: 'ai',   text: '✅ Pipeline complete! All cells have been added to the notebook.' });
          if (cols.length > 0) addMsg({ type: 'predict_form', text: 'predict' });
        }
        // Guard events
        if (type === 'guard_analyzing') addMsg({ type: 'guard', guardStep: 'analyzing', text: `**${ev.title}** — ${lastErrLine(ev.error_preview)}` });
        if (type === 'web_searching')   addMsg({ type: 'guard', guardStep: 'searching', text: ev.query as string });
        if (type === 'fix_attempt')     addMsg({ type: 'guard', guardStep: 'fixing',    text: ev.explanation as string, guardCode: ev.code as string });
        if (type === 'fix_success')     addMsg({ type: 'guard', guardStep: 'success',   text: ev.explanation as string });
        if (type === 'guard_give_up')   addMsg({ type: 'guard', guardStep: 'failed',    text: `Retries exhausted for **${ev.title}**` });
      }
    } catch (e: any) { addMsg({ type: 'error', text: e.message }); }
    finally { setBuildingPipeline(false); }
  }, [targetCol, getSession, addMsg, addCellFromSSE]);

  // ── Predict ───────────────────────────────────────────────────────────────────
  const predict = useCallback(async () => {
    const session = await getSession(); if (!session) return;
    setPredicting(true);
    try {
      const r = await fetch(`${AGENT_URL}/v2/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session, input_values: predictInputs }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${r.status}`); }
      const d = await r.json();
      // Add prediction code as a notebook cell
      addCellFromSSE(d.code, d.output ?? '', d.error ?? null, []);
      addMsg({ type: 'ai', text: d.error ? `⚠️ Prediction error: ${d.error}` : `🎯 Prediction result:\n\`\`\`\n${d.output}\n\`\`\`` });
    } catch (e: any) { addMsg({ type: 'error', text: e.message }); }
    finally { setPredicting(false); }
  }, [getSession, predictInputs, addMsg, addCellFromSSE]);

  // ── Chat ──────────────────────────────────────────────────────────────────────
  const sendChat = useCallback(async () => {
    const msg = chatInput.trim(); if (!msg) return;
    const session = await getSession(); if (!session) return;
    setChatInput(''); addMsg({ type: 'user', text: msg }); setChatSending(true);
    try {
      const r = await fetch(`${AGENT_URL}/v2/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session, message: msg }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();

      // If code needs execution → render any guard events first, then add cell
      if (d.action === 'execute' && d.code) {
        // Replay guard events returned from the non-streaming chat endpoint
        for (const ge of (d.guard_events ?? []) as Array<Record<string,unknown>>) {
          const gt = ge.type as string;
          if (gt === 'guard_analyzing') addMsg({ type: 'guard', guardStep: 'analyzing', text: `**${ge.title}** — ${lastErrLine(ge.error_preview)}` });
          if (gt === 'web_searching')   addMsg({ type: 'guard', guardStep: 'searching', text: ge.query as string });
          if (gt === 'fix_attempt')     addMsg({ type: 'guard', guardStep: 'fixing',    text: ge.explanation as string, guardCode: ge.code as string });
          if (gt === 'fix_success')     addMsg({ type: 'guard', guardStep: 'success',   text: ge.explanation as string });
          if (gt === 'guard_give_up')   addMsg({ type: 'guard', guardStep: 'failed',    text: `Retries exhausted for **${ge.title}**` });
        }
        addCellFromSSE(d.code, d.output ?? '', d.error ?? null, d.charts ?? []);
        // If chart, show insight
        if (d.chart_insight) addMsg({ type: 'insight', text: d.chart_insight });
      }
      // Always show text reply in chat
      addMsg({ type: 'ai', text: d.reply });
    } catch (e: any) {
      addMsg({ type: 'error', text: agentUp === false ? 'lab-agent is offline. Start it: uvicorn main:app --port 8020' : e.message });
    } finally { setChatSending(false); }
  }, [chatInput, getSession, addMsg, addCellFromSSE, agentUp]);

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const reset = () => {
    if (sidRef.current) { fetch(`${LAB_URL}/session/${sidRef.current}`, { method: 'DELETE' }).catch(() => {}); fetch(`${AGENT_URL}/agent-session/${sidRef.current}`, { method: 'DELETE' }).catch(() => {}); }
    sidRef.current = null; execCount.current = 0;
    setSid(null); setCells([newCell()]); setConnErr(null);
    setUploadedFilename(null); setUploadedFilePath(null); setUploadErr(null); setTargetCol('');
    setChatMsgs([{ id: 'w', type: 'welcome', text: 'Upload a CSV or Excel dataset to begin. The AI agent will analyse it, suggest top models, and build a complete ML pipeline for you.' }]);
    setChatInput(''); setAnalysisStage('idle'); setSelectedModel(null); setFeatureColumns([]); setPredictInputs({});
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0b14', color: '#e6eef8', fontFamily: "'Chillax','Inter',sans-serif", overflow: 'hidden' }}>

      {/* Header */}
      <header style={{ height: 52, flexShrink: 0, background: 'rgba(10,11,20,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push('/dashboard')} title="Back to Dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 10px', color: '#94a3b8', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Dashboard
          </button>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#4a3aad,#7c5cbf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 0 12px rgba(110,84,200,0.4)' }}>🧪</div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Lab Playground</span>
          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: 'rgba(110,84,200,0.18)', border: '1px solid rgba(110,84,200,0.35)', color: '#a87edf' }}>BETA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ServiceDot label="backend" up={backendUp} />
          <ServiceDot label="agent"   up={agentUp} />
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: sid ? '#4ade80' : '#475569' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: sid ? '#4ade80' : '#475569', display: 'inline-block' }} />
            {sid ? `session ${sid.slice(0,7)}…` : 'no session'}
          </span>
          <button onClick={reset} style={ghostBtn}>Reset Kernel</button>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* Left: Notebook */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '20px 24px 60px' }}>
          {connErr && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#fca5a5', fontSize: 12 }}>⚠ {connErr}</div>}
          <div style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 10, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#fbbf24', display: 'flex', gap: 6 }}>
            🔒 <span><code style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.07)', padding: '0 4px', borderRadius: 3 }}>pip install</code> and heavy DL libraries are restricted.</span>
          </div>
          {cells.map((cell, idx) => (
            <CellBlock key={cell.id} cell={cell} index={idx} total={cells.length}
              onRun={() => run(cell.id)} onCode={v => setCode(cell.id, v)}
              onInsert={() => insertAfter(cell.id)} onMoveUp={() => moveUp(cell.id)}
              onMoveDown={() => moveDown(cell.id)} onDelete={() => deleteCell(cell.id)}
              onToggleOut={() => toggleOut(cell.id)} />
          ))}
          <AddCellBtn onClick={() => setCells(p => [...p, newCell()])} />
        </div>

        {/* Drag handle */}
        <div onMouseDown={e => { dragRef.current = { startX: e.clientX, startW: panelW }; e.preventDefault(); }}
          style={{ width: 5, flexShrink: 0, cursor: 'col-resize', background: 'rgba(110,84,200,0.12)', borderLeft: '1px solid rgba(110,84,200,0.2)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(110,84,200,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(110,84,200,0.12)'; }} />

        {/* Right: Chat Panel */}
        <div style={{ width: panelW, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0c0d1a', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Panel header */}
          <div style={{ flexShrink: 0, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>🤖</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#c4b5fd' }}>ML Agent</span>
              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 20, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(110,84,200,0.2)', border: '1px solid rgba(110,84,200,0.35)', color: '#a87edf' }}>GPT-4o-mini</span>
            </div>

            {/* Upload */}
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
              {uploadedFilename ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 7, padding: '4px 8px' }}>
                  <span style={{ fontSize: 11 }}>📄</span>
                  <span style={{ fontSize: 11, color: '#4ade80', fontFamily: 'monospace', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFilename}</span>
                  {analysisStage === 'idle' && <button onClick={() => { setUploadedFilename(null); setUploadedFilePath(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 13, padding: 0 }}>×</button>}
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, cursor: uploading ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.18)', color: '#94a3b8', fontSize: 11, fontFamily: 'inherit' }}>
                  {uploading ? <><SpinIcon size={10}/><span>Uploading…</span></> : <><span>📂</span><span>Upload CSV / Excel</span></>}
                </button>
              )}
              {uploadErr && <span style={{ fontSize: 11, color: '#f87171' }}>⚠ {uploadErr}</span>}
            </div>

            {/* Target + Analyse */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input value={targetCol} onChange={e => setTargetCol(e.target.value)} placeholder="target column (optional)"
                disabled={analysisStage !== 'idle'}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 9px', color: '#e2e8f0', fontSize: 11, outline: 'none', fontFamily: 'monospace', opacity: analysisStage !== 'idle' ? 0.4 : 1 }} />
              {analysisStage === 'idle' ? (
                <button onClick={analyze} disabled={!uploadedFilePath || analyzing}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, cursor: (!uploadedFilePath || analyzing) ? 'not-allowed' : 'pointer', background: (!uploadedFilePath || analyzing) ? 'rgba(110,84,200,0.1)' : 'linear-gradient(135deg,rgba(110,84,200,0.7),rgba(124,92,191,0.7))', border: '1px solid rgba(110,84,200,0.5)', color: !uploadedFilePath ? '#475569' : '#e2e8f0', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {analyzing ? <><SpinIcon size={10}/><span>Analysing…</span></> : <><span>🔍</span><span>Analyse</span></>}
                </button>
              ) : analysisStage === 'analyzed' ? (
                <span style={{ fontSize: 10, color: '#a87edf', whiteSpace: 'nowrap' }}>Select a model ↓</span>
              ) : (
                <span style={{ fontSize: 10, color: '#4ade80', whiteSpace: 'nowrap' }}>✓ Pipeline built</span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0' }}>
            {chatMsgs.map(msg => (
              <ChatBubble key={msg.id} msg={msg}
                onSelectModel={buildPipeline} selectedModel={selectedModel}
                pipelineDisabled={buildingPipeline || analysisStage === 'pipeline_built'}
                featureColumns={featureColumns} predictInputs={predictInputs}
                setPredictInputs={setPredictInputs} onPredict={predict} predicting={predicting} />
            ))}
            {(analyzing || buildingPipeline) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', color: '#a87edf', fontSize: 12 }}>
                <SpinIcon size={12} /> {analyzing ? 'Agent is analysing your dataset…' : 'Building the pipeline, step by step…'}
              </div>
            )}
            <div ref={chatEndRef} style={{ height: 12 }} />
          </div>

          {/* Chat input */}
          <div style={{ flexShrink: 0, padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: 7, alignItems: 'flex-end' }}>
            <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="Ask anything about your data or pipeline… (Enter to send)"
              rows={2}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '8px 11px', color: '#e2e8f0', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5 }} />
            <button onClick={sendChat} disabled={chatSending || !chatInput.trim()}
              style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: chatInput.trim() ? 'linear-gradient(135deg,rgba(110,84,200,0.8),rgba(124,92,191,0.8))' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(110,84,200,0.4)', color: chatInput.trim() ? '#e2e8f0' : '#475569', cursor: chatInput.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {chatSending ? <SpinIcon size={11}/> : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chat Bubble ────────────────────────────────────────────────────────────────
interface BubbleProps {
  msg: ChatMsg;
  onSelectModel(name: string): void;
  selectedModel: string | null;
  pipelineDisabled: boolean;
  featureColumns: string[];
  predictInputs: Record<string,string>;
  setPredictInputs: React.Dispatch<React.SetStateAction<Record<string,string>>>;
  onPredict(): void;
  predicting: boolean;
}

function ChatBubble({ msg, onSelectModel, selectedModel, pipelineDisabled, featureColumns, predictInputs, setPredictInputs, onPredict, predicting }: BubbleProps) {
  switch (msg.type) {
    case 'welcome': return (
      <div style={{ marginBottom: 12, padding: 14, borderRadius: 12, background: 'rgba(110,84,200,0.08)', border: '1px solid rgba(110,84,200,0.2)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>🤖</span><span style={{ fontWeight: 700, fontSize: 13, color: '#c4b5fd' }}>ML Agent</span></div>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{msg.text}</p>
      </div>
    );

    case 'info': return (
      <div style={{ marginBottom: 7, padding: '7px 11px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#64748b' }}>
        <MdText text={msg.text || ''} />
      </div>
    );

    case 'analysis': return (
      <div style={{ marginBottom: 12, borderRadius: 12, border: '1px solid rgba(110,84,200,0.25)', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', background: 'rgba(110,84,200,0.12)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>📊</span><span style={{ fontWeight: 700, fontSize: 12, color: '#c4b5fd' }}>Dataset Analysis</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'rgba(110,84,200,0.2)', border: '1px solid rgba(110,84,200,0.35)', color: '#a87edf' }}>{msg.analysis?.problem_type}</span>
        </div>
        <div style={{ padding: '10px 12px', fontSize: 12, lineHeight: 1.7, color: '#94a3b8' }}>
          {msg.analysis?.target_column && <Row label="Target" val={msg.analysis.target_column} mono />}
          {msg.analysis?.dataset_summary && <Section title="Summary" text={msg.analysis.dataset_summary} />}
          {msg.analysis?.feature_analysis && <Section title="Features" text={msg.analysis.feature_analysis} />}
          {msg.analysis?.missing_values_note && <Section title="Missing Values" text={msg.analysis.missing_values_note} />}
          {msg.analysis?.feature_engineering_reasoning && <Section title="Feature Engineering" text={msg.analysis.feature_engineering_reasoning} />}
        </div>
      </div>
    );

    case 'fe': return (
      <div style={{ marginBottom: 12, borderRadius: 10, border: '1px solid rgba(99,102,241,0.25)', overflow: 'hidden' }}>
        <div style={{ padding: '7px 12px', background: 'rgba(99,102,241,0.1)', fontSize: 12, fontWeight: 700, color: '#818cf8', display: 'flex', gap: 6 }}>
          <span>⚙️</span> Feature Engineering Applied {msg.fe?.error && <span style={{ marginLeft: 'auto', color: '#f87171', fontSize: 11 }}>⚠ error</span>}
        </div>
        <pre style={{ margin: 0, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', fontSize: 11, fontFamily: "'Fira Code','Consolas',monospace", whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>{msg.fe?.code}</pre>
        {msg.fe?.output && <pre style={{ margin: 0, padding: '5px 12px', background: 'rgba(74,222,128,0.04)', color: '#bbf7d0', fontSize: 11, fontFamily: "'Fira Code','Consolas',monospace", whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'auto', borderTop: '1px solid rgba(255,255,255,0.04)' }}>{msg.fe.output}</pre>}
      </div>
    );

    case 'eda_summary': return (
      <EdaSummaryBubble summary={msg.edaSummary?.summary ?? ''} featureImportance={msg.edaSummary?.featureImportance ?? ''} preprocessing={msg.edaSummary?.preprocessing ?? ''} />
    );

    case 'models': return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', marginBottom: 8, display: 'flex', gap: 6 }}><span>🏆</span> Top 3 Recommended Models</div>
        {(msg.models || []).map((m, i) => (
          <ModelCard key={m.name} model={m} rank={i} isSelected={selectedModel === m.name} onSelect={() => onSelectModel(m.name)} disabled={pipelineDisabled} />
        ))}
      </div>
    );

    case 'pipeline': return (
      <div style={{ marginBottom: 12, borderRadius: 10, border: '1px solid rgba(74,222,128,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '7px 12px', background: 'rgba(74,222,128,0.06)', fontSize: 12, fontWeight: 700, color: '#4ade80', display: 'flex', gap: 6 }}><span>🧠</span> Agent Reasoning</div>
        <div style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.reasoning}</div>
      </div>
    );

    case 'insight': return (
      <div style={{ marginBottom: 10, display: 'flex', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#0d9488,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginTop: 2 }}>📈</div>
        <div style={{ flex: 1, padding: '9px 13px', borderRadius: '2px 12px 12px 12px', background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)', fontSize: 12, color: '#99f6e4', lineHeight: 1.7 }}>{msg.text}</div>
      </div>
    );

    case 'guard': return (
      <GuardBubble step={msg.guardStep ?? 'analyzing'} text={msg.text ?? ''} code={msg.guardCode} />
    );

    case 'predict_form': return (
      <PredictForm featureColumns={featureColumns} inputs={predictInputs} setInputs={setPredictInputs} onPredict={onPredict} predicting={predicting} />
    );

    case 'user': return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <div style={{ maxWidth: '80%', padding: '9px 13px', borderRadius: '12px 12px 2px 12px', background: 'rgba(110,84,200,0.25)', border: '1px solid rgba(110,84,200,0.4)', fontSize: 12, color: '#e2e8f0', lineHeight: 1.6 }}>{msg.text}</div>
      </div>
    );

    case 'ai': return (
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#4a3aad,#7c5cbf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginTop: 2 }}>🤖</div>
        <div style={{ flex: 1, padding: '9px 13px', borderRadius: '2px 12px 12px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
          <MdText text={msg.text || ''} />
        </div>
      </div>
    );

    case 'error': return (
      <div style={{ marginBottom: 8, padding: '9px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: 12, display: 'flex', gap: 6 }}>⚠ {msg.text}</div>
    );

    default: return null;
  }
}

// ── EDA Summary Bubble ────────────────────────────────────────────────────────
function EdaSummaryBubble({ summary, featureImportance, preprocessing }: { summary: string; featureImportance: string; preprocessing: string }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ summary: true, features: false, preprocessing: false });
  const toggle = (key: string) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

  const sections = [
    { key: 'summary',        icon: '📊', label: 'EDA Summary',                    content: summary,            color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.25)' },
    { key: 'features',       icon: '⭐', label: 'Feature Importance Notes',        content: featureImportance,  color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)' },
    { key: 'preprocessing',  icon: '🔧', label: 'Preprocessing Recommendations',  content: preprocessing,      color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' },
  ].filter(s => s.content);

  if (sections.length === 0) return null;

  return (
    <div style={{ marginBottom: 12, borderRadius: 12, border: '1px solid rgba(34,211,238,0.25)', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: 'rgba(34,211,238,0.08)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>🔬</span>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#22d3ee' }}>Exploratory Data Analysis</span>
      </div>
      <div style={{ padding: '6px 0' }}>
        {sections.map(s => (
          <div key={s.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <button onClick={() => toggle(s.key)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, color: s.color, fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit', textAlign: 'left' }}>
              <span>{s.icon}</span>
              <span style={{ flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 10, transform: openSections[s.key] ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>▾</span>
            </button>
            {openSections[s.key] && (
              <div style={{ padding: '4px 12px 10px', fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
                <MdText text={s.content} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Prediction form ───────────────────────────────────────────────────────────
function PredictForm({ featureColumns, inputs, setInputs, onPredict, predicting }: {
  featureColumns: string[]; inputs: Record<string,string>;
  setInputs: React.Dispatch<React.SetStateAction<Record<string,string>>>;
  onPredict(): void; predicting: boolean;
}) {
  return (
    <div style={{ marginBottom: 12, borderRadius: 12, border: '1px solid rgba(251,191,36,0.3)', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: 'rgba(251,191,36,0.08)', fontSize: 12, fontWeight: 700, color: '#fbbf24', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>🧪</span> Test Your Model
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#92400e' }}>Enter values → Predict</span>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {featureColumns.map(col => (
          <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', minWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col}</span>
            <input value={inputs[col] ?? ''} onChange={e => setInputs(p => ({ ...p, [col]: e.target.value }))}
              placeholder="value"
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '4px 8px', color: '#e2e8f0', fontSize: 11, outline: 'none', fontFamily: 'monospace' }} />
          </div>
        ))}
        <button onClick={onPredict} disabled={predicting}
          style={{ marginTop: 4, padding: '7px', borderRadius: 8, cursor: predicting ? 'not-allowed' : 'pointer', background: predicting ? 'rgba(251,191,36,0.06)' : 'linear-gradient(135deg,rgba(251,191,36,0.3),rgba(245,158,11,0.3))', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {predicting ? <><SpinIcon size={11}/><span>Predicting…</span></> : <><span>▶</span><span>Run Prediction</span></>}
        </button>
      </div>
    </div>
  );
}

// ── Guard Bubble ──────────────────────────────────────────────────────────────
const GUARD_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  analyzing: { icon: '🛡️', label: 'Guard analyzing error',  color: '#fbbf24', bg: 'rgba(251,191,36,0.07)',  border: 'rgba(251,191,36,0.28)' },
  searching: { icon: '🔍', label: 'Web search',             color: '#60a5fa', bg: 'rgba(96,165,250,0.07)',  border: 'rgba(96,165,250,0.28)'  },
  fixing:    { icon: '🔧', label: 'Applying fix',           color: '#a78bfa', bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.28)' },
  success:   { icon: '✅', label: 'Auto-fixed!',            color: '#4ade80', bg: 'rgba(74,222,128,0.07)',  border: 'rgba(74,222,128,0.28)'  },
  failed:    { icon: '⚠️', label: 'Could not auto-fix',    color: '#f87171', bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.28)'   },
};

function GuardBubble({ step, text, code }: { step: string; text: string; code?: string }) {
  const cfg = GUARD_CONFIG[step] ?? GUARD_CONFIG.analyzing;
  const [codeOpen, setCodeOpen] = useState(false);
  return (
    <div style={{ marginBottom: 7, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</div>
      <div style={{ flex: 1, padding: '6px 10px', borderRadius: '2px 9px 9px 9px', background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: 11.5, lineHeight: 1.55 }}>
        <span style={{ color: cfg.color, fontWeight: 700, marginRight: 6 }}>{cfg.label}</span>
        <MdText text={text} />
        {code && (
          <div style={{ marginTop: 5 }}>
            <button onClick={() => setCodeOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 10.5, padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ display: 'inline-block', transform: codeOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>▾</span>
              {codeOpen ? 'hide fixed code' : 'view fixed code'}
            </button>
            {codeOpen && (
              <pre style={{ margin: '4px 0 0', padding: '7px 9px', background: 'rgba(0,0,0,0.35)', borderRadius: 6, fontSize: 11, fontFamily: "'Fira Code','Consolas',monospace", whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto', color: '#a5f3fc', border: '1px solid rgba(255,255,255,0.06)' }}>{code}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Model Card ────────────────────────────────────────────────────────────────
function ModelCard({ model, rank, isSelected, onSelect, disabled }: { model: ModelSuggestion; rank: number; isSelected: boolean; onSelect(): void; disabled: boolean; }) {
  const icons = ['🥇','🥈','🥉'];
  const [open, setOpen] = useState(rank === 0);
  return (
    <div style={{ marginBottom: 8, borderRadius: 10, border: `1px solid ${isSelected ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)'}`, background: isSelected ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
      <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 14 }}>{icons[rank]||'•'}</span>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 12, color: isSelected ? '#4ade80' : '#e2e8f0' }}>{model.display_name}</span>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#475569' }}>{model.name}</span>
        <span style={{ fontSize: 11, color: '#475569', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.18s' }}>▾</span>
      </div>
      {open && (
        <div style={{ padding: '0 12px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ margin: '8px 0 6px', fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{model.reasoning}</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
            <div>{model.pros.map((p,i) => <div key={i} style={{ fontSize: 11, color: '#4ade80', display: 'flex', gap: 4 }}><span>✓</span><span>{p}</span></div>)}</div>
            <div>{model.cons.map((c,i) => <div key={i} style={{ fontSize: 11, color: '#f87171', display: 'flex', gap: 4 }}><span>✗</span><span>{c}</span></div>)}</div>
          </div>
          {model.expected_performance && <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginBottom: 8 }}>Expected: {model.expected_performance}</div>}
          <button onClick={onSelect} disabled={disabled || isSelected}
            style={{ width: '100%', padding: 7, borderRadius: 8, cursor: (disabled||isSelected) ? 'not-allowed' : 'pointer', background: isSelected ? 'rgba(74,222,128,0.12)' : disabled ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,rgba(110,84,200,0.6),rgba(124,92,191,0.6))', border: isSelected ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(110,84,200,0.5)', color: isSelected ? '#4ade80' : disabled ? '#475569' : '#e2e8f0', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            {isSelected ? <><span>✓</span><span>Selected</span></> : <><span>▶</span><span>Build Pipeline with {model.display_name}</span></>}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Markdown-light renderer ───────────────────────────────────────────────────
function MdText({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const codeM = part.match(/^```(?:\w+)?\n?([\s\S]*?)```$/);
        if (codeM) return <pre key={i} style={{ margin: '5px 0', padding: '7px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 6, fontFamily: "'Fira Code','Consolas',monospace", fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowX: 'auto' }}>{codeM[1]}</pre>;
        const boldM = part.match(/^\*\*([^*]+)\*\*$/);
        if (boldM) return <strong key={i} style={{ color: '#e2e8f0' }}>{boldM[1]}</strong>;
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      })}
    </>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function Section({ title, text }: { title: string; text: string }) {
  return (<><div style={{ color: '#c4b5fd', fontWeight: 600, marginTop: 6, marginBottom: 2 }}>{title}</div><p style={{ margin: 0 }}>{text}</p></>);
}
function Row({ label, val, mono }: { label: string; val: string; mono?: boolean }) {
  return (<div style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span style={{ color: '#475569', minWidth: 80 }}>{label}</span><span style={{ color: '#e2e8f0', fontFamily: mono ? 'monospace' : 'inherit' }}>{val}</span></div>);
}

// ── Cell Block ────────────────────────────────────────────────────────────────
interface CBProps { cell: Cell; index: number; total: number; onRun(): void; onCode(v:string): void; onInsert(): void; onMoveUp(): void; onMoveDown(): void; onDelete(): void; onToggleOut(): void; }

function CellBlock({ cell, index, total, onRun, onCode, onInsert, onMoveUp, onMoveDown, onDelete, onToggleOut }: CBProps) {
  const isRunning = cell.status === 'running';
  const hasOut    = cell.out !== null;
  const borderColor = isRunning ? 'rgba(99,102,241,0.55)' : cell.status === 'error' ? 'rgba(239,68,68,0.35)' : cell.status === 'done' ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)';
  const statusDot = { idle: { color: '#475569', icon: '○' }, running: { color: '#818cf8', icon: '●' }, done: { color: '#4ade80', icon: '✓' }, error: { color: '#f87171', icon: '✕' } }[cell.status];
  const charts = cell.out?.charts ?? [];

  return (
    <div style={{ marginBottom: 10, borderRadius: 12, border: `1px solid ${borderColor}`, background: 'rgba(255,255,255,0.018)', overflow: 'hidden', transition: 'border-color 0.25s' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'rgba(0,0,0,0.22)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1, color: isRunning ? '#818cf8' : cell.status === 'done' ? '#4ade80' : cell.status === 'error' ? '#f87171' : '#64748b', fontWeight: 600 }}>{isRunning ? '[*]' : `[${index+1}]`}</span>
          <span style={{ fontSize: 9.5, color: statusDot.color, display: 'flex', alignItems: 'center', gap: 2, lineHeight: 1 }}>
            {isRunning ? <SpinIcon/> : <span>{statusDot.icon}</span>}
            {cell.ms !== null && <span style={{ color: '#475569' }}>{cell.ms < 1000 ? `${cell.ms}ms` : `${(cell.ms/1000).toFixed(1)}s`}</span>}
          </span>
        </div>
        <button onClick={onRun} disabled={isRunning} title="Run (Ctrl+Enter)"
          style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: isRunning ? 'rgba(255,255,255,0.04)' : 'rgba(74,222,128,0.08)', border: isRunning ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(74,222,128,0.4)', cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isRunning ? '#475569' : '#4ade80', fontSize: 10, fontWeight: 700, boxShadow: isRunning ? 'none' : '0 0 10px rgba(74,222,128,0.15)' }}>
          {isRunning ? <SpinIcon size={11}/> : '▶'}
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Tip label="Move up"><IBtn onClick={onMoveUp} disabled={index===0}>↑</IBtn></Tip>
          <Tip label="Move down"><IBtn onClick={onMoveDown} disabled={index===total-1}>↓</IBtn></Tip>
          <Tip label="Insert below"><IBtn onClick={onInsert}>+</IBtn></Tip>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />
          <Tip label="Delete"><DelBtn onClick={onDelete}/></Tip>
        </div>
      </div>
      {/* Editor */}
      <div style={{ marginLeft: 56 }}>
        <CodeMirror value={cell.code} height="auto"
          extensions={[python(), Prec.highest(keymap.of([
            { key: 'Mod-Enter',   run: () => { onRun(); return true; } },
            { key: 'Shift-Enter', run: () => { onRun(); onInsert(); return true; } },
          ]))]}
          theme={oneDark} onChange={onCode}
          placeholder={`# Cell ${index+1} — Ctrl+Enter to run`}
          style={{ fontSize: 13.5, fontFamily: "'Fira Code','Cascadia Code','Consolas',monospace" }}
          basicSetup={{ lineNumbers: true, highlightActiveLineGutter: false, highlightSpecialChars: false, foldGutter: false, drawSelection: true, dropCursor: false, allowMultipleSelections: false, indentOnInput: true, syntaxHighlighting: true, bracketMatching: true, closeBrackets: true, autocompletion: false, rectangularSelection: false, crosshairCursor: false, highlightActiveLine: false, highlightSelectionMatches: false, closeBracketsKeymap: true, defaultKeymap: true, historyKeymap: true, history: true }}
        />
      </div>
      {/* Output + Charts */}
      {hasOut && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={onToggleOut} style={{ width: '100%', background: 'rgba(0,0,0,0.18)', border: 'none', padding: '5px 16px 5px 72px', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#64748b', fontSize: 11, textAlign: 'left', borderBottom: cell.outOpen ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <span style={{ display: 'inline-block', transform: cell.outOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.18s', lineHeight: 1 }}>▾</span>
            <span>output</span>
            {cell.out?.error && <span style={{ color: '#f87171', marginLeft: 2 }}>— error</span>}
            {!cell.out?.error && cell.out?.stdout && <span style={{ color: '#4ade80', marginLeft: 2 }}>— ok</span>}
            {charts.length > 0 && <span style={{ color: '#22d3ee', marginLeft: 2 }}>— {charts.length} chart{charts.length>1?'s':''}</span>}
          </button>
          {cell.outOpen && (
            <div>
              {cell.out?.stdout && <pre style={{ margin: 0, padding: '10px 16px 10px 72px', background: 'rgba(0,0,0,0.25)', color: '#bbf7d0', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: "'Fira Code','Consolas',monospace" }}>{cell.out.stdout}</pre>}
              {cell.out?.error  && <pre style={{ margin: 0, padding: '10px 16px 10px 72px', background: 'rgba(239,68,68,0.05)', color: '#fca5a5', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: "'Fira Code','Consolas',monospace" }}>{cell.out.error}</pre>}
              {!cell.out?.stdout && !cell.out?.error && <div style={{ padding: '8px 16px 8px 72px', color: '#334155', fontSize: 12, fontFamily: 'monospace', background: 'rgba(0,0,0,0.15)' }}>(no output)</div>}
              {/* Charts */}
              {charts.map((b64, i) => (
                <div key={i} style={{ padding: '8px 16px 8px 72px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <img src={`data:image/png;base64,${b64}`} alt={`Chart ${i+1}`} style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add Cell Button ───────────────────────────────────────────────────────────
function AddCellBtn({ onClick }: { onClick(): void }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ marginTop: 6, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: h ? 'rgba(110,84,200,0.12)' : 'rgba(110,84,200,0.05)', border: '1px dashed rgba(110,84,200,0.3)', borderRadius: 10, padding: '9px 0', color: h ? '#c4b5fd' : '#7c5cbf', fontSize: 13, cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit' }}>
      <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Cell
    </button>
  );
}

function IBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick(): void; disabled?: boolean }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: 26, height: 26, borderRadius: 6, background: h&&!disabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: disabled ? '#2d3748' : h ? '#e2e8f0' : '#64748b', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
      {children}
    </button>
  );
}

function DelBtn({ onClick }: { onClick(): void }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} title="Delete"
      style={{ width: 26, height: 26, borderRadius: 6, background: h ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.07)', border: h ? '1px solid rgba(239,68,68,0.55)' : '1px solid rgba(239,68,68,0.25)', color: h ? '#f87171' : '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
      </svg>
    </button>
  );
}

function Tip({ children, label }: { children: React.ReactNode; label: string }) { return <span title={label}>{children}</span>; }

function ServiceDot({ label, up }: { label: string; up: boolean | null }) {
  const color = up === null ? '#475569' : up ? '#4ade80' : '#f87171';
  return (
    <span title={`${label}: ${up===null?'checking…':up?'online':'offline'}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: up ? `0 0 6px ${color}` : 'none' }} />
      {label}
    </span>
  );
}

function SpinIcon({ size = 10 }: { size?: number }) {
  return <span style={{ display: 'inline-block', width: size, height: size, border: '1.5px solid rgba(99,102,241,0.35)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'lab-spin 0.7s linear infinite' }} />;
}

const ghostBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 12px', color: '#94a3b8', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' };
