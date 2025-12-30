/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // API proxying is now handled by /app/api/[...path]/route.ts
  // This provides runtime configuration support for Railway
};

module.exports = nextConfig;
