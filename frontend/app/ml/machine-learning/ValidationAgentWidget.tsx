"use client";

import React, { useState, useEffect, useRef } from "react";

type ChatMessage = { type: "user" | "ai"; text: string; timestamp: string };

interface Props {
  actualFile: File | null;
  userQuery: string;
  onStartValidation: () => Promise<void>;
  onStartEDA: () => Promise<void>;
  edaResults: any;
  validationResult: any;
  chatMessages: ChatMessage[];
  setChatMessages: (m: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
}

const STORAGE_KEY = "ownquesta_validation_chat_v1";

export default function ValidationAgentWidget({
  actualFile,
  userQuery,
  onStartValidation,
  onStartEDA,
  edaResults,
  validationResult,
  chatMessages,
  setChatMessages,
}: Props) {
  const [input, setInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(true);
  const initialized = useRef(false);
  const promptedRef = useRef<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastPayloadRef = useRef<{ fileName?: string | null; goal?: string | null }>({});

  // Load persisted chat once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && !initialized.current) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (parsed && parsed.length > 0) {
          // keep only last occurrence of identical messages
          const seen = new Set<string>();
          const uniqueReversed: ChatMessage[] = [];
          for (let i = parsed.length - 1; i >= 0; i--) {
            const m = parsed[i];
            const key = `${m.type}::${m.text}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueReversed.push(m);
            }
          }
          setChatMessages(uniqueReversed.reverse());
        }
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist chat
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatMessages || []));
    } catch (e) {}
  }, [chatMessages]);

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages((prev) => {
      const key = `${msg.type}::${msg.text}`;
      const exists = prev.some((m) => `${m.type}::${m.text}` === key);
      if (exists) {
        // move to end
        const filtered = prev.filter((m) => `${m.type}::${m.text}` !== key);
        return [...filtered, msg];
      }
      return [...prev, msg];
    });
  };

  const uniqueMessagesForRender = (messages: ChatMessage[]) => {
    const seen = new Set<string>();
    const outReversed: ChatMessage[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      const key = `${m.type}::${m.text}`;
      if (!seen.has(key)) {
        seen.add(key);
        outReversed.push(m);
      }
    }
    return outReversed.reverse();
  };

  // initial greeting
  useEffect(() => {
    if (!initialized.current) {
      const filename = actualFile ? actualFile.name : "no file uploaded";
      const goalText = userQuery || "Auto-detect task";
      addChatMessage({
        type: "ai",
        text: `Hello — I am your Validation Agent. I see your goal: "${goalText}" and dataset: "${filename}". Reply with 'yes' to start ML validation when you're ready.`,
        timestamp: new Date().toLocaleTimeString(),
      });
      initialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // prompt once when dataset+goal present
  useEffect(() => {
    const key = `${actualFile?.name || "nofile"}::${userQuery || "nogoal"}`;
    if (!actualFile || !userQuery) return;
    if (promptedRef.current[key]) return;
    promptedRef.current[key] = true;
    addChatMessage({
      type: "ai",
      text: `I detected a dataset "${actualFile.name}" and goal: "${userQuery}". Would you like me to start the ML validation process now? Reply 'yes' to begin.`,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [actualFile, userQuery]);

  // concise updates on dataset/goal changes
  useEffect(() => {
    try {
      const prev = lastPayloadRef.current;
      const fname = actualFile?.name || null;
      const goal = userQuery || null;
      let pushed = false;
      if (fname && prev.fileName !== fname) {
        addChatMessage({ type: "ai", text: `Dataset updated: ${fname}`, timestamp: new Date().toLocaleTimeString() });
        pushed = true;
      }
      if (goal && prev.goal !== goal) {
        addChatMessage({ type: "ai", text: `Goal updated: ${goal}`, timestamp: new Date().toLocaleTimeString() });
        pushed = true;
      }
      if (pushed) lastPayloadRef.current = { fileName: fname, goal };
    } catch (e) {}
  }, [actualFile?.name, userQuery]);

  const startFlow = async () => {
    if (!actualFile) {
      addChatMessage({ type: "ai", text: "Please upload a dataset first to begin validation.", timestamp: new Date().toLocaleTimeString() });
      return;
    }
    setIsBusy(true);

    addChatMessage({ type: "ai", text: `Starting ML validation for "${userQuery || "Auto-detect"}"... Preparing the validate page and running EDA then ML validation.`, timestamp: new Date().toLocaleTimeString() });

    try {
      // persist payload for validate page
      try {
        const payload: any = { ts: Date.now(), mlGoal: userQuery || "" };
        try {
          const text = await actualFile.text();
          payload.csv_text = text;
          payload.filename = actualFile.name;
        } catch (e) {}
        try { localStorage.setItem("ownquesta_start_payload", JSON.stringify(payload)); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent("ownquesta_start_validation", { detail: payload })); } catch (e) {}
      } catch (e) {}

      // navigate to validate page (same app)
      try { window.location.href = "/ml/machine-learning/validate"; } catch (e) {}

      // also attempt in-place handlers
      await onStartEDA();
      await onStartValidation();

      addChatMessage({ type: "ai", text: "✅ Validation finished — view results on the main page. Ask follow-up questions there.", timestamp: new Date().toLocaleTimeString() });
    } catch (e: any) {
      addChatMessage({ type: "ai", text: `Validation error: ${e?.message || String(e)}`, timestamp: new Date().toLocaleTimeString() });
    } finally {
      setIsBusy(false);
    }
  };

  const sendQuestion = async () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setChatMessages((prev) => [...prev, { type: "user", text: q, timestamp: new Date().toLocaleTimeString() }]);

    const normalized = q.toLowerCase().trim();

    if (["show code", "show eda code", "show ml code", "show implementation", "show code please"].some((k) => normalized.includes(k))) {
      try { localStorage.setItem("ownquesta_request_show", JSON.stringify({ what: "code", ts: Date.now() })); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent("ownquesta_request_show", { detail: { what: "code" } })); } catch (e) {}
      addChatMessage({ type: "ai", text: "OK — opening code panel on the main validation page. Navigate there to view.", timestamp: new Date().toLocaleTimeString() });
      return;
    }

    if (["show insights", "show analysis", "insights"].some((k) => normalized.includes(k))) {
      try { localStorage.setItem("ownquesta_request_show", JSON.stringify({ what: "insights", ts: Date.now() })); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent("ownquesta_request_show", { detail: { what: "insights" } })); } catch (e) {}
      addChatMessage({ type: "ai", text: "OK — opening insights on the main validation page. Navigate there to view.", timestamp: new Date().toLocaleTimeString() });
      return;
    }

    if (["yes", "y", "sure", "start", "run", "go"].includes(normalized)) {
      startFlow();
      return;
    }

    if (!edaResults) {
      addChatMessage({ type: "ai", text: 'Please run EDA first — reply "yes" to start the ML validation which includes EDA.', timestamp: new Date().toLocaleTimeString() });
      return;
    }

    setIsBusy(true);
    try {
      const res = await fetch("/api/validation/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, eda_results: edaResults }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const j = await res.json();
      addChatMessage({ type: "ai", text: j.answer || "No answer", timestamp: new Date().toLocaleTimeString() });
    } catch (err: any) {
      addChatMessage({ type: "ai", text: `Error: ${err?.message || String(err)}`, timestamp: new Date().toLocaleTimeString() });
    } finally {
      setIsBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <div ref={panelRef} className={`fixed right-6 bottom-8 z-[60] transition-transform ${collapsed ? "translate-x-64" : "translate-x-0"}`} style={{ width: 460 }}>
      <div className="flex flex-col bg-[#0f1724] border border-slate-700/40 rounded-xl shadow-lg overflow-hidden" style={{ height: "85vh", minHeight: 560 }}>
        <div className="flex items-center justify-between px-3 py-2 bg-[#071029] border-b border-slate-700/30">
          <div className="flex-1" />
          <div className="flex-1 flex flex-col items-center">
            <div className="text-sm font-semibold text-white">Validation Agent</div>
            <div className="text-xs text-slate-400">AI Data Scientist</div>
          </div>
          <div className="flex-1 flex justify-end">
            <button onClick={() => setVisible(false)} title="Close" className="p-1 rounded text-slate-300 hover:bg-slate-800/40">✕</button>
          </div>
        </div>

        <div className="p-3 h-full overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: "calc(85vh - 160px)" }}>
              {uniqueMessagesForRender(chatMessages || []).slice(-60).map((m, i) => (
                <div key={i} className={`flex ${m.type === "user" ? "justify-end" : "justify-start"}`}>
                  {m.type === "ai" && <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center mr-2 shrink-0">A</div>}
                  <div className={`${m.type === "user" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200"} max-w-[82%] rounded-lg p-2 text-sm`}>
                    <div className="text-xs text-slate-400 mb-1">{m.timestamp}</div>
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  </div>
                  {m.type === "user" && <div className="w-6" />}
                </div>
              ))}

              {isBusy && <div className="flex items-center gap-2 text-sm text-slate-400"> <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" /> Agent is thinking...</div>}
            </div>

            <div className="mt-auto space-y-0">
              <div className="flex gap-3 items-center">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendQuestion()} placeholder={"Ask a question..."} className="flex-1 px-4 py-3 rounded-xl bg-[#061122] text-white text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-shadow" />
                <button onClick={sendQuestion} disabled={!input.trim() || isBusy} className="ml-2 w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl flex items-center justify-center shadow-lg transform hover:-translate-y-0.5 transition-all" title="Send">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M22 2L11 13" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
