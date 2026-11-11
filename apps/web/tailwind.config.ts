import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Soft Aurora palette
        paper: '#FBF8F4',
        ink: {
          DEFAULT: '#231C33',
          soft: '#5E5670',
          faint: '#9A93A8',
        },
        coral: {
          DEFAULT: '#FF7A59',
          deep: '#E85A38',
          wash: '#FFE6DC',
        },
        peach: '#FFD3BD',
        lilac: '#D9CFFF',
        mint: '#C9F0DE',
        line: 'rgba(35, 28, 51, 0.08)',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        blob: '2.25rem',
      },
      boxShadow: {
        glass: '0 1px 0 rgba(255,255,255,0.7) inset, 0 12px 32px -18px rgba(70, 40, 90, 0.28)',
        lift: '0 18px 40px -20px rgba(232, 90, 56, 0.45)',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(6%, -4%, 0) scale(1.08)' },
          '66%': { transform: 'translate3d(-5%, 5%, 0) scale(0.95)' },
        },
        orbit: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        counter: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(-360deg)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.6)', opacity: '0.55' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.045)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        sweep: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        drift: 'drift 22s ease-in-out infinite',
        'drift-slow': 'drift 30s ease-in-out infinite reverse',
        orbit: 'orbit 48s linear infinite',
        counter: 'counter 48s linear infinite',
        ripple: 'ripple 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite',
        breathe: 'breathe 3.2s ease-in-out infinite',
        rise: 'rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        sweep: 'sweep 2.6s linear infinite',
        'bounce-dot': 'bounceDot 1.2s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
