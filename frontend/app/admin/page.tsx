"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllUsers, deleteUser, makeUserAdmin, removeUserAdmin, updateUser, registerAdmin, registerUser, getUserActivities, getAllActivities } from "@/services/api";
import Button from '../components/Button';
import Logo from '../components/Logo';
import {
  Search,
  Edit,
  Eye,
  Crown,
  UserMinus,
  Trash2,
  Plus,
  Activity,
  LayoutDashboard,
  Loader2,
  Users,
  Shield,
  User,
  Settings,
  BarChart3,
  Monitor,
  Wrench,
  Trash,
  Filter,
  Calendar,
  Clock,
  Globe,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  bio: string;
  company: string;
  jobTitle: string;
  location: string;
  skills: string;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [showActivities, setShowActivities] = useState(false);
  const [activityView, setActivityView] = useState<'user' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [systemStatus, setSystemStatus] = useState('online');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'activities' | 'settings'>('dashboard');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadUsers();
  }, []);

  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  useEffect(() => {
    if (activeTab === 'users') {
      const filtered = users.filter(user =>
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm, activeTab]);

  const checkAuthAndLoadUsers = async () => {
    try {
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/auth/me`, {
        credentials: "include"
      });
      const authData = await authResponse.json();

      if (!authResponse.ok || !authData.user) {
        router.push("/login");
        return;
      }

      if (authData.user.role !== 'admin') {
        setError("Access denied. Admin privileges required.");
        return;
      }

      setCurrentUser(authData.user);

      const response = await getAllUsers();
      setUsers(response.users);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('Unauthorized') || err.message.includes('Forbidden')) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    setActionLoading(userId);
    try {
      await deleteUser(userId);
      setUsers(users.filter(user => user._id !== userId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      await makeUserAdmin(userId);
      setUsers(users.map(user =>
        user._id === userId ? { ...user, role: 'admin' } : user
      ));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      await removeUserAdmin(userId);
      setUsers(users.map(user =>
        user._id === userId ? { ...user, role: 'user' } : user
      ));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setActionLoading(updatedUser._id);
    try {
      const response = await updateUser(updatedUser._id, {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        company: updatedUser.company,
        jobTitle: updatedUser.jobTitle,
        location: updatedUser.location,
        skills: updatedUser.skills
      });
      setUsers(users.map(user =>
        user._id === updatedUser._id ? response.user : user
      ));
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create-admin');
    try {
      await registerAdmin(adminForm);
      setAdminForm({ name: '', email: '', password: '' });
      setShowCreateAdmin(false);
      const response = await getAllUsers();
      setUsers(response.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create-user');
    try {
      await registerUser(userForm);
      setUserForm({ name: '', email: '', password: '' });
      setShowCreateUser(false);
      const response = await getAllUsers();
      setUsers(response.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewUserDetails = async (user: User) => {
    setSelectedUser(user);
    setActionLoading('view-activities');
    try {
      const response = await getUserActivities(user._id);
      setUserActivities(response.activities);
      setActivityView('user');
      setShowActivities(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewAllActivities = async () => {
    setActionLoading('view-all-activities');
    try {
      const response = await getAllActivities(100);
      setAllActivities(response.activities);
      setActivityView('all');
      setShowActivities(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMaintenanceMode = async () => {
    setActionLoading('maintenance-mode');
    try {
      // Here you would call an API to toggle maintenance mode
      // For now, we'll just toggle the local state
      setMaintenanceMode(!maintenanceMode);
      alert(`Maintenance mode ${!maintenanceMode ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearCache = async () => {
    if (!confirm("Are you sure you want to clear the system cache? This action cannot be undone.")) return;
    
    setActionLoading('clear-cache');
    try {
      // Here you would call an API to clear cache
      // For now, we'll just show a success message
      alert('System cache cleared successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckSystemStatus = async () => {
    setActionLoading('system-status');
    try {
      // Here you would call an API to check system status
      // For now, we'll simulate checking
      setSystemStatus('online');
      alert('System status: All systems operational');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
        <p className="text-gray-400">Loading admin panel...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <p className="text-red-400">{error}</p>
        <Button onClick={() => router.push('/login')} className="mt-4">
          Go to Login
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Modern Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo + Admin Panel */}
            <div className="flex items-center space-x-6">
              <Logo size="md" variant="light" />
              <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Admin Panel
              </div>
            </div>

            {/* Right Side - Dashboard Button */}
            <div className="flex items-center">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tab Navigation */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 mb-6 border border-gray-700">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'activities'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Activity Log</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Total Users
                    </p>
                    <p className="text-3xl font-bold text-white">{users.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Administrators
                    </p>
                    <p className="text-3xl font-bold text-white">{users.filter(user => user.role === 'admin').length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Regular Users
                    </p>
                    <p className="text-3xl font-bold text-white">{users.filter(user => user.role === 'user').length}</p>
                  </div>
                  <User className="h-8 w-8 text-green-200" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => setActiveTab('users')}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2 h-12"
                >
                  <Users className="h-4 w-4" />
                  <span>Manage Users</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('activities')}
                  className="bg-purple-600 hover:bg-purple-700 flex items-center justify-center space-x-2 h-12"
                >
                  <Activity className="h-4 w-4" />
                  <span>View Activities</span>
                </Button>
                <Button
                  onClick={() => setShowCreateUser(true)}
                  className="bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2 h-12"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add User</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('settings')}
                  className="bg-orange-600 hover:bg-orange-700 flex items-center justify-center space-x-2 h-12"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, company, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                  />
                </div>
                <div className="text-sm text-gray-400">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowCreateUser(true)}
                className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add User</span>
              </Button>
            </div>

            {/* Users Table */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {user.role === 'admin' ? <Crown className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {user.company || <span className="text-gray-500">-</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleViewUserDetails(user)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === 'view-activities'}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleEditUser(user)}
                              variant="secondary"
                              size="sm"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {user.role !== 'admin' ? (
                              <Button
                                onClick={() => handleMakeAdmin(user._id)}
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                                disabled={actionLoading === user._id}
                              >
                                {actionLoading === user._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crown className="h-3 w-3" />}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleRemoveAdmin(user._id)}
                                className="bg-yellow-600 hover:bg-yellow-700"
                                size="sm"
                                disabled={actionLoading === user._id}
                              >
                                {actionLoading === user._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserMinus className="h-3 w-3" />}
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDeleteUser(user._id)}
                              variant="danger"
                              size="sm"
                              disabled={actionLoading === user._id}
                            >
                              {actionLoading === user._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">🔍</div>
                  <p className="text-gray-400 text-lg">No users found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-6">
            {/* Activity Controls */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
                  <p className="text-gray-400 text-sm">Monitor all user activities and system events</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <Button
                    onClick={() => handleViewAllActivities()}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
                    disabled={actionLoading === 'view-all-activities'}
                  >
                    {actionLoading === 'view-all-activities' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                    <span>Load All Activities</span>
                  </Button>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="all">All Actions</option>
                  <option value="login">Login</option>
                  <option value="registration">Registration</option>
                  <option value="admin">Admin Actions</option>
                  <option value="profile">Profile Updates</option>
                  <option value="upload">File Uploads</option>
                  <option value="delete">Deletions</option>
                </select>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Filter by type</span>
                </div>
              </div>
            </div>

            {/* Activity Display */}
            {allActivities.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <div className="divide-y divide-gray-700">
                    {allActivities
                      .filter(activity => {
                        const matchesSearch = activitySearch === '' ||
                          activity.userName.toLowerCase().includes(activitySearch.toLowerCase()) ||
                          activity.userEmail.toLowerCase().includes(activitySearch.toLowerCase()) ||
                          activity.description.toLowerCase().includes(activitySearch.toLowerCase()) ||
                          activity.action.toLowerCase().includes(activitySearch.toLowerCase());

                        const matchesFilter = activityFilter === 'all' ||
                          (activityFilter === 'login' && activity.action === 'login') ||
                          (activityFilter === 'registration' && activity.action === 'registration') ||
                          (activityFilter === 'admin' && activity.action.includes('admin')) ||
                          (activityFilter === 'profile' && activity.action.includes('profile')) ||
                          (activityFilter === 'upload' && activity.action.includes('upload')) ||
                          (activityFilter === 'delete' && activity.action.includes('delete'));

                        return matchesSearch && matchesFilter;
                      })
                      .map((activity: any) => (
                        <div key={activity._id} className="p-6 hover:bg-gray-700/30 transition-colors">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* User Info */}
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-white">{activity.userName}</span>
                                    <span className="text-gray-400">({activity.userEmail})</span>
                                    {activity.adminChangedBy && (
                                      <span className="px-2 py-1 bg-red-600 text-xs rounded-full font-medium">
                                        ADMIN ACTION
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{new Date(activity.timestamp).toLocaleString()}</span>
                                    </div>
                                    {activity.ipAddress && (
                                      <div className="flex items-center space-x-1">
                                        <Globe className="h-3 w-3" />
                                        <span>{activity.ipAddress}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action and Description */}
                              <div className="mb-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  {activity.action === 'login' && <CheckCircle className="h-4 w-4 text-green-400" />}
                                  {activity.action === 'registration' && <Plus className="h-4 w-4 text-blue-400" />}
                                  {activity.action.includes('admin') && <Shield className="h-4 w-4 text-red-400" />}
                                  {activity.action.includes('delete') && <Trash2 className="h-4 w-4 text-red-400" />}
                                  {activity.action.includes('update') && <Edit className="h-4 w-4 text-yellow-400" />}
                                  {activity.action.includes('upload') && <Plus className="h-4 w-4 text-purple-400" />}
                                  {!['login', 'registration'].includes(activity.action) &&
                                   !activity.action.includes('admin') &&
                                   !activity.action.includes('delete') &&
                                   !activity.action.includes('update') &&
                                   !activity.action.includes('upload') && <Info className="h-4 w-4 text-gray-400" />}

                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    activity.action === 'login' ? 'bg-green-600 text-green-100' :
                                    activity.action === 'registration' ? 'bg-blue-600 text-blue-100' :
                                    activity.action.includes('admin') ? 'bg-red-600 text-red-100' :
                                    activity.action.includes('delete') ? 'bg-red-500 text-red-100' :
                                    activity.action.includes('update') ? 'bg-yellow-600 text-yellow-100' :
                                    activity.action.includes('upload') ? 'bg-purple-600 text-purple-100' :
                                    'bg-gray-600 text-gray-100'
                                  }`}>
                                    {activity.action.replace(/_/g, ' ').toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-gray-300 leading-relaxed">{activity.description}</p>
                              </div>

                              {/* Metadata */}
                              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                                  <h5 className="text-sm font-medium text-gray-300 mb-2">Additional Details:</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    {Object.entries(activity.metadata).map(([key, value]: [string, any]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                        <span className="text-gray-200 font-mono text-xs">
                                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Admin Info */}
                              {activity.adminChangedBy && (
                                <div className="mt-3 flex items-center space-x-2 text-sm text-red-400">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>Action performed by admin: {activity.adminEmail}</span>
                                </div>
                              )}

                              {/* User Agent */}
                              {activity.userAgent && (
                                <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                                  <Smartphone className="h-3 w-3" />
                                  <span className="truncate">{activity.userAgent}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Activity Count */}
                <div className="px-6 py-3 bg-gray-700/30 border-t border-gray-600">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Showing {allActivities.filter(activity => {
                      const matchesSearch = activitySearch === '' ||
                        activity.userName.toLowerCase().includes(activitySearch.toLowerCase()) ||
                        activity.userEmail.toLowerCase().includes(activitySearch.toLowerCase()) ||
                        activity.description.toLowerCase().includes(activitySearch.toLowerCase()) ||
                        activity.action.toLowerCase().includes(activitySearch.toLowerCase());

                      const matchesFilter = activityFilter === 'all' ||
                        (activityFilter === 'login' && activity.action === 'login') ||
                        (activityFilter === 'registration' && activity.action === 'registration') ||
                        (activityFilter === 'admin' && activity.action.includes('admin')) ||
                        (activityFilter === 'profile' && activity.action.includes('profile')) ||
                        (activityFilter === 'upload' && activity.action.includes('upload')) ||
                        (activityFilter === 'delete' && activity.action.includes('delete'));

                      return matchesSearch && matchesFilter;
                    }).length} of {allActivities.length} activities</span>
                    <Button
                      onClick={() => handleViewAllActivities()}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {allActivities.length === 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-gray-700 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No activities loaded yet</p>
                <p className="text-gray-500 text-sm mt-2">Click "Load All Activities" to view system activities</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Settings Header */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                User Management Settings
              </h3>
              <p className="text-gray-400 text-sm">
                Configure user management settings and permissions
              </p>
            </div>

            {/* Settings Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h4 className="font-semibold mb-4 flex items-center">
                  <Plus className="h-4 w-4 mr-2 text-green-400" />
                  Add Admin
                </h4>
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowCreateAdmin(true)}
                    className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Admin</span>
                  </Button>
                  <p className="text-sm text-gray-400">
                    Add new administrator accounts with full system access
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h4 className="font-semibold mb-4 flex items-center">
                  <Trash2 className="h-4 w-4 mr-2 text-red-400" />
                  Remove Users
                </h4>
                <div className="space-y-3">
                  <Button
                    onClick={() => setActiveTab('users')}
                    variant="outline"
                    className="w-full border-red-500 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Manage Users</span>
                  </Button>
                  <p className="text-sm text-gray-400">
                    Go to User Management to remove or modify user accounts
                  </p>
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h4 className="font-semibold mb-4 flex items-center">
                <Settings className="h-4 w-4 mr-2 text-blue-400" />
                System Settings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={handleCheckSystemStatus}
                  variant="outline"
                  className="flex items-center justify-center space-x-2"
                  disabled={actionLoading === 'system-status'}
                >
                  <Monitor className="h-4 w-4" />
                  <span>System Status</span>
                  {actionLoading === 'system-status' && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
                <Button
                  onClick={handleToggleMaintenanceMode}
                  variant={maintenanceMode ? "danger" : "outline"}
                  className="flex items-center justify-center space-x-2"
                  disabled={actionLoading === 'maintenance-mode'}
                >
                  <Wrench className="h-4 w-4" />
                  <span>{maintenanceMode ? 'Disable' : 'Enable'} Maintenance</span>
                  {actionLoading === 'maintenance-mode' && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
                <Button
                  onClick={handleClearCache}
                  variant="outline"
                  className="flex items-center justify-center space-x-2 border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
                  disabled={actionLoading === 'clear-cache'}
                >
                  <Trash className="h-4 w-4" />
                  <span>Clear Cache</span>
                  {actionLoading === 'clear-cache' && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                <p>Current Status: <span className={`font-semibold ${systemStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>{systemStatus}</span></p>
                <p>Maintenance Mode: <span className={`font-semibold ${maintenanceMode ? 'text-yellow-400' : 'text-green-400'}`}>{maintenanceMode ? 'Enabled' : 'Disabled'}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  ✏️ Edit User
                </h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateUser(editingUser);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      👤 Name
                    </label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      📧 Email
                    </label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      📱 Phone
                    </label>
                    <input
                      type="text"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      🏢 Company
                    </label>
                    <input
                      type="text"
                      value={editingUser.company}
                      onChange={(e) => setEditingUser({...editingUser, company: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      💼 Job Title
                    </label>
                    <input
                      type="text"
                      value={editingUser.jobTitle}
                      onChange={(e) => setEditingUser({...editingUser, jobTitle: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      📍 Location
                    </label>
                    <input
                      type="text"
                      value={editingUser.location}
                      onChange={(e) => setEditingUser({...editingUser, location: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      📝 Bio
                    </label>
                    <textarea
                      value={editingUser.bio}
                      onChange={(e) => setEditingUser({...editingUser, bio: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      🛠️ Skills
                    </label>
                    <input
                      type="text"
                      value={editingUser.skills}
                      onChange={(e) => setEditingUser({...editingUser, skills: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                      placeholder="e.g., JavaScript, React, Node.js"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-8">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                    disabled={actionLoading === editingUser._id}
                  >
                    {actionLoading === editingUser._id ? '💾 Saving...' : '💾 Save Changes'}
                  </Button>
                  <Button
                    onClick={() => setEditingUser(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    ❌ Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Admin Modal */}
        {showCreateAdmin && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  👑 Add Admin User
                </h2>
                <button
                  onClick={() => {
                    setShowCreateAdmin(false);
                    setAdminForm({ name: '', email: '', password: '' });
                  }}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateAdmin}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      👤 Full Name
                    </label>
                    <input
                      type="text"
                      value={adminForm.name}
                      onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                      placeholder="Enter admin name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      📧 Email Address
                    </label>
                    <input
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      🔒 Password
                    </label>
                    <input
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                      placeholder="Enter secure password"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-8">
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    disabled={actionLoading === 'create-admin'}
                  >
                    {actionLoading === 'create-admin' ? '⏳ Adding...' : '✅ Add Admin'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreateAdmin(false);
                      setAdminForm({ name: '', email: '', password: '' });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    ❌ Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  👤 Add New User
                </h2>
                <button
                  onClick={() => {
                    setShowCreateUser(false);
                    setUserForm({ name: '', email: '', password: '' });
                  }}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateUser}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      👤 Full Name
                    </label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                      placeholder="Enter user name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      📧 Email Address
                    </label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      🔒 Password
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                      placeholder="Enter secure password"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-8">
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    disabled={actionLoading === 'create-user'}
                  >
                    {actionLoading === 'create-user' ? '⏳ Adding...' : '✅ Add User'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreateUser(false);
                      setUserForm({ name: '', email: '', password: '' });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    ❌ Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Activities Modal */}
        {showActivities && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  📊 {activityView === 'user' && selectedUser
                    ? `Activity History - ${selectedUser.name}`
                    : 'All System Activities'
                  }
                </h2>
                <button
                  onClick={() => setShowActivities(false)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="overflow-y-auto max-h-[60vh] space-y-4">
                {(activityView === 'user' ? userActivities : allActivities).map((activity: any) => (
                  <div key={activity._id} className="bg-gray-700/50 rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-white text-lg">{activity.userName}</span>
                        <span className="text-gray-400">({activity.userEmail})</span>
                      </div>
                      <span className="text-sm text-gray-400 bg-gray-600 px-3 py-1 rounded-full">
                        🕒 {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="mb-3">
                      <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                        activity.action.includes('admin') ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        activity.action === 'login' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        activity.action === 'registration' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {activity.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-300 mb-3 leading-relaxed">{activity.description}</p>

                    {activity.adminChangedBy && (
                      <div className="text-sm text-yellow-400 bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-500/20">
                        👑 Changed by admin: {activity.adminEmail}
                      </div>
                    )}

                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <details className="mt-4">
                        <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors flex items-center">
                          📋 View Details
                          <span className="ml-2">▼</span>
                        </summary>
                        <pre className="mt-3 text-xs bg-gray-900 p-4 rounded-lg overflow-x-auto border border-gray-600 text-gray-300">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}

                {(activityView === 'user' ? userActivities : allActivities).length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📭</div>
                    <p className="text-gray-400 text-xl">No activities found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {activityView === 'user' ? 'This user has no activity history yet.' : 'No system activities recorded.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}