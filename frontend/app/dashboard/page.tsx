"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import Lenis from 'lenis';

interface Project {
  id: string;
  name: string;
  dataset: string;
  taskType: string;
  status: "validated" | "in-progress" | "failed" | "clarify-needed";
  confidence: number;
  createdDate: string;
}

interface Activity {
  id: string;
  action: string;
  timestamp: string;
  type: "upload" | "validation" | "clarification" | "error" | "completion";
}

interface MLStats {
  validations: number;
  datasets: number;
  avgConfidence: number;
  totalRows: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ name?: string; email?: string; avatar?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState<MLStats>({
    validations: 0,
    datasets: 0,
    avgConfidence: 0,
    totalRows: 0,
  });
  const [projects] = useState<Project[]>([]);
  const [activities] = useState<Activity[]>([]);
  const router = useRouter();

  const loadDashboardData = () => {
    // Load from localStorage or API
    const mlData = localStorage.getItem("mlValidationStats");
    if (mlData) {
      const parsedStats = JSON.parse(mlData);
      setStats(parsedStats);
    }
  };

  useEffect(() => {
    async function loadMe() {
      try {
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
          setUser(prev => ({ ...prev, avatar: savedAvatar }));
        }
        const data = await api("/api/auth/me");
        setUser(data.user);
        localStorage.setItem('userAvatar', data.user.avatar || '');
        loadDashboardData();
      } catch {
        router.push("/login");
      }
    }
    loadMe();
  }, [router]);

  // Initialize Lenis for smooth scrolling
  useEffect(() => {
    const lenis = new Lenis();

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Mouse tracking for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    try {
      setUserDropdownOpen(false);
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } finally {
      window.location.href = '/';
    }
  };

  const selectModelType = (type: string) => {
    setSidebarOpen(false);
    setTimeout(() => {
      if (type === "machine-learning") {
        router.push("/ml/machine-learning");
      } else if (type === "deep-learning") {
        router.push("/dl");
      }
    }, 300);
  };

  const getStatusBadge = (status: Project["status"]) => {
    const badges = {
      validated: {
        icon: "✓",
        className: "bg-gradient-to-r from-green-500 to-green-600",
        label: "Validated",
      },
      "in-progress": {
        icon: "⟳",
        className: "bg-gradient-to-r from-blue-500 to-blue-600",
        label: "In Progress",
      },
      failed: {
        icon: "✕",
        className: "bg-gradient-to-r from-red-500 to-red-600",
        label: "Failed",
      },
      "clarify-needed": {
        icon: "?",
        className: "bg-gradient-to-r from-amber-500 to-amber-600",
        label: "Clarify Needed",
      },
    };
    return badges[status];
  };

  const getActivityIcon = (type: Activity["type"]) => {
    const icons = {
      upload: "↑",
      validation: "✓",
      clarification: "?",
      error: "✕",
      completion: "★",
    };
    return icons[type] || "•";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 font-sans text-sm relative overflow-hidden">
      {/* Background Animation */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Enhanced Gradient Layers */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(110, 84, 200, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(124, 73, 169, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(94, 114, 235, 0.25) 0%, transparent 60%),
            radial-gradient(circle at 30% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 40%)
          `
        }} />

        {/* Dynamic Mouse-Responsive Glow Orbs */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[80px] transition-all duration-1000 ease-out animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(110,84,200,0.25) 0%, rgba(110,84,200,0.1) 50%, transparent 100%)',
            top: `${Math.max(15, Math.min(70, (mousePos.y / (typeof window !== 'undefined' ? window.innerHeight : 1000)) * 100))}%`,
            left: `${Math.max(15, Math.min(70, (mousePos.x / (typeof window !== 'undefined' ? window.innerWidth : 1000)) * 100))}%`,
            transform: `translate(-50%, -50%) scale(${1 + (mousePos.x / (typeof window !== 'undefined' ? window.innerWidth : 1000)) * 0.3})`,
            animationDelay: '0s'
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[80px] transition-all duration-1500 ease-out animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(124,73,169,0.22) 0%, rgba(124,73,169,0.08) 50%, transparent 100%)',
            bottom: `${Math.max(15, Math.min(70, (((typeof window !== 'undefined' ? window.innerHeight : 1000) - mousePos.y) / (typeof window !== 'undefined' ? window.innerHeight : 1000)) * 100))}%`,
            right: `${Math.max(15, Math.min(70, (((typeof window !== 'undefined' ? window.innerWidth : 1000) - mousePos.x) / (typeof window !== 'undefined' ? window.innerWidth : 1000)) * 100))}%`,
            transform: `scale(${1 + (mousePos.y / (typeof window !== 'undefined' ? window.innerHeight : 1000)) * 0.25})`,
            animationDelay: '1s'
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full blur-[60px] transition-all duration-2000 ease-out animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.06) 50%, transparent 100%)',
            top: `${Math.max(20, Math.min(80, ((mousePos.x + mousePos.y) / ((typeof window !== 'undefined' ? window.innerWidth : 1000) + (typeof window !== 'undefined' ? window.innerHeight : 1000))) * 100))}%`,
            left: `${Math.max(20, Math.min(80, ((mousePos.x - mousePos.y) / (typeof window !== 'undefined' ? window.innerWidth : 1000)) * 50 + 50))}%`,
            animationDelay: '2s'
          }}
        />

        {/* Enhanced Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Floating Particles */}
        <div className="absolute top-[25%] left-[30%] w-2 h-2 bg-indigo-400 rounded-full animate-ping opacity-70" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[65%] right-[35%] w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[35%] left-[50%] w-2 h-2 bg-pink-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[15%] w-1 h-1 bg-violet-400 rounded-full animate-ping opacity-80" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-[50%] right-[45%] w-1.5 h-1.5 bg-indigo-300 rounded-full animate-ping opacity-40" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[70%] left-[25%] w-1 h-1 bg-purple-300 rounded-full animate-ping opacity-60" style={{ animationDelay: '2.5s' }} />
      </div>



      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-8 bg-slate-900/80 backdrop-blur-xl border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <a href="/home" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6e54c8] to-[#7c49a9] rounded-xl flex items-center justify-center font-bold text-white relative overflow-hidden shadow-[0_4px_12px_rgba(110,84,200,0.4)]">
              <div className="absolute inset-0 w-[150%] h-[150%] bg-gradient-to-br from-transparent via-[rgba(255,255,255,0.3)] to-transparent logo-shine" />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
                <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="white" opacity="0.7"/>
                <path d="M12 12L2 7V12L12 17L22 12V7L12 12Z" fill="white" opacity="0.5"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-white">Ownquesta</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/home')}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-slate-700/50 border border-slate-600/20 backdrop-blur-md hover:bg-slate-700/80 transition-all"
          >
            Back
          </button>
          
          {/* User Dropdown */}
          <div id="user-dropdown" className="relative">
            <div 
              className="cursor-pointer transition-all hover:opacity-80"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              <img 
                src={user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'User')} 
                alt="User" 
                className="w-10 h-10 rounded-full border-2 border-indigo-500/60 hover:border-indigo-500" 
              />
            </div>
            
            {userDropdownOpen && (
              <div className="absolute top-full right-0 mt-2.5 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-[0_8px_32px_rgba(110,84,200,0.3)] border border-slate-700/50 min-w-[200px] overflow-hidden">
                <button 
                  onClick={() => router.push('/profile')} 
                  className="w-full flex items-center gap-3 px-5 py-3 border-b border-slate-700/50 transition-all hover:bg-indigo-500/20 text-left"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span className="text-white">Profile</span>
                </button>
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center gap-3 px-5 py-3 cursor-pointer transition-all hover:bg-red-500/20 text-left"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span className="text-white">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <aside
        className={`fixed top-16 left-0 w-80 h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-r border-indigo-500/20 z-[1000] transition-transform duration-400 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-slate-700/50 rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
        >
          ✕
        </button>

        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-white text-xl font-bold mb-2">Select Platform</h2>
          <p className="text-slate-400 text-xs">
            Choose your validation environment
          </p>
        </div>

        <div className="p-4 space-y-3">
          <div
            onClick={() => selectModelType("machine-learning")}
            className="flex items-center gap-4 p-5 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-indigo-500/50 hover:bg-indigo-500/5 cursor-pointer transition-all"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-indigo-500/15 rounded-lg text-2xl">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white text-base font-semibold">
                Machine Learning
              </h3>
              <p className="text-slate-400 text-xs">
                Traditional ML models & algorithms
              </p>
            </div>
          </div>

          <div
            onClick={() => selectModelType("deep-learning")}
            className="flex items-center gap-4 p-5 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-indigo-500/50 hover:bg-indigo-500/5 cursor-pointer transition-all"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-indigo-500/15 rounded-lg text-2xl">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white text-base font-semibold">
                Deep Learning
              </h3>
              <p className="text-slate-400 text-xs">
                Neural networks & advanced AI
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Dashboard Overview
            </h1>
            <p className="text-slate-300 text-sm mb-6">
              Manage your AI validation projects with advanced analytics and
              insights
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Start New Validation
              </button>
              <button className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm bg-slate-700/50 border border-slate-600/20 hover:bg-slate-700/80 transition-all">
                <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View Projects
              </button>
              <button className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm bg-slate-700/50 border border-slate-600/20 hover:bg-slate-700/80 transition-all">
                <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15m-3 7.5A9.5 9.5 0 1121.5 12 9.5 9.5 0 0112 2.5z" />
                </svg>
                Continue Session
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="text-3xl mb-2">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.validations}
              </div>
              <div className="text-slate-400 font-medium text-xs">
                ML Validations
              </div>
            </div>
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="text-3xl mb-2">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.datasets}
              </div>
              <div className="text-slate-400 font-medium text-xs">
                Datasets Uploaded
              </div>
            </div>
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="text-3xl mb-2">
              <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.avgConfidence}%
              </div>
              <div className="text-slate-400 font-medium text-xs">
                Avg Confidence
              </div>
            </div>
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="text-3xl mb-2">
              <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.totalRows.toLocaleString()}
              </div>
              <div className="text-slate-400 font-medium text-xs">
                Total Rows Analyzed
              </div>
            </div>
          </div>

          {/* Workflow Pipeline */}
          <div className="rounded-xl p-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 mb-10">
            <h2 className="text-xl font-bold text-white mb-8">
              Your AI Workflow Pipeline
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/40">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-white font-semibold text-sm mt-3">
                  Validation
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  {stats.validations} projects
                </div>
              </div>
              <div className="flex-1 mx-4 h-1 bg-slate-700/50 rounded-full" />

              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-slate-700/50 border-2 border-slate-600/30">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-white font-semibold text-sm mt-3">
                  Feature Engineering
                </div>
                <div className="text-slate-400 text-xs mt-1">Coming soon</div>
              </div>
              <div className="flex-1 mx-4 h-1 bg-slate-700/50 rounded-full" />

              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-slate-700/50 border-2 border-slate-600/30">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div className="text-white font-semibold text-sm mt-3">
                  Model Studio
                </div>
                <div className="text-slate-400 text-xs mt-1">Locked</div>
              </div>
              <div className="flex-1 mx-4 h-1 bg-slate-700/50 rounded-full" />

              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-slate-700/50 border-2 border-slate-600/30">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-white font-semibold text-sm mt-3">
                  Deploy
                </div>
                <div className="text-slate-400 text-xs mt-1">Locked</div>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="rounded-xl p-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">My Projects</h2>
              <button className="px-4 py-2 rounded-lg text-white text-xs font-medium bg-slate-700/50 border border-slate-600/20 hover:bg-slate-700/80 transition-all">
                View All →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-slate-300 font-semibold py-3 px-4 uppercase text-xs tracking-wide">
                      Project
                    </th>
                    <th className="text-slate-300 font-semibold py-3 px-4 uppercase text-xs tracking-wide">
                      Dataset
                    </th>
                    <th className="text-slate-300 font-semibold py-3 px-4 uppercase text-xs tracking-wide">
                      Task Type
                    </th>
                    <th className="text-slate-300 font-semibold py-3 px-4 uppercase text-xs tracking-wide">
                      Status
                    </th>
                    <th className="text-slate-300 font-semibold py-3 px-4 uppercase text-xs tracking-wide">
                      Confidence
                    </th>
                    <th className="text-slate-300 font-semibold py-3 px-4 uppercase text-xs tracking-wide">
                      Created
                    </th>
                    <th className="text-slate-300 font-semibold py-3 px-4 uppercase text-xs tracking-wide">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-slate-400 text-sm"
                      >
                        No projects yet.{" "}
                        <button
                          onClick={() => setSidebarOpen(true)}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          Create your first project →
                        </button>
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => {
                      const badge = getStatusBadge(project.status);
                      return (
                        <tr
                          key={project.id}
                          className="border-b border-slate-700/30 hover:bg-indigo-500/10 transition-all"
                        >
                          <td className="py-4 px-4 text-white font-medium">
                            📍 {project.name}
                          </td>
                          <td className="py-4 px-4 text-slate-300">
                            {project.dataset}
                          </td>
                          <td className="py-4 px-4 text-slate-300 capitalize">
                            {project.taskType}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${badge.className}`}
                            >
                              {badge.icon} {badge.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-white font-semibold">
                            {project.confidence}%
                          </td>
                          <td className="py-4 px-4 text-slate-400">
                            {project.createdDate}
                          </td>
                          <td className="py-4 px-4">
                            <button className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                              Open
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Recent Activity */}
            <div className="rounded-xl p-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10">
              <h2 className="text-lg font-bold text-white mb-5">
                Recent Activity
              </h2>
              {activities.length === 0 ? (
                <div className="text-center text-slate-400 py-10 text-sm">
                  No activity yet
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, idx) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg shadow-indigo-500/40">
                          {getActivityIcon(activity.type)}
                        </div>
                        {idx < activities.length - 1 && (
                          <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-600 to-transparent my-2" />
                        )}
                      </div>
                      <div className="pt-1">
                        <div className="text-white font-medium text-sm">
                          {activity.action}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {activity.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Insights */}
            <div className="rounded-xl p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                🤖 AI Insights
              </h2>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-400 text-lg">●</span>
                  <span className="text-slate-200 text-sm">
                    Your dataset has ~12% missing values
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-400 text-lg">●</span>
                  <span className="text-slate-200 text-sm">
                    Target imbalance detected in classification tasks
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-400 text-lg">●</span>
                  <span className="text-slate-200 text-sm">
                    Low sample size on one project: only 300 rows
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-indigo-400 text-lg">●</span>
                  <span className="text-slate-200 text-sm">
                    Average validation confidence: {stats.avgConfidence}%
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Demo Templates */}
          <div className="rounded-xl p-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10">
            <h2 className="text-xl font-bold text-white mb-2">
              Try Example Datasets
            </h2>
            <p className="text-slate-300 text-sm mb-6">
              Load a demo dataset to get started quickly
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { 
                  name: "Customer Churn", 
                  icon: (
                    <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ), 
                  rows: "10,000" 
                },
                { 
                  name: "House Price", 
                  icon: (
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  ), 
                  rows: "15,000" 
                },
                { 
                  name: "Loan Default", 
                  icon: (
                    <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ), 
                  rows: "50,000" 
                },
                { 
                  name: "Sales Forecast", 
                  icon: (
                    <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ), 
                  rows: "5,000" 
                },
              ].map((demo) => (
                <button
                  key={demo.name}
                  className="rounded-xl p-6 text-center bg-slate-800/40 border border-slate-700/30 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-2 transition-all"
                >
                  <div className="flex justify-center mb-3">{demo.icon}</div>
                  <div className="text-white font-semibold text-sm mb-2">
                    {demo.name}
                  </div>
                  <div className="text-slate-400 text-xs">{demo.rows} rows</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .logo-shine {
          animation: shine 3s ease-in-out infinite;
        }

        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
      `}</style>
    </div>
  );
}