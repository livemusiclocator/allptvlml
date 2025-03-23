/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure for GitHub Pages deployment under livemusiclocator organization
  assetPrefix: process.env.NODE_ENV === 'production' ? '/allptvlml' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/allptvlml' : '',
  trailingSlash: true,
  // Optimize images
  images: {
    domains: ['timetableapi.ptv.vic.gov.au'],
    unoptimized: true, // Required for static export
  },
  // Enable TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  // Always use static export for production builds
  output: 'export',
  
  // Environment variables passed to the client
  env: {
    // Make these explicitly available on the client side
    NEXT_PUBLIC_PTV_DEV_ID: process.env.NEXT_PUBLIC_PTV_DEV_ID,
    NEXT_PUBLIC_PTV_API_KEY: process.env.NEXT_PUBLIC_PTV_API_KEY,
  },
}

module.exports = nextConfig
