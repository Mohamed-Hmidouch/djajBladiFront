import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: `${API_URL}/api/auth/:path*`,
      },
      {
        source: '/admin/:path*',
        destination: `${API_URL}/api/admin/:path*`,
      },
      {
        source: '/users/:path*',
        destination: `${API_URL}/api/users/:path*`,
      },
      {
        source: '/ouvrier/:path*',
        destination: `${API_URL}/api/ouvrier/:path*`,
      },
      {
        source: '/vet/:path*',
        destination: `${API_URL}/api/vet/:path*`,
      },
    ];
  },
};

export default nextConfig;
