/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ptv-blue': '#0072ce',
        'ptv-dark-blue': '#004b87',
        'ptv-light-blue': '#e6f2ff',
        'tram-green': '#78be20',
        'bus-orange': '#ff8200',
        'train-blue': '#0072ce',
        'skybus-red': '#e3000f',
        'music-purple': '#9b59b6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
}
