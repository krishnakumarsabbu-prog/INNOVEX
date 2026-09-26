/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        enterprise: {
          red: '#B31925',
          'red-dark': '#8A0F1A',
          'red-light': '#D4282F',
          gold: '#FFC72C',
          'gold-dark': '#E0B022',
          'gold-light': '#FFD955',
          charcoal: '#2D2D2D',
          'gray-warm': '#F5F4F1',
          'gray-border': '#E2E0DC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
