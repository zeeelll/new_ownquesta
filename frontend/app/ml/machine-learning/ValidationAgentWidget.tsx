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

      // Also dispatch full EDA results if available
      if (edaResults) {
        try {
          window.dispatchEvent(new CustomEvent("ownquesta_validation_complete", { 
            detail: { eda_result: edaResults, ml_result: validationResult } 
          }));
        } catch (e) {}
      }
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages]);

  // Dispatch validation results to parent when they change
  useEffect(() => {
    if (edaResults || validationResult) {
      try {
        window.dispatchEvent(new CustomEvent("ownquesta_validation_complete", { 
          detail: { eda_result: edaResults, ml_result: validationResult } 
        }));
        console.log('Dispatched validation results to main page:', { edaResults, validationResult });
      } catch (e) {
        console.error('Failed to dispatch validation results:', e);
      }
    }
  }, [edaResults, validationResult]);

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
      const filename = actualFile ? actualFile.name : "waiting for your dataset";
      const goalText = userQuery || "I'll help you detect the best approach";
      
      // Enhanced intelligent greeting with personality
      const greetingMessage = `👋 **Hello! I'm your Validation Agent!**

I'm here to be your personal ML data scientist. Think of me as your friendly AI assistant who loves analyzing data and helping you build amazing machine learning models! 🎉

📊 **Current Dataset:** ${filename}
🎯 **Your Goal:** ${goalText}

✨ **What makes me special?**
• I support **CSV and Excel files** (no size limits!)
• I can automatically detect the best ML approach for your data
• I perform comprehensive Exploratory Data Analysis (EDA)
• I validate your dataset and catch potential issues
• I generate ready-to-use Python code for you
• I answer any questions about your data

📁 **Supported Formats:**
• CSV files (.csv) - any size
• Excel files (.xlsx, .xls) - any size

🚀 **Ready to get started?**
Just say **'yes'** or **'start'** and I'll begin analyzing your dataset. Or feel free to ask me anything! I'm here to help make ML easy and fun for you! 😊`;
      
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
        return { type: 'Classification', icon: '🎯', confidence: 'High', emoji: '🎯' };
      }
      
      // Regression detection
      if ((lower.includes('predict') || lower.includes('forecast') || lower.includes('estimate')) && 
          (lower.includes('price') || lower.includes('sales') || lower.includes('value') || 
           lower.includes('score') || lower.includes('amount') || lower.includes('number'))) {
        return { type: 'Regression', icon: '📈', confidence: 'High', emoji: '📊' };
      }
      
      // Clustering detection
      if (lower.includes('cluster') || lower.includes('segment') || 
          lower.includes('group') || lower.includes('similar')) {
        return { type: 'Clustering', icon: '🔍', confidence: 'High', emoji: '🎨' };
      }
      
      // Time series detection
      if (lower.includes('time series') || lower.includes('forecast') || 
          lower.includes('trend') || lower.includes('temporal')) {
        return { type: 'Time Series Analysis', icon: '⏱️', confidence: 'Medium', emoji: '📉' };
      }
      
      return { type: 'Auto-detect', icon: '🤖', confidence: 'Will analyze', emoji: '🔬' };
    };

    const taskInfo = detectTaskType(userQuery);
    
    // Create enhanced detailed messages
    try {
      const ts = new Date().toLocaleTimeString();
      const concise: ChatMessage[] = [
        { 
          type: "ai", 
          text: `🎉 **Excellent! Everything is ready!**\n\nI can see you've uploaded your dataset and set your goal. This is going to be exciting! Let me give you a quick overview...`, 
          timestamp: ts 
        },
        { 
          type: "ai", 
          text: `📊 **Your Dataset:** ${actualFile.name}\n📦 **Size:** ${(actualFile.size / 1024).toFixed(2)} KB\n\n🎯 **Your Goal:** "${userQuery}"\n\n${taskInfo.emoji} **Detected Task Type:** ${taskInfo.type}\n💪 **My Confidence:** ${taskInfo.confidence}\n\nThis looks like a ${taskInfo.type.toLowerCase()} problem - perfect! I have lots of experience with these! 😊`, 
          timestamp: ts 
        },
        { 
          type: "ai", 
          text: `✨ **Here's what I'll do for you:**\n\n1️⃣ **Deep Dive EDA** - I'll analyze every aspect of your data\n2️⃣ **Quality Check** - I'll validate everything is ML-ready\n3️⃣ **Smart Recommendations** - I'll suggest the best models\n4️⃣ **Code Generation** - I'll create Python code you can use\n5️⃣ **Insights & Tips** - I'll share optimization ideas\n\n🚀 **Excited? Me too!** Just say **'yes'** or **'start'** and let's begin this ML journey together! 🎊`, 
          timestamp: ts 
        },
      ];

      setChatMessages(concise);
      lastPayloadRef.current = { fileName: actualFile.name, goal: userQuery };
    } catch (e) {
      addChatMessage({
        type: "ai",
        text: `✅ **Perfect!** Your dataset "${actualFile.name}" and goal are set. I'm ready to start the ML validation magic! 🪄\n\nType **'yes'** to begin!`,
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
        text: "⚠️ **No Dataset Found**\n\nPlease upload a dataset file (CSV or Excel format) to begin the validation process.", 
        timestamp: new Date().toLocaleTimeString() 
      });
      return;
    }
    setIsBusy(true);

    addChatMessage({ 
      type: "ai", 
      text: `🚀 **Starting ML Validation...**\n\nConnecting to Validation Agent and analyzing your dataset...\n\n📁 **File:** ${actualFile.name}\n📊 **Size:** ${(actualFile.size / 1024 / 1024).toFixed(2)} MB`, 
      timestamp: new Date().toLocaleTimeString() 
    });

    try {
      // Read dataset content - support both CSV and Excel
      let dataPayload: string | ArrayBuffer;
      let isExcel = false;
      
      const fileExtension = actualFile.name.toLowerCase();
      if (fileExtension.endsWith('.xlsx') || fileExtension.endsWith('.xls')) {
        // For Excel files, read as binary and convert to base64
        isExcel = true;
        const arrayBuffer = await actualFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        bytes.forEach((byte) => binary += String.fromCharCode(byte));
        dataPayload = btoa(binary);
      } else {
        // For CSV files, read as text
        dataPayload = await actualFile.text();
      }
      
      // Persist payload for validate page
      try {
        const payload: any = { 
          ts: Date.now(), 
          mlGoal: userQuery || "", 
          csv_text: typeof dataPayload === 'string' ? dataPayload : '', 
          filename: actualFile.name,
          isExcel: isExcel
        };
        try { localStorage.setItem("ownquesta_start_payload", JSON.stringify(payload)); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent("ownquesta_start_validation", { detail: payload })); } catch (e) {}
      } catch (e) {}

      // Call validation agent from ownquesta_agents
      const requestBody: any = {
        goal: { text: userQuery || "auto-detect", type: "ml_validation" }
      };

      if (isExcel) {
        // For Excel, send binary data as base64
        requestBody.file_data = dataPayload;
        requestBody.file_type = 'excel';
        requestBody.filename = actualFile.name;
      } else {
        // For CSV, send as text
        requestBody.csv_text = dataPayload;
      }

      const response = await fetch("http://localhost:8000/validation/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Validation service returned status ${response.status}. Make sure the agent is running on port 8000.`);
      }

      const result = await response.json();
      
      // Display real detailed EDA results
      if (result.eda_result || result.result) {
        const eda = result.eda_result || result.result;
        
        // 1. Dataset Structure & Overview
        const shape = eda.shape || {};
        const info = eda.info || {};
        let structureMsg = `📊 **Dataset Structure**\n\n`;
        structureMsg += `• **Filename:** ${actualFile.name}\n`;
        structureMsg += `• **File Type:** ${isExcel ? 'Excel (.xlsx/.xls)' : 'CSV'}\n`;
        structureMsg += `• **Dimensions:** ${shape.rows || 'N/A'} rows × ${shape.columns || 'N/A'} columns\n`;
        if (shape.memory_usage) {
          structureMsg += `• **Memory Usage:** ${shape.memory_usage}\n`;
        }
        addChatMessage({ type: "ai", text: structureMsg, timestamp: new Date().toLocaleTimeString() });

        // 2. Column Types & Features
        if (info.column_types || info.numerical_cols || info.categorical_cols) {
          let featuresMsg = `🔍 **Feature Analysis**\n\n`;
          
          if (info.numerical_cols && info.numerical_cols.length > 0) {
            featuresMsg += `📈 **Numerical Features (${info.numerical_cols.length}):**\n`;
            featuresMsg += info.numerical_cols.slice(0, 10).join(', ');
            if (info.numerical_cols.length > 10) featuresMsg += `, ... (${info.numerical_cols.length - 10} more)`;
            featuresMsg += '\n\n';
          }
          
          if (info.categorical_cols && info.categorical_cols.length > 0) {
            featuresMsg += `🏷️ **Categorical Features (${info.categorical_cols.length}):**\n`;
            featuresMsg += info.categorical_cols.slice(0, 10).join(', ');
            if (info.categorical_cols.length > 10) featuresMsg += `, ... (${info.categorical_cols.length - 10} more)`;
            featuresMsg += '\n';
          }
          
          addChatMessage({ type: "ai", text: featuresMsg, timestamp: new Date().toLocaleTimeString() });
        }

        // 3. Data Quality Metrics
        if (eda.summary || info.missing_values || info.duplicates !== undefined) {
          let qualityMsg = `✅ **Data Quality Assessment**\n\n`;
          
          if (info.missing_values !== undefined) {
            const totalMissing = typeof info.missing_values === 'number' ? info.missing_values : 
                               (typeof info.missing_values === 'object' ? Object.values(info.missing_values).reduce((a: any, b: any) => a + b, 0) : 0);
            qualityMsg += `• **Missing Values:** ${totalMissing}\n`;
          }
          
          if (info.duplicates !== undefined) {
            qualityMsg += `• **Duplicate Rows:** ${info.duplicates}\n`;
          }
          
          if (eda.summary) {
            qualityMsg += `• **Data Completeness:** ${eda.summary.completeness || 'Good'}\n`;
          }
          
          addChatMessage({ type: "ai", text: qualityMsg, timestamp: new Date().toLocaleTimeString() });
        }

        // 4. Statistical Summary
        if (eda.numericalSummary && Object.keys(eda.numericalSummary).length > 0) {
          const keys = Object.keys(eda.numericalSummary).slice(0, 3);
          let statsMsg = `📊 **Statistical Summary (Sample)**\n\n`;
          
          keys.forEach(col => {
            const stats = eda.numericalSummary[col];
            statsMsg += `**${col}:**\n`;
            statsMsg += `  Mean: ${stats.mean?.toFixed(2) || 'N/A'}, `;
            statsMsg += `Std: ${stats.std?.toFixed(2) || 'N/A'}\n`;
            statsMsg += `  Range: [${stats.min?.toFixed(2) || 'N/A'}, ${stats.max?.toFixed(2) || 'N/A'}]\n\n`;
          });
          
          if (Object.keys(eda.numericalSummary).length > 3) {
            statsMsg += `... and ${Object.keys(eda.numericalSummary).length - 3} more features\n`;
          }
          
          addChatMessage({ type: "ai", text: statsMsg, timestamp: new Date().toLocaleTimeString() });
        }

        // 5. Correlations
        if (eda.correlationPairs && eda.correlationPairs.length > 0) {
          let corrMsg = `🔗 **Top Correlations**\n\n`;
          
          eda.correlationPairs.slice(0, 5).forEach((pair: any, idx: number) => {
            corrMsg += `${idx + 1}. **${pair.feature1}** ↔ **${pair.feature2}**: ${pair.correlation?.toFixed(3)}\n`;
          });
          
          if (eda.correlationPairs.length > 5) {
            corrMsg += `\n... and ${eda.correlationPairs.length - 5} more correlations`;
          }
          
          addChatMessage({ type: "ai", text: corrMsg, timestamp: new Date().toLocaleTimeString() });
        }

        // 6. ML Validation Results
        if (result.ml_result) {
          const ml = result.ml_result;
          
          // Problem Type Detection
          if (ml.problemType || ml.task_type) {
            let mlTypeMsg = `🎯 **ML Task Detection**\n\n`;
            mlTypeMsg += `• **Detected Type:** ${ml.problemType || ml.task_type}\n`;
            if (ml.confidence) {
              mlTypeMsg += `• **Confidence:** ${ml.confidence}\n`;
            }
            if (ml.reasoning) {
              mlTypeMsg += `\n${ml.reasoning}\n`;
            }
            addChatMessage({ type: "ai", text: mlTypeMsg, timestamp: new Date().toLocaleTimeString() });
          }

          // Model Recommendations
          if (ml.modelRecommendations && ml.modelRecommendations.length > 0) {
            let modelsMsg = `🤖 **Model Recommendations**\n\n`;
            
            ml.modelRecommendations.slice(0, 5).forEach((m: any, idx: number) => {
              modelsMsg += `**${idx + 1}. ${m.algorithm || m.type || m.name}**\n`;
              if (m.use_case || m.description) {
                modelsMsg += `   ${m.use_case || m.description}\n`;
              }
              if (m.complexity) {
                modelsMsg += `   Complexity: ${m.complexity}\n`;
              }
              modelsMsg += '\n';
            });
            
            addChatMessage({ type: "ai", text: modelsMsg, timestamp: new Date().toLocaleTimeString() });
          }

          // Performance Estimates
          if (ml.performanceEstimates) {
            let perfMsg = `📈 **Expected Performance**\n\n`;
            const pe = ml.performanceEstimates;
            
            if (pe.expected_accuracy) perfMsg += `• **Accuracy:** ${pe.expected_accuracy}\n`;
            if (pe.confidence) perfMsg += `• **Confidence:** ${pe.confidence}\n`;
            if (pe.training_time) perfMsg += `• **Est. Training Time:** ${pe.training_time}\n`;
            if (pe.notes) perfMsg += `\n${pe.notes}\n`;
            
            addChatMessage({ type: "ai", text: perfMsg, timestamp: new Date().toLocaleTimeString() });
          }

          // Recommendations & Next Steps
          if (ml.recommendations && ml.recommendations.length > 0) {
            let recsMsg = `💡 **Recommendations**\n\n`;
            
            ml.recommendations.slice(0, 5).forEach((rec: string, idx: number) => {
              recsMsg += `${idx + 1}. ${rec}\n`;
            });
            
            addChatMessage({ type: "ai", text: recsMsg, timestamp: new Date().toLocaleTimeString() });
          }
        }

        // 7. AI-Generated Insights
        if (result.agent_answer && result.agent_answer !== result.aiInsights) {
          addChatMessage({ 
            type: "ai", 
            text: `🧠 **AI Insights**\n\n${result.agent_answer}`, 
            timestamp: new Date().toLocaleTimeString() 
          });
        }
      }

      // Run original handlers for UI compatibility
      await onStartEDA();
      await onStartValidation();

      addChatMessage({ 
        type: "ai", 
        text: `✅ **Analysis Complete!**\n\n🎉 All EDA and ML validation results are displayed above. Your dataset is ready for machine learning!\n\n**What's next?**\n• Ask me specific questions about your data\n• Type "show code" for Python implementation\n• Type "insights" for more detailed analysis`, 
        timestamp: new Date().toLocaleTimeString() 
      });
    } catch (e: any) {
      addChatMessage({ 
        type: "ai", 
        text: `❌ **Connection Issue**\n\n${e?.message || String(e)}\n\n💡 **Tip:** Make sure the validation agent is running:\n\`\`\`\ncd ownquesta_agents\nuv run uvicorn main:app --reload\n\`\`\``, 
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
        text: "🤖 **Hey! I'm Your Friendly ML Assistant!**\n\nI'm here to make machine learning easy and fun for you! Here's what I can help with:\n\n🎯 **Start Validation** → Just say 'yes' or 'start'\nI'll analyze your dataset with comprehensive EDA and ML validation!\n\n💻 **View Code** → Ask 'show code' or 'python code'\nI'll show you clean, ready-to-use Python implementation!\n\n📊 **See Insights** → Say 'insights' or 'show analysis'\nGet detailed EDA results and recommendations!\n\n❓ **Ask Questions** → Just ask naturally!\n• \"What features are most important?\"\n• \"Are there any missing values?\"\n• \"What model should I use?\"\n• \"How's my data quality?\"\n\n📈 **Get Guidance** → I'll recommend:\n• Best ML models for your goal\n• Feature engineering tips\n• Data preprocessing steps\n• Model optimization strategies\n\n💡 **Tip:** I'm conversational! Just talk to me like a friend. I'm here to help! 😊", 
        timestamp: new Date().toLocaleTimeString() 
      });
      return;
    }

    // Data quality queries
    if (["missing", "null", "data quality", "clean", "preprocessing"].some((k) => normalized.includes(k))) {
      if (!edaResults) {
        addChatMessage({ 
          type: "ai", 
          text: "📊 **Great Question!**\n\nI'd love to tell you about data quality, but first I need to analyze your dataset! 🔍\n\nJust say **'yes'** and I'll perform a comprehensive analysis including:\n• Missing value detection\n• Data type validation\n• Quality metrics\n• Preprocessing recommendations\n\nLet's do this together! 🚀", 
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
          text: "🔍 **I'm Ready to Analyze!**\n\nTo answer your question about features, I need to first explore your dataset in detail.\n\nSay **'yes'** or **'start'** and I'll analyze:\n• Feature types and distributions\n• Correlations and relationships\n• Feature importance\n• Engineering opportunities\n\nReady when you are! 😊", 
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
          text: "🎯 **Perfect Question!**\n\nI'd love to recommend the best models for you! But first, let me understand your data better.\n\nJust say **'yes'** and I'll:\n• Analyze your dataset characteristics\n• Identify the problem type\n• Recommend optimal ML models\n• Explain why they're the best fit\n\nLet me help you make the best choice! 💪", 
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
        text: "📈 **I'm Excited to Help!**\n\nBefore I can answer that, I need to analyze your dataset first. Don't worry, it's super quick! ⚡\n\n**What I'll do:**\n• Comprehensive Exploratory Data Analysis\n• Feature analysis & insights\n• ML model recommendations\n• Generate Python code\n\n**Ready to start?** Just say **'yes'** and I'll begin! You can ask me any questions after the analysis is complete. 😊", 
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
      if (!res.ok) throw new Error(`I couldn't reach the analysis service (status ${res.status}). Let me try again...`);
      const j = await res.json();
      
      // Format and display intelligent response with friendly tone
      const answer = j.answer || "I'm analyzing that for you... Give me just a moment! 🔍";
      
      // Add friendly wrapper to response
      let formattedAnswer = answer;
      if (answer.length > 200) {
        formattedAnswer = `${answer.substring(0, 200)}...\n\n💡 **Want more details?** Check the main page for the complete analysis! I've put everything there for you.`;
      }
      
      // Add encouraging closing
      if (!formattedAnswer.includes('?') && !formattedAnswer.endsWith('!')) {
        formattedAnswer += '\n\n💬 Have more questions? I\'m here to help!';
      }
      
      addChatMessage({ 
        type: "ai", 
        text: formattedAnswer, 
        timestamp: new Date().toLocaleTimeString() 
      });
    } catch (err: any) {
      addChatMessage({ 
        type: "ai", 
        text: `⚠️ **Oops! Connection Hiccup**\n\n${err?.message || "I couldn't reach the analysis service right now."}\n\n💡 **Don't worry!** This usually means:\n• The service might be starting up\n• Check your internet connection\n• The validation agent might need to be restarted\n\nTry asking again in a moment, or say **'help'** if you need assistance! 😊`, 
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
