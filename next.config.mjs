/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/rescuespinner', destination: '/tossthebone', permanent: true },
    ]
  },
  async rewrites() {
    return [
      { source: '/tossthebone', destination: '/tossthebone/index.html' },
    ]
  },
}

export default nextConfig
