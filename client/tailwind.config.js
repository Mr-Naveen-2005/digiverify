/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        signal: {
          bg: '#02040a',
          secondary: '#050914',
          card: 'rgba(8, 14, 28, 0.75)',
          green: '#00ff87',
          cyan: '#60efff',
          purple: '#a855f7',
          gold: '#facc15',
          border: 'rgba(96, 239, 255, 0.18)',
        },
        bg: {
          main: '#02040a',
          secondary: '#050914',
          card: 'rgba(8, 14, 28, 0.75)',
          hud: 'rgba(10, 18, 35, 0.85)',
        },
        brand: {
          primary: '#00ff87',
          ai: '#60efff',
          neon: '#a855f7',
        },
        status: {
          success: '#00ff87',
          warning: '#facc15',
          danger: '#ff4b4b',
        },
        text: {
          main: '#f8fafc',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        border: {
          DEFAULT: 'rgba(96, 239, 255, 0.18)',
          cyber: 'rgba(96, 239, 255, 0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Space Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 30px rgba(0, 0, 0, 0.6)',
        glow: '0 0 30px rgba(0, 255, 135, 0.25)',
        'glow-cyan': '0 0 30px rgba(96, 239, 255, 0.25)',
        'glow-purple': '0 0 30px rgba(168, 85, 247, 0.25)',
        'glow-gold': '0 0 30px rgba(250, 204, 21, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        scanline: 'scanline 2.5s linear infinite',
        ticker: 'ticker 28s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
