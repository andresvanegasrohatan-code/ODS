/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#8E1B4D',
          dark: '#6C1339',
          tint: '#F6DFE8',
        },
        cream: '#FAF1EC',
        ink: {
          DEFAULT: '#2C1E29',
          soft: '#7A6670',
        },
        line: '#ECDDD5',
        sidebar: {
          DEFAULT: '#221A33',
          text: '#B3A7BE',
        },
        gold: {
          DEFAULT: '#B8862B',
          tint: '#FBEBD0',
        },
        violet: {
          DEFAULT: '#5B4A8A',
          tint: '#E8E1F2',
        },
        ok: {
          DEFAULT: '#3F8F6B',
          tint: '#DDEFE6',
        },
        danger: '#B23A48',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Karla', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(44, 30, 41, 0.18)',
      },
    },
  },
  plugins: [],
};
