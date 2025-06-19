/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scan all relevant files in src
  ],
  theme: {
    extend: {
      // Keep font families consistent with what was in index.html's tailwind config
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Menlo', 'monospace'],
      },
      // If you had other theme extensions (colors, etc.) in the CDN config, add them here.
      // For example, if you used specific color names like 'primary', you'd define them here.
      // However, the project seems to use Tailwind's default color palette directly (e.g., 'blue-600').
    },
  },
  plugins: [],
}
