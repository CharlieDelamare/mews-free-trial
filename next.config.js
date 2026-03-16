/** @type {import('next').NextConfig} */
const nextConfig = {
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
    optimizePackageImports: ['react', 'react-dom', 'date-fns', 'date-fns-tz', 'lucide-react'],
  },

  // Stub optional jsPDF peer dependencies (dompurify + canvg) that are only
  // needed for the jsPDF.html() path — we use the canvas/addImage path instead.
  webpack(config) {
    config.resolve.alias['dompurify'] = false;
    config.resolve.alias['canvg'] = false;
    return config;
  },
}

module.exports = nextConfig
