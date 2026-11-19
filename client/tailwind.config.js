/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {50:'#020617',100:'#0F172A',200:'#1E293B',300:'#334155',400:'#475569',500:'#64748B',600:'#94A3B8',700:'#CBD5E1',800:'#E2E8F0',900:'#FFFFFF',950:'#F8FAFC'},
        indigo: {300:'#6366F1',400:'#4F46E5',500:'#4F46E5',600:'#4F46E5',700:'#4338CA'},
        cyan: {300:'#06B6D4',400:'#0891B2',500:'#0891B2'},
        emerald: {400:'#059669',500:'#059669'},
        amber: {400:'#D97706',500:'#D97706'},
        purple: {400:'#7C3AED',500:'#7C3AED'},
        red: {400:'#DC2626',500:'#DC2626'},
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': {
            opacity: '1',
            filter: 'drop-shadow(0 0 10px rgba(8, 145, 178, 0.3))',
          },
          '50%': {
            opacity: '0.7',
            filter: 'drop-shadow(0 0 4px rgba(79, 70, 229, 0.2))',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
