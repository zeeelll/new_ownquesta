/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        chillax: ['Chillax', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Chillax', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        brand: {
          50:  '#f3eeff',
          100: '#e4d9ff',
          200: '#ccb8ff',
          300: '#b08dff',
          400: '#9165f3',
          500: '#7c5cbf',
          600: '#6e54c8',
          700: '#5b3fa0',
          800: '#4a3280',
          900: '#3b2766',
          950: '#1e1338',
        },
        surface: {
          DEFAULT: '#0a0b14',
          50: 'rgba(255,255,255,0.03)',
          100: 'rgba(255,255,255,0.05)',
          200: 'rgba(255,255,255,0.08)',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6e54c8 0%, #7c49a9 100%)',
        'gradient-hero': 'linear-gradient(160deg, #ffffff 0%, #c8b8ff 50%, #9d7eee 100%)',
        'gradient-accent': 'linear-gradient(135deg, #a87edf 0%, #6e54c8 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(124, 92, 191, 0.25)',
        'glow-md': '0 0 30px rgba(124, 92, 191, 0.35)',
        'glow-lg': '0 0 60px rgba(124, 92, 191, 0.3)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 30px rgba(124, 92, 191, 0.15)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'slide-in-left': 'slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-right': 'slideInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'logo-shine': 'logoShine 3.5s ease-in-out infinite',
        'scroll-bounce': 'scrollBounce 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 92, 191, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 92, 191, 0.5)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        logoShine: {
          '0%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' },
          '50%, 100%': { transform: 'translateX(100%) translateY(100%) rotate(45deg)' },
        },
        scrollBounce: {
          '0%, 100%': { transform: 'rotate(45deg) translateY(0)', opacity: '0.5' },
          '50%': { transform: 'rotate(45deg) translateY(10px)', opacity: '1' },
        },
      },
      letterSpacing: {
        'tighter': '-0.03em',
        'tight': '-0.02em',
        'snug': '-0.01em',
        'wide-xl': '0.08em',
        'widest-xl': '0.15em',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      backdropBlur: {
        'xs': '4px',
      },
    },
  },
  plugins: [],
}
