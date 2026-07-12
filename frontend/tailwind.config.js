/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ink-navy': '#0B1220',
        'paper': '#F6F3EA',
        'brass': '#8A6D1E',
        'ochre': '#9C3F2E',
        'teal': '#2F6F62',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
