/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { 'box-shadow': '0 0 10px rgba(0,255,136,0.3)' },
          '100%': { 'box-shadow': '0 0 20px rgba(0,255,136,0.6)' },
        },
      },
    },
  },
  plugins: [],
};