'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import Logo from '../components/Logo';
import Chatbot from '../components/Chatbot';

export default function TutorialPage() {
  const steps = [
    {
      number: 1,
      title: 'Open Ownquesta & Explore Features',
      icon: '🌟',
      color: 'from-violet-600/20 to-purple-800/20',
      accentColor: '#a78bfa',
      borderColor: 'border-violet-500/40',
      badge: 'Getting Started',
      fullDescription: `When you first open Ownquesta, you land on the Home Page — a stunning showcase of everything the platform can do for you.

Here you'll discover:

• Auto ML Workflows — build and deploy models without writing a single line of code
• Agent-Powered Analysis — AI agents handle EDA, validation, preprocessing, and modeling automatically
• 50+ Pre-built ML Models ready to train on your data
• End-to-End Pipeline from raw data upload to live deployment

Take a moment to explore the feature highlights. When you're ready, click "Sign In" to continue your journey.`,
    },
    {
      number: 2,
      title: 'Sign In or Create Your Account',
      icon: '🔐',
      color: 'from-blue-600/20 to-indigo-800/20',
      accentColor: '#60a5fa',
      borderColor: 'border-blue-500/40',
      badge: 'Authentication',
      fullDescription: `The Sign In page gives you two paths to get started quickly:

Google Sign-In: Click the Google button for instant access using your existing Google account — no passwords required.

New Account: If it's your first time, you'll be guided through a simple registration with your name, email, and a secure password. After signing up, verify your email and you're in.

Returning users simply enter credentials and go. The system remembers you and brings you straight back to your workspace.`,
    },
    {
      number: 3,
      title: 'Welcome Page',
      icon: '🏠',
      color: 'from-orange-500/20 to-amber-700/20',
      accentColor: '#fb923c',
      borderColor: 'border-orange-500/40',
      badge: 'Onboarding',
      fullDescription: `After signing in, you're greeted with a personalized Welcome Page — "Hey [Your Name], ready to build?"

This page celebrates what's possible with Ownquesta:

• 50+ Pre-built ML Models available instantly
• Auto Algorithms that select the best approach for your specific data
• 95% Time Saved versus traditional manual ML coding

A large "Go to Dashboard" button is your gateway to the workspace. You'll also notice the AI Chatbot in the bottom-right corner — it's always available to guide you through any step.`,
    },
    {
      number: 4,
      title: 'Navigate Your Dashboard',
      icon: '📊',
      color: 'from-purple-600/20 to-pink-800/20',
      accentColor: '#c084fc',
      borderColor: 'border-purple-500/40',
      badge: 'Command Center',
      fullDescription: `The Dashboard is your central command center. Everything you've done and everything you'll build lives here.

At the top, four stat cards track your progress in real time:

• ML Verify Dataset — validated datasets count
• Datasets Uploaded — all files you've submitted
• Avg Confidence % — accuracy across all trained models
• Total Rows Analyzed — total data volume processed

The ML Workflow Pipeline shows your 5-step journey visually: Upload Data → Feature Engineering → Model Building → Model Comparison → Deployment. Each phase unlocks as you advance.

Your projects table lists every project with name, dataset, task type, status, accuracy, and creation date. An Activity Timeline at the bottom logs everything — uploads, validations, training runs, and more.

Ready to build? You can use a demo dataset to explore the platform, or upload your own dataset to start a real project.`,
    },
    {
      number: 5,
      title: 'Create a Project & Choose Your Path',
      icon: '✨',
      color: 'from-pink-500/20 to-rose-700/20',
      accentColor: '#f472b6',
      borderColor: 'border-pink-500/40',
      badge: 'Project Setup',
      fullDescription: `Click "Start Validation" from the Dashboard to kick off a new project. A modal appears asking you to name your project — make it descriptive and meaningful.

Good project name examples:
• "Customer Churn Prediction Q4"
• "House Price Forecasting Model"
• "Fraud Detection System"

After naming your project, you choose your ML type:

🤖 Machine Learning — for structured/tabular data tasks like classification, regression, and clustering
🧠 Deep Learning — for complex patterns, image data, and advanced neural network tasks

Select Machine Learning to continue. Any previous projects appear below so you can resume where you left off.`,
    },
    {
      number: 6,
      title: 'Setup — Define Goal & Upload Dataset',
      icon: '📤',
      color: 'from-green-500/20 to-emerald-700/20',
      accentColor: '#4ade80',
      borderColor: 'border-green-500/40',
      badge: 'ML Setup Page',
      fullDescription: `The ML Setup page is your starting point for the AutoML pipeline. It has two key actions:

1. Define Your ML Goal
Type your objective in plain language — no technical terms needed. Examples:
• "Predict which customers are likely to churn in the next 3 months"
• "Forecast property sale prices based on location and features"
• "Detect fraudulent transactions in real time"

Be specific. Mention key variables if you know them.

2. Upload Your Dataset
Drag and drop your CSV or Excel file onto the upload zone, or click to browse your files. A preview of your data will appear so you can confirm it looks correct before proceeding.

Supported: .csv, .xlsx, .xls
Recommended size: Under 10 MB for fast results (up to 100 MB supported)

Once both are complete, click "Next" to hand things over to the AI validation agent.`,
    },
    {
      number: 7,
      title: 'Validate — AI Agent Runs EDA & Validation',
      icon: '🔍',
      color: 'from-cyan-500/20 to-teal-700/20',
      accentColor: '#22d3ee',
      borderColor: 'border-cyan-500/40',
      badge: 'Validation Agent',
      fullDescription: `This is where the intelligence kicks in. The Validation Agent takes over and performs a deep analysis of your dataset automatically.

What the agent does:
• Exploratory Data Analysis (EDA) — scans distributions, correlations, and patterns
• Missing Value Detection — identifies incomplete fields and their severity
• Data Type Validation — checks if columns are correctly typed
• Class Balance Check — flags imbalanced target variables
• ML Readiness Assessment — scores your data from 0–100%

You watch the agent work in real time. Progress indicators show each validation step completing. When it's done, you see a clean summary of your data health.

Status indicators:
🟢 Green — Data is ready, good to go
🟡 Yellow — Some issues, proceed with caution
🔴 Red — Significant problems, consider cleaning first

You can still proceed even with warnings — the system will do its best with what you have.`,
    },
    {
      number: 8,
      title: 'Config — Validation Report & Preprocessing',
      icon: '⚙️',
      color: 'from-indigo-500/20 to-blue-800/20',
      accentColor: '#818cf8',
      borderColor: 'border-indigo-500/40',
      badge: 'Configuration Page',
      fullDescription: `The Config page presents your Validation Report Summary — a complete breakdown of what the agent discovered about your data.

Report highlights include:
• Total Rows & Columns
• Data Quality Score
• Missing values per column
• Numerical statistics (mean, median, min, max)
• Feature correlations and distributions

After reviewing the report, you begin the Model Configuration Pipeline:

Step 1 — Preprocessing
The system suggests the right preprocessing steps for your data: handling missing values, outlier removal, normalization/standardization, and class balancing.

Step 2 — Encoding & Feature Selection
You see which encoding strategy is recommended (one-hot, label, target encoding) and which features are selected as most informative. You can review and adjust as needed.

Once preprocessing and feature configuration are set, click "Start Modeling" to let the agents do the heavy lifting.`,
    },
    {
      number: 9,
      title: 'Modeling — Train, Evaluate & Compare',
      icon: '🤖',
      color: 'from-violet-500/20 to-purple-800/20',
      accentColor: '#a78bfa',
      borderColor: 'border-violet-500/40',
      badge: 'Modeling Agent',
      fullDescription: `The Modeling Agent now creates, trains, and evaluates multiple ML models simultaneously — you don't have to pick just one.

Models trained in parallel (classification example):
• Logistic Regression
• Random Forest
• XGBoost / Gradient Boosting
• Support Vector Machine (SVM)
• Neural Network

For each model, the agent:
• Splits data: 80% training / 10% validation / 10% testing
• Trains with optimal hyperparameters
• Evaluates using Accuracy, Precision, Recall, F1-Score, and AUC-ROC
• Generates a confusion matrix and feature importance chart

Progress bars show real-time training status for each model. You can leave the page and return — everything continues in the background.

Once all models complete, the agent presents a side-by-side Comparison View. It highlights the top performer with a 🏆 badge and explains its recommendation. You can review all models and select whichever best fits your business priorities.`,
    },
    {
      number: 10,
      title: 'Testing — Test Your Best Model',
      icon: '🧪',
      color: 'from-yellow-500/20 to-orange-700/20',
      accentColor: '#facc15',
      borderColor: 'border-yellow-500/40',
      badge: 'Model Testing',
      fullDescription: `Before deployment, the Testing Page lets you validate your best model on real data with the help of the AI agent.

Two testing options:

Manual Input Testing
Fill in values for each feature your model expects (e.g., Customer Age, Account Balance, Monthly Usage). Click "Predict" and instantly receive:
• Prediction result (e.g., "Will Churn" or "Won't Churn")
• Confidence Score (e.g., "87.3% confidence")
• Feature contribution breakdown — which inputs drove the prediction

Batch Testing
Upload a test CSV with multiple rows. The agent processes all records at once and returns predictions for every row. Download the results file with predictions and confidence scores included.

The agent also explains how the model works on your data in plain language, helping you understand not just what it predicts, but why — building your confidence before going live.`,
    },
    {
      number: 11,
      title: 'Explain & Deploy — Understand, Then Go Live',
      icon: '🚀',
      color: 'from-red-500/20 to-pink-800/20',
      accentColor: '#f87171',
      borderColor: 'border-red-500/40',
      badge: 'Explain & Deploy',
      fullDescription: `The final page combines explainability with deployment — because you should understand your model before you ship it.

Explain Section (Powered by Generative AI)
The system generates a clear, human-readable explanation of why your model was selected as the best:
• Which features matter most and why
• How the model performs across different data segments
• SHAP value visualizations showing individual prediction reasoning
• Business implications of the model's behavior

This makes your AI decisions transparent, auditable, and trustworthy.

Deploy Section
When you're ready to go live, click "Deploy Model". In 30–90 seconds, your model becomes a live REST API:

• 🌐 API Endpoint URL — the address developers call for predictions
• 🔑 API Key — your secure authentication token (keep it private!)
• 💻 Code Samples — ready-to-use Python, JavaScript, and cURL snippets
• 📈 Live Dashboard — shows status (🟢 LIVE), prediction count, avg response time (~142ms), and 99.9% uptime

Download Option: Don't need an API? Download your trained model as a file to use in your own environment.

Your model is now live, making real predictions 24/7. Congratulations — you've built and shipped a production AI model! 🎉`,
    },
  ];

  const [currentStep, setCurrentStep] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const step = Number(entry.target.getAttribute('data-step'));
            if (step) setCurrentStep(step);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-10% 0px -10% 0px' }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToStep = (stepNumber: number) => {
    const section = document.querySelector(`section[data-step="${stepNumber}"]`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative text-[#e6eef8] overflow-x-hidden font-chillax bg-[#060812]">
      {/* Static deep space background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#060812] via-[#0d0a1f] to-[#060812]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 px-4 sm:px-6 md:px-10 py-3 sm:py-4 flex justify-between items-center z-[100] transition-all duration-500 ${isScrolled ? 'bg-[rgba(6,8,18,0.85)] backdrop-blur-2xl border-b border-white/5' : 'bg-transparent'}`}>
        <Logo href="/" size="md" />
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-2 text-xs text-white/40 font-medium">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            Step {currentStep} of {steps.length}
          </span>
          <Link
            href="/"
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:-translate-y-0.5 border border-white/10 bg-white/5 backdrop-blur-sm text-[#c5d4ed] hover:text-white hover:border-white/20"
          >
            Home
          </Link>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[200]">
        <div
          className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-all duration-500"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>

      <div className="relative z-10">
        {/* Sidebar Navigation */}
        <div className="hidden lg:block fixed left-0 top-0 h-screen w-[260px] bg-[rgba(6,8,18,0.7)] backdrop-blur-xl border-r border-white/[0.06] overflow-y-auto z-40">
          <div className="p-5 pt-20">
            <div className="mb-5">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Tutorial</p>
              <h3 className="text-sm font-semibold text-white/60">Ownquesta Workflow</h3>
            </div>
            <div className="space-y-1">
              {steps.map((step) => {
                const isActive = currentStep === step.number;
                const isPast = currentStep > step.number;
                return (
                  <button
                    key={step.number}
                    onClick={() => scrollToStep(step.number)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 group ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 transition-all ${
                      isActive ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30' 
                      : isPast ? 'bg-white/10' 
                      : 'bg-white/[0.04] border border-white/10'
                    }`}>
                      {isPast && !isActive ? '✓' : step.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-white/30 font-medium">Step {step.number}</div>
                      <div className="text-xs font-medium truncate">{step.title}</div>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-1 h-4 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[rgba(6,8,18,0.95)] backdrop-blur-xl border-t border-white/[0.06] z-40">
          <div className="flex overflow-x-auto gap-1.5 p-2.5 scroll-smooth hide-scrollbar">
            {steps.map((step) => {
              const isActive = currentStep === step.number;
              const isPast = currentStep > step.number;
              return (
                <button
                  key={step.number}
                  onClick={() => scrollToStep(step.number)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[60px] ${
                    isActive ? 'bg-white/10' : isPast ? 'bg-white/[0.04]' : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
                    isActive ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500' 
                    : isPast ? 'bg-white/10 text-white/60' 
                    : 'bg-white/[0.04] text-white/40'
                  }`}>
                    {isPast && !isActive ? '✓' : step.icon}
                  </div>
                  <span className={`text-[9px] font-medium ${isActive ? 'text-white' : 'text-white/30'}`}>{step.number}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Steps */}
        <div className="lg:ml-[260px] pb-24 lg:pb-0">
          {steps.map((step, index) => (
            <section
              key={step.number}
              data-step={step.number}
              ref={(el) => { sectionRefs.current[index] = el; }}
              className="min-h-screen w-full flex items-center border-b border-white/[0.04] relative overflow-hidden"
            >
              {/* Section background accent */}
              <div className={`absolute inset-0 bg-gradient-to-br ${step.color} pointer-events-none`} />
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 -translate-y-1/2"
                  style={{ background: step.accentColor }}
                />
              </div>

              <div className="relative w-full max-w-3xl px-8 sm:px-12 md:px-16 lg:px-12 py-20 lg:py-24">
                {/* Badge */}
                <div className="mb-6">
                  <span className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border ${step.borderColor} bg-white/5`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: step.accentColor }} />
                    {step.badge}
                  </span>
                </div>

                {/* Step number line */}
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="text-6xl md:text-7xl"
                    style={{ filter: `drop-shadow(0 0 20px ${step.accentColor}60)` }}
                  >
                    {step.icon}
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                  <span className="text-4xl font-black text-white/5 tabular-nums tracking-tight">
                    {String(step.number).padStart(2, '0')}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8 leading-tight tracking-tight">
                  {step.title}
                </h2>

                {/* Content */}
                <div className="space-y-0">
                  {step.fullDescription.split('\n\n').map((para, i) => {
                    if (para.trim().startsWith('•')) {
                      const lines = para.trim().split('\n').filter(l => l.trim());
                      return (
                        <div key={i} className="my-5 space-y-2">
                          {lines.map((line, j) => {
                            if (line.trim().startsWith('•')) {
                              return (
                                <div key={j} className="flex items-start gap-3">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: step.accentColor }} />
                                  <span className="text-base md:text-lg text-white/70 leading-relaxed">{line.replace('•', '').trim()}</span>
                                </div>
                              );
                            }
                            return (
                              <p key={j} className="text-base md:text-lg text-white/80 font-semibold leading-relaxed">{line.trim()}</p>
                            );
                          })}
                        </div>
                      );
                    }
                    return (
                      <p key={i} className="text-base md:text-lg text-white/70 leading-relaxed my-4">{para.trim()}</p>
                    );
                  })}
                </div>

                {/* Navigation hint */}
                <div className="mt-12 pt-8 border-t border-white/[0.06] flex items-center justify-between">
                  {step.number > 1 ? (
                    <button
                      onClick={() => scrollToStep(step.number - 1)}
                      className="text-sm text-white/30 hover:text-white/60 transition-colors flex items-center gap-2"
                    >
                      ← Previous step
                    </button>
                  ) : <div />}
                  {step.number < steps.length ? (
                    <button
                      onClick={() => scrollToStep(step.number + 1)}
                      className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-white/70 hover:text-white"
                    >
                      Next: {steps[index + 1]?.title}
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  ) : (
                    <Link
                      href="/home"
                      className="group flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
                      style={{ background: `linear-gradient(135deg, ${step.accentColor}40, ${step.accentColor}20)`, border: `1px solid ${step.accentColor}40` }}
                    >
                      Start Building
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  )}
                </div>
              </div>
            </section>
          ))}

          {/* Final CTA */}
          <section className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-fuchsia-600/10 to-pink-600/10 pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
            </div>
            <div className="relative text-center px-8 max-w-2xl mx-auto">
              <div className="text-8xl mb-8 animate-bounce">🎉</div>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                You Know<br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  Ownquesta!
                </span>
              </h2>
              <p className="text-lg text-white/60 mb-10 leading-relaxed">
                From signing in to deploying a live AI model — you've walked through the complete AutoML workflow. Now it's time to build something real.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/home"
                  className="px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all hover:scale-105 shadow-xl shadow-violet-500/20"
                >
                  🚀 Start Building Your Model
                </Link>
                <button
                  onClick={() => scrollToStep(1)}
                  className="px-8 py-4 rounded-2xl font-semibold text-white/60 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all"
                >
                  ↑ Review Tutorial
                </button>
              </div>
            </div>
          </section>
        </div>

        <Chatbot userId="exampleUserId" />
      </div>
    </div>
  );
}