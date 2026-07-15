import type { Config } from 'tailwindcss';

/**
 * Kaza admin design tokens — warm, editorial, earth-toned (§7.6).
 * The back-office borrows the product's magazine identity: deep forest chrome,
 * warm paper surfaces, burnt clay accents.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#22201C',
        paper: '#F7F2E9',
        sand: {
          DEFAULT: '#E7DCC8',
          deep: '#D4C5A9',
        },
        clay: {
          DEFAULT: '#B4552D',
          soft: '#D8825B',
          wash: '#F3E2D7',
        },
        forest: {
          DEFAULT: '#234436',
          deep: '#182F25',
          soft: '#3D6652',
        },
        gold: '#C99B3F',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
