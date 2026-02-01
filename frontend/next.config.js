/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Reduce bundle size - tree-shake heavy packages
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  // Disable telemetry for faster builds
  telemetry: false,
}

module.exports = nextConfig
