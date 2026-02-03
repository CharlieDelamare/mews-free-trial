/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Use SWC minification (7x faster than Terser)
  swcMinify: true,

  // Disable source maps in production
  productionBrowserSourceMaps: false,

  // Remove console logs in production (except errors/warnings)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['react', 'react-dom', 'date-fns', 'date-fns-tz'],
  },
}

module.exports = nextConfig
