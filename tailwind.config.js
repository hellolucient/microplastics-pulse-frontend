import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'md:hidden',
    'sm:hidden',
    'hidden',
    'md:block',
    'sm:block',
    'block',
    'line-clamp-3',
    'line-clamp-2',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['InterVariable', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Define a palette inspired by the mascot image
        'brand-blue': '#0284c7', // sky-600
        'brand-orange': '#f97316', // orange-500
        'brand-light': '#f3f4f6', // gray-100
        'brand-dark': '#1f2937', // gray-800
        'brand-darker': '#111827', // gray-900
      },
    },
  },
  plugins: [
    typography,
  ],
};
