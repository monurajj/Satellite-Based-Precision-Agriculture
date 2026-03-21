/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        farm: {
          green: '#2d5016',
          light: '#e8f5e0',
          muted: '#6b7c5e',
          earth: '#c9b896',
          harvest: '#8bbc52',
          soil: '#a0826d',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        sway: 'sway 3s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease-out forwards',
      },
      keyframes: {
        sway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
