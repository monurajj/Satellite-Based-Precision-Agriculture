/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        farm: {
          green: '#1a5c2e',
          deep: '#14432a',
          light: '#f0f9f0',
          lime: '#e6f5e0',
          muted: '#6b8c5e',
          harvest: '#4ade80',
          gold: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
