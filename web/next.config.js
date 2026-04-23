/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@flavor-bomb/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

module.exports = nextConfig
