'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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
  
  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // OTP expiry timer (2 minutes)
  function OtpExpiryInfo() {
    const [secondsLeft, setSecondsLeft] = useState(120);
    useEffect(() => {
      if (forgotStep !== 'otp') return;
      setSecondsLeft(120);
      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }, [forgotStep]);

    const min = Math.floor(secondsLeft / 60);
    const sec = secondsLeft % 60;
    return (
      <div className="text-xs text-[#dc2626] mt-1">
        ⚠️ OTP expires in <span className="font-bold">{min}:{sec.toString().padStart(2, '0')}</span> minutes
      </div>
    );
  }
  
  const [currentUser, setCurrentUser] = useState<{ authenticated: boolean; name?: string; avatar?: string } | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    // Check authentication status on mount
    fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setCurrentUser({ authenticated: true, name: data.user.name, avatar: data.user.avatar });
          } else {
            setCurrentUser({ authenticated: false });
          }
        } else {
          setCurrentUser({ authenticated: false });
        }
      })
      .catch(() => setCurrentUser({ authenticated: false }));
  }, [BACKEND_URL]);

  // Mouse tracking for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        // Login successful - redirect to home page
        window.location.href = '/home';
      } else {
        const data = await response.json();
        setSignInMessage(data.message || data.error || 'Invalid email or password');
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
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `${firstName} ${lastName}`, 
          email: signUpEmail, 
          password: signUpPassword 
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        // Signup successful - redirect to home page
        window.location.href = '/home';
      } else {
        const data = await response.json().catch(() => ({ message: 'Failed to create account' }));
        setSignUpMessage(data.message || data.error || 'Failed to create account');
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
    setCurrentUser({ authenticated: false });
    
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

  const handleForgotPassword = async () => {
    setForgotMessage('');
    
    if (!forgotEmail) {
      setForgotMessage('Please enter your email address');
      setForgotSuccess(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      
      if (response.ok) {
        setForgotStep('otp');
        setForgotMessage('OTP sent to your email. Please check your inbox.');
        setForgotSuccess(true);
      } else {
        const data = await response.json();
        setForgotMessage(data.message || 'Failed to send OTP');
        setForgotSuccess(false);
      }
    } catch {
      setForgotMessage('Network error. Please try again.');
      setForgotSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setForgotMessage('');
    
    if (!otp) {
      setForgotMessage('Please enter the OTP');
      setForgotSuccess(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp }),
      });
      
      if (response.ok) {
        setForgotStep('reset');
        setForgotMessage('OTP verified successfully. Please set your new password.');
        setForgotSuccess(true);
      } else {
        const data = await response.json();
        setForgotMessage(data.message || 'Invalid OTP');
        setForgotSuccess(false);
      }
    } catch {
      setForgotMessage('Network error. Please try again.');
      setForgotSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotMessage('');
    
    if (!newPassword || !confirmPassword) {
      setForgotMessage('Please enter both password fields');
      setForgotSuccess(false);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setForgotMessage('Passwords do not match');
      setForgotSuccess(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setForgotMessage('Password must be at least 6 characters');
      setForgotSuccess(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp, newPassword }),
      });
      
      if (response.ok) {
        setForgotMessage('Password reset successfully! You can now sign in with your new password.');
        setForgotSuccess(true);
        setTimeout(() => {
          setIsForgotPassword(false);
          setForgotStep('email');
          setForgotEmail('');
          setOtp('');
          setNewPassword('');
          setConfirmPassword('');
          setForgotMessage('');
        }, 3000);
      } else {
        const data = await response.json();
        setForgotMessage(data.message || 'Failed to reset password');
        setForgotSuccess(false);
      }
    } catch {
      setForgotMessage('Network error. Please try again.');
      setForgotSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setIsForgotPassword(false);
    setForgotStep('email');
    setForgotEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotMessage('');
    setForgotSuccess(false);
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
              {/* If user already authenticated, show user info and dashboard button */}
              {currentUser?.authenticated ? (
                <div className="space-y-6">
                  <div className="bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.3)] rounded-xl p-6 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <img 
                        src={currentUser.avatar || 'https://via.placeholder.com/80'} 
                        alt="User" 
                        className="w-20 h-20 rounded-full border-4 border-[rgba(139,92,246,0.6)]" 
                      />
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Welcome back!</h3>
                        <p className="text-[#94a3b8]">{currentUser.name}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => router.push('/home')}
                    className="w-full p-[15px] rounded-lg border-none text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)]"
                  >
                    Go to Dashboard
                  </button>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => router.push('/profile')}
                      className="flex-1 p-[12px] rounded-lg border border-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] hover:border-[#8b5cf6] transition-all text-sm"
                    >
                      Profile
                    </button>
                    <button 
                      onClick={handleLogoutFromLogin}
                      className="flex-1 p-[12px] rounded-lg border border-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] hover:border-[#8b5cf6] transition-all text-sm"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div>
              <div className="mb-8">
                <h2 className="text-[32px] font-bold mb-2.5 text-[#f8fafc]">
                  {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
                </h2>
                <p className="text-[15px] text-[#94a3b8]">
                  {isForgotPassword ? (
                    <>
                      Remember your password?{' '}
                      <span 
                        onClick={resetForgotPassword} 
                        className="text-[#8b5cf6] font-semibold cursor-pointer hover:text-[#7c3aed] transition-colors"
                      >
                        Sign in
                      </span>
                    </>
                  ) : (
                    <>
                      Don't have an account?{' '}
                      <span 
                        onClick={() => setIsSignUp(true)} 
                        className="text-[#8b5cf6] font-semibold cursor-pointer hover:text-[#7c3aed] transition-colors"
                      >
                        Sign up
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div>
                {/* Sign In Form */}
                {!isForgotPassword && (
                  <>
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
                      <div className="mt-2 text-right">
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-sm text-[#8b5cf6] hover:text-[#7c3aed] transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
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
                  </>
                )}

                {/* Forgot Password Form */}
                {isForgotPassword && (
                  <>
                    {forgotStep === 'email' && (
                      <>
                        <div className="mb-5">
                          <label className="block text-sm font-semibold text-[#f8fafc] mb-2">Email Address</label>
                          <input 
                            type="email"
                            placeholder="you@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full p-3.5 rounded-lg border border-[#1e293b] bg-[rgba(15,23,42,0.5)] text-[#f8fafc] text-[15px] transition-all focus:outline-none focus:border-[#8b5cf6] focus:bg-[rgba(15,23,42,0.8)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] placeholder:text-[#94a3b8]"
                          />
                        </div>

                        <button 
                          onClick={handleForgotPassword}
                          disabled={loading}
                          className="w-full p-[15px] rounded-lg border-none text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                          {loading ? (
                            <>
                              <span className="spinner" />
                              Sending OTP...
                            </>
                          ) : 'Send OTP'}
                        </button>
                      </>
                    )}

                    {forgotStep === 'otp' && (
                      <>
                        <div className="mb-5">
                          <label className="block text-sm font-semibold text-[#f8fafc] mb-2">Enter OTP</label>
                          <input 
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full p-3.5 rounded-lg border border-[#1e293b] bg-[rgba(15,23,42,0.5)] text-[#f8fafc] text-[15px] transition-all focus:outline-none focus:border-[#8b5cf6] focus:bg-[rgba(15,23,42,0.8)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] placeholder:text-[#94a3b8]"
                          />
                          <OtpExpiryInfo />
                        </div>

                        <button 
                          onClick={handleVerifyOtp}
                          disabled={loading}
                          className="w-full p-[15px] rounded-lg border-none text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                          {loading ? (
                            <>
                              <span className="spinner" />
                              Verifying...
                            </>
                          ) : 'Verify OTP'}
                        </button>

                        <button 
                          onClick={() => setForgotStep('email')}
                          className="w-full mt-3 p-[12px] rounded-lg border border-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] hover:border-[#8b5cf6] transition-all"
                        >
                          Back
                        </button>
                      </>
                    )}

                    {forgotStep === 'reset' && (
                      <>
                        <div className="mb-5">
                          <label className="block text-sm font-semibold text-[#f8fafc] mb-2">New Password</label>
                          <input 
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3.5 rounded-lg border border-[#1e293b] bg-[rgba(15,23,42,0.5)] text-[#f8fafc] text-[15px] transition-all focus:outline-none focus:border-[#8b5cf6] focus:bg-[rgba(15,23,42,0.8)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] placeholder:text-[#94a3b8]"
                          />
                        </div>

                        <div className="mb-5">
                          <label className="block text-sm font-semibold text-[#f8fafc] mb-2">Confirm New Password</label>
                          <input 
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3.5 rounded-lg border border-[#1e293b] bg-[rgba(15,23,42,0.5)] text-[#f8fafc] text-[15px] transition-all focus:outline-none focus:border-[#8b5cf6] focus:bg-[rgba(15,23,42,0.8)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] placeholder:text-[#94a3b8]"
                          />
                        </div>

                        <button 
                          onClick={handleResetPassword}
                          disabled={loading}
                          className="w-full p-[15px] rounded-lg border-none text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                          {loading ? (
                            <>
                              <span className="spinner" />
                              Resetting...
                            </>
                          ) : 'Reset Password'}
                        </button>

                        <button 
                          onClick={() => setForgotStep('otp')}
                          className="w-full mt-3 p-[12px] rounded-lg border border-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] hover:border-[#8b5cf6] transition-all"
                        >
                          Back
                        </button>
                      </>
                    )}

                    {forgotMessage && (
                      <div className={`mt-4 p-3.5 rounded-lg text-sm ${
                        forgotSuccess 
                          ? 'bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] text-[#6ee7b7]'
                          : 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5]'
                      }`}>
                        {forgotMessage}
                      </div>
                    )}
                  </>
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