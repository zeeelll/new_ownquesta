"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
}

const DeepLearningPlatform: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 100, y: 100 });
  const [isHovering, setIsHovering] = useState(false);
  const [user, setUser] = useState<{ name?: string; avatar?: string } | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  
  const nodesRef = useRef<Node[]>([
    { x: 100, y: 60, baseX: 100, baseY: 60 },
    { x: 60, y: 100, baseX: 60, baseY: 100 },
    { x: 140, y: 100, baseX: 140, baseY: 100 },
    { x: 80, y: 140, baseX: 80, baseY: 140 },
    { x: 120, y: 140, baseX: 120, baseY: 140 },
    { x: 100, y: 170, baseX: 100, baseY: 170 }
  ]);

  useEffect(() => {
    // Fetch user data
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setUser(prev => ({ ...prev, avatar: savedAvatar }));
    }
    fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUser({ name: data.user.name, avatar: data.user.avatar });
          localStorage.setItem('userAvatar', data.user.avatar || '');
        }
      })
      .catch(err => console.error('Failed to fetch user', err));

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (dist < 100) {
            const alpha = (100 - dist) / 100 * 0.3;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw nodes
      nodes.forEach((node, i) => {
        // Mouse interaction
        if (isHovering) {
          const dx = mousePos.x - node.x;
          const dy = mousePos.y - node.y;
          const dist = Math.hypot(dx, dy);
          
          if (dist < 80) {
            const force = (80 - dist) / 80;
            node.x += dx * force * 0.1;
            node.y += dy * force * 0.1;
          }
        }

        // Return to base position
        node.x += (node.baseX - node.x) * 0.05;
        node.y += (node.baseY - node.y) * 0.05;

        // Gentle pulse
        const pulse = Math.sin(Date.now() * 0.002 + i) * 2;

        // Draw glow
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, 15 + pulse
        );
        gradient.addColorStop(0, 'rgba(167, 139, 250, 0.8)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 15 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Draw node
        ctx.fillStyle = '#a78bfa';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5 + pulse * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos, isHovering, BACKEND_URL]);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

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

  const handleBack = () => {
    router.back();
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  const handleMLPlatform = () => {
    window.location.href = '/ml/machine-learning';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a3e] to-[#0f0f23] text-gray-200 pt-20">
      <style>{`
        @keyframes badgePulse {
          0%, 100% {
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 4px 25px rgba(99, 102, 241, 0.4);
            transform: scale(1.02);
          }
        }

        .badge-pulse {
          animation: badgePulse 2s ease-in-out infinite;
        }

        .gradient-text {
          background: linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .feature-card {
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
          transition: left 0.5s;
        }

        .feature-card:hover::before {
          left: 100%;
        }
      `}</style>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-transparent z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <a href="/home" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6e54c8] to-[#7c49a9] rounded-xl flex items-center justify-center font-bold text-white relative overflow-hidden shadow-[0_4px_12px_rgba(110,84,200,0.4)]">
              <div className="absolute inset-0 w-[150%] h-[150%] bg-gradient-to-br from-transparent via-[rgba(255,255,255,0.3)] to-transparent logo-shine" />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" opacity="0.9"/>
                <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="white" opacity="0.7"/>
                <path d="M12 12L2 7V12L12 17L22 12V7L12 12Z" fill="white" opacity="0.5"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-white">Ownquesta</span>
          </a>
          <span className="text-sm text-slate-400 ml-4">Deep Learning Platform</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-slate-700/50 border border-slate-400/20 backdrop-blur-sm text-white hover:bg-slate-700/80 hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all"
          >
            Back
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-100 px-5 py-2 rounded-full text-sm font-semibold mb-6 border border-purple-400/40 shadow-lg shadow-indigo-500/20 badge-pulse">
            Coming Soon
          </div>
          
          <div className="relative w-52 h-52 mx-auto mb-8">
            <canvas 
              ref={canvasRef}
              width="200" 
              height="200"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="block mx-auto cursor-pointer"
            />
          </div>
          
          <h1 className="text-5xl font-bold gradient-text mb-4">
            Deep Learning Platform
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            We're building an advanced deep learning validation platform with cutting-edge neural network capabilities. Stay tuned for its launch!
          </p>
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-semibold mb-8 text-center text-gray-100">
            What's Coming
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: 'Neural Network Architecture Validation',
                description: 'Comprehensive validation of your neural network architectures with automated testing and optimization suggestions.',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )
              },
              {
                title: 'Advanced Model Optimization',
                description: 'Intelligent hyperparameter tuning and model compression techniques to maximize performance.',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )
              },
              {
                title: 'Real-time Training Monitoring',
                description: 'Live dashboards tracking loss, accuracy, gradients, and other critical metrics during training.',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              },
              {
                title: 'GPU Acceleration Support',
                description: 'Seamless integration with CUDA and distributed training across multiple GPUs.',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                )
              },
              {
                title: 'Pre-trained Model Integration',
                description: 'Access to state-of-the-art pre-trained models for transfer learning and fine-tuning.',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                title: 'Advanced Visualization Tools',
                description: 'Interactive visualizations of network architectures, activation maps, and decision boundaries.',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="feature-card bg-white/5 border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-500/50 hover:-translate-y-1 hover:bg-white/8 transition-all relative"
              >
                <div className="absolute left-6 top-6 text-xl text-indigo-500">
                  {feature.icon}
                </div>
                <h3 className="text-lg mb-2 ml-8 text-gray-200 font-medium">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed ml-8">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-300 mb-6">
            In the meantime, explore our Machine Learning validation platform to validate your datasets and models.
          </p>
          <button
            onClick={handleMLPlatform}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 transition-all shadow-lg shadow-indigo-500/30"
          >
            Explore Machine Learning →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeepLearningPlatform;