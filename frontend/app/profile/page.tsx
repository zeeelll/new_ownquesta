"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300d4ff;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%237c3aed;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='140' height='140'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='56' font-weight='bold' fill='white'%3EU%3C/text%3E%3C/svg%3E";

type TabType = 'personal' | 'work' | 'settings' | 'security';

export default function ProfilePage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' });
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        const u = data.user;
        setProfile({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          bio: u.bio || '',
          avatar: u.avatar || DEFAULT_AVATAR,
          company: u.company || '',
          jobTitle: u.jobTitle || '',
          location: u.location || '',
          skills: u.skills || ''
        });
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [BACKEND_URL, router]);

  const handleChange = (key: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be <5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => handleChange('avatar', reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: profile.name, 
          phone: profile.phone, 
          bio: profile.bio, 
          avatar: profile.avatar,
          company: profile.company,
          jobTitle: profile.jobTitle,
          location: profile.location,
          skills: profile.skills
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Save failed');
      alert('Profile saved successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Save failed: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center relative z-10">
          <p className="text-gray-400">Not authenticated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-8 bg-slate-900/80 backdrop-blur-xl border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-transparent">
            ◾
          </div>
          <span className="text-lg font-bold text-white">Ownquesta</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/home')}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-slate-700/50 border border-slate-600/20 backdrop-blur-md hover:bg-slate-700/80 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
            Dashboard
          </button>
        </div>
      </nav>

      <div className="relative z-10 pt-24 pb-12 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Your Profile
          </h1>
          <p className="text-slate-300">Manage your personal information and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 animate-slide-up overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-700/50 bg-slate-900/30 overflow-x-auto">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-6 py-4 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'personal'
                  ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Details
            </button>
            <button
              onClick={() => setActiveTab('work')}
              className={`px-6 py-4 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'work'
                  ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Work Details
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-4 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-4 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'security'
                  ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security
            </button>
          </div>

          <div className="p-8">
            {/* Personal Details Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-8 border-b border-slate-700/50">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
                    <img 
                      src={profile.avatar || DEFAULT_AVATAR} 
                      alt="avatar" 
                      className="relative w-32 h-32 rounded-full object-cover ring-4 ring-slate-800 shadow-xl transition-transform duration-300 group-hover:scale-105" 
                    />
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-800 shadow-lg"></div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
                    <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 mb-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {profile.email}
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <input 
                        ref={avatarInputRef} 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatar} 
                        style={{ display: 'none' }} 
                      />
                      <button 
                        onClick={() => avatarInputRef.current?.click()} 
                        className="group relative px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-indigo-500/50 hover:scale-105 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Change Photo
                      </button>
                      <button 
                        onClick={() => handleChange('avatar', DEFAULT_AVATAR)} 
                        className="px-4 py-2 border-2 border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 rounded-lg transition-all duration-300 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Personal Form Fields */}
                <div className="grid gap-6">
                  <label className="group">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-300">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Full Name
                    </div>
                    <input 
                      value={profile.name} 
                      onChange={(e) => handleChange('name', e.target.value)} 
                      className="w-full p-4 border-2 border-slate-700 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-300 hover:border-slate-600" 
                      placeholder="Enter your full name"
                    />
                  </label>

                  <label className="group">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-300">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Address <span className="text-xs text-slate-500 ml-1">(readonly)</span>
                    </div>
                    <input 
                      value={profile.email} 
                      readOnly 
                      className="w-full p-4 border-2 border-slate-700/50 rounded-xl bg-slate-900/30 text-slate-400 cursor-not-allowed" 
                    />
                  </label>

                  <label className="group">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-300">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Phone Number
                    </div>
                    <input 
                      value={profile.phone} 
                      onChange={(e) => handleChange('phone', e.target.value)} 
                      className="w-full p-4 border-2 border-slate-700 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-300 hover:border-slate-600" 
                      placeholder="Enter your phone number"
                    />
                  </label>

                  <label className="group">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-300">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Bio
                    </div>
                    <textarea 
                      value={profile.bio} 
                      onChange={(e) => handleChange('bio', e.target.value)} 
                      className="w-full p-4 border-2 border-slate-700 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-300 hover:border-slate-600 resize-none" 
                      rows={5}
                      placeholder="Tell us about yourself..."
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Work Details Tab */}
            {activeTab === 'work' && (
              <div className="grid gap-6">
                <label className="group">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-300">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Company
                  </div>
                  <input 
                    value={profile.company || ''} 
                    onChange={(e) => handleChange('company', e.target.value)} 
                    className="w-full p-4 border-2 border-slate-700 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-300 hover:border-slate-600" 
                    placeholder="Enter your company name"
                  />
                </label>

                <label className="group">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-300">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Job Title
                  </div>
                  <input 
                    value={profile.jobTitle || ''} 
                    onChange={(e) => handleChange('jobTitle', e.target.value)} 
                    className="w-full p-4 border-2 border-slate-700 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-300 hover:border-slate-600" 
                    placeholder="e.g., Data Scientist, ML Engineer"
                  />
                </label>

                <label className="group">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-300">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </div>
                  <input 
                    value={profile.location || ''} 
                    onChange={(e) => handleChange('location', e.target.value)} 
                    className="w-full p-4 border-2 border-slate-700 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-300 hover:border-slate-600" 
                    placeholder="e.g., San Francisco, CA"
                  />
                </label>

                <label className="group">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-300">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Skills
                  </div>
                  <textarea 
                    value={profile.skills || ''} 
                    onChange={(e) => handleChange('skills', e.target.value)} 
                    className="w-full p-4 border-2 border-slate-700 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-300 hover:border-slate-600 resize-none" 
                    rows={4}
                    placeholder="e.g., Python, TensorFlow, Machine Learning, Data Analysis"
                  />
                </label>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="p-6 border-2 border-slate-700 rounded-xl bg-slate-900/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-white">Email Notifications</h3>
                        <p className="text-sm text-slate-400">Receive updates via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <div className="p-6 border-2 border-slate-700 rounded-xl bg-slate-900/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-white">Dark Mode</h3>
                        <p className="text-sm text-slate-400">Use dark theme</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <div className="p-6 border-2 border-slate-700 rounded-xl bg-slate-900/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-white">AI Suggestions</h3>
                        <p className="text-sm text-slate-400">Get personalized AI recommendations</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="p-6 border-2 border-amber-700/50 bg-amber-900/10 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-amber-400 mb-1">Security Settings</h3>
                      <p className="text-sm text-slate-400">Password change and two-factor authentication features are coming soon.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-2 border-slate-700 rounded-xl bg-slate-900/30 opacity-50 cursor-not-allowed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-slate-400">Change Password</h3>
                        <p className="text-sm text-slate-500">Update your password regularly</p>
                      </div>
                    </div>
                    <button disabled className="px-4 py-2 bg-slate-700/30 text-slate-500 rounded-lg cursor-not-allowed">
                      Coming Soon
                    </button>
                  </div>
                </div>

                <div className="p-6 border-2 border-slate-700 rounded-xl bg-slate-900/30 opacity-50 cursor-not-allowed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-slate-400">Two-Factor Authentication</h3>
                        <p className="text-sm text-slate-500">Add an extra layer of security</p>
                      </div>
                    </div>
                    <button disabled className="px-4 py-2 bg-slate-700/30 text-slate-500 rounded-lg cursor-not-allowed">
                      Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-slate-700/50">
              <button 
                onClick={save} 
                disabled={saving} 
                className="group relative flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/50 hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => window.location.reload()} 
                className="px-8 py-4 border-2 border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
