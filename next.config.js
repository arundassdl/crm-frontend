/**
 * Module Federation — **runtime only** on this host (see `src/lib/mf/mfHost.ts`).
 * Do **not** add webpack `ModuleFederationPlugin` remotes here: sharing React/react-dom on the host
 * conflicts with the App Router (`React.use`) and can break hydration.
 *
 * Equivalent classic webpack `remotes` map:
 * ```js
 * remotes: {
 *   analytics: 'analytics@<ANALYTICS_ORIGIN>/_next/static/chunks/remoteEntry.js',
 *   reports: 'reports@http://localhost:3002/_next/static/chunks/remoteEntry.js',
 * }
 * ```
 * Override origins with `NEXT_PUBLIC_ANALYTICS_APP_URL`, `NEXT_PUBLIC_REPORTS_APP_URL`, or full entry URLs.
 */
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', '@mui/lab'],
  },
  env: {
    NEXT_PUBLIC_ANALYTICS_MF_BUILD_BUST:
      process.env.NEXT_PUBLIC_ANALYTICS_MF_CACHE_BUST ||
      String(Date.now()),
    NEXT_PUBLIC_REPORTS_MF_BUILD_BUST:
      process.env.NEXT_PUBLIC_REPORTS_MF_CACHE_BUST ||
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
        source: '/listing',
        destination: '/reports',
        permanent: false,
      },
      /** Legacy reports-app paths → CRM canonical route (keep in sync with `REPORTS_DETAIL_HREF_PREFIX` in `src/lib/reports/reportRoutes.ts`). */
      {
        source: '/details/:name',
        destination: '/reports/details/:name',
        permanent: false,
      },
      /** Standalone reports-app edit path → CRM canonical edit route. */
      {
        source: '/edit/:code',
        destination: '/reports/edit/:code',
        permanent: false,
      },
      {
        source: '/analytics/analytics/:path*',
        destination: '/analytics/:path*',
        permanent: false,
      },
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

  /**
   * Remote MF chunks and API routes are sometimes resolved against the CRM origin
   * (`/reports/_next/…`, `/reports/api/…`). Proxy those to the reports app
   * (`NEXT_PUBLIC_REPORTS_APP_URL`, default dev `http://localhost:3014/reports`).
   */
  async rewrites() {
    const reportsBase = (
      process.env.NEXT_PUBLIC_REPORTS_APP_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://devtest.socialdnalabs.com/reports'
        : 'http://localhost:3014/reports')
    ).replace(/\/$/, '')
    return [
      {
        source: '/reports/_next/:path*',
        destination: `${reportsBase}/_next/:path*`,
      },
      {
        source: '/reports/api/:path*',
        destination: `${reportsBase}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
