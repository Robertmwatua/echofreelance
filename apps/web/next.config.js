/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() { return [{source:'/sw.js',headers:[{key:'Cache-Control',value:'no-cache, no-store, must-revalidate'},{key:'Service-Worker-Allowed',value:'/'}]},{source:'/manifest.webmanifest',headers:[{key:'Content-Type',value:'application/manifest+json'},{key:'Cache-Control',value:'public, max-age=300'}]}] },
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
