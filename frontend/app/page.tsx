'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

type AuthUser = {
  authenticated: boolean;
  name?: string;
  avatar?: string;
};

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const lastScrollY = useRef(0);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

  useEffect(() => {
    // Check authentication status
    fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          // User is authenticated, redirect to /home
          window.location.href = '/home';
        } else {
          setUser({ authenticated: false });
        }
      })
      .catch(err => {
        console.error('Auth check failed:', err);
        setUser({ authenticated: false });
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
      
      setShowScrollIndicator(scrollY < 100);
      
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll);
    
    // Show scroll indicator after delay (only for non-authenticated users)
    let timer: NodeJS.Timeout | undefined;
    let hideTimer: NodeJS.Timeout | undefined;
    
    if (!user?.authenticated) {
      timer = setTimeout(() => setShowScrollIndicator(true), 2000);
      hideTimer = setTimeout(() => setShowScrollIndicator(false), 8000);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timer) clearTimeout(timer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [BACKEND_URL, user]);

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

  return (
    <div className="relative bg-[#0a0e1a] text-[#e6eef8] overflow-x-hidden">
      <style jsx global>{`
        @keyframes logoShine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          50%, 100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        @keyframes scrollBounce {
          0%, 100% { transform: rotate(45deg) translateY(0); opacity: 0.5; }
          50% { transform: rotate(45deg) translateY(12px); opacity: 1; }
        }

        .logo-shine {
          animation: logoShine 3s ease-in-out infinite;
        }

        .scroll-bounce {
          animation: scrollBounce 2s ease-in-out infinite;
        }

        .gradient-text {
          background: linear-gradient(180deg, #ffffff 0%, #b8a3ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-[#6e54c8] to-[#7c49a9] z-[1000] transition-transform duration-100"
        style={{ transform: `scaleX(${scrollProgress})`, transformOrigin: 'left' }}
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(110, 84, 200, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(124, 73, 169, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(94, 114, 235, 0.18) 0%, transparent 60%),
            radial-gradient(circle at 10% 80%, rgba(184, 103, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 90% 20%, rgba(79, 70, 229, 0.15) 0%, transparent 50%)
          `
        }} />
        
        {/* Glow Orbs */}
        <div className="absolute w-[350px] h-[350px] rounded-full blur-[70px] bg-[rgba(110,84,200,0.2)] top-[10%] left-[10%]" />
        <div className="absolute w-[450px] h-[450px] rounded-full blur-[70px] bg-[rgba(124,73,169,0.18)] bottom-[10%] right-[10%]" />
        <div className="absolute w-[300px] h-[300px] rounded-full blur-[70px] bg-[rgba(94,114,235,0.15)] top-[50%] left-[50%]" />
      </div>

      {/* Navigation Bar */}
      <nav 
        className={`fixed top-0 left-0 right-0 px-10 py-4 flex justify-between items-center backdrop-blur-md bg-[rgba(11,18,33,0.8)] border-b border-[rgba(255,255,255,0.05)] z-[100] transition-all duration-500 ${
          isScrolled ? 'bg-[rgba(11,18,33,0.95)] shadow-[0_4px_24px_rgba(0,0,0,0.3)]' : ''
        } ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#6e54c8] to-[#7c49a9] rounded-xl flex items-center justify-center font-bold text-white relative overflow-hidden shadow-[0_4px_12px_rgba(110,84,200,0.4)]">
            <div className="absolute inset-0 w-[150%] h-[150%] bg-gradient-to-br from-transparent via-[rgba(255,255,255,0.3)] to-transparent logo-shine" />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
              <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="white" opacity="0.7"/>
              <path d="M12 12L2 7V12L12 17L22 12V7L12 12Z" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-wide">Ownquesta</span>
        </div>

        <div className="flex items-center gap-3">
          {!user?.authenticated ? (
            <>
              <Link href="/login" className="px-6 py-2.5 bg-[rgba(110,84,200,0.15)] border border-[rgba(110,84,200,0.4)] rounded-lg text-sm font-semibold transition-all hover:bg-[rgba(110,84,200,0.3)] hover:border-[rgba(110,84,200,0.6)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(110,84,200,0.3)]">
                Log In
              </Link>
              <Link href="/about" className="px-6 py-2.5 bg-[rgba(110,84,200,0.15)] border border-[rgba(110,84,200,0.4)] rounded-lg text-sm font-semibold transition-all hover:bg-[rgba(110,84,200,0.3)] hover:border-[rgba(110,84,200,0.6)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(110,84,200,0.3)]">
                About
              </Link>
            </>
          ) : (
            <div id="user-dropdown" className="relative">
              <div 
                className="flex items-center gap-2.5 cursor-pointer px-4 py-2 rounded-lg transition-all hover:bg-[rgba(110,84,200,0.15)]"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <img src={user.avatar || 'https://via.placeholder.com/36'} alt="User" className="w-9 h-9 rounded-full border-2 border-[rgba(110,84,200,0.6)]" />
                <span>{user.name}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 11L3 6h10l-5 5z"/>
                </svg>
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
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-5 pt-[180px] pb-[120px]">
        <div className="w-full max-w-[900px] text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 gradient-text">
            {user?.authenticated 
              ? `Welcome ${user.name?.split(' ')[0]}!`
              : 'From Raw Data to Intelligent Models—Instantly'
            }
          </h1>
          
          <p className="text-lg text-[#9fb3d9] leading-relaxed max-w-[700px] mx-auto mb-20">
            {user?.authenticated
              ? 'Click on Go to Menu button to start your journey with Ownquesta'
              : 'A complete no-code AI platform to explore datasets, create features, and train production-ready ML and deep learning models with explainable intelligence.'
            }
          </p>

          {!user?.authenticated && (
            <div className="mb-[100px]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-[60px]">
                {[
                  { num: '1', title: 'Upload Dataset' },
                  { num: '2', title: 'Understand Data' },
                  { num: '3', title: 'Build Model' }
                ].map((step, i) => (
                  <div key={i} className="opacity-0 animate-[fadeIn_0.8s_ease_forwards]" style={{ animationDelay: `${i * 0.15}s` }}>
                    <div className="inline-flex items-center justify-center w-[72px] h-[72px] bg-[rgba(110,84,200,0.2)] border-2 border-[rgba(110,84,200,0.4)] rounded-2xl text-3xl font-bold mb-5 transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_12px_32px_rgba(110,84,200,0.3)]">
                      {step.num}
                    </div>
                    <div className="text-base font-semibold tracking-wide">{step.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user?.authenticated && (
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-br from-[#6e54c8] to-[#7c49a9] text-white rounded-xl text-[17px] font-semibold shadow-[0_8px_24px_rgba(110,84,200,0.3)] transition-all duration-400 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_16px_40px_rgba(110,84,200,0.5)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              Go to Menu
            </Link>
          )}
        </div>
      </section>

      {!user?.authenticated && (
        <>
          {/* Features Section */}
          <section className="min-h-screen flex items-center justify-center px-5 py-[120px] bg-[rgba(15,23,42,0.3)] backdrop-blur-md border-y border-[rgba(255,255,255,0.05)]">
            <div className="w-full max-w-[900px]">
              {[
                {
                  icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
                  title: 'Lightning Fast Processing',
                  desc: 'Process millions of data points in seconds with our optimized ML pipeline. Experience real-time insights without the wait.'
                },
                {
                  icon: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
                  title: 'Intelligent Automation',
                  desc: 'Let AI handle feature engineering, model selection, and hyperparameter tuning. Focus on insights, not implementation.'
                },
                {
                  icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
                  title: 'Production Ready',
                  desc: 'Deploy models with one click. Get REST APIs, monitoring dashboards, and automatic scaling out of the box.'
                }
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="bg-[rgba(110,84,200,0.08)] border border-[rgba(110,84,200,0.2)] rounded-[20px] p-12 mb-8 transition-all duration-600 hover:-translate-y-3 hover:scale-[1.02] hover:bg-[rgba(110,84,200,0.12)] hover:shadow-[0_20px_60px_rgba(110,84,200,0.3)] hover:border-[rgba(110,84,200,0.4)]"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 min-w-[48px] bg-[rgba(110,84,200,0.2)] border-2 border-[rgba(110,84,200,0.3)] rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {feature.icon}
                      </svg>
                    </div>
                    <h3 className="text-[28px] font-bold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-base text-[#9fb3d9] leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Trust Section */}
          <section className="min-h-screen flex items-center justify-center px-5 py-[120px]">
            <div className="w-full max-w-[900px] text-center">
              <h2 className="text-sm uppercase tracking-[3px] text-[#9fb3d9] mb-[60px] font-semibold">Why Ownquesta</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
                    text: 'Data privacy & encryption'
                  },
                  {
                    icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
                    text: 'Explainable, statistics-driven insights'
                  },
                  {
                    icon: <><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m8.66-13.66l-4.24 4.24m-5.65 5.65L6.34 19.66M23 12h-6m-6 0H1m19.66 8.66l-4.24-4.24m-5.65-5.65L6.34 6.34"/></>,
                    text: 'Designed for real-world ML workflows'
                  }
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="flex flex-col items-center gap-4 p-8 bg-[rgba(110,84,200,0.05)] border border-[rgba(110,84,200,0.2)] rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:bg-[rgba(110,84,200,0.1)] hover:shadow-[0_12px_32px_rgba(110,84,200,0.2)]"
                  >
                    <div className="w-16 h-16 bg-[rgba(110,84,200,0.2)] border-2 border-[rgba(110,84,200,0.3)] rounded-xl flex items-center justify-center transition-transform hover:scale-110 hover:rotate-[5deg]">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {item.icon}
                      </svg>
                    </div>
                    <p className="text-[15px] text-[#c5d4ed] leading-relaxed font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}