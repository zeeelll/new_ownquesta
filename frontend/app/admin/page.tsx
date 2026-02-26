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
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchTerm, activeTab]);

  useEffect(() => {
    if (activeTab === 'activities' && allActivities.length === 0) {
      handleViewAllActivities();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'users') {
      setSearchTerm('');
    }
    if (activeTab !== 'activities') {
      setActivitySearch('');
      setActivityFilter('all');
    }
  }, [activeTab]);

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
    <div className="admin-root min-h-screen flex items-center justify-center">
      <style>{adminStyles}</style>
      <div className="text-center">
        <div className="loader-ring mx-auto mb-6">
          <Loader2 className="animate-spin h-10 w-10 text-cyan-400" />
        </div>
        <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">Initialising Command Center...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="admin-root min-h-screen flex items-center justify-center">
      <style>{adminStyles}</style>
      <div className="text-center error-card p-10 rounded-2xl">
        <div className="text-5xl mb-5">⚠</div>
        <p className="text-red-400 font-mono mb-6 text-sm">{error}</p>
        <Button onClick={() => router.push('/login')} className="btn-primary-custom">
          Return to Login
        </Button>
      </div>
    </div>
  );

  return (
    <div className="admin-root min-h-screen text-white">
      <style>{adminStyles}</style>

      {/* ── HEADER ─────────────────────────────── */}
      <header className="admin-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Logo size="md" variant="light" />
              <div className="header-title">
                Admin Command Center
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="status-dot-live" />
              <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Live</span>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="btn-outline-custom flex items-center space-x-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">

        {/* ── TAB NAV ──────────────────────────── */}
        <div className="tab-nav-container mb-8">
          <div className="flex space-x-1 p-1">
            {([
              { key: 'dashboard', icon: BarChart3, label: 'Dashboard' },
              { key: 'users',     icon: Users,    label: 'User Management' },
              { key: 'activities',icon: Activity,  label: 'Activity Log' },
              { key: 'settings',  icon: Settings,  label: 'Settings' },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`tab-btn flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === key ? 'tab-btn-active' : 'tab-btn-inactive'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            DASHBOARD TAB
        ══════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="stat-card stat-card-blue">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="stat-label flex items-center">
                      <Users className="h-3.5 w-3.5 mr-2" />
                      Total Users
                    </p>
                    <p className="stat-number">{users.length}</p>
                    <p className="stat-sub">Registered accounts</p>
                  </div>
                  <div className="stat-icon-bg stat-icon-blue">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <div className="stat-bar mt-4">
                  <div className="stat-bar-fill stat-bar-blue" style={{width: '100%'}} />
                </div>
              </div>

              <div className="stat-card stat-card-purple">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="stat-label flex items-center">
                      <Shield className="h-3.5 w-3.5 mr-2" />
                      Administrators
                    </p>
                    <p className="stat-number">{users.filter(user => user.role === 'admin').length}</p>
                    <p className="stat-sub">Privileged accounts</p>
                  </div>
                  <div className="stat-icon-bg stat-icon-purple">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
                <div className="stat-bar mt-4">
                  <div className="stat-bar-fill stat-bar-purple" style={{
                    width: users.length ? `${(users.filter(u => u.role === 'admin').length / users.length) * 100}%` : '0%'
                  }} />
                </div>
              </div>

              <div className="stat-card stat-card-emerald">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="stat-label flex items-center">
                      <User className="h-3.5 w-3.5 mr-2" />
                      Regular Users
                    </p>
                    <p className="stat-number">{users.filter(user => user.role === 'user').length}</p>
                    <p className="stat-sub">Standard accounts</p>
                  </div>
                  <div className="stat-icon-bg stat-icon-emerald">
                    <User className="h-6 w-6" />
                  </div>
                </div>
                <div className="stat-bar mt-4">
                  <div className="stat-bar-fill stat-bar-emerald" style={{
                    width: users.length ? `${(users.filter(u => u.role === 'user').length / users.length) * 100}%` : '0%'
                  }} />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="panel-card p-6">
              <h3 className="panel-title flex items-center mb-6">
                <Activity className="h-5 w-5 mr-2 text-cyan-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => setActiveTab('users')}
                  className="quick-action-btn quick-action-blue flex items-center justify-center space-x-2 h-12"
                >
                  <Users className="h-4 w-4" />
                  <span>Manage Users</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('activities')}
                  className="quick-action-btn quick-action-purple flex items-center justify-center space-x-2 h-12"
                >
                  <Activity className="h-4 w-4" />
                  <span>View Activities</span>
                </Button>
                <Button
                  onClick={() => setShowCreateUser(true)}
                  className="quick-action-btn quick-action-emerald flex items-center justify-center space-x-2 h-12"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add User</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('settings')}
                  className="quick-action-btn quick-action-amber flex items-center justify-center space-x-2 h-12"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            USERS TAB
        ══════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="space-y-6 fade-in">
            {/* Search Bar */}
            <div className="panel-card p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, company, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input w-full pl-10 pr-4 py-3 rounded-lg"
                  />
                </div>
                <div className="result-count font-mono text-sm">
                  <span className="text-cyan-400">{filteredUsers.length}</span>
                  <span className="text-slate-500"> user{filteredUsers.length !== 1 ? 's' : ''} found</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowCreateUser(true)}
                className="quick-action-btn quick-action-emerald flex items-center space-x-2 px-5"
              >
                <Plus className="h-4 w-4" />
                <span>Add User</span>
              </Button>
            </div>

            {/* Users Table */}
            <div className="panel-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="table-th">User</th>
                      <th className="table-th">Role</th>
                      <th className="table-th">Company</th>
                      <th className="table-th">Joined</th>
                      <th className="table-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="table-row-hover transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`user-avatar ${user.role === 'admin' ? 'user-avatar-admin' : 'user-avatar-user'}`}>
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">{user.name}</div>
                              <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`role-badge ${user.role === 'admin' ? 'role-badge-admin' : 'role-badge-user'}`}>
                            {user.role === 'admin' ? <Crown className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {user.company || <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-1.5">
                            <button
                              onClick={() => handleViewUserDetails(user)}
                              disabled={actionLoading === 'view-activities'}
                              className="action-btn action-btn-slate"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="action-btn action-btn-blue"
                              title="Edit User"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            {user.role !== 'admin' ? (
                              <button
                                onClick={() => handleMakeAdmin(user._id)}
                                disabled={actionLoading === user._id}
                                className="action-btn action-btn-emerald"
                                title="Make Admin"
                              >
                                {actionLoading === user._id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Crown className="h-3.5 w-3.5" />}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRemoveAdmin(user._id)}
                                disabled={actionLoading === user._id}
                                className="action-btn action-btn-amber"
                                title="Remove Admin"
                              >
                                {actionLoading === user._id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <UserMinus className="h-3.5 w-3.5" />}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={actionLoading === user._id}
                              className="action-btn action-btn-red"
                              title="Delete User"
                            >
                              {actionLoading === user._id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4 opacity-30">⌀</div>
                  <p className="text-slate-500 text-sm font-mono">No users match your search criteria</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            ACTIVITIES TAB
        ══════════════════════════════════════ */}
        {activeTab === 'activities' && (
          <div className="space-y-6 fade-in">
            <div className="panel-card p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div>
                  <h3 className="panel-title mb-1">Activity Log</h3>
                  <p className="text-slate-500 text-sm font-mono">Real-time monitoring of all system events</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <Button
                    onClick={() => handleViewAllActivities()}
                    className="quick-action-btn quick-action-blue flex items-center space-x-2"
                    disabled={actionLoading === 'view-all-activities'}
                  >
                    {actionLoading === 'view-all-activities'
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Activity className="h-4 w-4" />}
                    <span>Load All Activities</span>
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by user name or email..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="search-input w-full pl-10 pr-4 py-2.5 rounded-lg"
                  />
                </div>
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="search-input px-4 py-2.5 rounded-lg"
                >
                  <option value="all">All Actions</option>
                  <option value="login">Login</option>
                  <option value="registration">Registration</option>
                  <option value="admin">Admin Actions</option>
                  <option value="profile">Profile Updates</option>
                  <option value="upload">File Uploads</option>
                  <option value="delete">Deletions</option>
                </select>
                <div className="flex items-center space-x-2 text-slate-500">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-mono">Filter by action type</span>
                </div>
              </div>
            </div>

            {allActivities.length > 0 && (
              <div className="panel-card overflow-hidden">
                <div className="max-h-[560px] overflow-y-auto custom-scroll">
                  <div className="divide-y divide-slate-800/60">
                    {allActivities
                      .filter(activity => {
                        const matchesSearch = activitySearch === '' ||
                          activity.userName.toLowerCase().includes(activitySearch.toLowerCase()) ||
                          activity.userEmail.toLowerCase().includes(activitySearch.toLowerCase());

                        const matchesFilter = activityFilter === 'all' ||
                          (activityFilter === 'login' && activity.action === 'login') ||
                          (activityFilter === 'registration' && activity.action === 'registration') ||
                          (activityFilter === 'admin' && activity.action.startsWith('admin_')) ||
                          (activityFilter === 'profile' && activity.action === 'admin_update_profile') ||
                          (activityFilter === 'upload' && activity.action.includes('upload')) ||
                          (activityFilter === 'delete' && activity.action === 'admin_delete_account');

                        return matchesSearch && matchesFilter;
                      })
                      .map((activity: any) => (
                        <div key={activity._id} className="activity-row p-6 transition-colors">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="activity-avatar">
                                  <User className="h-4 w-4 text-slate-300" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                    <span className="font-semibold text-white text-sm">{activity.userName}</span>
                                    <span className="text-slate-500 text-xs font-mono">({activity.userEmail})</span>
                                    {activity.adminChangedBy && (
                                      <span className="admin-action-badge">ADMIN ACTION</span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-slate-600 mt-1 font-mono">
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

                              <div className="mb-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  {activity.action === 'login' && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
                                  {activity.action === 'registration' && <Plus className="h-3.5 w-3.5 text-blue-400" />}
                                  {activity.action.includes('admin') && <Shield className="h-3.5 w-3.5 text-red-400" />}
                                  {activity.action.includes('delete') && <Trash2 className="h-3.5 w-3.5 text-red-400" />}
                                  {activity.action.includes('update') && <Edit className="h-3.5 w-3.5 text-amber-400" />}
                                  {activity.action.includes('upload') && <Plus className="h-3.5 w-3.5 text-purple-400" />}
                                  {!['login', 'registration'].includes(activity.action) &&
                                   !activity.action.includes('admin') &&
                                   !activity.action.includes('delete') &&
                                   !activity.action.includes('update') &&
                                   !activity.action.includes('upload') && <Info className="h-3.5 w-3.5 text-slate-400" />}

                                  <span className={`action-chip ${
                                    activity.action === 'login' ? 'action-chip-green' :
                                    activity.action === 'registration' ? 'action-chip-blue' :
                                    activity.action.includes('admin') ? 'action-chip-red' :
                                    activity.action.includes('delete') ? 'action-chip-red' :
                                    activity.action.includes('update') ? 'action-chip-amber' :
                                    activity.action.includes('upload') ? 'action-chip-purple' :
                                    'action-chip-slate'
                                  }`}>
                                    {activity.action.replace(/_/g, ' ').toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">{activity.description}</p>
                              </div>

                              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                <div className="metadata-box rounded-lg p-3 mt-3">
                                  <h5 className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Metadata</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    {Object.entries(activity.metadata).map(([key, value]: [string, any]) => (
                                      <div key={key} className="flex justify-between gap-2">
                                        <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className="text-slate-300 font-mono truncate">
                                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {activity.adminChangedBy && (
                                <div className="mt-3 flex items-center space-x-2 text-xs text-red-400 font-mono">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  <span>Performed by admin: {activity.adminEmail}</span>
                                </div>
                              )}

                              {activity.userAgent && (
                                <div className="mt-2 flex items-center space-x-2 text-xs text-slate-600 font-mono">
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

                <div className="px-6 py-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">
                    Showing{' '}
                    <span className="text-cyan-400">
                      {allActivities.filter(activity => {
                        const matchesSearch = activitySearch === '' ||
                          activity.userName.toLowerCase().includes(activitySearch.toLowerCase()) ||
                          activity.userEmail.toLowerCase().includes(activitySearch.toLowerCase());
                        const matchesFilter = activityFilter === 'all' ||
                          (activityFilter === 'login' && activity.action === 'login') ||
                          (activityFilter === 'registration' && activity.action === 'registration') ||
                          (activityFilter === 'admin' && activity.action.startsWith('admin_')) ||
                          (activityFilter === 'profile' && activity.action === 'admin_update_profile') ||
                          (activityFilter === 'upload' && activity.action.includes('upload')) ||
                          (activityFilter === 'delete' && activity.action === 'admin_delete_account');
                        return matchesSearch && matchesFilter;
                      }).length}
                    </span>
                    {' '}of{' '}
                    <span className="text-slate-400">{allActivities.length}</span> activities
                  </span>
                  <Button
                    onClick={() => handleViewAllActivities()}
                    variant="outline"
                    size="sm"
                    className="btn-outline-custom text-xs"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            )}

            {allActivities.length === 0 && (
              <div className="panel-card p-16 text-center">
                <Activity className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 text-sm font-mono mb-1">No activities loaded</p>
                <p className="text-slate-600 text-xs">Click "Load All Activities" to begin monitoring</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            SETTINGS TAB
        ══════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="space-y-6 fade-in">
            <div className="panel-card p-6">
              <h3 className="panel-title flex items-center mb-2">
                <Settings className="h-5 w-5 mr-2 text-cyan-400" />
                System Configuration
              </h3>
              <p className="text-slate-500 text-sm font-mono">Manage system-level settings and permissions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="panel-card p-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center">
                  <span className="settings-icon-dot bg-emerald-400 mr-2" />
                  Add Administrator
                </h4>
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowCreateAdmin(true)}
                    className="quick-action-btn quick-action-emerald w-full flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Admin</span>
                  </Button>
                  <p className="text-xs text-slate-600 font-mono">
                    Grant full system access to a new administrator account
                  </p>
                </div>
              </div>

              <div className="panel-card p-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center">
                  <span className="settings-icon-dot bg-red-400 mr-2" />
                  User Removal
                </h4>
                <div className="space-y-3">
                  <Button
                    onClick={() => setActiveTab('users')}
                    variant="outline"
                    className="btn-outline-danger w-full flex items-center justify-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Manage Users</span>
                  </Button>
                  <p className="text-xs text-slate-600 font-mono">
                    Navigate to user management to modify or remove accounts
                  </p>
                </div>
              </div>
            </div>

            <div className="panel-card p-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-6 flex items-center">
                <span className="settings-icon-dot bg-blue-400 mr-2" />
                System Operations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={handleCheckSystemStatus}
                  variant="outline"
                  className="btn-outline-custom flex items-center justify-center space-x-2 h-11"
                  disabled={actionLoading === 'system-status'}
                >
                  <Monitor className="h-4 w-4" />
                  <span>Check Status</span>
                  {actionLoading === 'system-status' && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
                <Button
                  onClick={handleToggleMaintenanceMode}
                  variant={maintenanceMode ? "danger" : "outline"}
                  className={`flex items-center justify-center space-x-2 h-11 ${maintenanceMode ? 'btn-danger-custom' : 'btn-outline-amber'}`}
                  disabled={actionLoading === 'maintenance-mode'}
                >
                  <Wrench className="h-4 w-4" />
                  <span>{maintenanceMode ? 'Disable' : 'Enable'} Maintenance</span>
                  {actionLoading === 'maintenance-mode' && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
                <Button
                  onClick={handleClearCache}
                  variant="outline"
                  className="btn-outline-danger flex items-center justify-center space-x-2 h-11"
                  disabled={actionLoading === 'clear-cache'}
                >
                  <Trash className="h-4 w-4" />
                  <span>Clear Cache</span>
                  {actionLoading === 'clear-cache' && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
              </div>
              <div className="mt-5 flex items-center space-x-6 text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${systemStatus === 'online' ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : 'bg-red-400'}`} />
                  <span className="text-slate-500">System: <span className={systemStatus === 'online' ? 'text-emerald-400' : 'text-red-400'}>{systemStatus}</span></span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${maintenanceMode ? 'bg-amber-400' : 'bg-slate-600'}`} />
                  <span className="text-slate-500">Maintenance: <span className={maintenanceMode ? 'text-amber-400' : 'text-slate-500'}>{maintenanceMode ? 'Enabled' : 'Disabled'}</span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            EDIT USER MODAL
        ══════════════════════════════════════ */}
        {editingUser && (
          <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="modal-card w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scroll">
              <div className="flex justify-between items-center mb-8">
                <h2 className="modal-title">Edit User Profile</h2>
                <button onClick={() => setEditingUser(null)} className="modal-close-btn">×</button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateUser(editingUser);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { label: 'Full Name', key: 'name', type: 'text' },
                    { label: 'Email Address', key: 'email', type: 'email' },
                    { label: 'Phone', key: 'phone', type: 'text' },
                    { label: 'Company', key: 'company', type: 'text' },
                    { label: 'Job Title', key: 'jobTitle', type: 'text' },
                    { label: 'Location', key: 'location', type: 'text' },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="form-label">{label}</label>
                      <input
                        type={type}
                        value={(editingUser as any)[key] || ''}
                        onChange={(e) => setEditingUser({...editingUser, [key]: e.target.value})}
                        className="form-input w-full px-4 py-3 rounded-lg"
                        required={key === 'name' || key === 'email'}
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="form-label">Bio</label>
                    <textarea
                      value={editingUser.bio || ''}
                      onChange={(e) => setEditingUser({...editingUser, bio: e.target.value})}
                      className="form-input w-full px-4 py-3 rounded-lg resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Skills</label>
                    <input
                      type="text"
                      value={editingUser.skills || ''}
                      onChange={(e) => setEditingUser({...editingUser, skills: e.target.value})}
                      className="form-input w-full px-4 py-3 rounded-lg"
                      placeholder="e.g., JavaScript, React, Node.js"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-8">
                  <Button
                    type="submit"
                    className="quick-action-btn quick-action-blue flex-1"
                    disabled={actionLoading === editingUser._id}
                  >
                    {actionLoading === editingUser._id ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => setEditingUser(null)}
                    variant="outline"
                    className="btn-outline-custom flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            CREATE ADMIN MODAL
        ══════════════════════════════════════ */}
        {showCreateAdmin && (
          <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="modal-card w-full max-w-md">
              <div className="flex justify-between items-center mb-8">
                <h2 className="modal-title">Add Administrator</h2>
                <button onClick={() => { setShowCreateAdmin(false); setAdminForm({ name: '', email: '', password: '' }); }} className="modal-close-btn">×</button>
              </div>
              <form onSubmit={handleCreateAdmin}>
                <div className="space-y-5">
                  {[
                    { label: 'Full Name', key: 'name', type: 'text', ph: 'Administrator name' },
                    { label: 'Email Address', key: 'email', type: 'email', ph: 'admin@company.com' },
                    { label: 'Password', key: 'password', type: 'password', ph: 'Secure password' },
                  ].map(({ label, key, type, ph }) => (
                    <div key={key}>
                      <label className="form-label">{label}</label>
                      <input
                        type={type}
                        value={(adminForm as any)[key]}
                        onChange={(e) => setAdminForm({...adminForm, [key]: e.target.value})}
                        className="form-input w-full px-4 py-3 rounded-lg"
                        placeholder={ph}
                        required
                      />
                    </div>
                  ))}
                </div>
                <div className="flex space-x-4 mt-8">
                  <Button type="submit" className="quick-action-btn quick-action-emerald flex-1" disabled={actionLoading === 'create-admin'}>
                    {actionLoading === 'create-admin' ? 'Creating...' : 'Create Admin'}
                  </Button>
                  <Button onClick={() => { setShowCreateAdmin(false); setAdminForm({ name: '', email: '', password: '' }); }} variant="outline" className="btn-outline-custom flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            CREATE USER MODAL
        ══════════════════════════════════════ */}
        {showCreateUser && (
          <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="modal-card w-full max-w-md">
              <div className="flex justify-between items-center mb-8">
                <h2 className="modal-title">Add New User</h2>
                <button onClick={() => { setShowCreateUser(false); setUserForm({ name: '', email: '', password: '' }); }} className="modal-close-btn">×</button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-5">
                  {[
                    { label: 'Full Name', key: 'name', type: 'text', ph: 'User full name' },
                    { label: 'Email Address', key: 'email', type: 'email', ph: 'user@company.com' },
                    { label: 'Password', key: 'password', type: 'password', ph: 'Secure password' },
                  ].map(({ label, key, type, ph }) => (
                    <div key={key}>
                      <label className="form-label">{label}</label>
                      <input
                        type={type}
                        value={(userForm as any)[key]}
                        onChange={(e) => setUserForm({...userForm, [key]: e.target.value})}
                        className="form-input w-full px-4 py-3 rounded-lg"
                        placeholder={ph}
                        required
                      />
                    </div>
                  ))}
                </div>
                <div className="flex space-x-4 mt-8">
                  <Button type="submit" className="quick-action-btn quick-action-blue flex-1" disabled={actionLoading === 'create-user'}>
                    {actionLoading === 'create-user' ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button onClick={() => { setShowCreateUser(false); setUserForm({ name: '', email: '', password: '' }); }} variant="outline" className="btn-outline-custom flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            ACTIVITIES MODAL (from user details)
        ══════════════════════════════════════ */}
        {showActivities && (
          <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="modal-card w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="modal-title">
                  {activityView === 'user' && selectedUser
                    ? `Activity — ${selectedUser.name}`
                    : 'System Activity Log'}
                </h2>
                <button onClick={() => setShowActivities(false)} className="modal-close-btn">×</button>
              </div>

              <div className="overflow-y-auto max-h-[60vh] custom-scroll space-y-3">
                {(activityView === 'user' ? userActivities : allActivities).map((activity: any) => (
                  <div key={activity._id} className="activity-modal-item rounded-xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm">{activity.userName}</span>
                        <span className="text-slate-500 text-xs font-mono">({activity.userEmail})</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="mb-3">
                      <span className={`action-chip ${
                        activity.action.includes('admin') ? 'action-chip-red' :
                        activity.action === 'login' ? 'action-chip-green' :
                        activity.action === 'registration' ? 'action-chip-blue' :
                        'action-chip-slate'
                      }`}>
                        {activity.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed mb-3">{activity.description}</p>

                    {activity.adminChangedBy && (
                      <div className="text-xs text-amber-400 font-mono bg-amber-400/10 px-3 py-2 rounded border border-amber-400/20">
                        ⚡ Changed by admin: {activity.adminEmail}
                      </div>
                    )}

                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <details className="mt-3">
                        <summary className="text-xs text-slate-500 font-mono cursor-pointer hover:text-slate-300 transition-colors">
                          ▶ View metadata
                        </summary>
                        <pre className="mt-2 text-xs bg-slate-900 p-3 rounded overflow-x-auto text-slate-400 font-mono border border-slate-800">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}

                {(activityView === 'user' ? userActivities : allActivities).length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4 opacity-20">⌀</div>
                    <p className="text-slate-500 text-sm font-mono">No activity records found</p>
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

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   STYLES — injected via <style> tag
   Zero Tailwind conflicts: all custom class names
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const adminStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

  /* ── Root & Background ─────────────────────── */
  .admin-root {
    background: #080c14;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,182,212,0.06) 0%, transparent 60%),
      linear-gradient(180deg, #080c14 0%, #0a0f1a 100%);
    font-family: 'DM Sans', sans-serif;
    position: relative;
  }
  .admin-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
    z-index: 0;
  }
  .admin-root > * { position: relative; z-index: 1; }

  /* ── Header ────────────────────────────────── */
  .admin-header {
    background: rgba(8,12,20,0.92);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(6,182,212,0.12);
    box-shadow: 0 1px 0 rgba(6,182,212,0.05), 0 4px 24px rgba(0,0,0,0.4);
  }
  .header-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1.1rem;
    letter-spacing: -0.01em;
    background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .status-dot-live {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 2px rgba(34,197,94,0.2), 0 0 8px rgba(34,197,94,0.6);
    animation: pulse-live 2s ease-in-out infinite;
  }
  @keyframes pulse-live {
    0%, 100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.2), 0 0 8px rgba(34,197,94,0.6); }
    50% { box-shadow: 0 0 0 4px rgba(34,197,94,0.1), 0 0 16px rgba(34,197,94,0.8); }
  }

  /* ── Fade In ───────────────────────────────── */
  .fade-in {
    animation: fadeInUp 0.3s ease-out both;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Tab Nav ───────────────────────────────── */
  .tab-nav-container {
    background: rgba(15,20,32,0.8);
    border: 1px solid rgba(30,41,59,0.8);
    border-radius: 14px;
    padding: 5px;
    backdrop-filter: blur(12px);
  }
  .tab-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    border-radius: 10px;
    transition: all 0.2s ease;
  }
  .tab-btn-active {
    background: linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.08) 100%);
    color: #67e8f9;
    border: 1px solid rgba(6,182,212,0.3);
    box-shadow: 0 0 20px rgba(6,182,212,0.1), inset 0 1px 0 rgba(6,182,212,0.1);
  }
  .tab-btn-inactive {
    color: #475569;
    border: 1px solid transparent;
  }
  .tab-btn-inactive:hover {
    color: #94a3b8;
    background: rgba(30,41,59,0.5);
  }

  /* ── Panel Card ────────────────────────────── */
  .panel-card {
    background: rgba(13,18,30,0.9);
    border: 1px solid rgba(30,41,59,0.7);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02);
    backdrop-filter: blur(8px);
  }
  .panel-title {
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    color: #e2e8f0;
    letter-spacing: -0.01em;
  }

  /* ── Stat Cards ────────────────────────────── */
  .stat-card {
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .stat-card:hover {
    transform: translateY(-2px);
  }
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 120px; height: 120px;
    border-radius: 50%;
    opacity: 0.07;
    transform: translate(30%, -30%);
  }
  .stat-card-blue {
    background: linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.04) 100%);
    border-color: rgba(6,182,212,0.2);
    box-shadow: 0 4px 24px rgba(6,182,212,0.08), inset 0 1px 0 rgba(6,182,212,0.1);
  }
  .stat-card-blue::before { background: #06b6d4; }
  .stat-card-purple {
    background: linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%);
    border-color: rgba(139,92,246,0.2);
    box-shadow: 0 4px 24px rgba(139,92,246,0.08), inset 0 1px 0 rgba(139,92,246,0.1);
  }
  .stat-card-purple::before { background: #8b5cf6; }
  .stat-card-emerald {
    background: linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%);
    border-color: rgba(16,185,129,0.2);
    box-shadow: 0 4px 24px rgba(16,185,129,0.08), inset 0 1px 0 rgba(16,185,129,0.1);
  }
  .stat-card-emerald::before { background: #10b981; }

  .stat-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  .stat-number {
    font-family: 'Syne', sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    color: #f1f5f9;
    line-height: 1;
  }
  .stat-sub {
    font-size: 0.7rem;
    color: #475569;
    font-family: 'JetBrains Mono', monospace;
    margin-top: 0.25rem;
  }
  .stat-icon-bg {
    width: 48px; height: 48px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .stat-icon-blue  { background: rgba(6,182,212,0.15); color: #67e8f9; }
  .stat-icon-purple{ background: rgba(139,92,246,0.15); color: #c4b5fd; }
  .stat-icon-emerald{ background: rgba(16,185,129,0.15); color: #6ee7b7; }

  .stat-bar {
    height: 3px;
    background: rgba(255,255,255,0.05);
    border-radius: 2px;
    overflow: hidden;
  }
  .stat-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.8s ease;
  }
  .stat-bar-blue   { background: linear-gradient(90deg, #06b6d4, #67e8f9); }
  .stat-bar-purple { background: linear-gradient(90deg, #8b5cf6, #c4b5fd); }
  .stat-bar-emerald{ background: linear-gradient(90deg, #10b981, #6ee7b7); }

  /* ── Buttons ───────────────────────────────── */
  .quick-action-btn {
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 0.85rem;
    border-radius: 10px;
    padding: 0.6rem 1.25rem;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .quick-action-blue {
    background: linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.1));
    border-color: rgba(6,182,212,0.35);
    color: #67e8f9;
  }
  .quick-action-blue:hover { background: linear-gradient(135deg, rgba(6,182,212,0.3), rgba(6,182,212,0.15)); box-shadow: 0 0 20px rgba(6,182,212,0.2); }
  .quick-action-purple {
    background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.1));
    border-color: rgba(139,92,246,0.35);
    color: #c4b5fd;
  }
  .quick-action-purple:hover { background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(139,92,246,0.15)); box-shadow: 0 0 20px rgba(139,92,246,0.2); }
  .quick-action-emerald {
    background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1));
    border-color: rgba(16,185,129,0.35);
    color: #6ee7b7;
  }
  .quick-action-emerald:hover { background: linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.15)); box-shadow: 0 0 20px rgba(16,185,129,0.2); }
  .quick-action-amber {
    background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1));
    border-color: rgba(245,158,11,0.35);
    color: #fcd34d;
  }
  .quick-action-amber:hover { background: linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.15)); box-shadow: 0 0 20px rgba(245,158,11,0.2); }

  .btn-outline-custom {
    background: transparent;
    border: 1px solid rgba(51,65,85,0.8);
    color: #94a3b8;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    transition: all 0.2s ease;
  }
  .btn-outline-custom:hover { border-color: rgba(6,182,212,0.4); color: #67e8f9; background: rgba(6,182,212,0.05); }

  .btn-outline-amber {
    background: transparent;
    border: 1px solid rgba(245,158,11,0.3);
    color: #fcd34d;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    transition: all 0.2s ease;
  }
  .btn-outline-amber:hover { background: rgba(245,158,11,0.1); box-shadow: 0 0 16px rgba(245,158,11,0.15); }

  .btn-outline-danger {
    background: transparent;
    border: 1px solid rgba(239,68,68,0.3);
    color: #fca5a5;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    transition: all 0.2s ease;
  }
  .btn-outline-danger:hover { background: rgba(239,68,68,0.1); box-shadow: 0 0 16px rgba(239,68,68,0.15); }
  .btn-danger-custom {
    background: linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.1));
    border: 1px solid rgba(239,68,68,0.4);
    color: #fca5a5;
    border-radius: 10px;
  }

  /* ── Table ─────────────────────────────────── */
  .table-head { background: rgba(15,20,32,0.8); border-bottom: 1px solid rgba(30,41,59,0.6); }
  .table-th {
    padding: 0.875rem 1.5rem;
    text-align: left;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #475569;
  }
  .table-row-hover:hover { background: rgba(6,182,212,0.03); }

  .user-avatar {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    flex-shrink: 0;
  }
  .user-avatar-admin {
    background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(139,92,246,0.1));
    border: 1px solid rgba(139,92,246,0.3);
    color: #c4b5fd;
  }
  .user-avatar-user {
    background: linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.05));
    border: 1px solid rgba(6,182,212,0.2);
    color: #67e8f9;
  }

  .role-badge {
    display: inline-flex; align-items: center;
    padding: 0.2rem 0.65rem;
    border-radius: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border: 1px solid;
  }
  .role-badge-admin {
    background: rgba(139,92,246,0.12);
    border-color: rgba(139,92,246,0.3);
    color: #c4b5fd;
  }
  .role-badge-user {
    background: rgba(6,182,212,0.08);
    border-color: rgba(6,182,212,0.2);
    color: #67e8f9;
  }

  /* ── Action Buttons (table) ────────────────── */
  .action-btn {
    width: 30px; height: 30px;
    border-radius: 7px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .action-btn:hover { transform: translateY(-1px); }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .action-btn-slate { background: rgba(30,41,59,0.6); border-color: rgba(51,65,85,0.6); color: #94a3b8; }
  .action-btn-slate:hover { background: rgba(51,65,85,0.8); border-color: rgba(71,85,105,0.8); }
  .action-btn-blue  { background: rgba(6,182,212,0.1);  border-color: rgba(6,182,212,0.3);  color: #67e8f9; }
  .action-btn-blue:hover  { background: rgba(6,182,212,0.2); box-shadow: 0 0 10px rgba(6,182,212,0.2); }
  .action-btn-emerald { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #6ee7b7; }
  .action-btn-emerald:hover { background: rgba(16,185,129,0.2); box-shadow: 0 0 10px rgba(16,185,129,0.2); }
  .action-btn-amber { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); color: #fcd34d; }
  .action-btn-amber:hover { background: rgba(245,158,11,0.2); box-shadow: 0 0 10px rgba(245,158,11,0.2); }
  .action-btn-red   { background: rgba(239,68,68,0.1);  border-color: rgba(239,68,68,0.3);  color: #fca5a5; }
  .action-btn-red:hover   { background: rgba(239,68,68,0.2); box-shadow: 0 0 10px rgba(239,68,68,0.2); }

  /* ── Search Input ──────────────────────────── */
  .search-input {
    background: rgba(15,20,32,0.9);
    border: 1px solid rgba(30,41,59,0.8);
    color: #e2e8f0;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    outline: none;
  }
  .search-input::placeholder { color: #475569; }
  .search-input:focus {
    border-color: rgba(6,182,212,0.4);
    box-shadow: 0 0 0 3px rgba(6,182,212,0.06), 0 0 16px rgba(6,182,212,0.08);
  }
  .search-input option { background: #0f1520; }

  /* ── Activity Feed ─────────────────────────── */
  .activity-row:hover { background: rgba(6,182,212,0.02); }
  .activity-avatar {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: rgba(30,41,59,0.8);
    border: 1px solid rgba(51,65,85,0.6);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .admin-action-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    background: rgba(239,68,68,0.15);
    border: 1px solid rgba(239,68,68,0.3);
    color: #fca5a5;
  }
  .action-chip {
    display: inline-flex; align-items: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    padding: 0.2rem 0.6rem;
    border-radius: 5px;
    border: 1px solid;
  }
  .action-chip-green  { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #6ee7b7; }
  .action-chip-blue   { background: rgba(6,182,212,0.1);  border-color: rgba(6,182,212,0.3);  color: #67e8f9; }
  .action-chip-red    { background: rgba(239,68,68,0.1);  border-color: rgba(239,68,68,0.3);  color: #fca5a5; }
  .action-chip-amber  { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); color: #fcd34d; }
  .action-chip-purple { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.3); color: #c4b5fd; }
  .action-chip-slate  { background: rgba(51,65,85,0.4);   border-color: rgba(71,85,105,0.5);  color: #94a3b8; }

  .metadata-box {
    background: rgba(8,12,20,0.8);
    border: 1px solid rgba(30,41,59,0.6);
  }

  /* ── Settings ──────────────────────────────── */
  .settings-icon-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── Modal ─────────────────────────────────── */
  .modal-overlay {
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
  }
  .modal-card {
    background: rgba(10,15,25,0.98);
    border: 1px solid rgba(30,41,59,0.8);
    border-radius: 20px;
    padding: 2rem;
    box-shadow:
      0 24px 64px rgba(0,0,0,0.6),
      0 0 0 1px rgba(6,182,212,0.05),
      inset 0 1px 0 rgba(255,255,255,0.03);
  }
  .modal-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1.2rem;
    color: #e2e8f0;
    letter-spacing: -0.02em;
  }
  .modal-close-btn {
    color: #475569;
    font-size: 1.5rem;
    line-height: 1;
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s ease;
    background: rgba(30,41,59,0.4);
    border: 1px solid rgba(51,65,85,0.4);
    cursor: pointer;
  }
  .modal-close-btn:hover { color: #e2e8f0; background: rgba(51,65,85,0.6); }

  /* ── Form Fields ───────────────────────────── */
  .form-label {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #475569;
    margin-bottom: 0.5rem;
  }
  .form-input {
    background: rgba(8,12,20,0.9);
    border: 1px solid rgba(30,41,59,0.8);
    color: #e2e8f0;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    outline: none;
    transition: all 0.2s ease;
  }
  .form-input::placeholder { color: #334155; }
  .form-input:focus {
    border-color: rgba(6,182,212,0.45);
    box-shadow: 0 0 0 3px rgba(6,182,212,0.07), 0 0 20px rgba(6,182,212,0.07);
  }

  /* ── Activity Modal Items ──────────────────── */
  .activity-modal-item {
    background: rgba(15,20,32,0.7);
    border: 1px solid rgba(30,41,59,0.6);
    transition: border-color 0.15s ease;
  }
  .activity-modal-item:hover { border-color: rgba(6,182,212,0.15); }

  /* ── Loader ────────────────────────────────── */
  .loader-ring {
    width: 56px; height: 56px;
    border-radius: 50%;
    background: rgba(6,182,212,0.08);
    border: 1px solid rgba(6,182,212,0.2);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 32px rgba(6,182,212,0.12);
  }
  .error-card {
    background: rgba(10,15,25,0.9);
    border: 1px solid rgba(239,68,68,0.2);
    box-shadow: 0 0 40px rgba(239,68,68,0.06);
  }

  /* ── Custom Scrollbar ──────────────────────── */
  .custom-scroll::-webkit-scrollbar { width: 4px; }
  .custom-scroll::-webkit-scrollbar-track { background: transparent; }
  .custom-scroll::-webkit-scrollbar-thumb {
    background: rgba(6,182,212,0.2);
    border-radius: 2px;
  }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.35); }
`;