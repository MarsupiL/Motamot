/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blackboard: {
          dark: '#0d1f0d',
          DEFAULT: '#1a2f1a',
          light: '#243524',
          border: '#3d4f3d',
        },
        chalk: {
          DEFAULT: '#f5f5f0',
          dim: 'rgba(245, 245, 240, 0.7)',
          faint: 'rgba(245, 245, 240, 0.4)',
          subtle: 'rgba(245, 245, 240, 0.2)',
        },
      },
      fontFamily: {
        cursive: ['"Playwrite FR Trad"', 'cursive'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'spin-slow': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
