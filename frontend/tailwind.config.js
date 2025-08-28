/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'azt-blue': {
          DEFAULT: '#1e40af',
          dark: '#3b82f6',
        },
        'azt-green': {
          DEFAULT: '#16a34a',
          dark: '#22c55e',
        },
        'azt-red': {
          DEFAULT: '#dc2626',
          dark: '#ef4444',
        },
      },
      animation: {
        'ticker': 'ticker 60s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translate3d(100%, 0, 0)' },
          '100%': { transform: 'translate3d(-100%, 0, 0)' }
        }
      }
    },
  },
  plugins: [],
}
