/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#ffffff',
        'background': '#09090b', // zinc-950
        'surface': '#18181b', // zinc-900
        'border': '#27272a', // zinc-800
        'text-primary': '#ffffff',
        'text-secondary': '#a1a1aa', // zinc-400
      },
      boxShadow: {
        'neon': '0 0 15px rgba(255,255,255,0.7)',
      },
    },
  },
  plugins: [],
}
