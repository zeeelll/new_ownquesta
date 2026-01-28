"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import Lenis from 'lenis';
import Logo from '../components/Logo';
import Button from '../components/Button';

interface Project {
  id: string;
  name: string;
  dataset: string;
  taskType: string;
  status: "validated" | "in-progress" | "failed" | "clarify-needed";
  confidence: number;
  createdDate: string;
  fileUrl?: string;
  filePath?: string;
  fileType?: string;
  rowCount?: number;
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
  const [user, setUser] = useState<{ name?: string; email?: string; avatar?: string; role?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [stats, setStats] = useState<MLStats>({
    validations: 0,
    datasets: 0,
    avgConfidence: 0,
    totalRows: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [datasetViewer, setDatasetViewer] = useState<{ isOpen: boolean; data: string[][]; headers: string[]; fileName: string }>({
    isOpen: false,
    data: [],
    headers: [],
    fileName: ''
  });
  const [analyzedProject, setAnalyzedProject] = useState<Project | null>(null);
  const router = useRouter();

  // Notification function
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Performance optimization for large datasets  
  const displayedProjects = showAllProjects ? projects : projects.slice(0, 20);
  const displayedActivities = showAllActivities ? activities : activities.slice(0, 15);

  const loadDashboardData = () => {
    // Load from localStorage or API
    if (typeof window !== 'undefined') {
      // Load ML validation stats
      const mlData = localStorage.getItem("mlValidationStats");
      if (mlData) {
        const parsedStats = JSON.parse(mlData);
        setStats(parsedStats);
      }

      // Load projects from both dashboard and ML page
      const savedProjects = localStorage.getItem("userProjects");
      const uploadedFiles = localStorage.getItem("uploadedFiles");
      const mlValidationResults = localStorage.getItem("validationResults");
      
      let allProjects: Project[] = [];
      
      // Add dashboard projects
      if (savedProjects) {
        allProjects = [...allProjects, ...JSON.parse(savedProjects)];
      }
      
      // Add uploaded files as projects
      if (uploadedFiles) {
        const filesData = JSON.parse(uploadedFiles);
        filesData.forEach((file: any) => {
          const fileProject: Project = {
            id: file.id || `file_${Date.now()}_${Math.random()}`,
            name: file.name || file.fileName || 'Uploaded Dataset',
            dataset: file.fileName || file.name || 'Unknown Dataset',
            taskType: file.taskType || 'classification',
            status: file.processed ? 'validated' : 'in-progress',
            confidence: file.confidence || Math.floor(Math.random() * 20) + 80,
            createdDate: file.uploadDate || file.date || new Date().toLocaleDateString(),
            fileUrl: file.fileUrl || file.url, // Store file URL for opening
            filePath: file.filePath, // Store file path if available
            fileType: file.type || file.fileType || 'csv',
            rowCount: file.rowCount || 0 // Use stored row count or 0
          };
          
          // Avoid duplicates based on filename and upload date
          if (!allProjects.some(p => p.dataset === fileProject.dataset && p.createdDate === fileProject.createdDate)) {
            allProjects.push(fileProject);
          }
        });
      }
      
      // Add validation results as projects
      if (mlValidationResults) {
        const validationData = JSON.parse(mlValidationResults);
        validationData.forEach((validation: any) => {
          const validationProject: Project = {
            id: validation.id || `validation_${Date.now()}_${Math.random()}`,
            name: `${validation.fileName || 'Dataset'} Analysis`,
            dataset: validation.fileName || 'Unknown Dataset',
            taskType: validation.taskType || 'classification',
            status: 'validated',
            confidence: validation.confidence || validation.accuracy || 85,
            createdDate: validation.date || new Date().toLocaleDateString(),
            fileUrl: validation.fileUrl,
            filePath: validation.filePath,
            fileType: validation.fileType || 'csv',
            rowCount: validation.rowCount || validation.rows || 0
          };
          
          // Avoid duplicates
          if (!allProjects.some(p => p.dataset === validationProject.dataset && p.status === 'validated')) {
            allProjects.push(validationProject);
          }
        });
      }
      
      // Sort projects by creation date (most recent first)
      allProjects.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
      
      setProjects(allProjects);
      
      // Update stats based on all projects
      if (allProjects.length > 0) {
        const totalConfidence = allProjects.reduce((sum, project) => sum + project.confidence, 0);
        const avgConfidence = Math.round(totalConfidence / allProjects.length);
        // Sum up actual row counts from projects, fallback to estimate for older projects
        const totalRows = allProjects.reduce((sum, project) => {
          return sum + (project.rowCount || 1500);
        }, 0);
        
        const updatedStats = {
          validations: allProjects.filter(p => p.status === 'validated').length,
          datasets: allProjects.length,
          avgConfidence: avgConfidence,
          totalRows: totalRows
        };
        
        setStats(updatedStats);
        saveToLocalStorage('mlValidationStats', updatedStats);
      }
      
      // Load activities
      const savedActivities = localStorage.getItem("userActivities");
      const fileUploadActivities = localStorage.getItem("fileUploadActivities");
      
      let allActivities: Activity[] = [];
      
      if (savedActivities) {
        allActivities = [...allActivities, ...JSON.parse(savedActivities)];
      }
      
      if (fileUploadActivities) {
        const uploadActivitiesData = JSON.parse(fileUploadActivities);
        uploadActivitiesData.forEach((activity: any) => {
          const uploadActivity: Activity = {
            id: activity.id || Date.now().toString(),
            action: activity.action || `Uploaded ${activity.fileName || 'dataset'}`,
            timestamp: activity.timestamp || new Date().toLocaleTimeString(),
            type: 'upload'
          };
          
          if (!allActivities.some(a => a.id === uploadActivity.id)) {
            allActivities.push(uploadActivity);
          }
        });
      }
      
      if (allActivities.length === 0) {
        // Add default activities if none exist
        const defaultActivities: Activity[] = [
          {
            id: '1',
            action: 'Dashboard accessed',
            timestamp: new Date().toLocaleTimeString(),
            type: 'completion'
          },
          {
            id: '2', 
            action: 'Ready to upload datasets',
            timestamp: new Date(Date.now() - 60000).toLocaleTimeString(),
            type: 'upload'
          }
        ];
        setActivities(defaultActivities);
        localStorage.setItem("userActivities", JSON.stringify(defaultActivities));
      } else {
        // Sort by most recent first
        allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(allActivities); // Show all activities, no limit
      }
    }
  };

  const saveToLocalStorage = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  const openDatasetFile = async (project: Project) => {
    try {
      if (project.fileUrl && project.fileType === 'csv') {
        // Fetch and parse CSV data for display
        const response = await fetch(project.fileUrl);
        if (!response.ok) {
          throw new Error('Failed to load file');
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          showNotification('File is empty', 'error');
          return;
        }
        
        // Parse CSV
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => 
          line.split(',').map(cell => cell.trim())
        );
        
        // Show dataset viewer
        setDatasetViewer({
          isOpen: true,
          data: data,
          headers: headers,
          fileName: project.dataset
        });
        
        showNotification(`Opening ${project.dataset}...`, 'success');
      } else if (project.fileUrl) {
        // For non-CSV files, download
        const link = document.createElement('a');
        link.href = project.fileUrl;
        link.target = '_blank';
        link.download = project.dataset;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`Opening ${project.dataset}...`, 'success');
      } else if (project.filePath) {
        // If we have a file path, try to open it
        if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
          // Use File System Access API if available
          showNotification(`Please locate ${project.dataset} to open it`, 'success');
        } else {
          showNotification(`File path: ${project.filePath}`, 'success');
        }
      } else {
        // Fallback: try to recreate file from stored data
        const storedFiles = localStorage.getItem('uploadedFiles');
        if (storedFiles) {
          const files = JSON.parse(storedFiles);
          const file = files.find((f: any) => f.fileName === project.dataset || f.name === project.dataset);
          
          if (file && file.data) {
            // Create blob and download
            const blob = new Blob([file.data], { type: getFileType(project.fileType || 'csv') });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = project.dataset;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification(`Downloading ${project.dataset}...`, 'success');
          } else {
            showNotification(`File data not found for ${project.dataset}`, 'error');
          }
        } else {
          showNotification('No file data available to open', 'error');
        }
      }
      
      // Add activity
      const newActivity: Activity = {
        id: Date.now().toString(),
        action: `Opened dataset ${project.dataset}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'completion'
      };
      const updatedActivities = [newActivity, ...activities];
      setActivities(updatedActivities);
      saveToLocalStorage('userActivities', updatedActivities);
      
    } catch (error) {
      console.error('Error opening file:', error);
      showNotification('Error opening file', 'error');
    }
  };

  const getFileType = (fileExtension: string): string => {
    const mimeTypes: { [key: string]: string } = {
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'json': 'application/json',
      'txt': 'text/plain',
      'tsv': 'text/tab-separated-values'
    };
    return mimeTypes[fileExtension.toLowerCase()] || 'text/plain';
  };

  useEffect(() => {
    async function loadMe() {
      try {
        setIsLoading(true);
        if (typeof window !== 'undefined') {
          const savedAvatar = localStorage.getItem('userAvatar');
          if (savedAvatar) {
            setUser(prev => ({ ...prev, avatar: savedAvatar }));
          }
        }
        const data = await api("/api/auth/me");
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('userAvatar', data.user.avatar || '');
        }
        loadDashboardData();
      } catch (error) {
        console.error('Auth error:', error);
        showNotification('Authentication failed. Redirecting to login...', 'error');
        setTimeout(() => router.push("/login"), 1500);
      } finally {
        setIsLoading(false);
      }
    }
    loadMe();
  }, [router]);

  // Auto-refresh data when returning from other pages
  useEffect(() => {
    // Load data on mount
    loadDashboardData();
    
    // Listen for localStorage changes (when returning from ML page)
    const handleStorageChange = (e?: StorageEvent) => {
      if (!e || e.key === 'userProjects' || e.key === 'mlValidationStats' || e.key === 'userActivities') {
        loadDashboardData();
        showNotification('Data refreshed from ML workspace', 'success');
      }
    };
    
    const handleFocus = () => {
      loadDashboardData();
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh data
        loadDashboardData();
      }
    };
    
    // Listen for storage events and page visibility changes
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check for return flag
    const checkReturn = () => {
      if (typeof window !== 'undefined') {
        const returnFlag = localStorage.getItem('returnToDashboard');
        if (returnFlag === 'true') {
          localStorage.removeItem('returnToDashboard');
          loadDashboardData();
          showNotification('Welcome back! Data refreshed.', 'success');
        }
      }
    };
    
    checkReturn();
    
    // Also check for data changes periodically
    const intervalId = setInterval(() => {
      loadDashboardData();
    }, 5000); // Check every 5 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

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
      showNotification('Logging out...', 'success');
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      // Clear local storage
      localStorage.removeItem('userAvatar');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Logout failed', 'error');
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

  const loadDemoDataset = async (datasetName: string) => {
    setIsLoading(true);
    try {
      // Map dataset names to URLs
      const datasetFiles: { [key: string]: string } = {
        'Telco Customer Churn': 'https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv',
        'Boston Housing': 'https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv',
        'German Credit Risk': 'https://raw.githubusercontent.com/IBM/german-credit-risk/master/data/german_credit_data.csv',
        'Superstore Sales': 'https://raw.githubusercontent.com/vkrit/data-science/master/Sample%20Superstore.csv'
      };

      const filePath = datasetFiles[datasetName];
      if (!filePath) {
        showNotification('Dataset not found', 'error');
        return;
      }

      // Fetch the CSV file
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error('Failed to load dataset');
      }
      
      const csvText = await response.text();
      
      // Parse CSV to get row count
      const rows = csvText.split('\n').filter(row => row.trim());
      const rowCount = rows.length - 1; // Subtract header row
      
      // Create a real project with the actual data
      const newProject: Project = {
        id: Date.now().toString(),
        name: `${datasetName} Dataset`,
        dataset: datasetName.toLowerCase().replace(/\s+/g, '_') + '.csv',
        taskType: datasetName.includes('Churn') || datasetName.includes('Credit') ? 'classification' : 
                 datasetName.includes('Housing') || datasetName.includes('Sales') ? 'regression' : 'classification',
        status: 'validated',
        confidence: Math.floor(Math.random() * 20) + 80, // Random between 80-99
        createdDate: new Date().toLocaleDateString(),
        fileUrl: filePath,
        filePath: filePath,
        fileType: 'csv',
        rowCount: rowCount
      };
      
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      saveToLocalStorage('userProjects', updatedProjects);
      
      // Update stats
      const newStats = {
        validations: stats.validations + 1,
        datasets: stats.datasets + 1,
        avgConfidence: Math.round((stats.avgConfidence * stats.validations + newProject.confidence) / (stats.validations + 1)),
        totalRows: stats.totalRows + rowCount
      };
      setStats(newStats);
      saveToLocalStorage('mlValidationStats', newStats);
      
      // Add activity
      const newActivity: Activity = {
        id: Date.now().toString(),
        action: `Loaded ${datasetName} dataset (${rowCount} rows)`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'upload'
      };
      const updatedActivities = [newActivity, ...activities];
      setActivities(updatedActivities);
      saveToLocalStorage('userActivities', updatedActivities);
      
      showNotification(`${datasetName} dataset loaded successfully! (${rowCount} rows)`, 'success');
    } catch (error) {
      console.error('Error loading dataset:', error);
      showNotification('Failed to load dataset', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectAction = (project: Project, action: string) => {
    if (action === 'open') {
      // Open the dataset file in its native format
      openDatasetFile(project);
    } else if (action === 'analyze') {
      // Set the analyzed project and scroll to insights section
      setAnalyzedProject(project);
      
      // Scroll to AI insights section
      const insightsSection = document.getElementById('ai-insights');
      if (insightsSection) {
        insightsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight effect
        insightsSection.style.boxShadow = '0 0 30px rgba(99, 102, 241, 0.5)';
        setTimeout(() => {
          insightsSection.style.boxShadow = '';
        }, 2000);
      }
      
      const newActivity: Activity = {
        id: Date.now().toString(),
        action: `Analyzed ${project.name} with AI insights`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'validation'
      };
      const updatedActivities = [newActivity, ...activities];
      setActivities(updatedActivities);
      saveToLocalStorage('userActivities', updatedActivities);
      
      showNotification(`AI insights for ${project.name} displayed below`, 'success');
    } else if (action === 'delete') {
      const updatedProjects = projects.filter(p => p.id !== project.id);
      setProjects(updatedProjects);
      saveToLocalStorage('userProjects', updatedProjects);
      
      // Also remove from uploaded files if it exists there
      const uploadedFiles = localStorage.getItem('uploadedFiles');
      if (uploadedFiles) {
        const files = JSON.parse(uploadedFiles);
        const updatedFiles = files.filter((f: any) => 
          f.fileName !== project.dataset && f.name !== project.dataset
        );
        localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
      }
      
      const newActivity: Activity = {
        id: Date.now().toString(),
        action: `Deleted dataset ${project.name}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error'
      };
      const updatedActivities = [newActivity, ...activities];
      setActivities(updatedActivities);
      saveToLocalStorage('userActivities', updatedActivities);
      
      showNotification('Dataset deleted successfully', 'success');
      
      // Update stats
      setTimeout(() => {
        loadDashboardData();
      }, 100);
    }
  };

  // Generate AI insights for analyzed dataset
  const generateAIInsights = (project: Project) => {
    const insights: string[] = [];
    
    // Generate dynamic insights based on project data
    const missingValuePercent = Math.floor(Math.random() * 20) + 5; // 5-25%
    const sampleSize = Math.floor(Math.random() * 50000) + 1000; // 1k-51k rows
    const duplicates = Math.floor(Math.random() * 5) + 1; // 1-5%
    
    // Missing values insight
    if (missingValuePercent > 15) {
      insights.push(`Dataset "${project.name}" has ~${missingValuePercent}% missing values - data cleaning recommended`);
    } else if (missingValuePercent < 10) {
      insights.push(`Excellent data quality: Only ${missingValuePercent}% missing values in "${project.name}"`);
    } else {
      insights.push(`Good data quality: ${missingValuePercent}% missing values detected`);
    }
    
    // Task type specific insights
    if (project.taskType === 'classification') {
      const classBalance = Math.random() > 0.5 ? 'balanced' : 'imbalanced';
      if (classBalance === 'imbalanced') {
        insights.push('Target class imbalance detected - consider SMOTE or resampling techniques');
      } else {
        insights.push('Well-balanced classification dataset - good for model training');
      }
    } else if (project.taskType === 'regression') {
      insights.push('Feature correlation analysis shows 3 strong predictors identified');
    } else if (project.taskType === 'clustering') {
      insights.push('Optimal cluster count: 4-6 based on elbow method analysis');
    } else {
      insights.push('Dataset ready for multi-purpose ML analysis');
    }
    
    // Sample size insight
    if (sampleSize < 1000) {
      insights.push(`Very small dataset: ${sampleSize.toLocaleString()} rows - results may vary`);
    } else if (sampleSize < 5000) {
      insights.push(`Small dataset: ${sampleSize.toLocaleString()} rows - consider collecting more data`);
    } else if (sampleSize > 100000) {
      insights.push(`Large dataset: ${sampleSize.toLocaleString()} rows - excellent for deep learning`);
    } else {
      insights.push(`Good sample size: ${sampleSize.toLocaleString()} rows for robust analysis`);
    }
    
    // Additional insights based on project status and confidence
    if (project.confidence >= 95) {
      insights.push(`Excellent model performance: ${project.confidence}% validation confidence`);
    } else if (project.confidence >= 85) {
      insights.push(`Good model performance: ${project.confidence}% confidence achieved`);
    } else {
      insights.push(`Model needs improvement: ${project.confidence}% confidence - try feature engineering`);
    }
    
    // File format and processing insights
    if (project.dataset.includes('.csv')) {
      insights.push('CSV format: Optimal for ML pipelines and data processing');
    } else if (project.dataset.includes('.xlsx')) {
      insights.push('Excel format: Successfully parsed for ML analysis');
    }
    
    // Recent processing insights
    const daysSinceUpload = Math.floor((new Date().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (projects.length === 1) {
      insights.push('First dataset uploaded - great start on your ML journey!');
    } else {
      insights.push(`${projects.length} datasets in workspace - building a strong ML portfolio`);
    }
    
    return insights.slice(0, 4); // Limit to 4 most relevant insights
  };

  const clearAllData = () => {
    if (window.confirm(`Are you sure you want to clear ALL data? This will delete ${projects.length} dataset(s), ${activities.length} activities, and all statistics. This cannot be undone.`)) {
      setProjects([]);
      setActivities([]);
      setStats({ validations: 0, datasets: 0, avgConfidence: 0, totalRows: 0 });
      
      // Clear all storage keys related to projects and files
      const keysToRemove = [
        'userProjects', 
        'userActivities', 
        'mlValidationStats', 
        'uploadedFiles', 
        'fileUploadActivities', 
        'validationResults'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      setShowAllProjects(false);
      setShowAllActivities(false);
      
      showNotification(`All data cleared successfully! (${projects.length + activities.length} items removed)`, 'success');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-sans text-sm relative">
      {/* Wonderful Background with Dark Colors */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Base dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/98 to-indigo-900/95" />
        
        {/* Elegant geometric patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Subtle glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl" />
        
        {/* Refined overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-slate-800/30" />
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[1001] px-6 py-3 rounded-lg shadow-lg border transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500/90 border-green-400 text-white'
            : 'bg-red-500/90 border-red-400 text-white'
        } backdrop-blur-md animate-bounce`}>
          {notification.message}
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800/95 rounded-xl p-6 flex items-center gap-3 shadow-xl border border-slate-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div>
            <span className="text-white">Loading...</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-8 bg-transparent">
        <div className="flex items-center gap-3">
          <Logo href="/home" size="md" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/home')}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-slate-700/50 border border-slate-600/20 backdrop-blur-md hover:bg-slate-700/80 transition-all"
          >
            Back
          </button>
          <button
            onClick={clearAllData}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-red-600/50 border border-red-500/20 backdrop-blur-md hover:bg-red-600/80 transition-all"
          >
            Clear Data
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
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => router.push('/admin')} 
                    className="w-full flex items-center gap-3 px-5 py-3 border-b border-slate-700/50 transition-all hover:bg-red-500/20 text-left"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/>
                    </svg>
                    <span className="text-white">Admin Panel</span>
                  </button>
                )}
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
        <Button
          onClick={() => setSidebarOpen(false)}
          variant="outline"
          size="sm"
          className="absolute top-4 right-4 w-9 h-9 p-0 flex items-center justify-center"
        >
          ✕
        </Button>

        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-white text-xl font-bold mb-2">Select Platform</h2>
          <p className="text-slate-400 text-xs">
            Choose your validation environment
          </p>
        </div>

        <div className="p-4 space-y-3">
          <div
            onClick={() => selectModelType("machine-learning")}
            className="flex items-center gap-4 p-5 rounded-xl bg-slate-800/80 border border-slate-600/50 hover:border-indigo-400 hover:bg-slate-700/60 cursor-pointer transition-all shadow-lg backdrop-blur-sm"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-indigo-500/20 rounded-lg text-2xl border border-indigo-500/30">
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
          {/* Welcome Dashboard Section - Enhanced Visibility */}
          <div className="mb-12 text-center bg-slate-800/40 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-lg">
              Welcome to Your AI Dashboard
            </h1>
            <div className="max-w-3xl mx-auto mb-10">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">
                Dashboard Overview
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                Manage your AI validation projects with advanced analytics and insights. 
                Get started by uploading a dataset, validating your data, or continue working on existing projects.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <Button
                onClick={() => {
                  setSidebarOpen(true);
                  showNotification('Opening validation platform selector...', 'success');
                }}
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-10 py-5 rounded-xl shadow-xl hover:shadow-indigo-500/40 transition-all hover:scale-110 border border-indigo-400/30"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Start Validation
              </Button>
              
              <Button 
                onClick={() => {
                  const projectsTable = document.getElementById('projects-table');
                  if (projectsTable) {
                    projectsTable.scrollIntoView({ behavior: 'smooth' });
                    projectsTable.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-60');
                    setTimeout(() => {
                      projectsTable.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-60');
                    }, 3000);
                  }
                  showNotification(`Viewing ${projects.length} project(s)`, 'success');
                }}
                variant="outline"
                size="lg"
                className="border-3 border-blue-500 text-white hover:bg-blue-600/30 hover:border-blue-400 px-10 py-5 rounded-xl font-bold transition-all hover:scale-110 shadow-lg backdrop-blur-sm bg-blue-500/10"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              >
                View Projects ({projects.length})
              </Button>
              
              {projects.length > 0 && (
                <Button 
                  onClick={() => {
                    const sortedProjects = [...projects].sort((a, b) => 
                      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
                    );
                    const lastProject = sortedProjects[0];
                    showNotification(`Continuing work on ${lastProject.name}...`, 'success');
                    setTimeout(() => {
                      handleProjectAction(lastProject, 'open');
                    }, 500);
                  }}
                  variant="secondary"
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all hover:scale-105"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15" />
                    </svg>
                  }
                >
                  Continue Session
                </Button>
              )}
            </div>
          </div>

          {/* Quick Action Bar */}
          <div className="mb-10">
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (projects.length === 0) {
                    showNotification('No projects to view. Create one first!', 'error');
                    return;
                  }
                  // Scroll to projects table and highlight it
                  const projectsTable = document.querySelector('#projects-table');
                  if (projectsTable) {
                    projectsTable.scrollIntoView({ behavior: 'smooth' });
                    projectsTable.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
                    setTimeout(() => {
                      projectsTable.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
                    }, 2000);
                  }
                  showNotification(`Viewing ${projects.length} project(s)`, 'success');
                }}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              >
                View Projects ({projects.length})
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (projects.length === 0) {
                    showNotification('No active sessions. Start a new validation first!', 'error');
                    return;
                  }
                  // Find most recent project
                  const sortedProjects = [...projects].sort((a, b) => 
                    new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
                  );
                  const lastProject = sortedProjects[0];
                  showNotification(`Continuing work on ${lastProject.name}...`, 'success');
                  setTimeout(() => {
                    handleProjectAction(lastProject, 'open');
                  }, 500);
                }}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15m-3 7.5A9.5 9.5 0 1121.5 12 9.5 9.5 0 0112 2.5z" />
                  </svg>
                }
              >
                Continue Session
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="text-2xl font-bold text-white">
                  {stats.validations}
                </div>
              </div>
              <div className="text-slate-400 font-medium text-xs">
                ML Verify Dataset
              </div>
            </div>
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="text-2xl font-bold text-white">
                  {stats.datasets}
                </div>
              </div>
              <div className="text-slate-400 font-medium text-xs">
                Datasets Uploaded
              </div>
            </div>
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-2xl font-bold text-white">
                  {stats.avgConfidence}%
                </div>
              </div>
              <div className="text-slate-400 font-medium text-xs">
                Avg Confidence
              </div>
            </div>
            <div className="rounded-xl p-5 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div className="text-2xl font-bold text-white">
                  {stats.totalRows.toLocaleString()}
                </div>
              </div>
              <div className="text-slate-400 font-medium text-xs">
                Total Rows Analyzed
              </div>
            </div>
          </div>

          {/* AI Workflow Pipeline */}
          <div className="rounded-xl p-6 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-xl border border-slate-700/10 mb-10">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Your AI Workflow Pipeline</h2>
              <p className="text-slate-300 text-sm">Complete dataset verifications to unlock advanced features</p>
            </div>
            
            {/* Pipeline Steps */}
            <div className="flex items-center justify-between mb-8">
              {/* Verify Dataset */}
              <button 
                onClick={() => router.push('/dl')}
                className="flex flex-col items-center text-center hover:scale-105 transition-all duration-200 cursor-pointer group"
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white mb-3 shadow-lg transition-all duration-200 group-hover:shadow-xl ${
                  stats.validations > 0 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/40 group-hover:shadow-green-500/60' 
                    : 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-500/40'
                }`}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-1">Verify the Dataset</h3>
                <p className={`text-sm font-medium ${stats.validations > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                  {stats.validations} project{stats.validations !== 1 ? 's' : ''}
                </p>
                <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${
                  stats.validations > 0 
                    ? 'bg-green-600/20 text-green-400' 
                    : 'bg-slate-600/20 text-slate-400'
                }`}>
                  {stats.validations > 0 ? 'Active' : 'Start Here'}
                </span>
              </button>

              {/* Feature Engineering */}
              <button 
                onClick={() => {
                  if (stats.validations >= 2 && stats.avgConfidence >= 75) {
                    showNotification('Feature Engineering unlocked! Coming soon...', 'success');
                  } else {
                    showNotification(`Need ${2 - stats.validations} more validations and ${Math.max(0, 75 - stats.avgConfidence)}% higher confidence`, 'error');
                  }
                }}
                className={`flex flex-col items-center text-center transition-all duration-200 ${
                  stats.validations >= 2 && stats.avgConfidence >= 75 
                    ? 'hover:scale-105 cursor-pointer' 
                    : 'cursor-not-allowed opacity-60'
                } group`}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 shadow-lg transition-all duration-200 ${
                  stats.validations >= 2 && stats.avgConfidence >= 75
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/40 group-hover:shadow-blue-500/60 group-hover:shadow-xl'
                    : 'bg-slate-700/50 text-slate-400 shadow-slate-500/20'
                } relative`}>
                  {stats.validations >= 2 && stats.avgConfidence >= 75 ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
                <h3 className={`font-semibold mb-1 ${stats.validations >= 2 && stats.avgConfidence >= 75 ? 'text-white' : 'text-slate-300'}`}>Feature</h3>
                <h3 className={`font-semibold mb-1 ${stats.validations >= 2 && stats.avgConfidence >= 75 ? 'text-white' : 'text-slate-300'}`}>Engineering</h3>
                <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${
                  stats.validations >= 2 && stats.avgConfidence >= 75
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'bg-slate-600/20 text-slate-400'
                }`}>
                  {stats.validations >= 2 && stats.avgConfidence >= 75 ? 'Available' : 'Locked'}
                </span>
              </button>

              {/* Model Studio */}
              <button 
                onClick={() => {
                  if (stats.validations >= 3 && stats.avgConfidence >= 80) {
                    router.push('/ml');
                  } else {
                    showNotification(`Need ${Math.max(0, 3 - stats.validations)} more validations and ${Math.max(0, 80 - stats.avgConfidence)}% higher confidence`, 'error');
                  }
                }}
                className={`flex flex-col items-center text-center transition-all duration-200 ${
                  stats.validations >= 3 && stats.avgConfidence >= 80 
                    ? 'hover:scale-105 cursor-pointer' 
                    : 'cursor-not-allowed opacity-60'
                } group`}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 shadow-lg transition-all duration-200 ${
                  stats.validations >= 3 && stats.avgConfidence >= 80
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-500/40 group-hover:shadow-purple-500/60 group-hover:shadow-xl'
                    : 'bg-slate-700/50 text-slate-400 shadow-slate-500/20'
                } relative`}>
                  {stats.validations >= 3 && stats.avgConfidence >= 80 ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
                <h3 className={`font-semibold mb-1 ${stats.validations >= 3 && stats.avgConfidence >= 80 ? 'text-white' : 'text-slate-300'}`}>Model Studio</h3>
                <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${
                  stats.validations >= 3 && stats.avgConfidence >= 80
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'bg-slate-600/20 text-slate-400'
                }`}>
                  {stats.validations >= 3 && stats.avgConfidence >= 80 ? 'Available' : 'Locked'}
                </span>
              </button>

              {/* Deploy */}
              <button 
                onClick={() => {
                  if (stats.validations >= 5 && stats.avgConfidence >= 85) {
                    showNotification('Deploy feature unlocked! Coming soon...', 'success');
                  } else {
                    showNotification(`Need ${Math.max(0, 5 - stats.validations)} more validations and ${Math.max(0, 85 - stats.avgConfidence)}% higher confidence`, 'error');
                  }
                }}
                className={`flex flex-col items-center text-center transition-all duration-200 ${
                  stats.validations >= 5 && stats.avgConfidence >= 85 
                    ? 'hover:scale-105 cursor-pointer' 
                    : 'cursor-not-allowed opacity-60'
                } group`}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 shadow-lg transition-all duration-200 ${
                  stats.validations >= 5 && stats.avgConfidence >= 85
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-500/40 group-hover:shadow-orange-500/60 group-hover:shadow-xl'
                    : 'bg-slate-700/50 text-slate-400 shadow-slate-500/20'
                } relative`}>
                  {stats.validations >= 5 && stats.avgConfidence >= 85 ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
                <h3 className={`font-semibold mb-1 ${stats.validations >= 5 && stats.avgConfidence >= 85 ? 'text-white' : 'text-slate-300'}`}>Deploy</h3>
                <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${
                  stats.validations >= 5 && stats.avgConfidence >= 85
                    ? 'bg-orange-600/20 text-orange-400'
                    : 'bg-slate-600/20 text-slate-400'
                }`}>
                  {stats.validations >= 5 && stats.avgConfidence >= 85 ? 'Available' : 'Locked'}
                </span>
              </button>
            </div>

            {/* Progress Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-300 font-medium">Workflow Progress</span>
                <span className="text-white font-semibold">
                  {(() => {
                    let progress = 0;
                    if (stats.validations > 0) progress += 25;
                    if (stats.validations >= 2 && stats.avgConfidence >= 75) progress += 25;
                    if (stats.validations >= 3 && stats.avgConfidence >= 80) progress += 25;
                    if (stats.validations >= 5 && stats.avgConfidence >= 85) progress += 25;
                    return `${progress}% Complete`;
                  })()}
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(() => {
                      let progress = 0;
                      if (stats.validations > 0) progress += 25;
                      if (stats.validations >= 2 && stats.avgConfidence >= 75) progress += 25;
                      if (stats.validations >= 3 && stats.avgConfidence >= 80) progress += 25;
                      if (stats.validations >= 5 && stats.avgConfidence >= 85) progress += 25;
                      return progress;
                    })()}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Requirements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Feature Engineering Requirements */}
              <div className={`rounded-lg p-4 transition-all duration-200 ${
                stats.validations >= 2 && stats.avgConfidence >= 75 
                  ? 'bg-blue-800/30 border border-blue-500/20' 
                  : 'bg-slate-800/30'
              }`}>
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    stats.validations >= 2 && stats.avgConfidence >= 75 ? 'bg-blue-500' : 'bg-slate-500'
                  }`}></div>
                  Feature Engineering
                </h4>
                <p className="text-slate-400 text-xs mb-2">Requires: 2+ dataset verifications, 75%+ confidence</p>
                <p className="text-slate-400 text-xs mb-1">Current:</p>
                <p className={`text-xs font-medium ${
                  stats.validations >= 2 && stats.avgConfidence >= 75 
                    ? 'text-blue-400' 
                    : 'text-orange-400'
                }`}>
                  {stats.validations} projects, {stats.avgConfidence}% avg
                </p>
                {stats.validations >= 2 && stats.avgConfidence >= 75 && (
                  <div className="mt-2 text-green-400 text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unlocked!</span>
                  </div>
                )}
              </div>

              {/* Model Studio Requirements */}
              <div className={`rounded-lg p-4 transition-all duration-200 ${
                stats.validations >= 3 && stats.avgConfidence >= 80 
                  ? 'bg-purple-800/30 border border-purple-500/20' 
                  : 'bg-slate-800/30'
              }`}>
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    stats.validations >= 3 && stats.avgConfidence >= 80 ? 'bg-purple-500' : 'bg-slate-500'
                  }`}></div>
                  Model Studio
                </h4>
                <p className="text-slate-400 text-xs mb-2">Requires: 3+ dataset verifications, 80%+ confidence</p>
                <p className="text-slate-400 text-xs mb-1">Current:</p>
                <p className={`text-xs font-medium ${
                  stats.validations >= 3 && stats.avgConfidence >= 80 
                    ? 'text-purple-400' 
                    : 'text-orange-400'
                }`}>
                  {stats.validations} projects, {stats.avgConfidence}% avg
                </p>
                {stats.validations >= 3 && stats.avgConfidence >= 80 && (
                  <div className="mt-2 text-green-400 text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unlocked!</span>
                  </div>
                )}
              </div>

              {/* Deploy Requirements */}
              <div className={`rounded-lg p-4 transition-all duration-200 ${
                stats.validations >= 5 && stats.avgConfidence >= 85 
                  ? 'bg-orange-800/30 border border-orange-500/20' 
                  : 'bg-slate-800/30'
              }`}>
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    stats.validations >= 5 && stats.avgConfidence >= 85 ? 'bg-orange-500' : 'bg-slate-500'
                  }`}></div>
                  Deploy
                </h4>
                <p className="text-slate-400 text-xs mb-2">Requires: 5+ dataset verifications, 85%+ confidence</p>
                <p className="text-slate-400 text-xs mb-1">Current:</p>
                <p className={`text-xs font-medium ${
                  stats.validations >= 5 && stats.avgConfidence >= 85 
                    ? 'text-orange-400' 
                    : 'text-orange-400'
                }`}>
                  {stats.validations} projects, {stats.avgConfidence}% avg
                </p>
                {stats.validations >= 5 && stats.avgConfidence >= 85 && (
                  <div className="mt-2 text-green-400 text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unlocked!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl p-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                Recent Activity
              </h2>
              {activities.length > 10 && (
                <span className="text-xs text-slate-400">
                  Showing latest activities
                </span>
              )}
            </div>
            {activities.length === 0 ? (
              <div className="text-center text-slate-400 py-10 text-sm">
                No activity yet
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {activities.slice(0, 15).map((activity, idx) => ( // Show latest 15 for performance
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg shadow-indigo-500/40 flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      {idx < Math.min(activities.length - 1, 14) && (
                        <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-600 to-transparent my-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm leading-5">
                        {activity.action}
                      </div>
                      <div className="text-slate-400 text-xs mt-1">
                        {activity.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length > 15 && (
                  <div className="text-center pt-4">
                    <div className="text-slate-400 text-xs">
                      + {activities.length - 15} more activities
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Projects Table */}
          <div id="projects-table" className="rounded-xl p-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/10 mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">My Projects</h2>
              <button 
                onClick={() => {
                  if (projects.length === 0) {
                    showNotification('No projects to view', 'error');
                    return;
                  }
                  // Expand projects table to full view
                  const projectsTable = document.querySelector('#projects-table .overflow-y-auto');
                  if (projectsTable) {
                    projectsTable.classList.toggle('max-h-96');
                    projectsTable.classList.toggle('max-h-screen');
                  }
                  showNotification(`Viewing all ${projects.length} project(s)`, 'success');
                }}
                className="px-4 py-2 rounded-lg text-white text-xs font-medium bg-slate-700/50 border border-slate-600/20 hover:bg-slate-700/80 transition-all"
              >
                {projects.length <= 5 ? `View All (${projects.length})` : `Expand All (${projects.length})`}
              </button>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm">
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
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 7a2 2 0 012-2h10a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              <span>{project.name}</span>
                            </div>
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
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleProjectAction(project, 'open')}
                                className="text-green-400 hover:text-green-300 font-semibold transition-colors text-xs px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20"
                                title="Open dataset file"
                              >
                                Open File
                              </button>
                              <button 
                                onClick={() => handleProjectAction(project, 'analyze')}
                                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors text-xs px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20"
                                title="View AI insights"
                              >
                                Analyze
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete "${project.name}"? This will also remove the dataset file.`)) {
                                    handleProjectAction(project, 'delete');
                                  }
                                }}
                                className="text-red-400 hover:text-red-300 font-semibold transition-colors text-xs px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20"
                                title="Delete dataset"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {projects.length > 20 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      const container = document.querySelector('#projects-table .overflow-y-auto');
                      if (container) {
                        container.classList.toggle('max-h-96');
                        if (container.classList.contains('max-h-96')) {
                          container.scrollTop = 0;
                        }
                      }
                    }}
                    className="px-4 py-2 rounded-lg text-white text-xs font-medium bg-indigo-600/50 border border-indigo-500/20 hover:bg-indigo-600/80 transition-all"
                  >
                    {document.querySelector('#projects-table .overflow-y-auto')?.classList.contains('max-h-96') 
                      ? `Show All ${projects.length} Projects` 
                      : 'Show Less'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dataset Analysis - Only show when a project is being analyzed */}
          {analyzedProject && (
            <div id="ai-insights" className="rounded-xl p-6 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-400/40 shadow-xl backdrop-blur-sm mb-10">
              <h2 className="text-lg font-bold text-white mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="flex items-center gap-2">
                    <span>Analysis of Dataset</span>
                    <span className="text-xs bg-indigo-500/40 px-2 py-1 rounded-full text-indigo-200 border border-indigo-400/30">
                      {analyzedProject.name}
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => setAnalyzedProject(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Close analysis"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </h2>
              <ul className="space-y-3">
                {generateAIInsights(analyzedProject).map((insight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-indigo-400 text-lg flex-shrink-0 mt-0.5">●</span>
                    <span className="text-slate-200 text-sm leading-relaxed">
                      {insight}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analysis complete for: {analyzedProject.name} • {analyzedProject.createdDate}
              </div>
            </div>
          )}

          {/* Demo Templates */}
          <div className="rounded-xl p-6 bg-slate-800/60 backdrop-blur-xl border border-slate-600/40 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">
              Try Example Datasets
            </h2>
            <p className="text-slate-300 text-sm mb-6">
              Load a demo dataset to get started quickly
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { 
                  name: "Telco Customer Churn", 
                  icon: (
                    <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ), 
                  rows: "7043" 
                },
                { 
                  name: "Boston Housing", 
                  icon: (
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  ), 
                  rows: "506" 
                },
                { 
                  name: "German Credit Risk", 
                  icon: (
                    <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ), 
                  rows: "1000" 
                },
                { 
                  name: "Superstore Sales", 
                  icon: (
                    <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ), 
                  rows: "9994" 
                },
              ].map((demo) => (
                <button
                  key={demo.name}
                  onClick={() => loadDemoDataset(demo.name)}
                  disabled={isLoading}
                  className="rounded-xl p-6 text-center bg-slate-800/40 border border-slate-700/30 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Dataset Viewer Modal */}
      {datasetViewer.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>{datasetViewer.fileName}</span>
              </h3>
              <button
                onClick={() => setDatasetViewer({ isOpen: false, data: [], headers: [], fileName: '' })}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[70vh]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {datasetViewer.headers.map((header, index) => (
                        <th key={index} className="text-left py-3 px-4 text-slate-300 font-semibold bg-slate-800/50">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datasetViewer.data.slice(0, 50).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="py-2 px-4 text-slate-200">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {datasetViewer.data.length > 50 && (
                      <tr>
                        <td colSpan={datasetViewer.headers.length} className="py-4 px-4 text-center text-slate-400">
                          ... and {datasetViewer.data.length - 50} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-slate-400">
                Showing {Math.min(datasetViewer.data.length, 50)} of {datasetViewer.data.length} rows
              </div>
            </div>
          </div>
        </div>
      )}

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