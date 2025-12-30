/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    // For Railway: Use NEXT_PUBLIC_API_URL which should be set to the backend's public URL
    // For Docker: Use BACKEND_INTERNAL_URL (http://backend:3001) for container-to-container communication
    // For local dev outside Docker: Use localhost:3001
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log(`[Next.js] Configuring API rewrites to: ${backendUrl}`);
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
