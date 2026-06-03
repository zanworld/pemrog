/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF5722', // Primary bright orange
          darkBg: '#131214', // MangaDex dark background
          cardBg: '#1e1c20', // Card background
          border: '#2d2b30', // Subtle border
          accent: '#FF764D', // Hover accent orange
          textMain: '#F5F5F7',
          textMuted: '#9e9ba1',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 15px rgba(255, 87, 34, 0.35)',
        'neon-hover': '0 0 25px rgba(255, 87, 34, 0.6)',
      }
    },
  },
  plugins: [],
}
