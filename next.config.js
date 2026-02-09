/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'better-sqlite3'],
  },
}

module.exports = nextConfig
