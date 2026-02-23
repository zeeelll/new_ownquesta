'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import Chatbot from '../components/Chatbot';

export default function TutorialPage() {
  const steps = [
    {
      number: 1,
      title: 'Create Your Account',
      icon: '👤',
      color: 'from-blue-500/30 to-blue-600/30',
      borderColor: 'border-blue-500/40',
      fullDescription: `
        Welcome to Ownquesta! Your first step is creating your account in just a few minutes.

        You'll see a beautiful login page with marketing content on the left and a signup form on the right. Simply click the "Sign Up" tab and fill in your details:

        • First Name & Last Name (e.g., "John Doe")
        • Your email address (make sure it's one you can access)
        • A strong password (minimum 6 characters)
        • Agree to Terms & Conditions

        Hit the purple "Sign Up" button and we'll validate everything. You'll receive an email with a verification link—just click it to activate your account. Then you can log in with your email and password, and you'll automatically land on your personalized Home Page. Your AI journey is officially starting! 🚀
      `,
    },
    {
      number: 2,
      title: 'Welcome to Home Page',
      icon: '🏠',
      color: 'from-orange-500/30 to-orange-600/30',
      borderColor: 'border-orange-500/40',
      fullDescription: `
        You've made it! Your Home Page welcomes you with a personalized greeting: "Hey [Your Name], ready to build?"

        It's a beautifully designed space with a cinematic background video and three inspiring stat cards:

        • 50+ Pre-built ML Models ready to train
        • Auto Algorithms that pick the best approach for your data
        • 95% Time Saved compared to coding ML manually

        Below these stats is a large purple "Go to Dashboard" button—this is your gateway to the actual ML workspace. You'll also notice a friendly AI assistant (Chatbot) in the bottom-right corner that's available anytime you need help.

        Take a moment to appreciate the interface, then click "Go to Dashboard" to enter your command center! 💪
      `,
    },
    {
      number: 3,
      title: 'Navigate to Dashboard',
      icon: '📊',
      color: 'from-purple-500/30 to-purple-600/30',
      borderColor: 'border-purple-500/40',
      fullDescription: `
        Welcome to your command center! The Dashboard is where all the magic happens. This is your workspace for managing every ML project you'll ever create.

        At the top, you'll see four colorful stat cards showing your progress:

        • ML Verify Dataset: How many datasets you've validated
        • Datasets Uploaded: Total number of files you've uploaded
        • Avg Confidence %: Average accuracy of all your trained models
        • Total Rows Analyzed: How much data you've processed overall

        Below these is the ML Workflow Pipeline—a visual 5-step journey showing your path: Upload Data → Feature Engineering → Model Building → Model Comparison → Deployment. Each step unlocks as you progress.

        Your projects are displayed in a detailed table showing each project's name, dataset, task type, status, accuracy, and when it was created. At the bottom is your Activity Timeline, tracking everything you've done—uploads, validations, trainings, errors, and more.

        The Dashboard is your home base. Everything you need is here! Explore it, then let's start your first project. 🎯
      `,
    },
    {
      number: 4,
      title: 'Create Your First Project',
      icon: '✨',
      color: 'from-pink-500/30 to-pink-600/30',
      borderColor: 'border-pink-500/40',
      fullDescription: `
        Time to create your first ML project! From the Dashboard, click "Start Validation" or select "Machine Learning" in the sidebar. A beautiful modal appears asking you to name your project.

        Give it a descriptive name that reflects what you're trying to predict. Good examples:
        • "Customer Churn Prediction"
        • "House Price Forecasting"
        • "Fraud Detection System"

        You'll see any recent projects listed below—you can continue an old one or create completely new. Enter your project name and click "Next" to proceed to the data upload step! 🚀
      `,
    },
    {
      number: 5,
      title: 'Upload Your Dataset',
      icon: '📤',
      color: 'from-green-500/30 to-green-600/30',
      borderColor: 'border-green-500/40',
      fullDescription: `
        Your data is the foundation of everything. You'll see a large upload area with "Drag files here or click to browse". Two options: drag your CSV/Excel file directly onto the zone, or click to open your file browser.

        Supported formats: CSV (.csv) or Excel (.xlsx, .xls) files.

        File size tips:
        • Under 10 MB: Fast (recommended for start)
        • 10-100 MB: Typical size
        • Over 100 MB: Will take longer to process

        Once you select your file, a progress bar shows the upload percentage. You'll see the filename, size, and estimated time. After reaching 100%, the system displays a preview of your first few rows so you can verify everything looks correct before proceeding! ✨
      `,
    },
    {
      number: 6,
      title: 'Define Your ML Goal',
      icon: '🎯',
      color: 'from-cyan-500/30 to-cyan-600/30',
      borderColor: 'border-cyan-500/40',
      fullDescription: `
        Now tell the system what you want to accomplish. You'll see a text input asking "What is your ML Goal?" Describe it naturally—no technical jargon needed.

        Examples of good goals:
        • "Predict which customers are likely to cancel in the next 3 months"
        • "Forecast house prices based on size, location, and age"
        • "Identify fraudulent credit card transactions"
        • "Group customers into segments based on their behavior"

        Be specific, mention key variables if possible, and keep it concise (2-3 sentences). Then click "Validate with AI" and let the system analyze your data and goal to recommend the best algorithms for your problem. The AI will assess your data quality and spot any potential issues! 🤖
      `,
    },
    {
      number: 7,
      title: 'Review Data Analysis & Statistics',
      icon: '📈',
      color: 'from-indigo-500/30 to-indigo-600/30',
      borderColor: 'border-indigo-500/40',
      fullDescription: `
        The system now shows comprehensive statistics about your data. At the top you'll see key metrics:

        • Total Rows: How many records you have
        • Total Columns: How many features
        • File Size: Storage used
        • Data Quality %: Overall score (aim for 75%+)

        Below you'll find missing values analysis showing which columns have incomplete data, numerical stats (mean, median, min/max values), and categorical distributions. The system highlights correlations between features.

        A status indicator shows if your data is ready (🟢 Green), needs caution (🟡 Yellow), or has problems (🔴 Red). Review this information to understand your data, then proceed to model training! 📊
      `,
    },
    {
      number: 8,
      title: 'Review AI Recommendations',
      icon: '✅',
      color: 'from-teal-500/30 to-teal-600/30',
      borderColor: 'border-teal-500/40',
      fullDescription: `
        Based on your data and goal, the system recommends specific algorithms perfect for your problem. For classification tasks, you might see: Logistic Regression, Random Forest, XGBoost, SVM, or Neural Networks. For regression, you'd see: Linear Regression, Ridge Regression, Gradient Boosting.

        Each algorithm shows an expected accuracy range (e.g., "75-85% accuracy") and training time estimate (e.g., "5-10 minutes"). The system assesses your data quality with green indicators (✓ sufficient data, good features, low missing values), yellow warnings (⚠️ class imbalance, potential issues), or red alerts (❌ severe problems).

        A readiness status gives your final thumbs up or caution. If green, you're good to go. If red, you might want to clean your data first. But you can also proceed at your own risk! 💚
      `,
    },
    {
      number: 9,
      title: 'Train Your Model',
      icon: '🤖',
      color: 'from-violet-500/30 to-violet-600/30',
      borderColor: 'border-violet-500/40',
      fullDescription: `
        Click "Continue to Training" and watch the magic happen! The system trains multiple ML models simultaneously—Random Forest, XGBoost, Logistic Regression, all running in parallel.

        You'll see progress bars for each algorithm showing percentage completion, time elapsed, and estimated time remaining. Unlike traditional ML, you don't train one model at a time—everything trains together to save you hours.

        Typical training times:
        • Small datasets (<1 MB): 1-5 minutes
        • Medium (1-10 MB): 5-15 minutes
        • Large (10-100 MB): 15-45 minutes

        The system splits your data: 80% for training, 10% for validation, 10% for testing. You can watch live progress, leave the page, or check back later. Once all models complete training, you'll get a success message! 🎉
      `,
    },
    {
      number: 10,
      title: 'View & Compare Results',
      icon: '🏆',
      color: 'from-yellow-500/30 to-yellow-600/30',
      borderColor: 'border-yellow-500/40',
      fullDescription: `
        All your trained models appear in a comparison view, sorted by performance. Each model shows:

        • Accuracy: Overall correctness (aim for 80%+)
        • Precision & Recall: Trade-offs in predictions
        • F1-Score: Balanced performance metric
        • AUC-ROC: How well it distinguishes between classes

        You'll see a confusion matrix showing correct/incorrect predictions, feature importance rankings showing which features matter most, and cross-validation scores showing model stability.

        The system recommends the best performer with a special badge. But you can select any model based on your priorities. If false positives are costly, choose high precision. If missing positives matters, choose high recall. Compare side-by-side and pick your champion! 🥇
      `,
    },
    {
      number: 11,
      title: 'Deploy Your Model',
      icon: '🚀',
      color: 'from-red-500/30 to-red-600/30',
      borderColor: 'border-red-500/40',
      fullDescription: `
        Selected your winner? Time to go live! Click "Deploy Model" and your model becomes production-ready in 30 seconds to 2 minutes.

        You'll see status updates (Preparing → Uploading → Configuring → Live) with progress percentages and estimated time remaining.

        Once deployment completes, you receive:

        • REST API Endpoint: A URL developers use to get predictions
        • API Key: A secret token for secure access (keep it safe!)
        • Code Samples: Python, JavaScript, and cURL examples showing how to integrate
        • Deployment Dashboard: Shows model status (🟢 LIVE), prediction count, average response time (142ms), and 99.9% uptime

        Your model is now live! Real predictions on real business data. Congratulations! 🎊
      `,
    },
    {
      number: 12,
      title: 'Make Predictions',
      icon: '💡',
      color: 'from-lime-500/30 to-lime-600/30',
      borderColor: 'border-lime-500/40',
      fullDescription: `
        Your model is LIVE—now make real predictions! Two options:

        Web Interface (Non-Technical): Go to your model's dashboard and find "Make Predictions". You'll see input fields for each variable your model expects (Customer Age, Account Age, Monthly Spending, etc.). Fill them in and click "Make Prediction". Instantly get results like "Will Churn" with "87.3% confidence". A history log tracks all predictions you've made.

        REST API (Developer Integration): Send a JSON request to your API endpoint with your data. The model responds with predictions and confidence scores. You can even batch process 100+ records simultaneously, sending them all at once and getting predictions back instantly.

        Real-world usage: Banks detect fraud on every transaction. Companies predict daily which customers might cancel and reach out proactively. Real estate sites instantly estimate property values. Your model works 24/7 making business-critical decisions.

        From account creation to live predictions—you've mastered the complete ML workflow. Your AI model is now delivering real value to your business! 🌟
      `,
    },
  ];

  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[data-step]');
      let activeStep = 1;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2) {
          activeStep = parseInt(section.getAttribute('data-step') || '1');
        }
      });

      setCurrentStep(activeStep);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToStep = (stepNumber) => {
    const section = document.querySelector(`section[data-step="${stepNumber}"]`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative text-[#e6eef8] overflow-x-hidden font-chillax bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10">
        {/* Sidebar Navigation */}
        <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:bg-slate-950/60 lg:backdrop-blur-md lg:border-r lg:border-white/10 lg:overflow-y-auto lg:z-40 lg:block">
          <div className="p-6">
            <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-4">Tutorial Steps</h3>
            <div className="space-y-2">
              {steps.map((step) => (
                <button
                  key={step.number}
                  onClick={() => scrollToStep(step.number)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 border ${
                    currentStep === step.number
                      ? 'bg-purple-500/30 border-purple-500/60 text-white font-semibold'
                      : 'border-white/10 text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{step.icon}</span>
                    <div>
                      <div className="text-xs text-white/50">Step {step.number}</div>
                      <div className="text-sm truncate">{step.title}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Toggle - Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-white/10 z-40">
          <div className="flex overflow-x-auto gap-2 p-3 scroll-smooth">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => scrollToStep(step.number)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all duration-300 border text-center ${
                  currentStep === step.number
                    ? 'bg-purple-500/30 border-purple-500/60 text-white font-semibold'
                    : 'border-white/10 text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="text-lg">{step.icon}</div>
                <div className="text-xs whitespace-nowrap">Step {step.number}</div>
              </button>
            ))}
          </div>
        </div>
        {/* Steps - Each Full Page */}
        <div className="space-y-0 lg:ml-64 pb-20 lg:pb-0">
          {steps.map((step) => (
            <section
              key={step.number}
              data-step={step.number}
              className={`min-h-screen w-full py-16 md:py-20 flex items-start justify-start border-b border-white/5 bg-gradient-to-br ${step.color}`}
            >
              <div className="w-full lg:w-1/2 px-8 sm:px-12 md:px-16 lg:px-8">
                {/* Step Header */}
                <div className="flex items-start gap-6 mb-10 md:mb-12">
                  <div className={`text-6xl md:text-7xl drop-shadow-lg`}>
                    {step.icon}
                  </div>
                  <div>
                    <div className={`inline-block mb-4`}>
                      <span className={`text-xs font-bold text-white/70 uppercase tracking-widest px-4 py-2 bg-white/10 rounded-full border ${step.borderColor}`}>
                        Step {step.number} of 12
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-5xl font-bold text-white mb-3">
                      {step.title}
                    </h2>
                  </div>
                </div>

                {/* Detailed Content */}
                <div className="prose prose-invert max-w-none">
                  <div className="text-base md:text-lg text-white/80 leading-relaxed space-y-4 whitespace-pre-wrap font-[350]">
                    {step.fullDescription}
                  </div>
                </div>

                {/* Step Counter */}
                <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
                  <span className="text-sm text-white/50 font-bold">Scroll down to continue →</span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {step.number}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Final CTA */}
        <section className="min-h-screen w-full lg:ml-64 py-16 md:py-20 flex items-start justify-start bg-gradient-to-br from-purple-600/20 to-pink-600/20">
          <div className="w-full lg:w-1/2 px-8 sm:px-12 md:px-16 lg:px-8">
            <div className="text-7xl md:text-8xl mb-8 animate-bounce">🎉</div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              You've Mastered Ownquesta!
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-12">
              From account creation to making real predictions, you now understand the complete machine learning workflow. You're ready to build, train, and deploy powerful AI models.
            </p>
            <Link
              href="/home"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Start Building Your First Model →
            </Link>
          </div>
        </section>
        <Chatbot />
      </div>
    </div>
  );
}
