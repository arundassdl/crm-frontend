/**
 * Module Federation (analytics) — **runtime only** on this host.
 *
 * A client `ModuleFederationPlugin` with `shared: { react, react-dom }` breaks the App Router:
 * Next expects a single React instance with `React.use`; federated sharing can replace resolution
 * and cause `(0, _react.use) is not a function` and hydration failures.
 *
 * Remotes load via `@module-federation/runtime` (`loadRemote` in `src/lib/mf/mfHost.ts`).
 * Analytics URLs live under `src/pages/analytics/*` (Pages Router) + `src/pages/_app.tsx`.
 */
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_ANALYTICS_MF_BUILD_BUST:
      process.env.NEXT_PUBLIC_ANALYTICS_MF_CACHE_BUST ||
      String(Date.now()),
  },
  webpack: (config, { dev, isServer }) => {
    /**
     * Federated remotes may import `next/router`. Shim prefers Pages context, then App context.
     */
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'next/router': path.resolve(
          __dirname,
          'src/lib/mf/shims/next-router-app-shim.tsx'
        ),
      }
    }

    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 244000,
      }
    }
    return config
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error'],
          }
        : false,
  },

  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,

  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '*',
        port: '8012',
        pathname: '/**',
      },
    ],
  },

  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/analytics/dashboard',
        permanent: false,
      },
      {
        source: '/dashboard/create',
        destination: '/analytics/dashboard/create',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
