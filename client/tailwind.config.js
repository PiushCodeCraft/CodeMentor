/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 1. Inverted Slate: Clean Light Theme Backgrounds, Surfaces, Borders & Typography
        slate: {
          50: '#0F172A',   // Inverted: deep navy
          100: '#0F172A',  // Primary text: near-black #0F172A (16:1 contrast on #FFF)
          200: '#1E293B',  // High-contrast dark text
          300: '#334155',  // Dark navy-gray text (>9:1 contrast)
          400: '#64748B',  // Secondary text: #64748B (4.6:1 WCAG AA contrast on white)
          500: '#64748B',  // Secondary / subtle text
          600: '#94A3B8',  // Light muted slate / placeholders
          700: '#CBD5E1',  // Subtle borders / input hover
          800: '#E2E8F0',  // Borders: #E2E8F0
          900: '#FFFFFF',  // Cards and surfaces: #FFFFFF
          950: '#F8FAFC',  // Page background: #F8FAFC
        },

        // 2. Primary: Indigo -> #4F46E5 (Hover: #4338CA, Text on light: #4F46E5)
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#4338CA',  // Darkened so text-indigo-300 has >7:1 contrast on light
          400: '#4F46E5',  // Remapped to Primary #4F46E5
          500: '#4F46E5',  // Primary #4F46E5
          600: '#4F46E5',  // Primary button color
          700: '#4338CA',  // Primary button hover color
          800: '#3730A3',
          900: '#312E81',
          950: '#EEF2FF',  // Light indigo tint for card backgrounds
        },

        // 3. Accent: Cyan -> #0891B2 (Icons, borders, badges)
        cyan: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#0E7490',  // Darkened for text contrast
          300: '#0891B2',  // Accent #0891B2
          400: '#0E7490',  // Darkened for contrast on light
          500: '#0891B2',  // Accent #0891B2
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          950: '#F0FDFA',  // Subtle light cyan tint
        },

        // 4. Mentor Badge / Success: Emerald -> #059669
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#047857',  // Darkened for text contrast
          300: '#047857',  // Darkened
          400: '#059669',  // Mentor badge: #059669
          500: '#059669',
          600: '#059669',  // Solid badge / button
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#ECFDF5',  // Subtle light green tint
        },

        // 5. Credits / Warnings: Amber -> #D97706
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#92400E',  // Darkened
          300: '#B45309',  // Darkened
          400: '#D97706',  // Credits: #D97706 (4.6:1 contrast on white)
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',
          950: '#FFFBEB',  // Subtle light amber tint
        },

        // 6. Admin Badge: Purple -> #7C3AED
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#6D28D9',  // Darkened for text contrast
          300: '#6D28D9',  // Darkened
          400: '#7C3AED',  // Admin badge: #7C3AED
          500: '#7C3AED',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#FAF5FF',  // Subtle light purple tint
        },

        // 7. Error / Danger: Red & Rose -> #DC2626
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#B91C1C',
          300: '#DC2626',
          400: '#DC2626',  // Error: #DC2626
          500: '#DC2626',
          600: '#B91C1C',
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#450A0A',
          950: '#FEF2F2',
        },
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#BE123C',
          300: '#E11D48',
          400: '#DC2626',
          500: '#DC2626',
          600: '#BE123C',
          700: '#9F1239',
          800: '#881337',
          900: '#4C0519',
          950: '#FFF1F2',
        },
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
