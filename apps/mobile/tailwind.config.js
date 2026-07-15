/** @type {import('tailwindcss').Config} */
// Kaza design tokens — warm, premium, earth-toned (§7.6). Same palette as the
// admin app so the brand reads as one system.
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#22201C',
        paper: '#F7F2E9',
        sand: { DEFAULT: '#E7DCC8', deep: '#D4C5A9' },
        clay: { DEFAULT: '#B4552D', soft: '#D8825B', wash: '#F3E2D7' },
        forest: { DEFAULT: '#234436', deep: '#182F25', soft: '#3D6652' },
        gold: '#C99B3F',
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        'display-medium': ['Fraunces_500Medium'],
        sans: ['Archivo_400Regular'],
        'sans-medium': ['Archivo_500Medium'],
      },
    },
  },
  plugins: [],
};
