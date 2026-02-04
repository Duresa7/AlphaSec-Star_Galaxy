/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sith-red': '#8B0000',
        'sith-crimson': '#DC143C',
        'republic-gold': '#FFD700',
        'republic-blue': '#1E90FF',
        'hyperspace-blue': '#00BFFF',
        'space-black': '#0a0a0f',
        'nebula-purple': '#9400D3',
        'nebula-cyan': '#00CED1',
      },
      fontFamily: {
        'aurebesh': ['Aurebesh', 'sans-serif'],
        'star-wars': ['Star Jedi', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
