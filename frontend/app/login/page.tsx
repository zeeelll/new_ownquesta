'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../components/Logo';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // Sign In
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInMessage, setSignInMessage] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);

  // Sign Up
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [isSignUpPasswordStrong, setIsSignUpPasswordStrong] = useState(false);
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signUpMessage, setSignUpMessage] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [currentUser, setCurrentUser] = useState<{ authenticated: boolean; name?: string; avatar?: string } | null>(null);

  // OTP expiry timer
  function OtpExpiryInfo() {
    const [secondsLeft, setSecondsLeft] = useState(120);
    useEffect(() => {
      if (forgotStep !== 'otp') return;
      setSecondsLeft(120);
      const interval = setInterval(() => {
        setSecondsLeft(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
      }, 1000);
      return () => clearInterval(interval);
    }, [forgotStep]);
    const min = Math.floor(secondsLeft / 60);
    const sec = secondsLeft % 60;
    return (
      <div className="text-xs text-[#f87171] mt-1.5 flex items-center gap-1.5">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        OTP expires in <span className="font-semibold tabular-nums">{min}:{sec.toString().padStart(2, '0')}</span>
      </div>
    );
  }

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(async res => {
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data?.user ? { authenticated: true, name: data.user.name, avatar: data.user.avatar } : { authenticated: false });
        } else { setCurrentUser({ authenticated: false }); }
      })
      .catch(() => setCurrentUser({ authenticated: false }));
  }, [BACKEND_URL]);

  const handleSignIn = async () => {
    setSignInMessage('');
    if (!signInEmail || !signInPassword) { setSignInMessage('Please enter email and password.'); setSignInSuccess(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }), credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.user?.role === 'admin' ? '/admin' : '/home';
      } else {
        const data = await res.json();
        setSignInMessage(data.message || data.error || 'Invalid email or password.');
        setSignInSuccess(false);
      }
    } catch { setSignInMessage('Network error. Please try again.'); setSignInSuccess(false); }
    finally { setLoading(false); }
  };

  const handleSignUp = async () => {
    setSignUpMessage('');
    if (!firstName || !lastName) { setSignUpMessage('Please enter your first and last name.'); setSignUpSuccess(false); return; }
    if (!signUpEmail || !signUpPassword) { setSignUpMessage('Please enter email and password.'); setSignUpSuccess(false); return; }
    if (!isSignUpPasswordStrong) { setSignUpMessage(passwordStrengthMessage || 'Please choose a stronger password.'); setSignUpSuccess(false); return; }
    if (!agreeTerms) { setSignUpMessage('Please agree to the Terms & Conditions.'); setSignUpSuccess(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${firstName} ${lastName}`, email: signUpEmail, password: signUpPassword }), credentials: 'include',
      });
      if (res.ok) { window.location.href = '/home'; }
      else {
        const data = await res.json().catch(() => ({ message: 'Failed to create account' }));
        setSignUpMessage(data.message || data.error || 'Failed to create account.');
        setSignUpSuccess(false);
      }
    } catch { setSignUpMessage('Network error. Please try again.'); setSignUpSuccess(false); }
    finally { setLoading(false); }
  };

  const handleGoogleAuth = () => {
    setLoading(true);
    setTimeout(() => { window.location.href = `${BACKEND_URL}/api/auth/google`; }, 500);
  };

  const handleLogoutFromLogin = () => {
    setLoading(true);
    setCurrentUser({ authenticated: false });
    fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
      .finally(() => setTimeout(() => window.location.replace('/'), 100));
  };

  const handleForgotPassword = async () => {
    setForgotMessage('');
    if (!forgotEmail) { setForgotMessage('Please enter your email address.'); setForgotSuccess(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail }) });
      if (res.ok) { setForgotStep('otp'); setForgotMessage('OTP sent to your email. Please check your inbox.'); setForgotSuccess(true); }
      else { const data = await res.json(); setForgotMessage(data.message || 'Failed to send OTP.'); setForgotSuccess(false); }
    } catch { setForgotMessage('Network error. Please try again.'); setForgotSuccess(false); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setForgotMessage('');
    if (!otp) { setForgotMessage('Please enter the OTP.'); setForgotSuccess(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, otp }) });
      if (res.ok) { setForgotStep('reset'); setForgotMessage('OTP verified. Set your new password.'); setForgotSuccess(true); }
      else { const data = await res.json(); setForgotMessage(data.message || 'Invalid OTP.'); setForgotSuccess(false); }
    } catch { setForgotMessage('Network error. Please try again.'); setForgotSuccess(false); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    setForgotMessage('');
    if (!newPassword || !confirmPassword) { setForgotMessage('Please fill both password fields.'); setForgotSuccess(false); return; }
    if (newPassword !== confirmPassword) { setForgotMessage('Passwords do not match.'); setForgotSuccess(false); return; }
    const v = validatePassword(newPassword);
    if (!v.ok) { setForgotMessage(v.message); setForgotSuccess(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, otp, newPassword }) });
      if (res.ok) {
        setForgotMessage('Password reset successfully! You can now sign in.');
        setForgotSuccess(true);
        setTimeout(() => { setIsForgotPassword(false); setForgotStep('email'); setForgotEmail(''); setOtp(''); setNewPassword(''); setConfirmPassword(''); setForgotMessage(''); }, 3000);
      } else { const data = await res.json(); setForgotMessage(data.message || 'Failed to reset password.'); setForgotSuccess(false); }
    } catch { setForgotMessage('Network error. Please try again.'); setForgotSuccess(false); }
    finally { setLoading(false); }
  };

  const resetForgotPassword = () => {
    setIsForgotPassword(false); setForgotStep('email'); setForgotEmail(''); setOtp('');
    setNewPassword(''); setConfirmPassword(''); setForgotMessage(''); setForgotSuccess(false);
  };

  const inputClass = "w-full px-4 py-3.5 rounded-xl border bg-[rgba(10,11,20,0.5)] text-white text-sm transition-all duration-300 focus:outline-none placeholder-[#4a5568] border-white/[0.08] focus:border-[rgba(110,84,200,0.6)] focus:bg-[rgba(10,11,20,0.8)] focus:shadow-[0_0_0_3px_rgba(110,84,200,0.12),0_0_20px_rgba(110,84,200,0.06)] hover:border-white/[0.15] font-chillax";
  const labelClass = "block text-xs font-semibold text-[#c5d4ed] mb-2 tracking-wide uppercase";
  const primaryBtn = `w-full py-4 rounded-xl font-semibold text-sm tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-[#6e54c8] to-[#7c49a9] text-white hover:from-[#7c62d6] hover:to-[#8a57b7] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(110,84,200,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 font-chillax`;
  const ghostBtn = `w-full py-3.5 rounded-xl font-medium text-sm tracking-wide cursor-pointer transition-all duration-300 border border-white/[0.08] text-[#8fa3c4] hover:text-white hover:border-white/[0.2] hover:bg-white/[0.04] font-chillax`;

  // Password validator: requires min 8 chars, uppercase, lowercase, number and special char
  function validatePassword(pw: string) {
    if (!pw || pw.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' };
    if (!/[a-z]/.test(pw)) return { ok: false, message: 'Password should include a lowercase letter.' };
    if (!/[A-Z]/.test(pw)) return { ok: false, message: 'Password should include an uppercase letter.' };
    if (!/[0-9]/.test(pw)) return { ok: false, message: 'Password should include a number.' };
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) return { ok: false, message: 'Password should include a special character.' };
    return { ok: true, message: '' };
  }

  useEffect(() => {
    const v = validatePassword(signUpPassword);
    setIsSignUpPasswordStrong(v.ok);
    setPasswordStrengthMessage(v.message);
  }, [signUpPassword]);

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-5 md:p-8 relative overflow-x-hidden font-chillax" style={{ background: 'radial-gradient(ellipse at top left, #1a1040 0%, #0a0b14 55%, #0e1020 100%)' }}>
      {/* Ambient orbs */}
      <div className="fixed top-1/4 -left-32 w-80 h-80 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #7c5cbf 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="fixed bottom-1/4 -right-32 w-80 h-80 rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #4f3ba0 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="w-full max-w-[1020px] rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-white/[0.06] grid grid-cols-1 md:grid-cols-[42%_58%] relative z-10">

        {/* Left Panel */}
        <div className="relative flex flex-col justify-between p-8 sm:p-10 md:p-12 overflow-hidden" style={{ background: 'linear-gradient(145deg, #5b3fa0 0%, #7c5cbf 40%, #4a3280 100%)' }}>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E")` }} />
          {/* Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

          <div className="relative z-10">
            <Logo href="/" size="lg" showText={true} variant="light" />
          </div>

          <div className="relative z-10 mt-auto">
            <h1 className="text-2xl sm:text-3xl md:text-[2rem] font-bold leading-snug mb-4 text-white tracking-tight">
              Unlock the power of your data
            </h1>
            <p className="text-sm leading-relaxed text-white/80 mb-8 font-[350]">
              Join thousands of teams using Ownquesta to build production-ready AI models without writing a single line of code.
            </p>
            <ul className="hidden md:flex flex-col gap-3.5">
              {['Advanced AI-powered tools', 'Secure cloud storage', 'Explainable AI results'].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-white/90 text-sm font-[400]">
                  <span className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="p-7 sm:p-9 md:p-12 bg-[#0b0d1a]">

          {/* Already authenticated */}
          {!isSignUp && currentUser?.authenticated ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Welcome back!</h2>
                <p className="text-sm text-[#8fa3c4]">You're already signed in</p>
              </div>
              <div className="glass-purple rounded-2xl p-6 text-center border border-white/[0.06]">
                <img src={currentUser.avatar || 'https://via.placeholder.com/80'} alt="User" className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-[rgba(110,84,200,0.5)] object-cover" />
                <p className="text-lg font-semibold text-white">{currentUser.name}</p>
              </div>
              <button onClick={() => router.push('/home')} className={primaryBtn}>Go to Dashboard</button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => router.push('/profile')} className={ghostBtn}>Profile</button>
                <button onClick={handleLogoutFromLogin} className={ghostBtn}>Sign Out</button>
              </div>
            </div>

          ) : !isSignUp ? (
            /* Sign In */
            <div>
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">
                  {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
                </h2>
                <p className="text-sm text-[#8fa3c4]">
                  {isForgotPassword ? (
                    <>Remember your password?{' '}<button onClick={resetForgotPassword} className="text-[#a87edf] font-semibold hover:text-white transition-colors">Sign in</button></>
                  ) : (
                    <>Don't have an account?{' '}<button onClick={() => setIsSignUp(true)} className="text-[#a87edf] font-semibold hover:text-white transition-colors">Create one</button></>
                  )}
                </p>
              </div>

              {!isForgotPassword && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" placeholder="you@example.com" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className={labelClass} style={{ marginBottom: 0 }}>Password</label>
                      <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-[#a87edf] hover:text-white transition-colors tracking-wide">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <input type={showSignInPassword ? 'text' : 'password'} placeholder="Enter your password" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()} className={`${inputClass} pr-12`} />
                      <button type="button" onClick={() => setShowSignInPassword(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a87edf] hover:text-white transition-colors">{showSignInPassword ? 'Hide' : 'Show'}</button>
                    </div>
                  </div>

                  <button onClick={handleSignIn} disabled={loading} className={primaryBtn}>
                    {loading ? <><span className="spinner" />Signing in…</> : 'Sign In'}
                  </button>

                  <div className="flex items-center gap-3 text-[#4a5568] text-xs">
                    <div className="flex-1 h-px bg-white/[0.06]" />or continue with<div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  <button onClick={handleGoogleAuth} className="w-full py-3.5 rounded-xl font-medium text-sm tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 border border-white/[0.08] text-[#c5d4ed] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.15] font-chillax">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  {signInMessage && (
                    <div className={`p-3.5 rounded-xl text-sm ${signInSuccess ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                      {signInMessage}
                    </div>
                  )}
                </div>
              )}

              {/* Forgot Password Flow */}
              {isForgotPassword && (
                <div className="space-y-4">
                  {forgotStep === 'email' && (
                    <>
                      <div>
                        <label className={labelClass}>Email Address</label>
                        <input type="email" placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className={inputClass} />
                      </div>
                      <button onClick={handleForgotPassword} disabled={loading} className={primaryBtn}>
                        {loading ? <><span className="spinner" />Sending…</> : 'Send OTP'}
                      </button>
                    </>
                  )}
                  {forgotStep === 'otp' && (
                    <>
                      <div>
                        <label className={labelClass}>Enter OTP</label>
                        <input type="text" placeholder="6-digit code" value={otp} onChange={e => setOtp(e.target.value)} className={inputClass} />
                        <OtpExpiryInfo />
                      </div>
                      <button onClick={handleVerifyOtp} disabled={loading} className={primaryBtn}>
                        {loading ? <><span className="spinner" />Verifying…</> : 'Verify OTP'}
                      </button>
                      <button onClick={() => setForgotStep('email')} className={ghostBtn}>Back</button>
                    </>
                  )}
                  {forgotStep === 'reset' && (
                    <>
                      <div>
                        <label className={labelClass}>New Password</label>
                        <div className="relative">
                          <input type={showNewPassword ? 'text' : 'password'} placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={`${inputClass} pr-12`} />
                          <button type="button" onClick={() => setShowNewPassword(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a87edf] hover:text-white transition-colors">{showNewPassword ? 'Hide' : 'Show'}</button>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Confirm Password</label>
                        <div className="relative">
                          <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`${inputClass} pr-12`} />
                          <button type="button" onClick={() => setShowConfirmPassword(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a87edf] hover:text-white transition-colors">{showConfirmPassword ? 'Hide' : 'Show'}</button>
                        </div>
                      </div>
                      <button onClick={handleResetPassword} disabled={loading} className={primaryBtn}>
                        {loading ? <><span className="spinner" />Resetting…</> : 'Reset Password'}
                      </button>
                      <button onClick={() => setForgotStep('otp')} className={ghostBtn}>Back</button>
                    </>
                  )}
                  {forgotMessage && (
                    <div className={`p-3.5 rounded-xl text-sm ${forgotSuccess ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                      {forgotMessage}
                    </div>
                  )}
                </div>
              )}
            </div>

          ) : (
            /* Sign Up */
            <div>
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">Create Account</h2>
                <p className="text-sm text-[#8fa3c4]">
                  Already have an account?{' '}
                  <button onClick={() => setIsSignUp(false)} className="text-[#a87edf] font-semibold hover:text-white transition-colors">Sign in</button>
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input type="text" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" placeholder="you@example.com" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <input type={showSignUpPassword ? 'text' : 'password'} placeholder="Create a strong password (min. 8 chars)" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignUp()} className={`${inputClass} pr-12`} />
                    <button type="button" onClick={() => setShowSignUpPassword(prev => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a87edf] hover:text-white transition-colors">{showSignUpPassword ? 'Hide' : 'Show'}</button>
                  </div>
                  {signUpPassword && (
                    <div className={`text-xs mt-2 ${isSignUpPasswordStrong ? 'text-emerald-300' : 'text-red-400'}`}>{isSignUpPasswordStrong ? 'Strong password' : passwordStrengthMessage}</div>
                  )}
                </div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" id="agreeTerms" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 w-4 h-4 cursor-pointer accent-[#7c5cbf] flex-shrink-0" />
                  <span className="text-sm text-[#8fa3c4] group-hover:text-[#c5d4ed] transition-colors">
                    I agree to the{' '}
                    <span className="text-[#a87edf] hover:text-white transition-colors">Terms & Conditions</span>
                  </span>
                </label>

                <button onClick={handleSignUp} disabled={loading || !isSignUpPasswordStrong} className={primaryBtn}>
                  {loading ? <><span className="spinner" />Creating account…</> : 'Create Account'}
                </button>

                <div className="flex items-center gap-3 text-[#4a5568] text-xs">
                  <div className="flex-1 h-px bg-white/[0.06]" />or continue with<div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                <button onClick={handleGoogleAuth} className="w-full py-3.5 rounded-xl font-medium text-sm tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 border border-white/[0.08] text-[#c5d4ed] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.15] font-chillax">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {signUpMessage && (
                  <div className={`p-3.5 rounded-xl text-sm ${signUpSuccess ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
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
