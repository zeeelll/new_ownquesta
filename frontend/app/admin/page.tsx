"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllUsers, deleteUser, makeUserAdmin, removeUserAdmin, updateUser, registerAdmin, getUserActivities, getAllActivities } from "@/services/api";
import Button from '../components/Button';

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [showActivities, setShowActivities] = useState(false);
  const [activityView, setActivityView] = useState<'user' | 'all'>('all');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadUsers();
  }, []);

  const checkAuthAndLoadUsers = async () => {
    try {
      // First check if user is authenticated and is admin
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

      // Now load users
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

    try {
      await deleteUser(userId);
      setUsers(users.filter(user => user._id !== userId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      await makeUserAdmin(userId);
      setUsers(users.map(user =>
        user._id === userId ? { ...user, role: 'admin' } : user
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      await removeUserAdmin(userId);
      setUsers(users.map(user =>
        user._id === userId ? { ...user, role: 'user' } : user
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (updatedUser: User) => {
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
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerAdmin(adminForm);
      setAdminForm({ name: '', email: '', password: '' });
      setShowCreateAdmin(false);
      // Refresh the users list
      const response = await getAllUsers();
      setUsers(response.users);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleViewUserDetails = async (user: User) => {
    setSelectedUser(user);
    try {
      const response = await getUserActivities(user._id);
      setUserActivities(response.activities);
      setActivityView('user');
      setShowActivities(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleViewAllActivities = async () => {
    try {
      const response = await getAllActivities(100);
      setAllActivities(response.activities);
      setActivityView('all');
      setShowActivities(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Panel - User Management</h1>
          <div className="flex space-x-4">
            <Button
              onClick={() => handleViewAllActivities()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              View All Activities
            </Button>
            <Button
              onClick={() => setShowCreateAdmin(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Admin User
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/login')}
              className="bg-red-600 hover:bg-red-700"
            >
              Logout
            </Button>
          </div>
        </div>

        {currentUser && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300">
              Logged in as: <span className="font-semibold">{currentUser.name}</span> ({currentUser.email})
            </p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'admin' ? 'bg-red-600' : 'bg-blue-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.company || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <Button
                        onClick={() => handleViewUserDetails(user)}
                        className="bg-purple-600 hover:bg-purple-700 px-3 py-1 text-sm"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => handleEditUser(user)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 text-sm"
                      >
                        Edit
                      </Button>
                      {user.role !== 'admin' ? (
                        <Button
                          onClick={() => handleMakeAdmin(user._id)}
                          className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm"
                        >
                          Make Admin
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleRemoveAdmin(user._id)}
                          className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 text-sm"
                        >
                          Remove Admin
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteUser(user._id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 text-sm"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateUser(editingUser);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="text"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <input
                      type="text"
                      value={editingUser.company}
                      onChange={(e) => setEditingUser({...editingUser, company: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Job Title</label>
                    <input
                      type="text"
                      value={editingUser.jobTitle}
                      onChange={(e) => setEditingUser({...editingUser, jobTitle: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={editingUser.location}
                      onChange={(e) => setEditingUser({...editingUser, location: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea
                      value={editingUser.bio}
                      onChange={(e) => setEditingUser({...editingUser, bio: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Skills</label>
                    <input
                      type="text"
                      value={editingUser.skills}
                      onChange={(e) => setEditingUser({...editingUser, skills: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex space-x-2 mt-6">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => setEditingUser(null)}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCreateAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create Admin User</h2>
              <form onSubmit={handleCreateAdmin}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={adminForm.name}
                      onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-2 mt-6">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Create Admin
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreateAdmin(false);
                      setAdminForm({ name: '', email: '', password: '' });
                    }}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showActivities && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {activityView === 'user' && selectedUser
                    ? `Activity History - ${selectedUser.name}`
                    : 'All System Activities'
                  }
                </h2>
                <Button
                  onClick={() => setShowActivities(false)}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  Close
                </Button>
              </div>

              <div className="space-y-3">
                {(activityView === 'user' ? userActivities : allActivities).map((activity: any) => (
                  <div key={activity._id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">{activity.userName}</span>
                        <span className="text-gray-400">({activity.userEmail})</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        activity.action.includes('admin') ? 'bg-red-600' :
                        activity.action === 'login' ? 'bg-green-600' :
                        activity.action === 'registration' ? 'bg-blue-600' :
                        'bg-gray-600'
                      }`}>
                        {activity.action.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-300 mb-2">{activity.description}</p>

                    {activity.adminChangedBy && (
                      <div className="text-sm text-yellow-400">
                        Changed by admin: {activity.adminEmail}
                      </div>
                    )}

                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}

                {(activityView === 'user' ? userActivities : allActivities).length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    No activities found
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