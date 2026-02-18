"use client";

import React, { useState, useEffect, useRef } from "react";

type ChatMessage = { 
  type: "user" | "ai"; 
  text: string; 
  timestamp: string;
  isTyping?: boolean;
};

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
  const [edaPanelMessages, setEdaPanelMessages] = useState<string[]>([]);
  const initialized = useRef(false);
  const promptedRef = useRef<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const autoScrollEnabled = useRef(true);
  const lastPayloadRef = useRef<{ fileName?: string | null; goal?: string | null }>({});

  // Load persisted chat once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // If user already uploaded a dataset and provided a goal, do not
      // restore prior chat history — show only concise dataset/goal messages.
      if (actualFile && userQuery) {
        initialized.current = true;
        return;
      }
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

  const isEdaMessage = (m: ChatMessage) => {
    if (!m || !m.text) return false;
    const txt = m.text;
    const lower = txt.toLowerCase();
    if (txt.includes('```')) return true;
    if (txt.trim().startsWith('{') && txt.length > 120) return true;
    if (txt.trim().startsWith('[') && txt.length > 120) return true;
    if (lower.includes('columntypes') || lower.includes('datainfo') || lower.includes('memoryfootprint')) return true;
    if (lower.includes('eda') && txt.length > 40) return true;
    if (lower.includes('insight') && txt.length > 40) return true;
    return false;
  };

  // Extract EDA / insights messages from chat and forward them to the main page
  useEffect(() => {
    try {
      if (!chatMessages || chatMessages.length === 0) return;
      const edaMsgs = chatMessages.filter(isEdaMessage);
      if (edaMsgs.length === 0) return;
      const edaTexts = edaMsgs.map((m) => m.text);
      // keep local preview state
      setEdaPanelMessages((prev) => {
        const merged = [...prev, ...edaTexts];
        // dedupe
        return Array.from(new Set(merged));
      });

      // remove EDA messages from chat so they don't appear in the widget
      const nonEda = chatMessages.filter((m) => !isEdaMessage(m));
      // only update if different
      if (nonEda.length !== chatMessages.length) {
        setChatMessages(nonEda);
      }

      // dispatch to main page so it can render full EDA/insights panel there
      try {
        window.dispatchEvent(new CustomEvent("ownquesta_eda_messages", { detail: edaTexts }));
      } catch (e) {}
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages]);

  // Auto-scroll to bottom when messages change or agent finishes thinking
  useEffect(() => {
    try {
      // only auto-scroll when user has not manually scrolled up
      if (!autoScrollEnabled.current) return;
      if (messagesRef.current) {
        // instant scroll to bottom
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      } else if (endRef.current) {
        endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    } catch (e) {}
  }, [chatMessages, isBusy, visible, collapsed]);

  // attach onScroll handler to detect manual user scrolling (stay up)
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const threshold = 80; // px from bottom considered "at bottom"
    const handler = () => {
      try {
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
        autoScrollEnabled.current = atBottom;
      } catch (e) {}
    };
    el.addEventListener("scroll", handler, { passive: true });
    // initialize
    handler();
    return () => el.removeEventListener("scroll", handler);
  }, [messagesRef.current]);

  // Initial greeting with enhanced intelligence and personality
  useEffect(() => {
    if (!initialized.current) {
      const filename = actualFile ? actualFile.name : "no dataset uploaded yet";
      const goalText = userQuery || "Auto-detect task type";
      
      // Enhanced intelligent greeting with personality
      const greetingMessage = `👋 Hello! I'm your ML Validation Agent

I specialize in analyzing datasets, detecting optimal ML approaches, and guiding you through the validation process.

📊 **Current Dataset:** ${filename}
🎯 **Your Goal:** ${goalText}

**What I can do:**
• Auto-detect ML task types (Classification, Regression, Clustering)
• Perform comprehensive EDA & data validation
• Generate Python code for your ML pipeline
• Answer questions about your data

**Ready to begin?** Type 'yes' to start comprehensive validation, or ask me anything about your dataset!`;
      
      addChatMessage({
        type: "ai",
        text: greetingMessage,
        timestamp: new Date().toLocaleTimeString(),
      });
      initialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enhanced intelligent prompt when dataset + goal are present
  useEffect(() => {
    const key = `${actualFile?.name || "nofile"}::${userQuery || "nogoal"}`;
    if (!actualFile || !userQuery) return;
    if (promptedRef.current[key]) return;
    promptedRef.current[key] = true;

    // Advanced task type detection with confidence scoring
    const detectTaskType = (goal: string) => {
      const lower = goal.toLowerCase();
      
      // Classification detection
      if (lower.includes('classif') || lower.includes('categor') || 
          lower.includes('detect') || lower.includes('identify')) {
        return { type: 'Classification', icon: '🎯', confidence: 'High' };
      }
      
      // Regression detection
      if ((lower.includes('predict') || lower.includes('forecast') || lower.includes('estimate')) && 
          (lower.includes('price') || lower.includes('sales') || lower.includes('value') || 
           lower.includes('score') || lower.includes('amount') || lower.includes('number'))) {
        return { type: 'Regression', icon: '📈', confidence: 'High' };
      }
      
      // Clustering detection
      if (lower.includes('cluster') || lower.includes('segment') || 
          lower.includes('group') || lower.includes('similar')) {
        return { type: 'Clustering', icon: '🔍', confidence: 'High' };
      }
      
      // Time series detection
      if (lower.includes('time series') || lower.includes('forecast') || 
          lower.includes('trend') || lower.includes('temporal')) {
        return { type: 'Time Series Analysis', icon: '⏱️', confidence: 'Medium' };
      }
      
      return { type: 'Auto-detect', icon: '🤖', confidence: 'Will analyze' };
    };

    const taskInfo = detectTaskType(userQuery);
    
    // Create enhanced detailed messages
    try {
      const ts = new Date().toLocaleTimeString();
      const concise: ChatMessage[] = [
        { 
          type: "ai", 
          text: `✅ **Analysis Ready!**\n\n📊 **Dataset:** ${actualFile.name}\n📝 **Size:** ${(actualFile.size / 1024).toFixed(2)} KB\n🎯 **Your Goal:** ${userQuery}\n\n${taskInfo.icon} **Detected Task:** ${taskInfo.type}\n🎓 **Confidence:** ${taskInfo.confidence}`, 
          timestamp: ts 
        },
        { 
          type: "ai", 
          text: `🚀 **Next Steps:**\n\n1️⃣ I'll perform comprehensive EDA\n2️⃣ Validate dataset compatibility\n3️⃣ Generate Python ML code\n4️⃣ Provide optimization suggestions\n\n💡 **Say 'yes' to begin the magic!**`, 
          timestamp: ts 
        },
      ];

      setChatMessages(concise);
      lastPayloadRef.current = { fileName: actualFile.name, goal: userQuery };
    } catch (e) {
      addChatMessage({
        type: "ai",
        text: `✅ **Ready!** Dataset "${actualFile.name}" loaded. Goal set. Type 'yes' to start ML validation journey!`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
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
      addChatMessage({ 
        type: "ai", 
        text: "⚠️ **No Dataset Found**\n\nPlease upload a dataset file (CSV format) to begin the validation process.", 
        timestamp: new Date().toLocaleTimeString() 
      });
      return;
    }
    setIsBusy(true);

    addChatMessage({ 
      type: "ai", 
      text: `🚀 **Starting ML Validation Pipeline...**\n\n⏳ Analyzing dataset structure\n⏳ Performing EDA\n⏳ Validating compatibility\n\n📊 Results will appear on the main page!`, 
      timestamp: new Date().toLocaleTimeString() 
    });

    try {
      // Persist payload for validate page
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

      // Run analysis handlers with progress updates
      await onStartEDA();
      await onStartValidation();

      addChatMessage({ 
        type: "ai", 
        text: `✅ **Analysis Complete!**\n\n📊 Comprehensive EDA finished\n🔍 Validation results ready\n💻 Python code generated\n\n**What's next?**\n• View detailed results on main page\n• Ask me specific questions about your data\n• Request code modifications\n• Get optimization suggestions`, 
        timestamp: new Date().toLocaleTimeString() 
      });
    } catch (e: any) {
      addChatMessage({ 
        type: "ai", 
        text: `❌ **Error Encountered**\n\n${e?.message || String(e)}\n\nPlease check your dataset format and try again, or ask me for help!`, 
        timestamp: new Date().toLocaleTimeString() 
      });
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

    // Enhanced intelligent routing for various user intents
    
    // Code-related queries
    if (["show code", "code", "show eda code", "show ml code", "implementation", "python code", "documentation", "generate code", "view code"].some((k) => normalized.includes(k))) {
      try { localStorage.setItem("ownquesta_request_show", JSON.stringify({ what: "code", ts: Date.now() })); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent("ownquesta_request_show", { detail: { what: "code" } })); } catch (e) {}
      addChatMessage({ 
        type: "ai", 
        text: "💻 **Opening Python Code View**\n\nI'm displaying the complete implementation on the main page. You'll find:\n• Data preprocessing code\n• Model training pipeline\n• Evaluation metrics\n• Easy-to-understand documentation", 
        timestamp: new Date().toLocaleTimeString() 
      });
      return;
    }

    // Insights and analysis queries
    if (["show insights", "show analysis", "insights", "results", "findings", "show results", "analysis", "summary", "report"].some((k) => normalized.includes(k))) {
      try { localStorage.setItem("ownquesta_request_show", JSON.stringify({ what: "insights", ts: Date.now() })); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent("ownquesta_request_show", { detail: { what: "insights" } })); } catch (e) {}
      addChatMessage({ 
        type: "ai", 
        text: "📊 **Opening Insights Panel**\n\nDisplaying comprehensive analysis including:\n• Data quality metrics\n• Feature correlations\n• Distribution analysis\n• Actionable recommendations", 
        timestamp: new Date().toLocaleTimeString() 
      });
      return;
    }

    // Start/confirmation queries
    if (["yes", "y", "sure", "start", "run", "go", "begin", "proceed", "ok", "okay", "let's go", "do it"].includes(normalized)) {
      startFlow();
      return;
    }

    // Help and guidance
    if (["help", "what can you do", "commands", "guide", "capabilities", "features", "?", "how"].some((k) => normalized.includes(k))) {
      addChatMessage({ 
        type: "ai", 
        text: "🤖 **I'm Your ML Validation Assistant!**\n\n**I can help you with:**\n\n🎯 **Validation**: Say 'yes' to start comprehensive ML validation\n\n💻 **Code**: Ask 'show code' for Python implementation\n\n📊 **Analysis**: Request 'insights' for detailed EDA results\n\n❓ **Questions**: Ask about your data, features, or ML approach\n\n📈 **Guidance**: Get recommendations for model selection and optimization\n\n**Try asking:**\n• \"What features are most important?\"\n• \"Are there missing values?\"\n• \"What model should I use?\"\n• \"Show me the correlations\"", 
        timestamp: new Date().toLocaleTimeString() 
      });
      return;
    }

    // Data quality queries
    if (["missing", "null", "data quality", "clean", "preprocessing"].some((k) => normalized.includes(k))) {
      if (!edaResults) {
        addChatMessage({ 
          type: "ai", 
          text: "📊 **Run EDA First**\n\nI need to analyze your dataset before I can answer quality questions. Say 'yes' to start!", 
          timestamp: new Date().toLocaleTimeString() 
        });
        return;
      }
      // Will be handled by API below
    }

    // Feature-related queries
    if (["feature", "column", "variable", "correlation", "importance"].some((k) => normalized.includes(k))) {
      if (!edaResults) {
        addChatMessage({ 
          type: "ai", 
          text: "🔍 **Analysis Required**\n\nI need to perform EDA to analyze features. Reply 'yes' to begin!", 
          timestamp: new Date().toLocaleTimeString() 
        });
        return;
      }
      // Will be handled by API below
    }

    // Model selection queries
    if (["model", "algorithm", "which", "best", "recommend", "suggest"].some((k) => normalized.includes(k))) {
      if (!edaResults) {
        addChatMessage({ 
          type: "ai", 
          text: "🎯 **Let Me Analyze First**\n\nI need to understand your data before recommending models. Say 'yes' to start validation!", 
          timestamp: new Date().toLocaleTimeString() 
        });
        return;
      }
      // Will be handled by API below
    }

    // Generic EDA requirement check
    if (!edaResults) {
      addChatMessage({ 
        type: "ai", 
        text: "📈 **Ready to Analyze!**\n\nI'm ready to perform comprehensive ML validation on your dataset. This includes:\n\n• Exploratory Data Analysis (EDA)\n• Feature engineering insights\n• Model recommendations\n• Code generation\n\n**Reply 'yes' to begin!**", 
        timestamp: new Date().toLocaleTimeString() 
      });
      return;
    }

    // Intelligent Q&A using API
    setIsBusy(true);
    try {
      const res = await fetch("/api/validation/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, eda_results: edaResults }),
      });
      if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
      const j = await res.json();
      
      // Format and display intelligent response
      const answer = j.answer || "I'm analyzing that for you...";
      const formattedAnswer = answer.length > 200 
        ? `${answer.substring(0, 200)}...\n\n💡 *View complete analysis on the main page for full details*` 
        : answer;
      
      addChatMessage({ 
        type: "ai", 
        text: formattedAnswer, 
        timestamp: new Date().toLocaleTimeString() 
      });
    } catch (err: any) {
      addChatMessage({ 
        type: "ai", 
        text: `⚠️ **Connection Issue**\n\n${err?.message || "Unable to reach the validation service"}\n\nPlease check your connection and try again.`, 
        timestamp: new Date().toLocaleTimeString() 
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      {visible && (
        <div 
          ref={panelRef} 
          className={`fixed right-6 bottom-8 z-[60] transition-all duration-500 ease-out ${collapsed ? "translate-x-64 opacity-0" : "translate-x-0 opacity-100"}`} 
          style={{ width: 480 }}
        >
          <div 
            className="flex flex-col bg-gradient-to-br from-[#0a1120] via-[#0f1724] to-[#0a1120] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl" 
            style={{ height: "92vh", minHeight: 650, maxHeight: 850 }}
          >
            {/* Enhanced Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-cyan-600/20 border-b border-slate-700/40 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {/* Premium AI Avatar with Glow */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl blur-lg opacity-60 animate-pulse"></div>
                  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 relative z-10" aria-hidden>
                    <defs>
                      <linearGradient id="headerGradientPremium" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0" stopColor="#8b5cf6" />
                        <stop offset="0.5" stopColor="#7c3aed" />
                        <stop offset="1" stopColor="#06b6d4" />
                      </linearGradient>
                      <filter id="headerGlowPremium" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <rect width="48" height="48" rx="12" fill="url(#headerGradientPremium)" />
                    <g filter="url(#headerGlowPremium)" opacity="0.95">
                      <circle cx="19" cy="20" r="2.5" fill="#fff" />
                      <circle cx="29" cy="20" r="2.5" fill="#fff" />
                      <path d="M18 26c1-1.5 3-2 6-2s5 .5 6 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </g>
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <div className="text-base font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                    Validation Agent
                  </div>
                  <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    AI Data Scientist
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setVisible(false)} 
                  title="Minimize Validation Agent" 
                  aria-label="Minimize Validation Agent" 
                  className="p-2 rounded-lg text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all duration-200 hover:scale-105"
                > 
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="p-4 h-full overflow-hidden">
              <div className="flex flex-col h-full">
                {/* Messages Container with Enhanced Scrolling */}
                <div 
                  ref={messagesRef} 
                  className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent" 
                  style={{ maxHeight: "calc(92vh - 180px)" }}
                >
                  {uniqueMessagesForRender(chatMessages || []).slice(-60).map((m, i) => (
                    <div 
                      key={i} 
                      className={`flex items-end gap-3 animate-fadeIn ${m.type === "user" ? "justify-end" : "justify-start"}`}
                      style={{ animation: "fadeIn 0.3s ease-out" }}
                    >
                      {/* AI Avatar */}
                      {m.type === "ai" && (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 text-white flex items-center justify-center flex-shrink-0 ring-2 ring-indigo-500/30 shadow-lg overflow-hidden">
                          <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" aria-hidden>
                            <circle cx="14" cy="14" r="1.5" fill="#fff" />
                            <circle cx="22" cy="14" r="1.5" fill="#fff" />
                            <path d="M13 19c1-1 3-1.5 5-1.5s4 .5 5 1.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Message Bubble */}
                      <div 
                        className={`${
                          m.type === "user" 
                            ? "bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30" 
                            : "bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 text-slate-100 backdrop-blur-sm border border-slate-600/30"
                        } max-w-[84%] rounded-2xl p-3.5 text-sm leading-relaxed relative transition-all duration-200 hover:shadow-xl`}
                      > 
                        <div className="text-[10px] text-slate-400 mb-1.5 font-medium">{m.timestamp}</div>
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                      </div>
                      
                      {/* User Avatar */}
                      {m.type === "user" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-indigo-500/30 shadow-lg">
                          You
                        </div>
                      )}
                    </div>
                  ))}

                  <div ref={endRef} />

                  {/* Enhanced Thinking Indicator */}
                  {isBusy && (
                    <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-800/40 rounded-xl p-3 backdrop-blur-sm animate-fadeIn">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="font-medium">Agent is thinking...</span>
                    </div>
                  )}
                </div>

                {/* Enhanced Input Area */}
                <div className="mt-auto pt-3 space-y-0">
                  <div className="flex gap-2 items-center">
                    <input 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendQuestion()} 
                      placeholder="Ask me anything about your data..." 
                      className="flex-1 px-4 py-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 backdrop-blur-sm" 
                      disabled={isBusy}
                    />
                    <button 
                      onClick={sendQuestion} 
                      disabled={!input.trim() || isBusy} 
                      className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:via-indigo-600 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform hover:scale-105 active:scale-95 transition-all duration-200" 
                      title="Send Message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Floating Button When Collapsed */}
      {!visible && (
        <div className="fixed right-6 bottom-8 z-[70]">
          <div className="relative">
            {/* Pulsing Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl blur-xl opacity-50 animate-pulse"></div>
            
            <button 
              onClick={() => setVisible(true)} 
              title="Open Validation Agent" 
              aria-label="Open Validation Agent" 
              className="relative w-14 h-14 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 text-white rounded-xl flex items-center justify-center shadow-2xl ring-2 ring-indigo-500/30 transform hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" aria-hidden>
                <circle cx="14" cy="14" r="1.8" fill="#fff" />
                <circle cx="22" cy="14" r="1.8" fill="#fff" />
                <path d="M13 20c1-1.2 3-1.8 5-1.8s4 .6 5 1.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
              
              {/* Notification Dot */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
            </button>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }
      `}</style>
    </>
  );
}
