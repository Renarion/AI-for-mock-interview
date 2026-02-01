/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Skip ESLint during production build (rules reference @typescript-eslint which isn't installed)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
