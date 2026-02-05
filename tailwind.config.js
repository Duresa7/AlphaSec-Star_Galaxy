/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'aurebesh': ['Aurebesh', 'sans-serif'],
        'star-wars': ['Star Jedi', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
