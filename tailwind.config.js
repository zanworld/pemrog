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
          orange: '#00f0ff', // Cyberpunk Cyan (kept var name for compatibility)
          darkBg: '#09090b', // Deeper dark for neon contrast
          cardBg: '#121214', // Card background
          border: '#27272a', // Subtle border
          accent: '#bf00ff', // Cyberpunk Purple accent
          textMain: '#F5F5F7',
          textMuted: '#9e9ba1',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 15px rgba(0, 240, 255, 0.4)',
        'neon-hover': '0 0 25px rgba(191, 0, 255, 0.6)',
      }
    },
  },
  plugins: [],
}
