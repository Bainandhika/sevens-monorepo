/**
 * Neo-Brutalist Design Tokens for Tujuhan Tactical (7-an)
 * Derived from DESIGN.md and Google Stitch specifications.
 *
 * @typedef {'nb-bg' | 'nb-surface' | 'nb-white' | 'nb-black' | 'nb-yellow' | 'nb-mint' | 'nb-emerald' | 'nb-coral' | 'nb-red' | 'nb-cyan' | 'table-felt' | 'table-dark' | 'table-light'} NeoColorToken
 * @typedef {'brutal-xs' | 'brutal-sm' | 'brutal-card' | 'brutal' | 'brutal-md' | 'brutal-lg'} NeoShadowToken
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nb-bg': '#F5F0EA',
        'nb-surface': '#FAF8FF',
        'nb-white': '#FFFFFF',
        'nb-black': '#000000',
        'nb-dark': '#131B2E',
        'nb-yellow': '#FFE600',
        'nb-mint': '#00D084',
        'nb-emerald': '#10B981',
        'nb-coral': '#FF4343',
        'nb-red': '#FF4D4D',
        'nb-cyan': '#00D4FF',
        'table-felt': '#055A36',
        'table-dark': '#033B23',
        'table-light': '#087346',
      },
      boxShadow: {
        'brutal-xs': '1px 1px 0px #000000',
        'brutal-sm': '2px 2px 0px #000000',
        'brutal-card': '2.5px 2.5px 0px #000000',
        'brutal': '3.5px 3.5px 0px #000000',
        'brutal-md': '4px 4px 0px #000000',
        'brutal-lg': '6px 6px 0px #000000',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.125rem', // 2px
        'DEFAULT': '0.25rem', // 4px
        'md': '0.375rem', // 6px
        'lg': '0.5rem', // 8px
        'xl': '0.75rem', // 12px
        '2xl': '1rem', // 16px
        'full': '9999px',
      },
      borderWidth: {
        'DEFAULT': '1px',
        '2': '2px',
        '2.5': '2.5px',
        '3': '3px',
        '4': '4px',
      },
    },
  },
  plugins: [],
}

