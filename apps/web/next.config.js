/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep review builds separate from a running development server.
  distDir: process.env.EF_NEXT_DIST_DIR || '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
