/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://nexa-backend-r7dp.onrender.com/api/v1',
  },
  images: {
    domains: ['nexa-backend-r7dp.onrender.com'],
  },
}

module.exports = nextConfig
