/** @type {import('next').NextConfig} */
const nextConfig = { 
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Reduce chunk size in production
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 244000
      }
    }
    return config
  },
   // Compiler options
   compiler: {
    // Enables React Fast Refresh in development
    
    // Optional: Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false
  },

  // Performance optimizations
  poweredByHeader: false, // Removes X-Powered-By header
  productionBrowserSourceMaps: false, // Disable source maps in production
  
  // Typescript and other optimizations
  typescript: {
    ignoreBuildErrors: false // Set to true if you want to skip type checking during build
  },
  reactStrictMode: false,
  productionBrowserSourceMaps: true, 
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    // domains: [], // Add external image domains if needed
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '*',
        port: '8012',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
