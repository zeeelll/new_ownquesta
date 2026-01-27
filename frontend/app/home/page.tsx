'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Chatbot from '../components/Chatbot';

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
    // Check authentication status
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) {
        setUser(prev => prev ? { ...prev, avatar: savedAvatar } : { authenticated: false, avatar: savedAvatar });
      }
    }
    fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUser({
            authenticated: true,
            name: data.user.name,
            avatar: data.user.avatar,
            userId: data.user.userId
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem('userAvatar', data.user.avatar || '');
            localStorage.setItem('userId', data.user.userId || '');
          }
        } else {
          // If not authenticated, redirect to login
          window.location.href = '/login';
        }
      })
      .catch(err => {
        console.error('Auth check failed:', err);
        window.location.href = '/login';
      });

    // Scroll handler
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const progress = scrollY / (documentHeight - windowHeight);
      setScrollProgress(progress);
      
      setIsScrolled(scrollY > 100);
      
      if (scrollY > 100 && scrollY > lastScrollY.current) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }
      
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [BACKEND_URL]);

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
    try {
      setUserDropdownOpen(false);
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } finally {
      window.location.href = '/';
    }
  };

  if (!user?.authenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="relative text-[#e6eef8] overflow-x-hidden min-h-screen">
      {/* Video Background */}
      <div className="fixed top-0 left-0 w-full h-full z-0 overflow-hidden bg-[#1a1a2e]">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute min-w-full min-h-full w-auto h-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover"
          src="/videos/background.mp4"
        />
      </div>
      
      {/* Dark overlay for better text readability */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-[1]" />

      <style jsx global>{`
        @keyframes logoShine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          50%, 100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        .logo-shine {
          animation: logoShine 3s ease-in-out infinite;
        }

        .gradient-text {
          color: #ffffff;
          font-weight: 900;
        }
      `}</style>

      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-[#6e54c8] to-[#7c49a9] z-[1000] transition-transform duration-100"
        style={{ transform: `scaleX(${scrollProgress})`, transformOrigin: 'left' }}
      />

      {/* Navigation Bar */}
      <nav 
        className={`fixed top-0 left-0 right-0 px-10 py-4 flex justify-between items-center bg-transparent z-[100] transition-all duration-500 ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <Logo href="/home" size="md" />

        <div className="flex items-center gap-3">
          <div id="user-dropdown" className="relative">
            <div 
              className="cursor-pointer transition-all hover:opacity-80"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              <img src={user.avatar || 'https://via.placeholder.com/36'} alt="User" className="w-10 h-10 rounded-full border-2 border-[rgba(110,84,200,0.6)] hover:border-[rgba(110,84,200,0.9)]" />
            </div>
            
            {userDropdownOpen && (
              <div className="absolute top-full right-0 mt-2.5 bg-[rgba(11,18,33,0.95)] backdrop-blur-md rounded-xl shadow-[0_8px_32px_rgba(110,84,200,0.3)] border border-[rgba(255,255,255,0.1)] min-w-[200px]">
                <Link href="/profile" className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.05)] transition-all hover:bg-[rgba(110,84,200,0.2)] hover:pl-6">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Profile</span>
                </Link>
                <div onClick={handleLogout} className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all hover:bg-[rgba(110,84,200,0.2)] hover:pl-6">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Authenticated User Home */}
      <section className="min-h-screen flex items-center justify-center px-5 pt-[180px] pb-[120px]">
        <div className="w-full max-w-[900px] text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 gradient-text">
            Hey {user.name?.split(' ')[0]}, Welcome to Ownquesta!
          </h1>
          
          <p className="text-lg text-white leading-relaxed max-w-[700px] mx-auto mb-20">
            Start your journey with Ownquesta and transform data into powerful AI models—no coding required. Your next breakthrough is just one click away.
          </p>

          <Button 
            href="/dashboard"
            size="lg"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            }
          >
            Go to Dashboard
          </Button>
        </div>
      </section>

      {/* Chatbot Widget */}
      {user?.userId && <Chatbot userId={user.userId} />}
    </div>
  );
}