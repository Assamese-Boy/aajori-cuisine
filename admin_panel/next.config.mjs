/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL;

    // In production on Vercel: only rewrite if a valid remote HTTP/HTTPS backend URL is explicitly configured.
    // Never rewrite to localhost on Vercel edge, which triggers DNS_HOSTNAME_RESOLVED_PRIVATE.
    if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
      const cleanUrl = backendUrl.replace(/\/+$/, '');
      return [
        {
          source: '/api/v1/:path*',
          destination: `${cleanUrl}/api/v1/:path*`,
        },
      ];
    }

    // In local development: proxy to local backend on port 4000
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:4000/api/v1/:path*',
        },
      ];
    }

    // On Vercel without a remote backend: return empty array to prevent DNS_HOSTNAME_RESOLVED_PRIVATE
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
