'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInMessage, setSignInMessage] = useState('');
  const [signInSuccess, setSignInSuccess] = useState(false);
  
  // Sign Up State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signUpMessage, setSignUpMessage] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  useEffect(() => {
    // Check authentication status and show user panel if logged in
    fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data?.user) setCurrentUser({ authenticated: true, name: data.user.name, avatar: data.user.avatar });
          else setCurrentUser({ authenticated: false });
        } else {
          setCurrentUser({ authenticated: false });
        }
      })
      .catch(() => setCurrentUser({ authenticated: false }));
  }, [router]);

  const [currentUser, setCurrentUser] = useState<{ authenticated: boolean; name?: string; avatar?: string } | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSignIn = async () => {
    setSignInMessage('');
    
    if (!signInEmail || !signInPassword) {
      setSignInMessage('Please enter email and password');
      setSignInSuccess(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
        credentials: 'include'
      });
      
      if (response.redirected) {
        window.location.href = response.url;
      } else if (response.ok) {
        router.replace('/');
      } else {
        const data = await response.json();
        setSignInMessage(data.error || 'Invalid email or password');
        setSignInSuccess(false);
      }
    } catch {
      setSignInMessage('Network error. Please try again.');
      setSignInSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setSignUpMessage('');
    
    if (!firstName || !lastName) {
      setSignUpMessage('Please enter your first and last name');
      setSignUpSuccess(false);
      return;
    }
    if (!signUpEmail || !signUpPassword) {
      setSignUpMessage('Please enter email and password');
      setSignUpSuccess(false);
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpMessage('Password must be at least 6 characters');
      setSignUpSuccess(false);
      return;
    }
    if (!agreeTerms) {
      setSignUpMessage('Please agree to the Terms & Conditions');
      setSignUpSuccess(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `${firstName} ${lastName}`, 
          email: signUpEmail, 
          password: signUpPassword 
        }),
        credentials: 'include'
      });
      
      if (response.redirected) {
        window.location.href = response.url;
      } else if (response.ok) {
        router.replace('/');
      } else {
        const errorText = await response.text();
        setSignUpMessage(errorText || 'Failed to create account');
        setSignUpSuccess(false);
      }
    } catch {
      setSignUpMessage('Network error. Please try again.');
      setSignUpSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.href = `${BACKEND_URL}/api/auth/google`;
    }, 500);
  };

  const handleLogoutFromLogin = () => {
    setLoading(true);
    setUser({ authenticated: false });
    
    fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    })
      .finally(() => {
        setTimeout(() => {
          window.location.replace('/');
        }, 100);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-x-hidden bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,#0a0e1a_50%)]">
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
      `}</style>

      {/* Background Effects */}
      <div className="absolute w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(139,92,246,0.15)_0%,transparent_70%)] top-[-200px] right-[-200px] rounded-full pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(59,130,246,0.1)_0%,transparent_70%)] bottom-[-150px] left-[-150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[1000px] bg-[rgba(15,23,42,0.7)] backdrop-blur-[20px] rounded-3xl border border-[rgba(255,255,255,0.1)] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] grid grid-cols-1 md:grid-cols-[45%_55%] relative z-10">
        
        {/* Left Panel */}
        <div className="bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] p-12 md:p-[60px_50px] flex flex-col justify-between relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-50" 
            style={{
              backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E')`
            }}
          />
          
          <div className="flex items-center gap-3.5 mb-[60px] relative z-10">
            <div className="w-[52px] h-[52px] bg-[rgba(255,255,255,0.2)] rounded-xl flex items-center justify-center backdrop-blur-[10px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
                <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="white" opacity="0.7"/>
                <path d="M12 12L2 7V12L12 17L22 12V7L12 12Z" fill="white" opacity="0.5"/>
              </svg>
            </div>
            <div className="text-[26px] font-bold text-white tracking-tight">Ownquesta</div>
          </div>

          <div className="relative z-10">
            <h1 className="text-[38px] font-bold leading-tight mb-5 text-white">Capturing Moments, Creating Memories</h1>
            <p className="text-base leading-relaxed text-[rgba(255,255,255,0.9)] mb-[30px]">
              Join thousands of users who trust Ownquesta for powerful AI-driven services and seamless experiences.
            </p>
            
            <ul className="list-none hidden md:block">
              {[
                'Advanced AI-powered tools',
                'Secure cloud storage',
                '24/7 customer support'
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 mb-3.5 text-[rgba(255,255,255,0.95)] text-[15px]">
                  <span className="w-6 h-6 bg-[rgba(255,255,255,0.2)] rounded-md flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="p-12 md:p-[60px_50px] bg-[#0f1623]">
          
          {/* Sign In View */}
          {!isSignUp && (
            <div>
              {/* If user already authenticated, show user name + dropdown instead of sign-in form */}
              {currentUser?.authenticated ? (
                <div id="login-user-dropdown" className="relative">
                  <div
                    className="flex items-center gap-3.5 cursor-pointer px-4 py-3 rounded-lg transition-all hover:bg-[rgba(110,84,200,0.05)]"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  >
                    <img src={currentUser.avatar || 'https://via.placeholder.com/36'} alt="User" className="w-9 h-9 rounded-full border-2 border-[rgba(110,84,200,0.6)]" />
                    <span className="text-lg font-medium text-white">{currentUser.name}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 11L3 6h10l-5 5z" />
                    </svg>
                  </div>

                  {userDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2.5 bg-[rgba(11,18,33,0.95)] backdrop-blur-md rounded-xl shadow-[0_8px_32px_rgba(110,84,200,0.3)] border border-[rgba(255,255,255,0.05)] min-w-[200px]">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => { setUserDropdownOpen(false); router.push('/profile'); }}
                        onKeyPress={(e) => { if (e.key === 'Enter') { setUserDropdownOpen(false); router.push('/profile'); } }}
                        className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.03)] transition-all hover:bg-[rgba(110,84,200,0.05)] hover:pl-6 cursor-pointer"
                      >
                        <span>Profile</span>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => { setUserDropdownOpen(false); handleLogoutFromLogin(); }}
                        onKeyPress={(e) => { if (e.key === 'Enter') { setUserDropdownOpen(false); handleLogoutFromLogin(); } }}
                        className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all hover:bg-[rgba(110,84,200,0.05)] hover:pl-6"
                      >
                        <span>Logout</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
              <div className="mb-8">
                <h2 className="text-[32px] font-bold mb-2.5 text-[#f8fafc]">Welcome Back</h2>
                <p className="text-[15px] text-[#94a3b8]">
                  Don't have an account?{' '}
                  <span 
                    onClick={() => setIsSignUp(true)} 
                    className="text-[#8b5cf6] font-semibold cursor-pointer hover:text-[#7c3aed] transition-colors"
                  >
                    Sign up
                  </span>
                </p>
              </div>

              <div>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-[#f8fafc] mb-2">Email Address</label>
                  <input 
                    type="email"
                    placeholder="you@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full p-3.5 rounded-lg border border-[#1e293b] bg-[rgba(15,23,42,0.5)] text-[#f8fafc] text-[15px] transition-all focus:outline-none focus:border-[#8b5cf6] focus:bg-[rgba(15,23,42,0.8)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] placeholder:text-[#94a3b8]"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-[#f8fafc] mb-2">Password</label>
                  <input 
                    type="password"
                    placeholder="Enter your password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                    className="w-full p-3.5 rounded-lg border border-[#1e293b] bg-[rgba(15,23,42,0.5)] text-[#f8fafc] text-[15px] transition-all focus:outline-none focus:border-[#8b5cf6] focus:bg-[rgba(15,23,42,0.8)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] placeholder:text-[#94a3b8]"
                  />
                </div>

                <button 
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full p-[15px] rounded-lg border-none text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </button>

                <div className="flex items-center gap-4 my-6 text-[#94a3b8] text-sm">
                  <div className="flex-1 h-px bg-[#1e293b]" />
                  or continue with
                  <div className="flex-1 h-px bg-[#1e293b]" />
                </div>

                <button
                  onClick={handleGoogleAuth}
                  className="w-full p-[15px] rounded-lg font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.05)] border border-[#1e293b] text-[#f8fafc] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {signInMessage && (
                  <div className={`mt-4 p-3.5 rounded-lg text-sm ${
                    signInSuccess 
                      ? 'bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] text-[#6ee7b7]'
                      : 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5]'
                  }`}>
                    {signInMessage}
                  </div>
                )}
              </div>
              </div>
              )}
            </div>
          )}

          {/* Sign Up View */}
          {isSignUp && (
            <div>
              <div className="mb-8">
                <h2 className="text-[32px] font-bold mb-2.5 text-[#f8fafc]">Create Account</h2>
                <p className="text-[15px] text-[#94a3b8]">
                  Already have an account?{' '}
                  <span 
                    onClick={() => setIsSignUp(false)}
                    className="text-[#8b5cf6] font-semibold cursor-pointer hover:text-[#7c3aed] transition-colors"
                  >
                    Sign in
                  </span>
                </p>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#f8fafc] mb-2">First Name</label>
                    <input 
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full p-3.5 rounded-lg border border-[#1e293b] bg-[rgba(15,23,42,0.5)] text-[#f8fafc] text-[15px] transition-all focus:outline-none focus:border-[#8b5cf6] focus:bg-[rgba(15,23,42,0.8)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] placeholder:text-[#94a3b8]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#f8fafc] mb-2">Last Name</label>
                    <input 
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full p-3.5 rounded-lg border border-[#1e293b] bg-[rgba(15,23,42,0.5)] text-[#f8fafc] text-[15px] transition-all focus:outline-none focus:border-[#8b5cf6] focus:bg-[rgba(15,23,42,0.8)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] placeholder:text-[#94a3b8]"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-[#f8fafc] mb-2">Email Address</label>
                  <input 
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full p-3.5 rounded-lg border border-[#1e293b] bg-[rgba(15,23,42,0.5)] text-[#f8fafc] text-[15px] transition-all focus:outline-none focus:border-[#8b5cf6] focus:bg-[rgba(15,23,42,0.8)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] placeholder:text-[#94a3b8]"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-[#f8fafc] mb-2">Password</label>
                  <input 
                    type="password"
                    placeholder="Create a strong password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
                    className="w-full p-3.5 rounded-lg border border-[#1e293b] bg-[rgba(15,23,42,0.5)] text-[#f8fafc] text-[15px] transition-all focus:outline-none focus:border-[#8b5cf6] focus:bg-[rgba(15,23,42,0.8)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] placeholder:text-[#94a3b8]"
                  />
                </div>

                <div className="flex items-center gap-2.5 my-5">
                  <input 
                    type="checkbox" 
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-[18px] h-[18px] cursor-pointer accent-[#8b5cf6]"
                  />
                  <label htmlFor="agreeTerms" className="text-sm font-normal cursor-pointer text-[#f8fafc]">
                    I agree to the <span className="text-[#8b5cf6] no-underline cursor-pointer">Terms & Conditions</span>
                  </label>
                </div>

                <button 
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full p-[15px] rounded-lg border-none text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Creating account...
                    </>
                  ) : 'Create Account'}
                </button>

                <div className="flex items-center gap-4 my-6 text-[#94a3b8] text-sm">
                  <div className="flex-1 h-px bg-[#1e293b]" />
                  or continue with
                  <div className="flex-1 h-px bg-[#1e293b]" />
                </div>

                <button
                  onClick={handleGoogleAuth}
                  className="w-full p-[15px] rounded-lg font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.05)] border border-[#1e293b] text-[#f8fafc] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {signUpMessage && (
                  <div className={`mt-4 p-3.5 rounded-lg text-sm ${
                    signUpSuccess 
                      ? 'bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] text-[#6ee7b7]'
                      : 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5]'
                  }`}>
                    {signUpMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}