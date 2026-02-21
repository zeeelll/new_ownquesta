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
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-10 h-10 sm:w-11 sm:h-11',
  };

  const iconSizes = {
    sm: { width: 14, height: 14 },
    md: { width: 17, height: 17 },
    lg: { width: 20, height: 20 },
  };

  const textSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  return (
    <Link href={href} className="flex items-center gap-2.5 group cursor-pointer select-none">
      {/* Icon */}
      <div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-105`}
        style={{
          background: 'linear-gradient(135deg, #4a3aad 0%, #7c5cbf 50%, #5b3fa0 100%)',
          boxShadow: '0 4px 16px rgba(110, 84, 200, 0.35)',
        }}
      >
        {/* Subtle animated sheen */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 logo-shine"
          style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)' }}
        />

        {/* Neural Network SVG */}
        <svg
          width={iconSizes[size].width}
          height={iconSizes[size].height}
          viewBox="0 0 24 24"
          fill="none"
          className="text-white relative z-10"
        >
          <circle cx="4"  cy="6"  r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="12" cy="4"  r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="20" cy="6"  r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="4"  cy="18" r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="12" cy="20" r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="20" cy="18" r="1.5" fill="currentColor" opacity="0.9"/>
          <circle cx="8"  cy="12" r="1"   fill="currentColor" opacity="0.65"/>
          <circle cx="16" cy="12" r="1"   fill="currentColor" opacity="0.65"/>
          <circle cx="12" cy="10" r="1"   fill="currentColor" opacity="0.65"/>
          <circle cx="12" cy="14" r="1"   fill="currentColor" opacity="0.65"/>
          <path d="M4 6 L8 12 L12 10 L16 12 L20 6"  stroke="currentColor" strokeWidth="0.9" opacity="0.55"/>
          <path d="M4 18 L8 12 L12 14 L16 12 L20 18" stroke="currentColor" strokeWidth="0.9" opacity="0.55"/>
          <path d="M12 4 L12 10 L12 14 L12 20"       stroke="currentColor" strokeWidth="0.9" opacity="0.55"/>
          <path d="M4 6 L4 18"  stroke="currentColor" strokeWidth="0.9" opacity="0.4"/>
          <path d="M20 6 L20 18" stroke="currentColor" strokeWidth="0.9" opacity="0.4"/>
        </svg>
      </div>

      {showText && (
        <span
          className={`${textSizes[size]} font-bold tracking-tight transition-all duration-300 font-chillax ${
            variant === 'light'
              ? 'text-white'
              : 'bg-gradient-to-r from-white via-[#d4c8ff] to-[#a87edf] bg-clip-text text-transparent'
          }`}
        >
          Ownquesta
        </span>
      )}
    </Link>
  );
}
