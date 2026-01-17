"use client";

import React, { useState, useEffect, useRef, ChangeEvent, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './OwnquestaProfile.css'; // We'll extract CSS separately

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  bio: string;
  company: string;
  jobTitle: string;
  location: string;
  department: string;
  website: string;
  avatar: string;
  memberSince: string;
  emailNotif: boolean;
  marketingEmails: boolean;
  publicProfile: boolean;
  twoFactorAuth: boolean;
  language: string;
  timezone: string;
}

interface Message {
  text: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

const OwnquestaProfile: React.FC = () => {
  const STORAGE_KEY = 'ownquesta_user_profile';
  const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300d4ff;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%237c3aed;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='140' height='140'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='56' font-weight='bold' fill='white'%3EU%3C/text%3E%3C/svg%3E";

  const [userData, setUserData] = useState<UserProfile>({
    name: 'User Profile',
    email: 'user@ownquesta.com',
    phone: '',
    dateOfBirth: '',
    bio: '',
    company: '',
    jobTitle: '',
    location: '',
    department: '',
    website: '',
    avatar: DEFAULT_AVATAR,
    memberSince: new Date().toISOString().split('T')[0],
    emailNotif: true,
    marketingEmails: false,
    publicProfile: true,
    twoFactorAuth: false,
    language: 'en',
    timezone: 'UTC'
  });

  const [currentAvatar, setCurrentAvatar] = useState<string>(DEFAULT_AVATAR);
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [message, setMessage] = useState<Message>({ text: '', type: 'info', show: false });
  const [memberDays, setMemberDays] = useState<number>(0);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const saveProfile = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }, [userData]);

  const updateMemberDays = useCallback(() => {
    if (!userData.memberSince) return;
    const memberDate = new Date(userData.memberSince);
    const today = new Date();
    const days = Math.floor((today.getTime() - memberDate.getTime()) / (1000 * 60 * 60 * 24));
    if (!isNaN(days)) {
      setMemberDays(days);
    }
  }, [userData.memberSince]);

  // Load profile data on component mount
  useEffect(() => {
    setIsHydrated(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedData = JSON.parse(stored);
      setUserData(parsedData);
      setCurrentAvatar(parsedData.avatar || DEFAULT_AVATAR);
    }
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    updateMemberDays();
  }, [updateMemberDays]);

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type, show: true });
    setTimeout(() => {
      setMessage(prev => ({ ...prev, show: false }));
    }, 3500);
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage('Image size should be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCurrentAvatar(result);
      showMessage('✓ Avatar updated! Click Save to apply permanently.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setCurrentAvatar(DEFAULT_AVATAR);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
    showMessage('✓ Avatar removed! Click Save to apply permanently.', 'success');
  };

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    const updatedData = {
      ...userData,
      name: (document.getElementById('name') as HTMLInputElement)?.value || userData.name,
      phone: (document.getElementById('phone') as HTMLInputElement)?.value || userData.phone,
      dateOfBirth: (document.getElementById('dateOfBirth') as HTMLInputElement)?.value || userData.dateOfBirth,
      bio: (document.getElementById('bio') as HTMLTextAreaElement)?.value || userData.bio,
      avatar: currentAvatar
    };
    setUserData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    showMessage('✓ Profile updated successfully! All changes saved permanently.', 'success');
  };

  const handleWorkSubmit = (e: FormEvent) => {
    e.preventDefault();
    const updatedData = {
      ...userData,
      company: (document.getElementById('company') as HTMLInputElement)?.value || userData.company,
      jobTitle: (document.getElementById('jobTitle') as HTMLInputElement)?.value || userData.jobTitle,
      location: (document.getElementById('location') as HTMLInputElement)?.value || userData.location,
      department: (document.getElementById('department') as HTMLInputElement)?.value || userData.department,
      website: (document.getElementById('website') as HTMLInputElement)?.value || userData.website
    };
    setUserData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    showMessage('✓ Work information saved successfully! All changes saved permanently.', 'success');
  };

  const toggleSetting = (setting: keyof Pick<UserProfile, 'emailNotif' | 'marketingEmails' | 'publicProfile' | 'twoFactorAuth'>) => {
    setUserData(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const saveSettings = () => {
    const language = (document.getElementById('language') as HTMLSelectElement)?.value || 'en';
    const timezone = (document.getElementById('timezone') as HTMLSelectElement)?.value || 'UTC';
    
    const updatedData = {
      ...userData,
      language,
      timezone
    };
    setUserData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    showMessage('✓ Preferences saved successfully! All changes saved permanently.', 'success');
  };

  const changePassword = () => {
    const current = (document.getElementById('currentPassword') as HTMLInputElement)?.value;
    const newPass = (document.getElementById('newPassword') as HTMLInputElement)?.value;
    const confirm = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;

    if (!current || !newPass || !confirm) {
      showMessage('✕ Please fill all password fields', 'error');
      return;
    }

    if (newPass !== confirm) {
      showMessage('✕ New passwords do not match', 'error');
      return;
    }

    if (newPass.length < 6) {
      showMessage('✕ Password must be at least 6 characters', 'error');
      return;
    }

    (document.getElementById('currentPassword') as HTMLInputElement).value = '';
    (document.getElementById('newPassword') as HTMLInputElement).value = '';
    (document.getElementById('confirmPassword') as HTMLInputElement).value = '';
    
    showMessage('✓ Password changed successfully! Saved permanently.', 'success');
  };

  const deleteAccountConfirm = () => {
    const confirmed = confirm('⚠️ WARNING: This action cannot be undone. Are you absolutely sure you want to delete your account?');
    if (confirmed) {
      const finalConfirm = prompt('Type your email to confirm deletion: ' + userData.email);
      if (finalConfirm === userData.email) {
        localStorage.removeItem(STORAGE_KEY);
        showMessage('✓ Account deleted successfully. Redirecting to home...', 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        showMessage('✕ Email does not match. Account deletion cancelled.', 'error');
      }
    }
  };

  const resetForm = (formId: string) => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) form.reset();
    loadProfile();
    showMessage('✓ Changes discarded', 'info');
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  const switchTab = (tabName: string) => {
    setActiveTab(tabName);
  };

  if (!isHydrated) return null;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
                <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="white" opacity="0.7"/>
              </svg>
            </div>
            <span>Ownquesta</span>
          </div>
          <div className="nav-right">
            <button className="theme-toggle" onClick={goToDashboard}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="profile-grid">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="avatar-container">
              <img id="profileAvatar" className="avatar-large" src={currentAvatar} alt="Profile" />
              <input 
                type="file" 
                id="avatarInput" 
                ref={avatarInputRef}
                accept="image/*" 
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              <div className="avatar-controls">
                <button 
                  className="avatar-btn" 
                  onClick={() => avatarInputRef.current?.click()} 
                  title="Upload photo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </button>
                <button 
                  className="avatar-btn danger" 
                  onClick={removeAvatar} 
                  title="Remove photo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <div className="profile-info">
              <div className="profile-name" id="profileName">{userData.name}</div>
              <div className="profile-email" id="profileEmail">{userData.email}</div>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value" id="memberDays">{memberDays}</span>
                <span className="stat-label">Days Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">100%</span>
                <span className="stat-label">Complete</span>
              </div>
            </div>

            <div className="quick-actions">
              <a href="#" className="quick-action" onClick={(e) => { e.preventDefault(); switchTab('profile'); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Profile Settings
              </a>
              <a href="#" className="quick-action" onClick={(e) => { e.preventDefault(); switchTab('work'); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                Work Information
              </a>
              <a href="#" className="quick-action" onClick={(e) => { e.preventDefault(); switchTab('settings'); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6m8.66-13.66l-4.24 4.24m0 6.36l4.24 4.24M23 12h-6m-6 0H1m20.66 8.66l-4.24-4.24"></path>
                </svg>
                Preferences
              </a>
              <a href="#" className="quick-action" onClick={(e) => { e.preventDefault(); switchTab('account'); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Security
              </a>
            </div>
          </div>

          {/* Main Content */}
          <div className="profile-main">
            {message.show && (
              <div id="message" className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="tabs">
              <button 
                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} 
                onClick={() => switchTab('profile')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Profile
              </button>
              <button 
                className={`tab-btn ${activeTab === 'work' ? 'active' : ''}`} 
                onClick={() => switchTab('work')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                Work
              </button>
              <button 
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} 
                onClick={() => switchTab('settings')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6"></path>
                </svg>
                Settings
              </button>
              <button 
                className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`} 
                onClick={() => switchTab('account')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Account
              </button>
            </div>

            {/* Profile Tab */}
            <div id="profile" className={`tab-content ${activeTab === 'profile' ? 'active' : ''}`}>
              <div className="section-header">
                <div className="section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h3>Personal Information</h3>
              </div>

              <form id="profileForm" onSubmit={handleProfileSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      placeholder="John Doe" 
                      defaultValue={userData.name}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      className="readonly" 
                      readOnly 
                      defaultValue={userData.email}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      placeholder="+1 (555) 000-0000" 
                      defaultValue={userData.phone}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="dateOfBirth">Date of Birth</label>
                    <input 
                      type="date" 
                      id="dateOfBirth" 
                      name="dateOfBirth" 
                      defaultValue={userData.dateOfBirth}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea 
                    id="bio" 
                    name="bio" 
                    placeholder="Data scientist with expertise in machine learning and statistical analysis..." 
                    defaultValue={userData.bio}
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => resetForm('profileForm')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Work Tab */}
            <div id="work" className={`tab-content ${activeTab === 'work' ? 'active' : ''}`}>
              <div className="section-header">
                <div className="section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <h3>Work Information</h3>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <div className="info-label">Company</div>
                  <div className="info-value" id="displayCompany">
                    {userData.company || '-'}
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-label">Job Title</div>
                  <div className="info-value" id="displayJobTitle">
                    {userData.jobTitle || '-'}
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-label">Location</div>
                  <div className="info-value" id="displayLocation">
                    {userData.location || '-'}
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-label">Department</div>
                  <div className="info-value" id="displayDepartment">
                    {userData.department || '-'}
                  </div>
                </div>
              </div>

              <form id="workForm" onSubmit={handleWorkSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="company">Company</label>
                    <input 
                      type="text" 
                      id="company" 
                      name="company" 
                      placeholder="Tech Corp Inc." 
                      defaultValue={userData.company}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="jobTitle">Job Title</label>
                    <input 
                      type="text" 
                      id="jobTitle" 
                      name="jobTitle" 
                      placeholder="Senior Data Scientist" 
                      defaultValue={userData.jobTitle}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input 
                      type="text" 
                      id="location" 
                      name="location" 
                      placeholder="San Francisco, CA" 
                      defaultValue={userData.location}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <input 
                      type="text" 
                      id="department" 
                      name="department" 
                      placeholder="Data Science" 
                      defaultValue={userData.department}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input 
                    type="url" 
                    id="website" 
                    name="website" 
                    placeholder="https://yourportfolio.com" 
                    defaultValue={userData.website}
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => resetForm('workForm')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Settings Tab */}
            <div id="settings" className={`tab-content ${activeTab === 'settings' ? 'active' : ''}`}>
              <div className="section-header">
                <div className="section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6"></path>
                  </svg>
                </div>
                <h3>Preferences</h3>
              </div>

              <div className="settings-grid">
                <div className="setting-card">
                  <div className="setting-info">
                    <h4>Email Notifications</h4>
                    <p>Receive updates via email</p>
                  </div>
                  <button 
                    className={`toggle-switch ${userData.emailNotif ? 'active' : ''}`} 
                    id="emailNotif"
                    onClick={() => toggleSetting('emailNotif')}
                  ></button>
                </div>
                <div className="setting-card">
                  <div className="setting-info">
                    <h4>Marketing Emails</h4>
                    <p>Get promotional offers</p>
                  </div>
                  <button 
                    className={`toggle-switch ${userData.marketingEmails ? 'active' : ''}`} 
                    id="marketingEmails"
                    onClick={() => toggleSetting('marketingEmails')}
                  ></button>
                </div>
                <div className="setting-card">
                  <div className="setting-info">
                    <h4>Public Profile</h4>
                    <p>Make profile visible to others</p>
                  </div>
                  <button 
                    className={`toggle-switch ${userData.publicProfile ? 'active' : ''}`} 
                    id="publicProfile"
                    onClick={() => toggleSetting('publicProfile')}
                  ></button>
                </div>
                <div className="setting-card">
                  <div className="setting-info">
                    <h4>Two-Factor Auth</h4>
                    <p>Enhance account security</p>
                  </div>
                  <button 
                    className={`toggle-switch ${userData.twoFactorAuth ? 'active' : ''}`} 
                    id="twoFactorAuth"
                    onClick={() => toggleSetting('twoFactorAuth')}
                  ></button>
                </div>
              </div>

              <div className="section-header" style={{ marginTop: '40px' }}>
                <div className="section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </div>
                <h3>Regional Settings</h3>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="language">Preferred Language</label>
                  <select id="language" name="language" defaultValue={userData.language}>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="timezone">Timezone</label>
                  <select id="timezone" name="timezone" defaultValue={userData.timezone}>
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Standard Time</option>
                    <option value="CST">Central Standard Time</option>
                    <option value="MST">Mountain Standard Time</option>
                    <option value="PST">Pacific Standard Time</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-primary" onClick={saveSettings}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Save Preferences
                </button>
              </div>
            </div>

            {/* Account Tab */}
            <div id="account" className={`tab-content ${activeTab === 'account' ? 'active' : ''}`}>
              <div className="section-header">
                <div className="section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <polyline points="17 11 19 13 23 9"></polyline>
                  </svg>
                </div>
                <h3>Account Overview</h3>
              </div>

              <div className="stats-showcase">
                <div className="stat-card">
                  <div className="stat-number" id="memberDaysLarge">{memberDays}</div>
                  <div className="stat-card-label">Days Member</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number" id="lastLogin">Today</div>
                  <div className="stat-card-label">Last Login</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number" id="accountStatus">Active</div>
                  <div className="stat-card-label">Status</div>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <div className="info-label">Member Since</div>
                  <div className="info-value" id="memberSince">{userData.memberSince}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Subscription Plan</div>
                  <div className="info-value">
                    <span className="badge badge-premium" id="planBadge">Premium</span>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-label">Account Status</div>
                  <div className="info-value">
                    <span className="badge badge-success">Active & Verified</span>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-label">Email Verified</div>
                  <div className="info-value">
                    <span className="badge badge-success">Verified</span>
                  </div>
                </div>
              </div>

              <div className="section-header" style={{ marginTop: '40px' }}>
                <div className="section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <h3>Security Settings</h3>
              </div>

              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input type="password" id="currentPassword" placeholder="Enter current password" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input type="password" id="newPassword" placeholder="Enter new password" />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input type="password" id="confirmPassword" placeholder="Confirm new password" />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-primary" onClick={changePassword}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Update Password
                </button>
              </div>

              <div className="danger-zone">
                <h4>⚠️ Danger Zone</h4>
                <p>Once you delete your account, there is no going back. All your data will be permanently removed.</p>
                <button type="button" className="btn btn-danger" onClick={deleteAccountConfirm}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OwnquestaProfile;