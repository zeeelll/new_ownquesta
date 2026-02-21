'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: (e?: any) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  href?: string;
  icon?: ReactNode;
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  href,
  icon,
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#7c5cbf] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none whitespace-nowrap tracking-wide font-chillax';

  const variantClasses: Record<string, string> = {
    primary:
      'bg-gradient-to-r from-[#6e54c8] to-[#7c49a9] text-white shadow-[0_4px_15px_rgba(110,84,200,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(110,84,200,0.45)] hover:from-[#7c62d6] hover:to-[#8a57b7]',
    secondary:
      'bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(139,92,246,0.45)]',
    danger:
      'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_4px_15px_rgba(220,38,38,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(220,38,38,0.4)]',
    outline:
      'bg-transparent border border-[rgba(110,84,200,0.5)] text-[#a87edf] hover:bg-[rgba(110,84,200,0.1)] hover:border-[rgba(110,84,200,0.8)] hover:text-white',
    ghost:
      'bg-transparent border border-white/10 text-[#8fa3c4] hover:bg-white/[0.05] hover:border-white/20 hover:text-white',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'px-4 py-2 text-xs sm:text-sm',
    md: 'px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base',
    lg: 'px-7 py-3.5 sm:px-9 sm:py-4 text-base sm:text-lg',
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant] ?? variantClasses.primary} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={buttonClasses}>
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={buttonClasses}>
      {icon}
      {children}
    </button>
  );
}
