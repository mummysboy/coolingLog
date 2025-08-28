/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'mobile': '320px',
        'mobile-lg': '375px',
        'mobile-xl': '425px',
        'tablet': '768px',
        'ipad': '1024px',
        'ipad-lg': '1280px',
        'ipad-xl': '1366px',
        'ipad-pro': '1668px',
        'ipad-landscape': {'raw': '(min-width: 1024px) and (orientation: landscape)'},
        'ipad-portrait': {'raw': '(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)'},
        'mobile-portrait': {'raw': '(max-width: 767px) and (orientation: portrait)'},
        'mobile-landscape': {'raw': '(max-width: 767px) and (orientation: landscape)'},
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
}
