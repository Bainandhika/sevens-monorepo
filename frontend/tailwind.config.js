/**
 * Neo-Brutalist Design Tokens for Tujuhan Tactical (7-an)
 * Derived from DESIGN.md and Google Stitch specifications.
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
        // Existing nb-* legacy and convenience tokens
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

        // Full DESIGN.md & Stitch semantic color tokens
        'surface': '#FAF8FF',
        'surface-dim': '#D2D9F4',
        'surface-bright': '#FAF8FF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F2F3FF',
        'surface-container': '#EAEDFF',
        'surface-container-high': '#E1E7FF',
        'surface-container-highest': '#DAE2FD',
        'on-surface': '#131B2E',
        'on-surface-variant': '#3C4A42',
        'inverse-surface': '#283044',
        'inverse-on-surface': '#EEF0FF',
        'outline': '#000000',
        'outline-variant': '#BBCABF',
        'primary': '#006C49',
        'primary-container': '#10B981',
        'on-primary-container': '#00422B',
        'inverse-primary': '#4EDEA3',
        'secondary': '#725C00',
        'secondary-container': '#FFD000',
        'on-secondary-container': '#6F5900',
        'tertiary': '#C0000A',
        'tertiary-container': '#FF7B6B',
        'error': '#BA1A1A',
        'error-container': '#FFDAD6',
        'on-error-container': '#93000A',
        'felt-green': '#0C693A',
        'felt-dark': '#08532E',
        'felt-placeholder': '#0E5531',
        'dock-tray': '#EDEBE6',
        'dock-rack': '#1B4332',
        'rt-rw-maroon': '#8B0000',
        'fold-coral': '#FF5A5F',

        // Stitch brand and suit aliases
        'brand-yellow': '#FFE600',
        'brand-mint': '#00D084',
        'brand-coral': '#FF4343',
        'suit-black': '#000000',
        'suit-red': '#FF4343',
      },
      boxShadow: {
        'brutal-xs': '1px 1px 0px #000000',
        'brutal-sm': '2px 2px 0px #000000',
        'neo-sm': '2px 2px 0px #000000',
        'brutal-card': '2.5px 2.5px 0px #000000',
        'neo-card': '2.5px 2.5px 0px #000000',
        'neo': '3px 3px 0px #000000',
        'brutal': '3.5px 3.5px 0px #000000',
        'brutal-md': '4px 4px 0px #000000',
        'neo-md': '4px 4px 0px #000000',
        'neo-lg': '5px 5px 0px #000000',
        'brutal-lg': '6px 6px 0px #000000',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        grotesk: ['Space Grotesk', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
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
