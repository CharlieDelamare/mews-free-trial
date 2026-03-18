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
        /* Override Tailwind gray with Night Black-derived neutrals */
        gray: {
          50: 'var(--neutral-50)',
          100: 'var(--neutral-100)',
          200: 'var(--neutral-200)',
          300: 'var(--neutral-300)',
          400: 'var(--neutral-400)',
          500: 'var(--neutral-500)',
          600: 'var(--neutral-600)',
          700: 'var(--neutral-700)',
          800: 'var(--neutral-800)',
          900: 'var(--neutral-900)',
        },
        /* Direct Mews palette access */
        mews: {
          'night-black': 'var(--mews-night-black)',
          'deep-blue': 'var(--mews-deep-blue)',
          'linen': 'var(--mews-linen)',
          'light-indigo': 'var(--mews-light-indigo)',
          'blue': 'var(--mews-blue)',
          'olive-green': 'var(--mews-olive-green)',
          'green': 'var(--mews-green)',
          'coral': 'var(--mews-coral)',
          'yellow': 'var(--mews-yellow)',
          'pink': 'var(--mews-pink)',
          'indigo': 'var(--mews-indigo)',
          'primary': 'var(--mews-primary)',
          'primary-hover': 'var(--mews-primary-hover)',
        },
        /* Semantic: Primary (Indigo-based) */
        primary: {
          50: '#F5F5FF',
          100: 'var(--mews-light-indigo)',
          200: '#DBDBfd',
          300: 'var(--mews-indigo)',
          400: '#8A89F5',
          500: '#6664EF',
          600: '#4B49D6',
          700: '#3937B0',
          800: '#2A2984',
        },
        /* Semantic: Success (Green-based) */
        success: {
          50: '#EEFBF4',
          100: 'var(--mews-green)',
          200: '#B8E5D2',
          300: '#7DD4B3',
          400: '#3FBA8A',
          500: '#1A9D6C',
          600: '#0E7D52',
          700: '#0A5F3E',
          800: '#07412B',
        },
        /* Semantic: Info (Blue-based) */
        info: {
          50: '#EFF4FE',
          100: 'var(--mews-blue)',
          200: '#B8CCFA',
          300: '#8BAAF5',
          400: '#5E88EF',
          500: '#3B6ED5',
          600: '#2957B5',
          700: '#1E4190',
          800: '#152E68',
        },
        /* Semantic: Warning (Yellow-based) */
        warning: {
          50: '#FEFDE8',
          100: '#FDFAB7',
          200: '#F7F08A',
          300: 'var(--mews-yellow)',
          400: '#D4D600',
          500: '#AEB000',
          600: '#868800',
          700: '#636500',
          800: '#434400',
        },
        /* Semantic: Error (Coral-based) */
        error: {
          50: '#FFF1F2',
          100: '#FFE1E3',
          200: '#FFBDC1',
          300: '#FF8A90',
          400: 'var(--mews-coral)',
          500: '#E8404B',
          600: '#C62D37',
          700: '#A12028',
          800: '#7D161D',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        subheading: ['var(--font-subheading)'],
        body: ['var(--font-body)'],
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
