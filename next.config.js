/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure for GitHub Pages deployment under livemusiclocator organization
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ptv-lml' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/ptv-lml' : '',
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
  // For development, don't use static export
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  
  // Environment variables passed to the client
  env: {
    // Make these explicitly available on the client side
    NEXT_PUBLIC_PTV_DEV_ID: process.env.NEXT_PUBLIC_PTV_DEV_ID,
    NEXT_PUBLIC_PTV_API_KEY: process.env.NEXT_PUBLIC_PTV_API_KEY,
  },
}

module.exports = nextConfig
