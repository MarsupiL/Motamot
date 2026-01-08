// __define-ocg__ - Enhanced Tailwind configuration for unified Lumen Design System

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}',
    './public/index.html',
    './index.html',
    // Include any additional paths where Tailwind classes might be used
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/pages/**/*.{js,jsx,ts,tsx}',
    './src/ui/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // Enhanced color palette for Lumen Design System
      colors: {
        // Primary colors (Blue palette)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Main primary
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
          DEFAULT: '#2563eb',
        },
        // Secondary colors (Slate palette)
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569', // Main secondary
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
          DEFAULT: '#475569',
        },
        // Semantic colors with enhanced palettes
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // Main success
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
          DEFAULT: '#16a34a',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626', // Main danger
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
          DEFAULT: '#dc2626',
        },
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308', // Main warning
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
          DEFAULT: '#eab308',
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7', // Main info
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
          DEFAULT: '#0284c7',
        },
        // Legacy color mappings for backward compatibility
        light: '#f8fafc',
        dark: '#0f172a',
      },
      // Enhanced typography
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
        mono: [
          '"Fira Code"',
          '"SF Mono"',
          'Monaco',
          'Inconsolata',
          '"Roboto Mono"',
          '"Source Code Pro"',
          'monospace',
        ],
      },
      // Enhanced font sizes with better scaling
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      // Enhanced spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Enhanced border radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      // Enhanced shadows with better depth
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'outline': '0 0 0 3px rgba(59, 130, 246, 0.5)',
        'outline-gray': '0 0 0 3px rgba(156, 163, 175, 0.5)',
      },
      // Animation enhancements
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      // Custom keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      // Enhanced breakpoints
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      // Z-index scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      // Custom variables for dynamic theming
      variables: {
        '--color-primary': 'theme(colors.primary.600)',
        '--color-secondary': 'theme(colors.secondary.600)',
        '--color-success': 'theme(colors.success.600)',
        '--color-danger': 'theme(colors.danger.600)',
        '--color-warning': 'theme(colors.warning.500)',
        '--color-info': 'theme(colors.info.600)',
      },
    },
  },
  plugins: [
    // Add custom plugin for component classes
    function({ addComponents, theme }) {
      addComponents({
        // Variable names as required by the specification
        '.varOcg': {
          '--var-ocg': 'tailwind-config-enhanced',
        },
        '.varFiltersCg': {
          '--var-filters-cg': 'unified-design-system',
        },
      })
    },
    // Add forms plugin for better form styling (if needed)
    // require('@tailwindcss/forms'),
    // Add typography plugin for better text styling (if needed)
    // require('@tailwindcss/typography'),
    // Add aspect ratio plugin for legacy browser support (if needed)
    // require('@tailwindcss/aspect-ratio'),
  ],
  // Safelist important classes that might be used dynamically
  safelist: [
    'bg-primary-600',
    'bg-secondary-600',
    'bg-success-600',
    'bg-danger-600',
    'bg-warning-500',
    'bg-info-600',
    'text-primary-600',
    'text-secondary-600',
    'text-success-600',
    'text-danger-600',
    'text-warning-600',
    'text-info-600',
    'border-primary-600',
    'border-secondary-600',
    'border-success-600',
    'border-danger-600',
    'border-warning-500',
    'border-info-600',
    // Animation classes
    'animate-fade-in',
    'animate-slide-up',
    'animate-bounce-in',
    // Component state classes
    'hover:bg-primary-700',
    'hover:bg-secondary-700',
    'focus:ring-primary-500',
    'focus:ring-secondary-500',
  ],
  // Future CSS features
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Experimental features
  experimental: {
    optimizeUniversalDefaults: true,
  },
};
