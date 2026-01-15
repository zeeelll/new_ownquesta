"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";

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
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<MLStats>({
    validations: 0,
    datasets: 0,
    avgConfidence: 0,
    totalRows: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadMe() {
      try {
        const data = await api("/api/auth/me");
        setUser(data.user);
        loadDashboardData();
      } catch {
        router.push("/login");
      }
    }
    loadMe();
  }, [router]);

  const loadDashboardData = () => {
    // Load from localStorage or API
    const mlData = localStorage.getItem("mlValidationStats");
    if (mlData) {
      setStats(JSON.parse(mlData));
    }

    // Mock projects data
    setProjects([
      {
        id: "1",
        name: "Churn Prediction",
        dataset: "churn.csv",
        taskType: "classification",
        status: "validated",
        confidence: 86,
        createdDate: "2024-01-08",
      },
      {
        id: "2",
        name: "House Price",
        dataset: "house.csv",
        taskType: "regression",
        status: "clarify-needed",
        confidence: 64,
        createdDate: "2024-01-07",
      },
    ]);

    // Mock activity data
    setActivities([
      {
        id: "1",
        action: "Uploaded dataset churn.csv",
        timestamp: "2024-01-08 14:30",
        type: "upload",
      },
      {
        id: "2",
        action: "Validation completed for Churn Prediction",
        timestamp: "2024-01-08 14:35",
        type: "validation",
      },
      {
        id: "3",
        action: 'AI asked clarification: "Confirm target variable"',
        timestamp: "2024-01-08 14:40",
        type: "clarification",
      },
    ]);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 font-sans text-sm">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-8 bg-slate-900/80 backdrop-blur-xl border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent">
            ◾
          </div>
          <span className="text-lg font-bold text-white">Ownquesta</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-slate-700/50 border border-slate-600/20 backdrop-blur-md hover:bg-slate-700/80 transition-all"
          >
            Back
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
          >
            👤 Profile
          </button>
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
              ⚙️
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
              ◆
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
              Welcome Back, {user.name} ◐
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
                📱 Start New Validation
              </button>
              <button className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm bg-slate-700/50 border border-slate-600/20 hover:bg-slate-700/80 transition-all">
                📋 View Projects
              </button>
              <button className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm bg-slate-700/50 border border-slate-600/20 hover:bg-slate-700/80 transition-all">
                ⚡ Continue Session
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="text-3xl mb-2">✓</div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.validations}
              </div>
              <div className="text-slate-400 font-medium text-xs">
                ML Validations
              </div>
            </div>
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.datasets}
              </div>
              <div className="text-slate-400 font-medium text-xs">
                Datasets Uploaded
              </div>
            </div>
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="text-3xl mb-2">◎</div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.avgConfidence}%
              </div>
              <div className="text-slate-400 font-medium text-xs">
                Avg Confidence
              </div>
            </div>
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="text-3xl mb-2">📈</div>
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
                  ✓
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
                  ◆
                </div>
                <div className="text-white font-semibold text-sm mt-3">
                  Feature Engineering
                </div>
                <div className="text-slate-400 text-xs mt-1">Coming soon</div>
              </div>
              <div className="flex-1 mx-4 h-1 bg-slate-700/50 rounded-full" />

              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-slate-700/50 border-2 border-slate-600/30">
                  🎨
                </div>
                <div className="text-white font-semibold text-sm mt-3">
                  Model Studio
                </div>
                <div className="text-slate-400 text-xs mt-1">Locked</div>
              </div>
              <div className="flex-1 mx-4 h-1 bg-slate-700/50 rounded-full" />

              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-slate-700/50 border-2 border-slate-600/30">
                  🚀
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
                { name: "Customer Churn", icon: "○", rows: "10,000" },
                { name: "House Price", icon: "▭", rows: "15,000" },
                { name: "Loan Default", icon: "◆", rows: "50,000" },
                { name: "Sales Forecast", icon: "▢", rows: "5,000" },
              ].map((demo) => (
                <button
                  key={demo.name}
                  className="rounded-xl p-6 text-center bg-slate-800/40 border border-slate-700/30 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-2 transition-all"
                >
                  <div className="text-3xl mb-3">{demo.icon}</div>
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
    </div>
  );
}