'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';

export default function AboutPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      setScrollProgress(scrollY / (documentHeight - windowHeight));
      setIsScrolled(scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let lenis: any;
    if (typeof window !== 'undefined') {
      import('lenis').then(({ default: Lenis }) => {
        lenis = new Lenis({ duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
        function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
      });
    }
    return () => { if (lenis?.destroy) lenis.destroy(); };
  }, []);

  const sectionHeadingClass = "text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3 relative inline-block after:content-[''] after:absolute after:bottom-[-10px] after:left-0 after:w-12 after:h-[2px] after:bg-gradient-to-r after:from-[#6e54c8] after:to-[#a87edf] after:rounded-full";

  return (
    <div className="min-h-screen text-[#e6eef8] relative overflow-hidden font-chillax" style={{ background: 'linear-gradient(160deg, #06080f 0%, #0b0d1a 50%, #080b18 100%)' }}>

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

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 px-4 sm:px-6 md:px-10 py-3 sm:py-4 flex justify-between items-center z-[100] transition-all duration-400 ${isScrolled ? 'bg-[rgba(10,11,20,0.8)] backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
        <Logo href="/" size="md" />
        <Link
          href="/"
          className="px-4 sm:px-5 py-2 sm:py-2.5 glass rounded-xl text-xs sm:text-sm font-semibold transition-all hover:bg-white/[0.08] hover:-translate-y-0.5 border border-white/[0.08] tracking-wide text-[#c5d4ed] hover:text-white"
        >
          Home
        </Link>
      </nav>

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(110,84,200,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* Main Container */}
      <div className="max-w-[1080px] mx-auto pt-24 sm:pt-28 md:pt-32 pb-16 px-4 sm:px-6">

        {/* Hero */}
        <div className="text-center mb-16 sm:mb-20 py-10 sm:py-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-8 border border-white/10 bg-white/[0.03] backdrop-blur-sm text-[#a87edf]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a87edf] animate-pulse" />
            About Ownquesta
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text tracking-tight mb-5 px-2">
            Making AI Easy for Everyone
          </h1>
          <p className="text-lg sm:text-xl text-[#8fa3c4] max-w-[620px] mx-auto mb-6 leading-relaxed font-[350]">
            Giving Smart Tools to All Creators
          </p>
          <p className="text-sm sm:text-base text-[#6b82a0] max-w-[760px] mx-auto leading-loose px-2 font-[350]">
            Ownquesta is a simple tool for machine learning. It helps people use AI without needing to be experts. Our app lets anyone — from beginners to business owners — make smart predictions from their data easily.
          </p>
        </div>

        {/* What We Do */}
        <section className="mb-16 sm:mb-20">
          <div className="mb-10">
            <h2 className={sectionHeadingClass}>What We Do</h2>
            <p className="text-[#8fa3c4] mt-6 leading-relaxed font-[350] max-w-[700px]">
              Ownquesta handles all parts of machine learning, from cleaning data to deploying models. It makes advanced AI simple for people in any field.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              { icon: <path d="M13 10V3L4 14h7v7l9-11h-7z"/>, title: 'Instant Model Building', desc: 'Upload your data and our AI will clean it, improve it, and build a great model quickly. No long development time.' },
              { icon: <><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17V12L12 17L2 12V17Z"/></>, title: 'Smart Algorithm Selection', desc: 'Our tool tests many algorithms and picks the best one for your data and goals automatically.' },
              { icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></>, title: 'Deep Insights & Visualization', desc: 'See detailed reports, charts, and easy explanations of how your model works and why it makes predictions.' },
              { icon: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>, title: 'Enterprise-Grade Security', desc: 'Your data is safe with strong encryption and privacy protection at every step.' },
              { icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, title: 'Real-Time Processing', desc: 'Use our fast cloud system to process data and train models with live feedback.' },
              { icon: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>, title: 'Educational Transparency', desc: 'Every step is shown and explained, making it a great platform for learning machine learning.' },
            ].map((card, i) => (
              <div key={i} className="group card-premium rounded-2xl p-6">
                <div className="w-12 h-12 mb-5 flex items-center justify-center bg-[rgba(110,84,200,0.10)] rounded-2xl border border-[rgba(110,84,200,0.18)] group-hover:bg-[rgba(110,84,200,0.18)] transition-colors duration-300">
                  <svg className="w-6 h-6 text-[#a87edf]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{card.icon}</svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-2.5 tracking-tight">{card.title}</h3>
                <p className="text-sm text-[#6b82a0] leading-relaxed font-[350]">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-16 sm:mb-20">
          <div className="mb-10">
            <h2 className={sectionHeadingClass}>Key Features</h2>
            <p className="text-[#8fa3c4] mt-6 leading-relaxed font-[350] max-w-[700px]">
              See our full set of tools made for real-world machine learning and new discoveries.
            </p>
          </div>

          <ul className="space-y-3 mt-10">
            {[
              { icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>, title: 'Multi-Format Data Support', desc: 'CSV, Excel, JSON, or database connections. AI checks and fixes data automatically for better models.' },
              { icon: <><path d="M3 6l9 4 9-4"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M3 14l9 4 9-4"/></>, title: 'Automated Data Preprocessing', desc: 'Our tool fixes missing values, outliers, and duplicates using smart, proven methods.' },
              { icon: <><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/></>, title: 'Intelligent Feature Engineering', desc: 'Automatically create new features from your data to make predictions more accurate.' },
              { icon: <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>, title: 'Multiple Algorithm Training', desc: 'Train Random Forests, Neural Networks, and more simultaneously — compare results instantly.' },
              { icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>, title: 'Advanced Model Evaluation', desc: 'Accuracy, precision, recall, and ROC curves — everything you need to evaluate model performance.' },
              { icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>, title: 'Explainable AI (XAI)', desc: 'See why the model makes predictions with tools showing which features matter most.' },
              { icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15 1.65 1.65 0 0 0 3.17 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>, title: 'Hyperparameter Optimization', desc: 'Automatically fine-tune model settings to achieve the best results without manual work.' },
              { icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>, title: 'Model Export & Deployment', desc: 'Download models or use our REST API to make predictions in your applications right away.' },
            ].map((feature, i) => (
              <li key={i} className="group p-5 glass-purple rounded-2xl border border-[rgba(110,84,200,0.10)] transition-all duration-300 hover:border-[rgba(110,84,200,0.25)] hover:translate-x-1 hover:shadow-[0_4px_20px_rgba(110,84,200,0.1)]">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 flex items-center justify-center bg-[rgba(110,84,200,0.12)] rounded-xl border border-[rgba(110,84,200,0.18)] flex-shrink-0 group-hover:bg-[rgba(110,84,200,0.20)] transition-colors">
                    <svg className="w-4 h-4 text-[#a87edf]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{feature.icon}</svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1 tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-[#6b82a0] leading-relaxed font-[350]">{feature.desc}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Who Uses */}
        <section className="mb-16 sm:mb-20">
          <div className="mb-10">
            <h2 className={sectionHeadingClass}>Who Uses Ownquesta</h2>
            <p className="text-[#8fa3c4] mt-6 leading-relaxed font-[350] max-w-[700px]">
              Our platform helps many types of users from different fields and skill levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              { icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></>, title: 'Students & Educators', desc: 'Learn ML by doing projects. Teachers use it for classes with real examples and quick feedback.' },
              { icon: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>, title: 'Business Analysts', desc: 'Build models for sales, customer behaviour, and reports without needing data science expertise.' },
              { icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>, title: 'Data Scientists', desc: 'Speed up exploratory work with auto models so you can focus on complex custom research.' },
              { icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>, title: 'SMBs & Startups', desc: 'Get enterprise AI tools without hiring a data science team. Build models for real business problems.' },
              { icon: <><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></>, title: 'Healthcare & Finance', desc: 'Build compliant, interpretable models for risk assessment, fraud detection, and diagnostics.' },
              { icon: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>, title: 'Researchers', desc: 'Build models for studies, test ideas, and share clear, reproducible results easily.' },
            ].map((card, i) => (
              <div key={i} className="group card-premium rounded-2xl p-6">
                <div className="w-12 h-12 mb-5 flex items-center justify-center bg-[rgba(110,84,200,0.10)] rounded-2xl border border-[rgba(110,84,200,0.18)] group-hover:bg-[rgba(110,84,200,0.18)] transition-colors duration-300">
                  <svg className="w-6 h-6 text-[#a87edf]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{card.icon}</svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-2.5 tracking-tight">{card.title}</h3>
                <p className="text-sm text-[#6b82a0] leading-relaxed font-[350]">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats + Mission */}
        <section className="mb-16">
          <div className="mb-10">
            <h2 className={sectionHeadingClass}>Why Choose Ownquesta</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { number: '95%', label: 'Time Saved' },
              { number: '50+', label: 'Algorithms' },
              { number: '100%', label: 'Automated' },
              { number: '24/7', label: 'Availability' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 glass-purple rounded-2xl border border-[rgba(110,84,200,0.12)]">
                <div className="text-3xl sm:text-4xl font-bold mb-2 stat-gradient">{stat.number}</div>
                <div className="text-xs text-[#8fa3c4] uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-7 sm:p-9 glass-purple rounded-3xl border border-[rgba(110,84,200,0.18)]">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 tracking-tight">Our Mission</h3>
            <p className="text-sm sm:text-base text-[#8fa3c4] leading-loose mb-4 font-[350]">
              At Ownquesta, we want everyone to use AI easily. We break down the walls that kept machine learning only for large organisations. We dream of a world where smart predictions are for everyone — from students to business owners uncovering new opportunities.
            </p>
            <p className="text-sm sm:text-base text-[#8fa3c4] leading-loose font-[350]">
              We care about keeping your data safe, making our tools transparent, and teaching well. Everything we build helps you succeed — showing not just the results, but how and why, so you can turn data into smart decisions.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base tracking-wide bg-gradient-to-r from-[#6e54c8] to-[#7c49a9] hover:from-[#7c62d6] hover:to-[#8a57b7] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(110,84,200,0.45)] text-white"
            >
              Get Started Free
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
