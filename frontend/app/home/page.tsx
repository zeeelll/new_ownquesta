'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';
import Button from '../components/Button';

type AuthUser = {
  authenticated: boolean;
  name?: string;
  avatar?: string;
  userId?: string;
};

export default function HomePage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastScrollY = useRef(0);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) setUser(prev => prev ? { ...prev, avatar: savedAvatar } : { authenticated: false, avatar: savedAvatar });
    }

    fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include', headers: { 'Accept': 'application/json' } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUser({ authenticated: true, name: data.user.name, avatar: data.user.avatar, userId: data.user.userId });
          if (typeof window !== 'undefined') {
            localStorage.setItem('userAvatar', data.user.avatar || '');
            localStorage.setItem('userId', data.user.userId || '');
          }
        } else {
          window.location.href = '/login';
        }
      })
      .catch(() => { window.location.href = '/login'; });

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      setScrollProgress(scrollY / (documentHeight - windowHeight));
      setIsScrolled(scrollY > 60);
      setNavHidden(scrollY > 120 && scrollY > lastScrollY.current);
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [BACKEND_URL]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('#user-dropdown')) setUserDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setUserDropdownOpen(false);
      await fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      window.location.href = '/';
    }
  };

  if (!user?.authenticated) return null;

  return (
    <div className="relative text-[#e6eef8] overflow-x-hidden min-h-screen font-chillax">
      {/* Video Background */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#0a0b14]">
        <video
          ref={videoRef}
          autoPlay loop muted playsInline
          className="absolute min-w-full min-h-full w-auto h-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover"
          src="/videos/background.mp4"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[2px] z-[1000]"
        style={{
          width: `${scrollProgress * 100}%`,
          background: 'linear-gradient(90deg, #6e54c8, #a87edf, #7c49a9)',
          transition: 'width 0.1s linear',
          boxShadow: '0 0 8px rgba(168,126,223,0.6)',
        }}
      />

      {/* Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 px-4 sm:px-6 md:px-10 py-3 md:py-4 flex justify-between items-center z-[100] transition-all duration-500 ${
          navHidden ? '-translate-y-full' : 'translate-y-0'
        } ${
          isScrolled
            ? 'bg-[rgba(10,11,20,0.75)] backdrop-blur-xl border-b border-white/[0.06]'
            : 'bg-transparent'
        }`}
      >
        <Logo href="/home" size="md" />

        <div className="flex items-center gap-2 sm:gap-3">
          <div id="user-dropdown" className="relative">
            <div
              className="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-xl transition-all hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              <img
                src={user.avatar || 'https://via.placeholder.com/36'}
                alt="User"
                className="w-8 h-8 rounded-full border-2 border-[rgba(110,84,200,0.5)] object-cover"
              />
              <svg className={`w-3.5 h-3.5 text-[#8fa3c4] transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 11L3 6h10l-5 5z"/>
              </svg>
            </div>

            {userDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 bg-[rgba(10,12,25,0.95)] backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] border border-white/[0.08] min-w-[200px] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-[#8fa3c4] mt-0.5">My Account</p>
                </div>
                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 transition-all hover:bg-white/[0.05] text-sm text-[#c5d4ed] hover:text-white">
                  <svg className="w-4 h-4 text-[#a87edf]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  Profile
                </Link>
                <div onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.05] text-sm text-[#8fa3c4] hover:text-white">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-5 md:px-8 pt-28 sm:pt-36 md:pt-44 pb-20">
        <div className="w-full max-w-[800px] text-center relative z-10">

          {/* Greeting badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-8 border border-white/10 bg-white/[0.04] backdrop-blur-sm text-[#a87edf] animate-fade-in-up">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Welcome back
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] mb-6 tracking-tight text-white animate-fade-in-up delay-100">
            Hey {user.name?.split(' ')[0]},{' '}
            <span className="gradient-text">ready to build?</span>
          </h1>

          <p className="text-base sm:text-lg text-[#8fa3c4] leading-relaxed max-w-[580px] mx-auto mb-12 px-2 animate-fade-in-up delay-200 font-[350]">
            Transform your data into powerful AI models — no coding required. Your next breakthrough is just one click away.
          </p>

          <div className="animate-fade-in-up delay-300">
            <Button
              href="/dashboard"
              size="lg"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              }
            >
              Go to Dashboard
            </Button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-16 max-w-[480px] mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards', opacity: 0 }}>
            {[
              { label: 'Models', value: '50+' },
              { label: 'Algorithms', value: 'Auto' },
              { label: 'Time Saved', value: '95%' },
            ].map((stat, i) => (
              <div key={i} className="glass-purple rounded-2xl py-4 px-3 border border-[rgba(110,84,200,0.15)]">
                <div className="text-2xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-xs text-[#8fa3c4] tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
