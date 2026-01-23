'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: (e?: any) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
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
  icon
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-3 font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0';

  const variantClasses = {
    primary: 'bg-gradient-to-br from-[#6e54c8] to-[#7c49a9] text-white shadow-[0_4px_12px_rgba(110,84,200,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(110,84,200,0.4)] focus:ring-[#6e54c8]',
    secondary: 'bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] focus:ring-[#8b5cf6]',
    danger: 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-[0_4px_12px_rgba(220,38,38,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] focus:ring-red-600',
    outline: 'bg-transparent border-2 border-[#6e54c8] text-[#6e54c8] hover:bg-[#6e54c8] hover:text-white focus:ring-[#6e54c8]'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={buttonClasses}>
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {icon}
      {children}
    </button>
  );
}