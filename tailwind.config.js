/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Blue
        success: '#16a34a', // Green
        danger: '#dc2626', // Red
        warning: '#f59e0b', // Yellow
        background: '#f8fafc', // Light gray
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
