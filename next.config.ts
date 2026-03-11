import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${API_URL}/api/auth/:path*`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${API_URL}/api/admin/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${API_URL}/api/users/:path*`,
      },
      {
        source: '/api/ouvrier/:path*',
        destination: `${API_URL}/api/ouvrier/:path*`,
      },
      {
        source: '/api/vet/:path*',
        destination: `${API_URL}/api/vet/:path*`,
      },
    ];
  },
};

export default nextConfig;
