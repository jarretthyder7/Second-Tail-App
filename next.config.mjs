/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: '/rescuespinner', destination: '/rescuespinner/index.html' },
    ]
  },
}

export default nextConfig
