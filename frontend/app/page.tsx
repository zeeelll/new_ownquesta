'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Logo from './components/Logo';

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
  const orb1Ref = useRef<HTMLDivElement | null>(null);
  const orb2Ref = useRef<HTMLDivElement | null>(null);
  const orb3Ref = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

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

  // Lenis-driven parallax for background orbs
  useEffect(() => {
    let lenis: any;
    let rafId: number;

    if (typeof window === 'undefined') return;

    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      function raf(time: number) {
        lenis.raf(time);
        const scroll = (lenis && lenis.scroll) || window.scrollY || 0;
        const t = performance.now() / 1000;

        if (orb1Ref.current) orb1Ref.current.style.transform = `translate3d(${Math.sin(t * 0.9) * 8}px, ${-scroll * 0.03 + Math.cos(t * 0.7) * 6}px, 0)`;
        if (orb2Ref.current) orb2Ref.current.style.transform = `translate3d(${Math.cos(t * 0.8) * 10}px, ${scroll * 0.02 + Math.sin(t * 0.6) * 8}px, 0)`;
        if (orb3Ref.current) orb3Ref.current.style.transform = `translate3d(${Math.sin(t * 0.6) * 6}px, ${scroll * 0.01 + Math.sin(t * 0.9) * 5}px, 0)`;

        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
    }).catch(() => {});

    return () => {
      cancelAnimationFrame(rafId);
      if (lenis && typeof lenis.destroy === 'function') lenis.destroy();
    };
  }, []);

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
    <div className="relative text-[#e6eef8] overflow-x-hidden min-h-screen">
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

      {/* Background Video */}
      <video 
        className="fixed top-0 left-0 w-full h-full object-cover" 
        autoPlay 
        muted 
        loop 
        playsInline
        preload="auto"
        style={{ zIndex: -10, position: 'fixed' }}
      >
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>

      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-[#6e54c8] to-[#7c49a9] z-[1000] transition-transform duration-100"
        style={{ transform: `scaleX(${scrollProgress})`, transformOrigin: 'left' }}
      />

      {/* Navigation Bar */}
      <nav 
        className={`fixed top-0 left-0 right-0 px-4 sm:px-6 md:px-10 py-3 md:py-4 flex justify-between items-center bg-transparent z-[100] transition-all duration-500 ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <Logo href="/" size="md" />

        <div className="flex items-center gap-2 sm:gap-3">
          {!user?.authenticated ? (
            <>
              <Link href="/login" className="px-3 sm:px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] border border-[rgba(246,147,251,0.6)] rounded-lg text-xs sm:text-sm font-semibold transition-all hover:from-[#764ba2] hover:via-[#f093fb] hover:to-[#667eea] hover:border-[rgba(246,147,251,0.9)] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(246,147,251,0.6)] hover:scale-105">
                Log In
              </Link>
              <Link href="/about" className="px-3 sm:px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] border border-[rgba(246,147,251,0.6)] rounded-lg text-xs sm:text-sm font-semibold transition-all hover:from-[#764ba2] hover:via-[#f093fb] hover:to-[#667eea] hover:border-[rgba(246,147,251,0.9)] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(246,147,251,0.6)] hover:scale-105">
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
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-5 md:px-8 pt-24 sm:pt-32 md:pt-[180px] pb-16 sm:pb-20 md:pb-[120px]">
        <div className="w-full max-w-[900px] text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6 gradient-text">
            {user?.authenticated 
              ? `Welcome ${user.name?.split(' ')[0]}!`
              : 'From Raw Data to Intelligent Models—Instantly'
            }
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-[#9fb3d9] leading-relaxed max-w-[700px] mx-auto mb-12 sm:mb-16 md:mb-20 px-4">
            {user?.authenticated
              ? 'Click on Go to Menu button to start your journey with Ownquesta'
              : 'A complete no-code AI platform to explore datasets, create features, and train production-ready ML and deep learning models with explainable intelligence.'
            }
          </p>

          {!user?.authenticated && (
            <div className="mb-12 sm:mb-16 md:mb-[100px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12 md:mb-[60px]">
                {[
                  { num: '1', title: 'Upload Dataset' },
                  { num: '2', title: 'Understand Data' },
                  { num: '3', title: 'Build Model' }
                ].map((step, i) => (
                  <div key={i} className="opacity-0 animate-[fadeIn_0.8s_ease_forwards]" style={{ animationDelay: `${i * 0.15}s` }}>
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] bg-[rgba(110,84,200,0.2)] border-2 border-[rgba(110,84,200,0.4)] rounded-2xl text-2xl sm:text-3xl font-bold mb-3 sm:mb-5 transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_12px_32px_rgba(110,84,200,0.3)]">
                      {step.num}
                    </div>
                    <div className="text-sm sm:text-base font-semibold tracking-wide">{step.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user?.authenticated && (
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-gradient-to-br from-[#6e54c8] to-[#7c49a9] text-white rounded-xl text-sm sm:text-base md:text-[17px] font-semibold shadow-[0_8px_24px_rgba(110,84,200,0.3)] transition-all duration-400 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_16px_40px_rgba(110,84,200,0.5)]"
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
          <section className="min-h-screen flex items-center justify-center px-4 sm:px-5 md:px-8 py-16 sm:py-20 md:py-[120px] bg-[rgba(15,23,42,0.3)] backdrop-blur-md border-y border-[rgba(255,255,255,0.05)]">
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
                  className="bg-[rgba(110,84,200,0.08)] border border-[rgba(110,84,200,0.2)] rounded-[20px] p-6 sm:p-8 md:p-12 mb-6 sm:mb-8 transition-all duration-600 hover:-translate-y-3 hover:scale-[1.02] hover:bg-[rgba(110,84,200,0.12)] hover:shadow-[0_20px_60px_rgba(110,84,200,0.3)] hover:border-[rgba(110,84,200,0.4)]"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 min-w-[40px] sm:min-w-[48px] bg-[rgba(110,84,200,0.2)] border-2 border-[rgba(110,84,200,0.3)] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {feature.icon}
                      </svg>
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-[28px] font-bold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-sm sm:text-base text-[#9fb3d9] leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Trust Section */}
          <section className="min-h-screen flex items-center justify-center px-4 sm:px-5 md:px-8 py-16 sm:py-20 md:py-[120px]">
            <div className="w-full max-w-[900px] text-center">
              <h2 className="text-xs sm:text-sm uppercase tracking-[2px] sm:tracking-[3px] text-[#9fb3d9] mb-8 sm:mb-12 md:mb-[60px] font-semibold">Why Ownquesta</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
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
                    className="flex flex-col items-center gap-3 sm:gap-4 p-6 sm:p-8 bg-[rgba(110,84,200,0.05)] border border-[rgba(110,84,200,0.2)] rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:bg-[rgba(110,84,200,0.1)] hover:shadow-[0_12px_32px_rgba(110,84,200,0.2)]"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-[rgba(110,84,200,0.2)] border-2 border-[rgba(110,84,200,0.3)] rounded-xl flex items-center justify-center transition-transform hover:scale-110 hover:rotate-[5deg]">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {item.icon}
                      </svg>
                    </div>
                    <p className="text-sm sm:text-[15px] text-[#c5d4ed] leading-relaxed font-medium">{item.text}</p>
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