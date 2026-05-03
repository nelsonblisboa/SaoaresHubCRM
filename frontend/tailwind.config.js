/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cor de destaque dinâmica via CSS variable
        accent: 'var(--accent-color, #10b981)',
      }
    },
  },
  plugins: [],
}