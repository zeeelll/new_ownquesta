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
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          window.location.href = '/home';
        } else {
          setUser({ authenticated: false });
        }
      })
      .catch(() => setUser({ authenticated: false }));

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const progress = scrollY / (documentHeight - windowHeight);
      setScrollProgress(progress);
      setIsScrolled(scrollY > 60);
      setNavHidden(scrollY > 120 && scrollY > lastScrollY.current);
      setShowScrollIndicator(scrollY < 100);
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

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
    let lenis: any;
    let rafId: number;
    if (typeof window === 'undefined') return;

    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({ duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });

      function raf(time: number) {
        lenis.raf(time);
        const scroll = lenis?.scroll ?? window.scrollY ?? 0;
        const t = performance.now() / 1000;
        if (orb1Ref.current) orb1Ref.current.style.transform = `translate3d(${Math.sin(t * 0.9) * 8}px,${-scroll * 0.03 + Math.cos(t * 0.7) * 6}px,0)`;
        if (orb2Ref.current) orb2Ref.current.style.transform = `translate3d(${Math.cos(t * 0.8) * 10}px,${scroll * 0.02 + Math.sin(t * 0.6) * 8}px,0)`;
        if (orb3Ref.current) orb3Ref.current.style.transform = `translate3d(${Math.sin(t * 0.6) * 6}px,${scroll * 0.01 + Math.sin(t * 0.9) * 5}px,0)`;
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);
    }).catch(() => {});

    return () => {
      cancelAnimationFrame(rafId);
      if (lenis?.destroy) lenis.destroy();
    };
  }, []);

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

  return (
    <div className="relative text-[#e6eef8] overflow-x-hidden min-h-screen font-chillax">

      {/* Background Video */}
      <video
        className="fixed top-0 left-0 w-full h-full object-cover"
        autoPlay muted loop playsInline preload="auto"
        style={{ zIndex: -10 }}
      >
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/40" style={{ zIndex: -9 }} />

      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[2px] z-[1000]"
        style={{
          width: `${scrollProgress * 100}%`,
          background: 'linear-gradient(90deg, #6e54c8, #a87edf, #7c49a9)',
          transition: 'width 0.1s linear',
          boxShadow: '0 0 8px rgba(168, 126, 223, 0.6)',
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
        <Logo href="/" size="md" />

        <div className="flex items-center gap-2 sm:gap-3">
          {!user?.authenticated ? (
            <>
              <Link
                href="/login"
                className="px-4 sm:px-5 md:px-6 py-2 md:py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 backdrop-blur-sm tracking-wide"
              >
                Sign In
              </Link>
              <Link
                href="/about"
                className="px-4 sm:px-5 md:px-6 py-2 md:py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 bg-gradient-to-r from-[#6e54c8] to-[#7c49a9] hover:from-[#7c62d6] hover:to-[#8a57b7] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(110,84,200,0.4)] tracking-wide"
              >
                About
              </Link>
            </>
          ) : (
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
                <span className="text-sm font-medium">{user.name}</span>
                <svg className={`w-4 h-4 text-[#9fb3d9] transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 11L3 6h10l-5 5z"/>
                </svg>
              </div>

              {userDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-[rgba(10,12,25,0.95)] backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] border border-white/[0.08] min-w-[200px] overflow-hidden">
                  <Link href="/profile" className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.05] transition-all hover:bg-white/[0.05] text-sm font-medium">
                    <svg className="w-4 h-4 text-[#a87edf]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Profile
                  </Link>
                  <div onClick={handleLogout} className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all hover:bg-white/[0.05] text-sm font-medium text-[#9fb3d9] hover:text-white">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-5 md:px-8 pt-28 sm:pt-36 md:pt-44 pb-20 md:pb-28">
        <div className="w-full max-w-[860px] text-center relative z-10">

          {/* Badge */}
          {!user?.authenticated && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-8 border border-white/10 bg-white/[0.04] backdrop-blur-sm text-[#a87edf] animate-fade-in-up">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a87edf] animate-pulse" />
              No-Code AI Platform
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 tracking-tight gradient-text animate-fade-in-up delay-100">
            {user?.authenticated
              ? `Welcome, ${user.name?.split(' ')[0]}`
              : 'From Raw Data to\nIntelligent Models'
            }
          </h1>

          <p className="text-base sm:text-lg text-[#8fa3c4] leading-relaxed max-w-[640px] mx-auto mb-14 px-2 animate-fade-in-up delay-200 font-[350]">
            {user?.authenticated
              ? 'Click "Go to Menu" to start your journey with Ownquesta.'
              : 'A complete no-code AI platform to explore datasets, create features, and train production-ready ML and deep learning models—instantly.'
            }
          </p>

          {!user?.authenticated && (
            <div className="mb-16 animate-fade-in-up delay-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12 max-w-[640px] mx-auto">
                {[
                  { num: '01', title: 'Upload Dataset', desc: 'Any format, any size' },
                  { num: '02', title: 'Understand Data', desc: 'AI-powered analysis' },
                  { num: '03', title: 'Build Model', desc: 'One-click deployment' },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="group opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${0.3 + i * 0.1}s`, animationFillMode: 'forwards' }}
                  >
                    <div className="glass-purple rounded-2xl p-5 text-left hover:-translate-y-1 transition-all duration-300 hover:shadow-glow-sm cursor-default">
                      <div className="text-xs font-semibold tracking-widest text-[#a87edf] mb-2 uppercase">{step.num}</div>
                      <div className="text-base font-semibold text-white mb-1">{step.title}</div>
                      <div className="text-xs text-[#8fa3c4] font-[350]">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'forwards', opacity: 0 }}>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base tracking-wide bg-gradient-to-r from-[#6e54c8] to-[#7c49a9] hover:from-[#7c62d6] hover:to-[#8a57b7] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(110,84,200,0.45)] text-white"
                >
                  Get Started Free
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base tracking-wide glass hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all duration-300 text-[#c5d4ed]"
                >
                  Learn More
                </Link>
              </div>
            </div>
          )}

          {user?.authenticated && (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#6e54c8] to-[#7c49a9] text-white rounded-2xl text-base font-semibold tracking-wide shadow-[0_8px_24px_rgba(110,84,200,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(110,84,200,0.5)] animate-fade-in-up delay-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {!user?.authenticated && (
        <>
          {/* Features Section */}
          <section className="min-h-screen flex items-center justify-center px-4 sm:px-5 md:px-8 py-20 md:py-28 relative">
            <div className="absolute inset-0 bg-[rgba(10,11,20,0.45)] backdrop-blur-sm border-y border-white/[0.04]" />
            <div className="w-full max-w-[860px] relative z-10">
              <div className="text-center mb-14">
                <p className="text-xs font-semibold tracking-widest uppercase text-[#a87edf] mb-4">Why Ownquesta</p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text tracking-tight">Built for Results</h2>
              </div>
              <div className="space-y-5">
                {[
                  {
                    icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
                    title: 'Lightning Fast Processing',
                    desc: 'Process millions of data points in seconds with our optimised ML pipeline. Experience real-time insights without the wait.',
                    tag: 'Performance',
                  },
                  {
                    icon: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
                    title: 'Intelligent Automation',
                    desc: 'Let AI handle feature engineering, model selection, and hyperparameter tuning. Focus on insights, not implementation.',
                    tag: 'AI-Powered',
                  },
                  {
                    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
                    title: 'Production Ready',
                    desc: 'Deploy models with one click. Get REST APIs, monitoring dashboards, and automatic scaling out of the box.',
                    tag: 'Deploy',
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="group glass-purple rounded-3xl p-7 sm:p-9 transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(110,84,200,0.2)] hover:border-[rgba(168,126,223,0.3)] border border-[rgba(110,84,200,0.15)]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                      <div className="w-12 h-12 min-w-[48px] bg-[rgba(110,84,200,0.15)] border border-[rgba(110,84,200,0.25)] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:bg-[rgba(110,84,200,0.25)] group-hover:scale-105">
                        <svg className="w-5 h-5 text-[#a87edf]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                          {feature.icon}
                        </svg>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{feature.title}</h3>
                        <span className="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full bg-[rgba(110,84,200,0.15)] text-[#a87edf] border border-[rgba(110,84,200,0.2)]">
                          {feature.tag}
                        </span>
                      </div>
                    </div>
                    <p className="text-[#8fa3c4] leading-relaxed font-[350]">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Trust Section */}
          <section className="min-h-screen flex items-center justify-center px-4 sm:px-5 md:px-8 py-20 md:py-28">
            <div className="w-full max-w-[860px] text-center">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#a87edf] mb-4">Our Promise</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text tracking-tight mb-14">
                Built on Trust
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  {
                    icon: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
                    title: 'Data Privacy',
                    text: 'Enterprise-grade encryption at every step of the pipeline.',
                  },
                  {
                    icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
                    title: 'Statistics-Driven',
                    text: 'Explainable, transparent insights you can trust and present.',
                  },
                  {
                    icon: <><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m8.66-13.66l-4.24 4.24m-5.65 5.65L6.34 19.66M23 12h-6m-6 0H1m19.66 8.66l-4.24-4.24m-5.65-5.65L6.34 6.34"/></>,
                    title: 'Real-World ML',
                    text: 'Designed for actual workflows, not just toy examples.',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="group flex flex-col items-center gap-4 p-7 glass-purple rounded-3xl border border-[rgba(110,84,200,0.15)] transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(110,84,200,0.2)] hover:border-[rgba(168,126,223,0.25)] cursor-default"
                  >
                    <div className="w-14 h-14 bg-[rgba(110,84,200,0.15)] border border-[rgba(110,84,200,0.25)] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[rgba(110,84,200,0.25)]">
                      <svg className="w-7 h-7 text-[#a87edf]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        {item.icon}
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-[#8fa3c4] leading-relaxed font-[350]">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-20 p-8 sm:p-12 glass-purple rounded-3xl border border-[rgba(110,84,200,0.2)]">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">Ready to build smarter?</h3>
                <p className="text-[#8fa3c4] mb-8 font-[350]">Join thousands of data teams using Ownquesta to ship faster.</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base tracking-wide bg-gradient-to-r from-[#6e54c8] to-[#7c49a9] hover:from-[#7c62d6] hover:to-[#8a57b7] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(110,84,200,0.45)] text-white"
                >
                  Start for Free
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
