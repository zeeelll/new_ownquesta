'use client';

import Link from 'next/link';
import { useState } from 'react';

interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ href = '/', size = 'md', showText = true }: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: { width: 20, height: 20 },
    md: { width: 28, height: 28 },
    lg: { width: 40, height: 40 }
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  return (
    <Link 
      href={href} 
      className="flex items-center gap-4 group cursor-pointer perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative transform-gpu">
        {/* Outer orbital rings - clean */}
        <div className="absolute -inset-8 opacity-0 group-hover:opacity-50 transition-all duration-1000">
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border border-purple-500/20 animate-[spin_15s_linear_reverse]" />
          <div className="absolute inset-4 rounded-full border border-pink-400/15 animate-[spin_8s_linear_infinite]" />
        </div>
        
        {/* Light beam rays - subtle */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-0.5 h-10 origin-bottom"
              style={{
                transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                background: `linear-gradient(to top, transparent, ${
                  ['#00f5ff', '#ff00ff', '#ffff00', '#00ff00'][i % 4]
                }15, transparent)`,
                animation: `pulse ${2 + i * 0.1}s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
        
        {/* Holographic effect overlay - subtle */}
        <div className="absolute -inset-2 rounded-3xl overflow-hidden opacity-0 group-hover:opacity-50 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shimmer_1.5s_linear_infinite] skew-x-12" />
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/15 via-transparent to-pink-400/15 animate-[wave_3s_ease-in-out_infinite]" />
        </div>
        
        {/* Sparkle particles - minimal */}
        <div className="absolute -inset-4 opacity-0 group-hover:opacity-60 transition-opacity duration-700">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${1 + Math.random()}px`,
                height: `${1 + Math.random()}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                background: ['#00f5ff', '#ff00ff', '#ffff00'][Math.floor(Math.random() * 3)],
                animation: `quantum ${2 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.5
              }}
            />
          ))}
        </div>
        
        {/* Main logo container - clean rectangle design */}
        <div className={`${sizeClasses[size]} relative bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] rounded-xl flex items-center justify-center font-bold text-white overflow-hidden shadow-lg transition-all duration-700 group-hover:shadow-xl group-hover:scale-[1.15] group-hover:rotate-[6deg] backdrop-blur-sm border-[3px] border-white/40 group-hover:border-white/60`}>
          
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 via-purple-500 via-pink-500 to-red-500 opacity-0 group-hover:opacity-20 transition-opacity duration-700 animate-[rainbow_6s_linear_infinite]" />
          
          {/* Liquid metal effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 animate-[liquidMetal_4s_ease-in-out_infinite]" />
          
          {/* Mesh gradient overlay - clean */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(102,126,234,0.2),transparent_50%)] animate-[float_4s_ease-in-out_infinite]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(246,147,251,0.2),transparent_50%)] animate-[float_5s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
          </div>
          
          {/* Minimal sparkles */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-80 transition-opacity duration-500">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${1 + Math.random()}px`,
                  height: `${1 + Math.random()}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  background: ['white', '#00f5ff', '#ff00ff'][Math.floor(Math.random() * 3)],
                  animation: `twinkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                  opacity: 0.7
                }}
              />
            ))}
          </div>
          
          {/* Nested rectangular frames */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 border-2 border-white/40 rounded-md animate-[spin_20s_linear_infinite]" style={{ transform: 'rotate(45deg)' }} />
            <div className="absolute inset-2 border-2 border-white/30 rounded-md animate-[spin_15s_linear_reverse]" style={{ transform: 'rotate(22.5deg)' }} />
            <div className="absolute inset-4 border border-white/20 rounded-md animate-[spin_10s_linear_infinite]" />
          </div>
          
          {/* Crystal shine effect - subtle */}
          <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent w-1/2 h-1/2 animate-[shimmer_3s_linear_infinite]" style={{ mixBlendMode: 'overlay' }} />
            <div className="absolute bottom-0 right-0 bg-gradient-to-tl from-white/25 via-transparent to-transparent w-1/2 h-1/2 animate-[shimmer_4s_linear_infinite]" style={{ animationDelay: '1s', mixBlendMode: 'overlay' }} />
          </div>
          
          {/* Main Logo SVG - Rectangle Design */}
          <svg 
            width={iconSizes[size].width} 
            height={iconSizes[size].height} 
            viewBox="0 0 48 48" 
            fill="none" 
            className="relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-all duration-700 group-hover:drop-shadow-[0_12px_24px_rgba(255,255,255,0.8)] group-hover:scale-[1.3] group-hover:-rotate-[8deg]"
            style={{ filter: 'brightness(1.1) contrast(1.1)' }}
          >
            {/* Outer rectangular frame */}
            <rect
              x="6" y="6"
              width="36" height="36"
              stroke="url(#logoGradient1)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.8"
              rx="3"
              className="animate-[spin_30s_linear_infinite]"
              style={{ transformOrigin: '24px 24px' }}
            />
            
            {/* Rotating square pattern */}
            <g className="animate-[spin_8s_linear_reverse] origin-center" style={{ transformOrigin: '24px 24px' }}>
              <rect x="14" y="14" width="20" height="20" fill="white" opacity="0.15" rx="2" />
            </g>
            
            {/* Triple rectangle design */}
            <rect x="8" y="8" width="32" height="32" stroke="url(#logoGradient2)" strokeWidth="2" fill="none" opacity="0.9" strokeDasharray="128" className="animate-[dash_8s_linear_infinite]" rx="2" />
            <rect x="12" y="12" width="24" height="24" stroke="white" strokeWidth="2.5" fill="none" opacity="0.95" rx="2" />
            <rect x="16" y="16" width="16" height="16" stroke="url(#logoGradient3)" strokeWidth="2" fill="white" fillOpacity="0.2" rx="1" />
            
            {/* Inner pulsing core */}
            <rect x="19" y="19" width="10" height="10" fill="white" opacity="0.4" rx="1">
              <animate attributeName="width" values="10;14;10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="height" values="10;14;10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="x" values="19;17;19" dur="2s" repeatCount="indefinite" />
              <animate attributeName="y" values="19;17;19" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
            </rect>
            
            {/* Data connection nodes */}
            <g className="animate-[pulse_3s_ease-in-out_infinite]">
              <line x1="24" y1="2" x2="24" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              <line x1="46" y1="24" x2="36" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              <line x1="24" y1="46" x2="24" y2="36" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              <line x1="2" y1="24" x2="12" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              
              {/* Diagonal connections */}
              <line x1="37" y1="11" x2="32" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <line x1="37" y1="37" x2="32" y2="32" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <line x1="11" y1="37" x2="16" y2="32" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <line x1="11" y1="11" x2="16" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
            </g>
            
            {/* Orbiting particles */}
            <circle cx="38" cy="14" r="2" fill="white" opacity="0.95">
              <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.95;0.4;0.95" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="34" cy="10" r="1.5" fill="cyan" opacity="0.9">
              <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="34" r="1.5" fill="pink" opacity="0.9">
              <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="5s" repeatCount="indefinite" />
            </circle>
            
            {/* Corner accent stars */}
            {[{x: 38, y: 10}, {x: 10, y: 38}, {x: 38, y: 38}, {x: 10, y: 10}].map((pos, i) => (
              <g key={i}>
                <circle cx={pos.x} cy={pos.y} r="2" fill="white" opacity="0.9">
                  <animate attributeName="opacity" values="1;0.3;1" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
                </circle>
                <path d={`M${pos.x} ${pos.y - 3} L${pos.x} ${pos.y + 3} M${pos.x - 3} ${pos.y} L${pos.x + 3} ${pos.y}`} stroke="white" strokeWidth="1" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.2;0.8" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
                </path>
              </g>
            ))}
            
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.9">
                  <animate attributeName="stop-color" values="#00f5ff;#ff00ff;#ffff00;#00f5ff" dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#ff00ff" stopOpacity="0.9">
                  <animate attributeName="stop-color" values="#ff00ff;#ffff00;#00f5ff;#ff00ff" dur="6s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              
              <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
              </linearGradient>
              
              <radialGradient id="logoGradient3">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.6" />
              </radialGradient>
            </defs>
          </svg>
          
          {/* Energy field particles - minimal */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-700">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-0.5 rounded-full"
                style={{
                  top: `${25 + (i * 6)}%`,
                  left: `${15 + (i * 8)}%`,
                  background: ['#00f5ff', '#ff00ff', '#ffff00'][i % 3],
                  animation: `orbit ${3 + (i * 0.3)}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0.6
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Energy pulse waves - minimal */}
        {isHovered && (
          <>
            <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-[ping_1.5s_ease-out_infinite]" />
            <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-[ping_2s_ease-out_infinite]" style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </div>
      
      {showText && (
        <div className="relative">
          <div className="relative">
            {/* Subtle text glow */}
            <span className={`${textSizes[size]} font-black tracking-tight absolute inset-0 blur-sm bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent opacity-30`}>
              Ownquesta
            </span>
            
            {/* Main text */}
            <span className={`${textSizes[size]} font-black tracking-tight relative bg-gradient-to-r from-[#667eea] via-[#764ba2] via-[#f093fb] via-[#667eea] to-[#764ba2] bg-clip-text text-transparent bg-[length:200%_100%] transition-all duration-700 group-hover:scale-110 group-hover:bg-[length:100%_100%] animate-[shimmerText_3s_linear_infinite]`}>
              Ownquesta
              
              {/* Animated underline */}
              <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 w-0 group-hover:w-full transition-all duration-1000 rounded-full" />
            </span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes shimmerText {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        @keyframes rainbow {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(360deg); }
        }
        
        @keyframes liquidMetal {
          0%, 100% { 
            background-position: 0% 50%;
            transform: rotate(0deg) scale(1);
          }
          25% { 
            background-position: 50% 25%;
            transform: rotate(5deg) scale(1.05);
          }
          50% { 
            background-position: 100% 50%;
            transform: rotate(0deg) scale(1);
          }
          75% { 
            background-position: 50% 75%;
            transform: rotate(-5deg) scale(1.05);
          }
        }
        
        @keyframes aurora {
          0%, 100% { 
            opacity: 0.3;
            transform: translateX(-50%) translateY(-50%) rotate(0deg);
          }
          50% { 
            opacity: 0.7;
            transform: translateX(-50%) translateY(-50%) rotate(180deg);
          }
        }
        
        @keyframes quantum {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
          }
          25% { 
            transform: translate(30px, -30px) scale(1.5);
            opacity: 1;
          }
          50% { 
            transform: translate(-20px, -50px) scale(0.8);
            opacity: 0.5;
          }
          75% { 
            transform: translate(-40px, -20px) scale(1.3);
            opacity: 0.9;
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg);
          }
          25% { 
            transform: translate(15px, -15px) rotate(5deg);
          }
          50% { 
            transform: translate(-10px, -25px) rotate(-5deg);
          }
          75% { 
            transform: translate(-15px, -10px) rotate(3deg);
          }
        }
        
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% { 
            opacity: 1;
            transform: scale(2) rotate(180deg);
          }
        }
        
        @keyframes wave {
          0%, 100% { 
            transform: translateY(0) scaleY(1);
          }
          50% { 
            transform: translateY(-15px) scaleY(1.1);
          }
        }
        
        @keyframes orbit {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          25% { 
            transform: translate(30px, -30px) scale(1.8) rotate(90deg);
            opacity: 0.5;
          }
          50% { 
            transform: translate(0, -50px) scale(1.2) rotate(180deg);
            opacity: 1;
          }
          75% { 
            transform: translate(-30px, -30px) scale(1.8) rotate(270deg);
            opacity: 0.5;
          }
        }
        
        @keyframes dash {
          0% { 
            stroke-dashoffset: 100.53;
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% { 
            stroke-dashoffset: 0;
            opacity: 0.5;
          }
        }
      `}</style>
    </Link>
  );
}
