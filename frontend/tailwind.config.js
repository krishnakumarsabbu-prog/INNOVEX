/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        enterprise: {
          // Primary - Enterprise Red
          red: {
            DEFAULT: '#B31925',
            50: '#FBEBED',
            100: '#F6D7DB',
            200: '#EDAFB7',
            300: '#E08693',
            400: '#D45E6F',
            500: '#C73548',
            600: '#B31925',
            700: '#8F121D',
            800: '#6B0E16',
            900: '#4A0A0F',
          },
          // Accent - Gold
          gold: {
            DEFAULT: '#FFC72C',
            50: '#FFF9E8',
            100: '#FFF1C2',
            200: '#FFE58C',
            300: '#FFD955',
            400: '#FFC72C',
            500: '#E0B022',
            600: '#C29A1B',
            700: '#9A780F',
            800: '#735C0B',
            900: '#4D3D07',
          },
          // Text - Charcoal
          charcoal: {
            DEFAULT: '#2D2D2D',
            50: '#F8F8F8',
            100: '#EFEFEF',
            200: '#DADADA',
            300: '#B8B8B8',
            400: '#8A8A8A',
            500: '#6B6B6B',
            600: '#525252',
            700: '#3D3D3D',
            800: '#2D2D2D',
            900: '#1A1A1A',
          },
          // Neutral - Warm Gray
          gray: {
            warm: '#F5F4F1',
            'warm-dark': '#EAE8E3',
            border: '#E2E0DC',
            'border-dark': '#C9C6BF',
          },
          // Supporting - Blue (for secondary info)
          blue: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            500: '#3B82F6',
            600: '#2563EB',
            700: '#1D4ED8',
          },
          // Success - Green
          success: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            200: '#BBF7D0',
            500: '#22C55E',
            600: '#16A34A',
            700: '#15803D',
          },
          // Warning - Amber
          warning: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
          },
          // Error
          error: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Source Serif Pro', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-in-up': 'fadeInUp 300ms ease-out',
        'slide-in-right': 'slideInRight 250ms ease-out',
        'slide-in-left': 'slideInLeft 250ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'scale-in': 'scaleIn 150ms ease-out',
        'shimmer': 'shimmer 1.5s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'enterprise': '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.06)',
        'enterprise-md': '0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 4px 8px 0 rgba(0, 0, 0, 0.06)',
        'enterprise-lg': '0 4px 8px 0 rgba(0, 0, 0, 0.04), 0 8px 16px 0 rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'enterprise': '4px',
      },
    },
  },
  plugins: [],
}
