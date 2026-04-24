/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'Times New Roman', 'serif'],
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
