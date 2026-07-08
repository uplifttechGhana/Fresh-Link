/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        forest: '#0E4D2C',
        green: {
          DEFAULT: '#15803D',
          50: '#F0F7F2',
          100: '#E7F0EA',
          600: '#15803D',
          700: '#0E6B32',
          800: '#0E4D2C',
        },
        orange: {
          DEFAULT: '#EA7A3B',
          soft: '#FBEADD',
        },
        cream: '#F4F1EA',
        earth: '#8A6A4F',
        yellow: {
          DEFAULT: '#F5D042',
          light: '#F9E58A',
        },
        ink: '#16201A',
        muted: '#6B7770',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        card: '0 8px 24px -8px rgba(14, 77, 44, 0.10)',
        float: '0 12px 32px -8px rgba(14, 77, 44, 0.18)',
        fab: '0 10px 24px -4px rgba(21, 128, 61, 0.45)',
      },
    },
  },
  plugins: [],
}
