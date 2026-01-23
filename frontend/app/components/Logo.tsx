'use client';

import Link from 'next/link';

interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'default' | 'light';
}

export default function Logo({ href = '/', size = 'md', showText = true, variant = 'default' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: { width: 16, height: 16 },
    md: { width: 20, height: 20 },
    lg: { width: 24, height: 24 }
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <Link
      href={href}
      className="flex items-center gap-3 group cursor-pointer"
    >
      {/* AI/ML Neural Network Icon */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 relative overflow-hidden`}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-transparent to-pink-400/20 animate-pulse"></div>

        {/* Neural Network SVG */}
        <svg
          width={iconSizes[size].width}
          height={iconSizes[size].height}
          viewBox="0 0 24 24"
          fill="none"
          className="text-white relative z-10"
        >
          {/* Neural network nodes and connections */}
          <circle cx="4" cy="6" r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="12" cy="4" r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="20" cy="6" r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="4" cy="18" r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="12" cy="20" r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="20" cy="18" r="1.5" fill="currentColor" opacity="0.9"/>

          {/* Hidden layer nodes */}
          <circle cx="8" cy="12" r="1" fill="currentColor" opacity="0.7"/>
          <circle cx="16" cy="12" r="1" fill="currentColor" opacity="0.7"/>
          <circle cx="12" cy="10" r="1" fill="currentColor" opacity="0.7"/>
          <circle cx="12" cy="14" r="1" fill="currentColor" opacity="0.7"/>

          {/* Connection lines */}
          <path d="M4 6 L8 12 L12 10 L16 12 L20 6" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
          <path d="M4 18 L8 12 L12 14 L16 12 L20 18" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
          <path d="M12 4 L12 10 L12 14 L12 20" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
          <path d="M4 6 L4 18" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
          <path d="M20 6 L20 18" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
        </svg>

        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {showText && (
        <span className={`${textSizes[size]} font-bold ${
          variant === 'light'
            ? 'text-white'
            : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent'
        } group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-indigo-700 transition-all duration-300`}>
          Ownquesta
        </span>
      )}
    </Link>
  );
}
