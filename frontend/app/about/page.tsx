'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AboutPage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const progress = scrollY / (documentHeight - windowHeight);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize Lenis smooth scrolling
  useEffect(() => {
    let lenis: any;
    if (typeof window !== 'undefined') {
      import('lenis').then(({ default: Lenis }) => {
        lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
        });

        function raf(time: number) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071026] to-[#0b1221] text-[#e6eef8] relative overflow-hidden">

      <style jsx global>{`
        body {
          overflow-x: hidden;
        }
        
        .gradient-text {
          background: linear-gradient(180deg, #ffffff 0%, #b8a3ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .stat-gradient {
          background: linear-gradient(135deg, #6e54c8, #b8a3ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-[#6e54c8] to-[#7c49a9] z-[1000] transition-transform duration-100"
        style={{ transform: `scaleX(${scrollProgress})`, transformOrigin: 'left', width: '100%' }}
      />

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 px-10 py-5 flex justify-between items-center bg-transparent z-[100]">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide transition-transform hover:-translate-y-0.5">
          <div className="w-10 h-10 bg-gradient-to-br from-[#6e54c8] to-[#7c49a9] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(110,84,200,0.4)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
              <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="white" opacity="0.7"/>
              <path d="M12 12L2 7V12L12 17L22 12V7L12 12Z" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <span>Ownquesta</span>
        </Link>
        
        <Link 
          href="/"
          className="px-6 py-2.5 bg-[rgba(110,84,200,0.15)] border border-[rgba(110,84,200,0.4)] rounded-lg text-sm font-semibold transition-all hover:bg-[rgba(110,84,200,0.3)] hover:border-[rgba(110,84,200,0.6)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(110,84,200,0.3)]"
        >
          Home
        </Link>
      </nav>

      {/* Main Container */}
      <div className="max-w-[1100px] mx-auto mt-[100px] mb-[60px] px-6 py-10">
        {/* Hero Section */}
        <div className="text-center mb-20 py-[60px]">
          <h1 className="text-4xl md:text-5xl font-bold mb-5 gradient-text">
            Making AI Easy for Everyone
          </h1>
          <p className="text-xl text-[#9fb3d9] max-w-[700px] mx-auto mb-8 leading-relaxed">
            Giving Smart Tools to All Creators
          </p>
          <p className="text-base text-[#c5d4ed] max-w-[800px] mx-auto leading-loose">
            Ownquesta is a simple tool for machine learning. It helps people use AI without needing to be experts. Our app lets anyone, from beginners to business owners, make smart predictions from their data easily.
          </p>
        </div>

        {/* What We Do Section */}
        <section className="mb-[60px]">
          <h2 className="text-[32px] font-bold mb-4 text-white relative inline-block after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-[60px] after:h-[3px] after:bg-gradient-to-r after:from-[#6e54c8] after:to-[#7c49a9] after:rounded-sm">
            What We Do
          </h2>
          <p className="text-[17px] text-[#9fb3d9] mb-10 leading-relaxed">
            Ownquesta handles all parts of machine learning, from cleaning data to using models. It makes advanced AI simple for people in any field, no matter their skill level.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[
              {
                icon: <path d="M13 10V3L4 14h7v7l9-11h-7z"/>,
                title: 'Instant Model Building',
                desc: 'Upload your data and our AI will clean it, improve it, and build a good model quickly. No need for long development time.'
              },
              {
                icon: <><path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17V12L12 17L2 12V17Z"/></>,
                title: 'Smart Algorithm Selection',
                desc: 'Our tool tests many algorithms and picks the best one for your data and goals.'
              },
              {
                icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></>,
                title: 'Deep Insights & Visualization',
                desc: 'See detailed reports, charts, and easy explanations of how your model works and why it makes predictions.'
              },
              {
                icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
                title: 'Enterprise-Grade Security',
                desc: 'Your data is safe with strong encryption and security that protects it at every step.'
              },
              {
                icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
                title: 'Real-Time Processing',
                desc: 'Use our fast cloud system to process data and train models quickly.'
              },
              {
                icon: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
                title: 'Educational Transparency',
                desc: 'Every step is shown and explained, making it a great way to learn machine learning.'
              }
            ].map((card, i) => (
              <div 
                key={i}
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl p-7 transition-all duration-300 hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(110,84,200,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(110,84,200,0.15)]"
              >
                <div className="w-14 h-14 mb-5 flex items-center justify-center bg-[rgba(110,84,200,0.1)] rounded-xl border border-[rgba(110,84,200,0.2)]">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#6e54c8" strokeWidth="1.5">
                    {card.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{card.title}</h3>
                <p className="text-[15px] text-[#c5d4ed] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Key Features Section */}
        <section className="mb-[60px]">
          <h2 className="text-[32px] font-bold mb-4 text-white relative inline-block after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-[60px] after:h-[3px] after:bg-gradient-to-r after:from-[#6e54c8] after:to-[#7c49a9] after:rounded-sm">
            Key Features
          </h2>
          <p className="text-[17px] text-[#9fb3d9] mb-10 leading-relaxed">
            See our full set of tools made for real-world machine learning and new discoveries.
          </p>

          <ul className="list-none mt-8 space-y-4">
            {[
              {
                icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
                title: 'Multi-Format Data Support',
                desc: 'Upload data in many formats like CSV, Excel, JSON, or connect to databases. Our AI checks the data and fixes problems for better models.'
              },
              {
                icon: <><path d="M3 6l9 4 9-4"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M3 14l9 4 9-4"/><line x1="3" y1="18" x2="21" y2="18"/></>,
                title: 'Automated Data Preprocessing',
                desc: 'Our tool fixes data issues like missing values, outliers, and duplicates using smart methods.'
              },
              {
                icon: <><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></>,
                title: 'Intelligent Feature Engineering',
                desc: 'Automatically create new features from your data to make predictions better and more accurate.'
              },
              {
                icon: <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>,
                title: 'Multiple Algorithm Training',
                desc: 'Train many algorithms at once, like Random Forests and Neural Networks, and compare their results.'
              },
              {
                icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
                title: 'Advanced Model Evaluation',
                desc: 'Check model performance with metrics like accuracy, precision, and charts to see how well it works.'
              },
              {
                icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
                title: 'Explainable AI (XAI)',
                desc: 'See why the model makes predictions, with tools that show which features matter most.'
              },
              {
                icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
                title: 'Hyperparameter Optimization',
                desc: 'Automatically adjust model settings to get the best results without manual work.'
              },
              {
                icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
                title: 'Model Export & Deployment',
                desc: 'Download models or use our API to make predictions in your apps right away.'
              }
            ].map((feature, i) => (
              <li 
                key={i}
                className="p-5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg transition-all duration-300 hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(110,84,200,0.3)] hover:translate-x-2"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-[rgba(110,84,200,0.1)] rounded-lg border border-[rgba(110,84,200,0.2)]">
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#6e54c8" strokeWidth="1.5">
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-[15px] text-[#c5d4ed] leading-relaxed ml-11">{feature.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Who Uses Section */}
        <section className="mb-[60px]">
          <h2 className="text-[32px] font-bold mb-4 text-white relative inline-block after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-[60px] after:h-[3px] after:bg-gradient-to-r after:from-[#6e54c8] after:to-[#7c49a9] after:rounded-sm">
            Who Uses Ownquesta
          </h2>
          <p className="text-[17px] text-[#9fb3d9] mb-10 leading-relaxed">
            Our app helps many types of users from different fields and skill levels.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[
              {
                icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></>,
                title: 'Students & Educators',
                desc: 'Learn ML by doing projects. Teachers use it for classes with real examples and quick feedback.'
              },
              {
                icon: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
                title: 'Business Analysts',
                desc: 'Make models for sales predictions, customer behavior, and business reports without needing data experts.'
              },
              {
                icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
                title: 'Researchers',
                desc: 'Quickly build models for studies, test ideas, and share clear results.'
              },
              {
                icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
                title: 'SMBs & Startups',
                desc: 'Get big company AI tools without hiring experts. Build models for customers, sales, and fraud detection.'
              },
              {
                icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
                title: 'Data Scientists',
                desc: 'Speed up work with auto models, so you can focus on hard tasks and custom ideas.'
              },
              {
                icon: <><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>,
                title: 'Healthcare & Finance',
                desc: 'Make clear, rule-following models for health checks, risk checks, and fraud spotting with full records.'
              }
            ].map((card, i) => (
              <div 
                key={i}
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl p-7 transition-all duration-300 hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(110,84,200,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(110,84,200,0.15)]"
              >
                <div className="w-14 h-14 mb-5 flex items-center justify-center bg-[rgba(110,84,200,0.1)] rounded-xl border border-[rgba(110,84,200,0.2)]">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#6e54c8" strokeWidth="1.5">
                    {card.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{card.title}</h3>
                <p className="text-[15px] text-[#c5d4ed] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="mb-[60px]">
          <h2 className="text-[32px] font-bold mb-10 text-white relative inline-block after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-[60px] after:h-[3px] after:bg-gradient-to-r after:from-[#6e54c8] after:to-[#7c49a9] after:rounded-sm">
            Why Choose Ownquesta
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            {[
              { number: '95%', label: 'Time Saved' },
              { number: '50+', label: 'Algorithms' },
              { number: '100%', label: 'Automated' },
              { number: '24/7', label: 'Availability' }
            ].map((stat, i) => (
              <div key={i} className="text-center p-7 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl">
                <div className="text-[42px] font-bold mb-2 stat-gradient">{stat.number}</div>
                <div className="text-sm text-[#9fb3d9] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-[rgba(110,84,200,0.15)] to-[rgba(124,73,169,0.15)] border border-[rgba(110,84,200,0.3)] rounded-xl p-8 mt-10">
            <h3 className="text-2xl font-bold mb-4 text-white">Our Mission</h3>
            <p className="text-base text-[#dfeeff] leading-relaxed mb-4">
              At Ownquesta, we want everyone to use AI easily. We break down the walls that kept machine learning only for big companies. We dream of a world where smart predictions are for everyone—from students learning basics to business owners finding new ideas and scientists exploring new knowledge.
            </p>
            <p className="text-base text-[#dfeeff] leading-relaxed">
              We care about keeping your data safe, making things clear, and teaching well. Everything we build helps you succeed—showing not just the results, but how and why, so you can turn data into smart choices.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}