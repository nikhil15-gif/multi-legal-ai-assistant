/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        legal: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#95bedc',
          400: '#609dc9',
          500: '#3c81b2',
          600: '#2c6694',
          700: '#245277',
          800: '#1b3b57',
          900: '#0f2438',
          950: '#07131f'
        },
        tealAccent: {
          500: '#0D9488',
          600: '#0F766E'
        }
      }
    },
  },
  plugins: [],
}
