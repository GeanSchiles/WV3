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
          950: '#1E88E5',
          900: '#1976D2',
          800: '#2196F3',
          700: '#42A5F5',
          600: '#64B5F6',
          500: '#90CAF9',
          400: '#D6EAFC',
          300: '#E8F3FE',
          200: '#F5FAFF',
          100: '#FFFFFF',
        },
        sidebar: {
          DEFAULT: '#1565C0',
          soft: '#0D47A1',
        },
        accent: {
          DEFAULT: '#0D47A1',
          soft: '#0B3D91',
          bright: '#1565C0',
        },
        ok: '#2E7D32',
        warn: '#F9A825',
        danger: '#E53935',
        rastreada: '#2E7D32',
        naoRastreada: '#CFE3FB',
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
