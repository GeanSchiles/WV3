/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0B0E14',
          900: '#0F131B',
          800: '#151B26',
          700: '#1C2430',
          600: '#28323F',
          500: '#3A4553',
          400: '#5B6674',
          300: '#8891A0',
          200: '#B8C0CC',
          100: '#E4E8EE',
        },
        accent: {
          DEFAULT: '#3E7CB1',
          soft: '#2C5A82',
          bright: '#5DA0D6',
        },
        ok: '#3FA772',
        warn: '#D6A340',
        danger: '#C25450',
        rastreada: '#3FA772',
        naoRastreada: '#8891A0',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
