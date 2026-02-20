/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mews: {
          night: 'var(--mews-night)',
          'deep-blue': 'var(--mews-deep-blue)',
          linen: 'var(--mews-linen)',
          'light-indigo': 'var(--mews-light-indigo)',
          blue: 'var(--mews-blue)',
          green: 'var(--mews-green)',
          coral: 'var(--mews-coral)',
          indigo: 'var(--mews-indigo)',
          pink: 'var(--mews-pink)',
          'pink-hover': 'var(--mews-pink-hover)',
          'pink-light': 'var(--mews-pink-light)',
          yellow: 'var(--mews-yellow)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
